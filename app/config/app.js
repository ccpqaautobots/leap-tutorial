var os = require('os');

module.exports = {
    host: process.env.HOST || os.hostname().toString(),
    port: process.env.PORT || 8080,
    apiSecret: process.env.API_SECRET || 'ks092suj7q0f55d80a2s3zjqp'
};