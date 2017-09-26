var os = require('os');

module.exports = {
    host: process.env.EXECUTION_HOST || os.hostname().toString(),
    port: process.env.EXECUTION_PORT || process.env.PORT || '8080'
};