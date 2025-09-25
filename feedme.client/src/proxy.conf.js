const { env } = require('process');

const FALLBACK_ENDPOINTS = ['https://localhost:7221', 'http://localhost:5016'];

const target = [
  resolvePreferredEndpoint([
    'services__feedme-server__https__0',
    'services__feedme-server__http__0'
  ]),
  resolveFromUrlsVariable('ASPNETCORE_URLS'),
  resolveFromPorts('ASPNETCORE_HTTPS_PORTS', 'https'),
  resolveFromPorts('ASPNETCORE_HTTP_PORTS', 'http'),
  ...FALLBACK_ENDPOINTS.map((endpoint) => normalizeUrl(endpoint))
].find(Boolean);

if (!target) {
  throw new Error('Unable to determine the backend endpoint for the development proxy.');
}

/**
 * Resolves the first available endpoint from the provided environment variable names.
 *
 * The .NET Aspire host emits environment variables using uppercase names, while the
 * local development experience can rely on lowercase names. The development server
 * needs to be case-insensitive so that it functions regardless of how the process
 * exposes the variables.
 */
function resolvePreferredEndpoint(variableNames) {
  for (const name of variableNames) {
    const candidate = normalizeUrl(getEnvironmentValue(name));

    if (candidate) {
      return candidate;
    }
  }

  return undefined;
}

function resolveFromUrlsVariable(variableName) {
  const raw = getEnvironmentValue(variableName);

  if (!raw) {
    return undefined;
  }

  return raw
    .split(/[;,\s]+/)
    .map((segment) => normalizeUrl(segment))
    .find(Boolean);
}

function resolveFromPorts(variableName, scheme) {
  const raw = getEnvironmentValue(variableName);

  if (!raw) {
    return undefined;
  }

  return raw
    .split(/[;,\s]+/)
    .map((segment) => normalizeUrl(segment, scheme))
    .find(Boolean);
}

function normalizeUrl(value, schemeHint) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (schemeHint && /^\d+$/.test(trimmed)) {
    return `${schemeHint}://localhost:${trimmed}`;
  }

  return undefined;
}

function getEnvironmentValue(variableName) {
  const normalizedVariableName = variableName.toLowerCase();
  const matchingEntry = Object.entries(env).find(([key]) => key.toLowerCase() === normalizedVariableName);

  return matchingEntry?.[1]?.trim() || undefined;
}

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
    logLevel: 'error'
  }
};

module.exports = PROXY_CONFIG;
