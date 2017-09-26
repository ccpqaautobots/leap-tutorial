const appConfig = require('./app');
const executionConfig = require('./execution');
const mailConfig = require('./mail');
const seleniumConfig = require('./selenium');
const mongoConfig = require('./mongodb');

module.exports = () => {
    const config = {};
    config.app = appConfig;
    config.execution = executionConfig;
    config.mail = mailConfig;
    config.selenium = seleniumConfig;
    config.mongo = mongoConfig();
    return config;
};