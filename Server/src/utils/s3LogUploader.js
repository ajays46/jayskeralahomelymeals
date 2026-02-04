import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

/**
 * Upload log files to S3 using env: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET
 * Keys in bucket: logs/{category}/{date}/{filename}
 * Creates the bucket if it does not exist (so logs can be uploaded without manual bucket creation).
 */

const getS3Config = () => {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET;
  return { region, accessKeyId, secretAccessKey, bucket };
};

const isS3Configured = () => {
  const { region, accessKeyId, secretAccessKey, bucket } = getS3Config();
  return !!(region && accessKeyId && secretAccessKey && bucket);
};

/**
 * Create S3 client from env (uses default credential chain if keys not set)
 */
const createS3Client = () => {
  const { region, accessKeyId, secretAccessKey } = getS3Config();
  const config = { region: region || 'ap-south-1' };
  if (accessKeyId && secretAccessKey) {
    config.credentials = { accessKeyId, secretAccessKey };
  }
  return new S3Client(config);
};

/**
 * Ensure the S3 bucket exists; create it if it does not (so logs can be uploaded).
 * Call this before uploading. Handles NoSuchBucket from PutObject by creating the bucket.
 */
export const ensureS3BucketExists = async () => {
  if (!isS3Configured()) return false;
  const { bucket, region } = getS3Config();
  const client = createS3Client();
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch (err) {
    const isNoSuchBucket = err.name === 'NoSuchBucket' || err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404;
    if (isNoSuchBucket) {
      try {
        await client.send(new CreateBucketCommand({
          Bucket: bucket,
          ...(region && region !== 'us-east-1' ? { CreateBucketConfiguration: { LocationConstraint: region } } : {})
        }));
        return true;
      } catch (createErr) {
        console.error('S3: Failed to create bucket', bucket, createErr.message);
        return false;
      }
    }
    throw err;
  }
};

/**
 * Extract date from log filename (e.g. app-system-2025-02-02.log -> 2025-02-02)
 */
const getDateFromLogFilename = (filename) => {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
};

/**
 * Check if filename looks like a dated log file (has YYYY-MM-DD)
 */
const isDatedLogFile = (filename) => {
  return filename.endsWith('.log') && /\d{4}-\d{2}-\d{2}/.test(filename);
};

/**
 * Upload a single log file to S3
 * @param {string} filePath - Full path to the log file
 * @param {string} category - Category subdir (daily, critical, errors, transactions)
 * @returns {Promise<{ key: string } | null>} S3 key on success, null on skip/fail
 */
export const uploadLogFileToS3 = async (filePath, category) => {
  if (!isS3Configured()) return null;
  const { bucket } = getS3Config();
  const filename = path.basename(filePath);
  const datePart = getDateFromLogFilename(filename) || new Date().toISOString().split('T')[0];
  const key = `logs/${category}/${datePart}/${filename}`;

  let body;
  try {
    body = fs.readFileSync(filePath);
  } catch (readErr) {
    throw new Error(`S3 upload failed for ${filePath}: ${readErr.message}`);
  }
  if (!body || body.length === 0) return null;

  const client = createS3Client();
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: 'text/plain'
      })
    );
    return { key };
  } catch (err) {
    if (err.name === 'NoSuchBucket') {
      await ensureS3BucketExists();
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: 'text/plain'
        })
      );
      return { key };
    }
    throw new Error(`S3 upload failed for ${filePath}: ${err.message}`);
  }
};

/**
 * Upload all dated log files from the logs directory to S3
 * @returns {Promise<{ uploaded: number, failed: number, errors: string[] }>}
 */
export const uploadLogsToS3 = async () => {
  const result = { uploaded: 0, failed: 0, errors: [] };
  if (!isS3Configured()) {
    return result;
  }

  // Ensure bucket exists (create if missing) so uploads succeed
  try {
    await ensureS3BucketExists();
  } catch (err) {
    result.errors.push(`Bucket check/create failed: ${err.message}`);
    return result;
  }

  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) return result;

  const categories = ['daily', 'critical', 'errors', 'transactions'];

  for (const category of categories) {
    const categoryDir = path.join(logDir, category);
    if (!fs.existsSync(categoryDir)) continue;

    const files = fs.readdirSync(categoryDir);
    for (const file of files) {
      if (!isDatedLogFile(file)) continue;

      const filePath = path.join(categoryDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) continue;

        await uploadLogFileToS3(filePath, category);
        result.uploaded++;
      } catch (err) {
        result.failed++;
        result.errors.push(`${file}: ${err.message}`);
      }
    }
  }

  return result;
};

export { isS3Configured, getS3Config };
