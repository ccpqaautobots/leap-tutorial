var mongoose = require('mongoose');
var Report = require('../../models/report');
var HtmlReporter = require('nightwatch-html-reporter');
var config = require('../../../config');

// database configuration ===========================================================
mongoose.connect(config.mongodb.connection());

/* Same options as when using the built in nightwatch reporter option */
var reporter = new HtmlReporter({
	openBrowser: true,
	reportsDirectory: __dirname + '/../../../data/reports',
	themeName: 'prime',
	uniqueFilename: true
});

module.exports = {
	write: function (results, options, done) {
		var report = new Report();
		report.result = {
			passed: results.passed,
			failed: results.failed,
			_errors: results.errors,
			skipped: results.skipped,
			total: results.tests
		};
		report.duration = 0;

		var module = results.modules[Object.keys(results.modules)[0]];
		report.identifier = Object.keys(results.modules)[0].split('---').pop();
		report.date = module.timestamp;

		report.scenarios = [];
		report.runtime = 0;

		Object.keys(module.completed).forEach(function (scenarioName) {
			var scenarioData = module.completed[scenarioName];

			var scenario = {
				name: scenarioName,
				duration: scenarioData.timeMs,
				result: {
					passed: scenarioData.passed,
					failed: scenarioData.failed,
					_errors: scenarioData.errors,
					skipped: scenarioData.skipped
				},
				assertions: scenarioData.assertions
			};

			report.runtime += parseInt(scenarioData.timeMs);
			report.scenarios.push(scenario);
		});

		reporter.fn(results, function (err, path) {
			if (err)
				throw (err);

			report.report = path;

			report.save(function (err, result) {
				if (result) {
					mongoose.disconnect(function () {
						mongoose.connection.close(function () {
							done();
						});
					});
				}
			});
		});
	}
};