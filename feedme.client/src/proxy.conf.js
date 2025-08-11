const { env } = require('process');

const httpsTarget = env['services__feedme-server__https__0'];
const httpTarget = env['services__feedme-server__http__0'];
const target = httpsTarget ?? httpTarget ?? 'https://localhost:7221';

const PROXY_CONFIG = [
  {
    context: [
      "/weatherforecast",
      "/api",
    ],
    target,
    secure: false
  }
]

module.exports = PROXY_CONFIG;
