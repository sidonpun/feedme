const { env } = require('process');

const DEFAULT_TARGET = 'http://185.251.90.40';
const target =
  env.FEEDME_API_BASE_URL ??
  env["services__feedme-server__https__0"] ??
  env["services__feedme-server__http__0"] ??
  DEFAULT_TARGET;

const PROXY_CONFIG = [
  {
    context: [
      '/api',
      '/weatherforecast',
    ],
    target,
    secure: false,
    changeOrigin: true,
  },
];

module.exports = PROXY_CONFIG;
