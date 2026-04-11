/**
 * API Version Middleware
 * Extracts version from the URL path and attaches it to req.apiVersion.
 * Supports v1, v2, etc. — future-ready for multi-version routing.
 */

export const extractApiVersion = (req, res, next) => {
  const base = req.baseUrl || '';
  const versionMatch = base.match(/\/v(\d+)/);
  req.apiVersion = versionMatch ? `v${versionMatch[1]}` : 'v1';
  next();
};

export const requireVersion = (...allowed) => (req, res, next) => {
  const version = req.apiVersion || 'v1';
  if (!allowed.includes(version)) {
    return res.status(400).json({
      success: false,
      message: `API version ${version} is not supported for this endpoint. Allowed: ${allowed.join(', ')}`,
    });
  }
  next();
};
