const os = require('os');

module.exports = function () {
    const uri = process.env.MONGODB_URI || undefined;
    const host = process.env.MONGODB_HOST || os.hostname().toString();
    const port = process.env.MONGODB_PORT || 27017;
    const database = process.env.MONGODB_DBNAME || 'leap-test-suite';
    const username = process.env.MONGODB_USERNAME || undefined;
    const password = process.env.MONGODB_PASSWORD || undefined;

    if (uri)
        return uri;

    // credentials provided
    if (username && password)
        return `mongodb://${username}:${password}@${host}:${port}/${database}`

    // no credentials provided
    else if (!username && !password)
        return `mongodb://${host}:${port}/${database}`

    // partial credentials
    else
        throw new Error('failed to initialize mongodb connection string, please check credentials')
};