const { env } = require('process');

const httpsTarget = env['services__feedme-server__https__0'];
const httpTarget = env['services__feedme-server__http__0'];

// Prefer the HTTP endpoint to avoid TLS issues when no certificates are configured
const target = httpTarget ?? httpsTarget ?? 'http://localhost:5016';

/**
 * Proxy configuration for the development server.
 *
 * The `http-proxy-middleware` package used by `webpack-dev-server` expects the
 * configuration to be an object where each key represents a path to proxy. The
 * previous array-based format caused an "Invalid context" error because the
 * middleware could not determine which routes to match.
 */
const PROXY_CONFIG = {
  '/api': {
    target,
    secure: false,
    logLevel: 'error',
  },
};

module.exports = PROXY_CONFIG;
