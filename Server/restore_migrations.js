import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = 'C:\\Users\\VIVEK\\Desktop\\JAYSKERALAHM\\Server\\migrations_backup_1754888028835';
const targetDir = path.join(__dirname, 'prisma', 'migrations');

console.log('🔄 Restoring migrations from backup...');
console.log('📁 Source:', sourceDir);
console.log('📁 Target:', targetDir);

if (fs.existsSync(sourceDir)) {
  // Clear target directory
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  
  // Copy backup to target
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  console.log('✅ Migrations restored successfully!');
} else {
  console.error('❌ Backup directory not found!');
}