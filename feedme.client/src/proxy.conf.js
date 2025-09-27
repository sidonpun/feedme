const { env } = require('process');

const normalizeTarget = (rawValue) => {
  if (!rawValue) {
    return null;
  }

  try {
    const url = new URL(rawValue.startsWith('http') ? rawValue : `http://${rawValue}`);
    return url.toString().replace(/\/?$/, '');
  } catch (error) {
    return null;
  }
};

const defaultTarget = 'http://185.251.90.40';
const target =
  normalizeTarget(env.API_BASE_URL) ||
  normalizeTarget(env.services__feedme_server__http__0) ||
  normalizeTarget(env.services__feedme_server__https__0) ||
  normalizeTarget(env['services__feedme-server__http__0']) ||
  normalizeTarget(env['services__feedme-server__https__0']) ||
  defaultTarget;

const PROXY_CONFIG = [
  {
    context: ['/api', '/weatherforecast'],
    target,
    secure: false,
    changeOrigin: true,
    logLevel: 'info',
  },
];

module.exports = PROXY_CONFIG;
