const { URL } = require('node:url');

const { baseUrl: remoteBackendBaseUrl } = require('./environments/remote-backend.config.json');

function normalizeTarget(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('Remote backend baseUrl must be provided for the development proxy.');
  }

  try {
    const parsedUrl = new URL(raw.trim());

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Remote backend baseUrl must use the HTTP or HTTPS protocol.');
    }

    parsedUrl.hash = '';
    parsedUrl.search = '';
    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, '');

    return parsedUrl.toString().replace(/\/+$/, '');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to parse remote backend baseUrl: ${message}`);
  }
}

const target = normalizeTarget(remoteBackendBaseUrl);
const isHttps = new URL(target).protocol === 'https:';

const PROXY_CONFIG = {
  '/api': {
    target,
    changeOrigin: true,
    logLevel: 'error',
    secure: isHttps
  }
};

module.exports = PROXY_CONFIG;
