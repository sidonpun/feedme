const { env } = require('process');

const httpsTarget = env['services__feedme-server__https__0'];
const httpTarget = env['services__feedme-server__http__0'];
// Prefer the HTTP endpoint to avoid TLS issues when no certificates are configured
const target = httpTarget ?? httpsTarget ?? 'http://localhost:5016';

const PROXY_CONFIG = [
  {
    context: [
      '/weatherforecast',
      '/api/**'
    ],
    target,
    secure: false,
    logLevel: 'error'
  },
]

module.exports = PROXY_CONFIG;
