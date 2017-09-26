const path = require('path');

module.exports = {
    path: {
        scripts: '../../../data/scripts',
        suites: '../../../data/suites'
    },
    nightwatch_reporter: path.join(__dirname, 'k-reporter.js'),
    nightwatch_config: path.join(__dirname, 'nightwatch.json')
}