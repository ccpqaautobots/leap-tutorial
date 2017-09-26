var os = require('os');

module.exports = {
    host: process.env.SELENIUM_HOST || os.hostname().toString(),
    port: process.env.SELENIUM_PORT || 4444
};