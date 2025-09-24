const { env } = require('process');

const target = resolvePreferredEndpoint([
  'services__feedme-server__http__0',
  'services__feedme-server__https__0',
]) ?? 'http://localhost:5016';

/**
 * Resolves the first available endpoint from the provided environment variable names.
 *
 * The .NET Aspire host emits environment variables using uppercase names, while the
 * local development experience can rely on lowercase names. The development server
 * needs to be case-insensitive so that it functions regardless of how the process
 * exposes the variables.
 */
function resolvePreferredEndpoint(variableNames) {
  return variableNames
    .map((name) => getEnvironmentValue(name))
    .find((value) => Boolean(value));
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
    logLevel: 'error',
  },
};

module.exports = PROXY_CONFIG;
