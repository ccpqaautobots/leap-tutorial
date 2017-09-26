var express = require('express'); // express app
var router = express.Router(); // express router
var authentication = require('./helpers/authentication'); // authentication
var controllers = require('./controllers');

// ================================================================
// primary routes
// ================================================================

// index page
router.get('/', authentication.authenticateLocked, controllers.primary.index);

// authentication pages
router.get('/login', authentication.authenticateLocked, controllers.primary.login);
router.get('/logout', authentication.authenticate, controllers.primary.logout);
router.get('/unlock', controllers.primary.unlock);

// project dashboard
router.get('/project/dashboard/:project', authentication.authenticate, controllers.primary.dashboardReport);

// account management
router.get('/user/:username', authentication.authenticate, controllers.primary.userProfile);
router.get('/user/:username/settings', authentication.authenticate, controllers.primary.userSettings);

// editors
router.get('/editors', authentication.authenticate, controllers.primary.editors);
router.get('/scripteditor', authentication.authenticate, controllers.primary.scriptEditor);
router.get('/scenarioeditor', authentication.authenticate, controllers.primary.scenarioEditor);
router.get('/suiteeditor', authentication.authenticate, controllers.primary.suiteEditor);

// repositories
router.get('/repositories', authentication.authenticate, controllers.primary.repositories);
router.get('/suiterepository/:project', authentication.authenticate, controllers.primary.suiteRepository);
router.get('/scenariorepository/:project', authentication.authenticate, controllers.primary.scenarioRepository);
router.get('/scriptsrepository/:project', authentication.authenticate, controllers.primary.scriptsRepository);
router.get('/pages/:project', authentication.authenticate, controllers.primary.pages);

// administrator
router.get('/administrator', authentication.authenticate, controllers.primary.administrator);
router.get('/administrator/projects', authentication.authenticate, controllers.primary.projectManagement);
router.get('/administrator/users', authentication.authenticate, controllers.primary.userManagement);
router.get('/administrator/user_invitation', authentication.authenticate, controllers.primary.userInvitation);

// execution
router.get('/execution', authentication.authenticate, controllers.primary.execution);
router.get('/execution/runtest', authentication.authenticate, controllers.primary.runtest);
router.get('/execution/runtest/runondemand', authentication.authenticate, controllers.primary.runOnDemand);
router.get('/execution/testresults', authentication.authenticate, controllers.primary.viewTestResults);
router.get('/execution/testresults/script/:id', authentication.authenticate, controllers.primary.viewTestResult);
router.get('/execution/testresults/suite/:id', authentication.authenticate, controllers.primary.viewTestResult);
router.get('/execution/testresults/suite/:suite_id/script/:script_id', authentication.authenticate, controllers.primary.viewTestResult);

// mailbox
router.get('/mailbox', authentication.authenticate, controllers.primary.mailbox);

// logs
router.get('/logs/application', controllers.primary.viewApplicationLogs);
router.get('/logs/access', controllers.primary.viewAccessLogs);

// setup
var Models = require('./models');
router.get('/setup', function(req, res) {
    return Models.User.findOne({ username: 'mikibihon' }, function(err, user) {
        if (err)
            return res.status(400).send({ success: false, message: 'error while querying users\n' + err });

        if (user)
            return callback();

        var newUser = new Models.User({
            username: 'mikibihon',
            firstName: 'miki',
            lastName: 'bihon',
            email: 'mikibihon@cambridge.org',
            password: 'bihonmiki',
            roles: ['super'],
            enabled: true
        });
        return newUser.save(function(err, user) {
            if (err)
                return res.status(400).send({ success: false, message: 'error while creating a user\n' + err });

            return callback();
        });
    });

    function callback() {
        return Models.Project.findOne({ projectKey: 'core' }, function(err, project) {
            if (err)
                return res.status(400).send({ success: false, message: 'error while creating project\n' + err });

            if (!project) {
                var newProject = new Models.Project({
                    projectKey: 'core',
                    name: 'Cambridge Core'
                });
                return newProject.save(function(err) {
                    if (err)
                        return res.status(400).send({ success: false, message: 'error while creating project\n' + err });

                    return callback2();
                })
            } else {
                return callback2();
            }
        });
    }

    function callback2() {
        return Models.Project.findOne({ projectKey: 'coreadmin' }, function(err, project2) {
            if (err)
                return res.status(400).send({ success: false, message: 'error while creating project\n' + err });

            if (!project2) {
                var newProject2 = new Models.Project({
                    projectKey: 'coreadmin',
                    name: 'Core Admin'
                });
                return newProject2.save(function(err) {
                    if (err)
                        return res.status(400).send({ success: false, message: 'error while creating project\n' + err });

                    return res.status(200).send({ success: true, message: 'setup completed!' });
                })
            } else {
                return res.status(200).send({ success: true, message: 'setup completed!' });
            }
        })
    }
});

// ================================================================
// api routes
// ================================================================

// authentication api
router.post('/api/login', controllers.auth.login);
router.post('/api/unlock', authentication.apiAuth, controllers.auth.unlock);

// chat api
router.post('/api/chat', controllers.chatbot.chat);

// dashboard api
router.post('/api/dashboard/:project', authentication.apiAuth, controllers.dashboard.projectDashboard);

