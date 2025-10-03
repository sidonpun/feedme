const net = require('node:net');
const { URL } = require('node:url');
const { env } = require('process');

const FALLBACK_ENDPOINTS = [
  // HTTPS ports are listed first so that secure endpoints take precedence.
  'https://localhost:8081',
  'https://localhost:7221',
  'http://localhost:8080',
  'http://localhost:5016',
  // Обращение к удалённому стенду, используемому в production.
  'http://185.251.90.40:8080'
];

const { endpoint: target, attemptedEndpoints } = resolveFirstReachableEndpoint([
  () => resolvePreferredEndpoint([
    'services__feedme-server__https__0',
    'services__feedme-server__http__0'
  ]),
  () => resolveFromUrlsVariable('ASPNETCORE_URLS'),
  () => resolveFromPorts('ASPNETCORE_HTTPS_PORTS', 'https'),
  () => resolveFromPorts('ASPNETCORE_HTTP_PORTS', 'http'),
  () => FALLBACK_ENDPOINTS
]);

if (!target) {
  throw new Error(createResolutionErrorMessage(attemptedEndpoints));
}

function resolveFirstReachableEndpoint(resolvers) {
  const attemptedEndpoints = [];

  for (const resolveCandidate of resolvers) {
    const value = resolveCandidate();

    if (!value) {
      continue;
    }

    const candidates = Array.isArray(value) ? value : [value];

    for (const candidate of candidates) {
      if (!candidate) {
        continue;
      }

      const normalized = normalizeUrl(candidate);

      if (!normalized) {
        continue;
      }

      if (isEndpointReachable(normalized)) {
        attemptedEndpoints.push(normalized);

        return {
          endpoint: normalized,
          attemptedEndpoints
        };
      }

      attemptedEndpoints.push(normalized);
    }
  }

  return {
    endpoint: undefined,
    attemptedEndpoints
  };
}

function createResolutionErrorMessage(endpoints) {
  if (!endpoints.length) {
    return 'Unable to determine the backend endpoint for the development proxy.';
  }

  const joinedEndpoints = endpoints.join(', ');

  return [
    'Unable to determine the backend endpoint for the development proxy.',
    'Verify that the FeedMe backend is running and exposes one of the following endpoints:',
    joinedEndpoints
  ].join(' ');
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
    .filter(Boolean);
}

function resolveFromPorts(variableName, scheme) {
  const raw = getEnvironmentValue(variableName);

  if (!raw) {
    return undefined;
  }

  return raw
    .split(/[;,\s]+/)
    .map((segment) => normalizeUrl(segment, scheme))
    .filter(Boolean);
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

const CONNECTION_TIMEOUT = 300;

function isEndpointReachable(endpoint) {
  try {
    const url = new URL(endpoint);
    const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));

    if (!Number.isFinite(port)) {
      return false;
    }

    const syncResult = createSynchronousResult();

    const socket = new net.Socket();

    socket.setTimeout(CONNECTION_TIMEOUT);

    socket.once('connect', () => {
      syncResult.set(true);
      socket.end();
    });

    socket.once('timeout', () => {
      syncResult.set(false);
      socket.destroy();
    });

    socket.once('error', () => {
      syncResult.set(false);
      socket.destroy();
    });

    socket.once('close', () => {
      syncResult.notify();
    });

    socket.connect({
      host: url.hostname,
      port
    });

    const result = syncResult.wait(CONNECTION_TIMEOUT * 2);

    socket.destroy();

    return result === true;
  } catch (error) {
    return false;
  }
}

function createSynchronousResult() {
  const buffer = new SharedArrayBuffer(4);
  const view = new Int32Array(buffer);
  let settled = false;
  let value;

  return {
    set(result) {
      if (!settled) {
        value = result;
        settled = true;
      }
    },
    notify() {
      Atomics.store(view, 0, 1);
      Atomics.notify(view, 0);
    },
    wait(timeout) {
      Atomics.wait(view, 0, 0, timeout);
      return value;
    },
    get value() {
      return value;
    }
  };
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
