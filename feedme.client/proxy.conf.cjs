const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const REMOTE_CONFIG_PATH = resolve(__dirname, 'src', 'environments', 'remote-backend.config.json');
const DEFAULT_API_PATH = '/api';

function loadRemoteBackendConfig() {
  const raw = readFileSync(REMOTE_CONFIG_PATH, 'utf-8');
  return JSON.parse(raw);
}

function normalizeBaseUrl(baseUrl) {
  if (typeof baseUrl !== 'string' || !baseUrl.trim()) {
    throw new Error('Remote backend baseUrl must be defined in remote-backend.config.json.');
  }

  return baseUrl.trim().replace(/\/+$/, '');
}

function normalizeApiPath(apiPath) {
  const value = typeof apiPath === 'string' ? apiPath : DEFAULT_API_PATH;
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error('Remote backend apiPath cannot be empty when configuring the development proxy.');
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

const remoteBackendConfig = loadRemoteBackendConfig();
const target = normalizeBaseUrl(remoteBackendConfig.baseUrl);
const apiPath = normalizeApiPath(remoteBackendConfig.apiPath);

module.exports = {
  [apiPath]: {
    target,
    secure: false,
    changeOrigin: true,
    logLevel: 'warn'
  }
};
