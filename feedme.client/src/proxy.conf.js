const { env } = require('process');

const httpsTarget = env['services__feedme-server__https__0'];
const httpTarget = env['services__feedme-server__http__0'];

// Prefer the HTTP endpoint to avoid TLS issues when no certificates are configured
const target = httpTarget ?? httpsTarget ?? 'http://localhost:5016';

/**
 * Development server proxy configuration.
 *
 * Exporting an object keyed by context strings avoids "Invalid context" errors
 * from http-proxy-middleware, which expects each property name to be a valid
 * path used when matching requests for proxying. The configuration below
 * proxies any call starting with `/api` to the backend server defined by the
 * `target` variable.
 */
const PROXY_CONFIG = {
  '/api': {
    target,
    secure: false,
    logLevel: 'error',
  },
};

module.exports = PROXY_CONFIG;