// execution api
router.get('/api/queuer_info', authentication.apiAuth, controllers.execution.queue_run_model_info);
router.get('/api/execute', authentication.apiAuth, controllers.execution.getLiveResult);
router.get('/api/user_results', authentication.apiAuth, controllers.execution.getResultsByUser);
router.get('/api/test_result', authentication.apiAuth, controllers.execution.getResultById);
router.get('/api/test_result/:id', authentication.apiAuth, controllers.execution.getResultById);
router.get('/api/update_run_error/:id', authentication.apiAuth, controllers.execution.updateErrorRun);
router.post('/api/execute', authentication.apiAuth, controllers.execution.queue_execution);
router.post('/api/test_results', authentication.apiAuth, controllers.execution.getResults);
router.post('/api/user_role_results', authentication.apiAuth, controllers.execution.getResultsByUserRole);
router.post('/api/run_models', authentication.apiAuth, controllers.execution.getRunModels);

// test result
router.put('/api/testresult/update', authentication.apiAuth, controllers.testresult.updateTestResult);

// features api
router.get('/api/feature', controllers.feature.getFeatures);
router.post('/api/feature', authentication.apiAuth, controllers.feature.addNewFeature);

// object api
router.put('/api/pages', authentication.apiAuth, controllers.object.updatePage);
router.put('/api/pages/elements', authentication.apiAuth, controllers.object.updateElement);
router.post('/api/getPages', authentication.apiAuth, controllers.object.getPage);
router.post('/api/pages', authentication.apiAuth, controllers.object.createPage);
router.post('/api/pages/duplicate', authentication.apiAuth, controllers.object.hasDuplicate);
router.post('/api/pages/elements', authentication.apiAuth, controllers.object.createElement);
router.delete('/api/pages', authentication.apiAuth, controllers.object.deletePage);
router.delete('/api/pages/elements', authentication.apiAuth, controllers.object.deleteElement);

// user preferences api
router.get('/api/preferences/sidebarmenu_toggle', authentication.authenticate, controllers.preferences.sidebarMenuToggle);

// projects api
router.put('/api/project/:id', authentication.apiAuth, controllers.project.updateProject);
router.post('/api/getProjects', authentication.apiAuth, controllers.project.getProjects);
router.post('/api/project', authentication.apiAuth, controllers.project.createProject);
router.delete('/api/project/:id', authentication.apiAuth, controllers.project.deleteProject);

// scenarios api
router.post('/api/getScenarios', authentication.apiAuth, controllers.scenario.getScenarios);
router.post('/api/scenarios', authentication.apiAuth, controllers.scenario.saveScenario);
router.post('/api/scenarios/status', authentication.apiAuth, controllers.scenario.updateStatus);
router.post('/api/scenarios/update', authentication.apiAuth, controllers.scenario.updateScenario);
router.delete('/api/scenarios/:id', authentication.apiAuth, controllers.scenario.deleteScenario);

// scripts api
router.get('/api/dependentSuites/:id', authentication.apiAuth, controllers.script.getDependentSuites);
router.post('/api/getScripts', authentication.apiAuth, controllers.script.getScript);
router.post('/api/scripts', authentication.apiAuth, controllers.script.saveScript);
router.post('/api/scripts/status', authentication.apiAuth, controllers.script.updateStatus);
router.delete('/api/scripts/:id', authentication.apiAuth, controllers.script.deleteScript);

// suites api
router.post('/api/getSuites', authentication.apiAuth, controllers.suite.getSuites);
router.post('/api/suites', authentication.apiAuth, controllers.suite.saveSuite);
router.put('/api/suites', authentication.apiAuth, controllers.suite.updateSuite);
router.delete('/api/suites/:id', authentication.apiAuth, controllers.suite.deleteSuite);
router.post('/api/suites/status', authentication.apiAuth, controllers.suite.updateStatus);

// trello api
router.post('/api/trello/card', controllers.trello.trelloRaise);

// user management api
router.get('/api/user/:id', authentication.apiAuth, controllers.user.getUser);
router.get('/api/user_verification/confirm_email', controllers.user.verifyUserEmail);
router.get('/api/user_verification/forgot_password_setup', controllers.user.verifyUserEmail);
router.put('/api/user/:id', authentication.apiAuth, controllers.user.updateUser);
router.put('/api/user/:username/change_password', authentication.apiAuth, controllers.user.userChangePassword);
router.post('/api/users', authentication.apiAuth, controllers.user.getUsers);
router.post('/api/user', authentication.apiAuth, controllers.user.createUser);
router.post('/api/user_verification/resend_verification', controllers.user.resendEmailVerification);
router.post('/api/user_verification/forgot_password_setup', controllers.user.verifyUserEmail);
router.post('/api/user_verification/forgot_password', controllers.user.forgotPassword);
router.post('/api/user_verification/confirm_email', controllers.user.verifyUserEmail);
router.post('/api/user_invitation', controllers.user.inviteUsers);
router.delete('/api/user/:id', controllers.user.disableUser);

// ================================================================
// 5xx pages
// ================================================================

// ================================================================
// 4xx pages
// ================================================================
router.get(/^\/(?!reload).*/, controllers.primary.pageMissing);

module.exports = router;