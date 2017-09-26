var models = require('./models-sc');
var moment = require('moment');
var Test_Result = models.TestResult;

exports.projectDashboard = function (req, res) {
    if (req.params.project) {
        GetDashboardData(req.params.project, function (error, result) {
            let data = {
                stats: {
                    today: ExtractResults(result.today),
                    yesterday: ExtractResults(result.yesterday),
                    thisWeek: ExtractResults(result.thisWeek),
                    lastWeek: ExtractResults(result.lastWeek),
                    thisMonth: ExtractResults(result.thisMonth),
                    lastMonth: ExtractResults(result.lastMonth)
                },
                dailyStats: {
                    thisMonth: ExtractResultsPerDay(result.thisMonth)
                }
            };
            return res.status(200).send(data);
        });
    } else {
        return res.render('pages/404');
    }
};

function ExtractResults(results) {
    let data = {
        duration: 0,
        total: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalWarning: 0,
        rates: {
            passing: 0,
            failure: 0
        }
    };

    results.forEach(function (result) {
        if (result.done) {
            if (result.type == 'Suite') {
                data.duration += result.duration;
                data.total += result.total;
                data.totalPassed += result.totalPassed;
                data.totalFailed += result.totalFailed;
                data.totalWarning += result.totalWarning;
            } else if (result.type == 'Script') {
                data.duration += result.duration;
                data.total += 1;
                if (result.status == 'Passed') {
                    data.totalPassed += 1;
                } else if (result.status == 'Failed') {
                    data.totalFailed += 1;
                } else if (result.status == 'Warning') {
                    data.total -= 1;
                    data.totalWarning += 1;
                }
            }
        }
    });

    data.rates.passing = (data.totalPassed / data.total) * 100;
    data.rates.failure = (data.totalFailed / data.total) * 100;

    // clean up variables
    data.rates.passing = (data.rates.passing) ? data.rates.passing : 0;
    data.rates.failure = (data.rates.failure) ? data.rates.failure : 0;

    return data;
};

function ExtractResultsPerDay(results) {
    var data = {};
    var today = moment();
    var start = today.startOf('month').date();
    var end = today.endOf('month').date();
    for (var i = start; i <= end; i++) {
        var currentDate = moment().set('year', today.year()).set('month', today.month()).set('date', i);
        data[i] = ExtractResults(results.filter(
            _ => _.runDate > currentDate.startOf('day') &&
            _.runDate < currentDate.endOf('day')));
    }
    return data;
};

function ExtractResultsPerWeek(results) {
    var data = {};
    var today = moment();
    var firstWeek = today.startOf('month').startOf('day');
    var secondWeek = today.startOf('month').add(1, 'weeks').startOf('day');
    var thirdWeek = today.startOf('month').add(2, 'weeks').startOf('day');
    var fourthWeek = today.startOf('month').add(3, 'weeks').startOf('day');

    for (var i = 0; i <= 3; i++) {
        var currentDate = today.startOf('month').add(i, 'weeks').startOf('day');
        console.log(currentDate);
    }
};

function GetDashboardData(project, callback) {
    Test_Result.find({
        project: project,
        $or: [
            {
                $and: [
                    { isSuite: true },
                    { isScript: false }
                ]
            },
            {
                $and: [
                    { isSuite: false },
                    { isScript: true }
                ]
            }
        ]
    }).exec(function (error, results) {
        if (error)
            callback(error);

        console.log('Total results: ' + results.length);

        if (results) {
            let data = {};

            data.today = results.filter(_ =>
                _.runDate > moment().startOf('day') &&
                _.runDate < moment().endOf('day'));

            console.log('startoftoday: ' + moment().startOf('day').toString());
            console.log('endoftoday: ' + moment().endOf('day').toString());

            data.yesterday = results.filter(_ =>
                _.runDate > moment().subtract(1, 'days').startOf('day') &&
                _.runDate < moment().subtract(1, 'days').endOf('day'));

            console.log('startofyesterday: ' + moment().subtract(1, 'days').startOf('day').toString());
            console.log('endofyesterday: ' + moment().subtract(1, 'days').endOf('day').toString());

            data.thisWeek = results.filter(_ =>
                _.runDate > moment().startOf('isoWeek').startOf('day') &&
                _.runDate < moment().endOf('isoWeek').endOf('day'));

            console.log('startofweek: ' + moment().startOf('isoWeek').startOf('day').toString());
            console.log('endofweek: ' + moment().endOf('isoWeek').endOf('day').toString());

            data.lastWeek = results.filter(_ =>
                _.runDate > moment().subtract(1, 'weeks').startOf('isoWeek').startOf('day') &&
                _.runDate < moment().subtract(1, 'weeks').endOf('isoWeek').endOf('day'));

            console.log('startoflastweek: ' + moment().subtract(1, 'weeks').startOf('isoWeek').startOf('day').toString());
            console.log('endoflastweek: ' + moment().subtract(1, 'weeks').endOf('isoWeek').endOf('day').toString());

            data.thisMonth = results.filter(_ =>
                _.runDate > moment().startOf('month').startOf('day') &&
                _.runDate < moment().endOf('month').endOf('day'));

            console.log('startofmonth: ' + moment().startOf('month').startOf('day').toString());
            console.log('endofmonth: ' + moment().endOf('month').endOf('day').toString());

            data.lastMonth = results.filter(_ =>
                _.runDate > moment().subtract(1, 'months').startOf('month').startOf('day') &&
                _.runDate < moment().subtract(1, 'months').endOf('month').endOf('day'));

            console.log('startoflastmonth: ' + moment().subtract(1, 'months').startOf('month').startOf('day').toString());
            console.log('endoflastmonth: ' + moment().subtract(1, 'months').endOf('month').endOf('day').toString());

            callback(null, data);
        } else {
            callback(null);
        }
    });
};