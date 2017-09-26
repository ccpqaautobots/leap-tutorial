var console = require('../helpers/consoleOverride')(console);
var readAccessLogs = require('../helpers/writableStreams').readAccessLogs;
var readApplicationLogs = require('../helpers/writableStreams').readApplicationLogs;
var models = require('./models-sc');
var User = models.User; // user model - user schema
var Project = models.Project;
var Script = models.Script;
var Scenario = models.Scenario;
var Object = models.Object;
var TestResult = models.TestResult;
var Suite = models.Suite;
var executionConfig = require('../config/execution');

// function to uppercase first letter of each word
function ToTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

exports.index = function (req, res) {
    // else render index page
    return res.render('layout', {
        sidebarmenu: new SidebarMenuActive('home'),
        renderContent: 'content/index',
        renderBreadcrumbs: undefined,
        renderScripts: 'scripts/index',
        // send user session if exists
        user: req.session.user || undefined,
        preferences: req.session.preferences || undefined,
        projects: req.app.locals.projects || undefined,
        reload: req.app.settings.reload
    });
};

exports.login = function (req, res) {
    // if session for user is undefined
    if (req.session.user === undefined) {
        return res.render('pages/login'); // render login page
    }

    // else redirect to index
    return res.redirect('/');
}

exports.logout = function (req, res) {
    var userId = req.session.user._id;
    // destroy session once logout
    req.session.destroy(function (err) {
        // if error occured, log error to console
        if (err)
            res.send(400).send({ message: 'an error occured while logging out\n' + err });
        else {
            // if query q is undefined
            if (!req.query.q)
                return res.status(301).redirect('/'); // redirect to index
            else
                return res.status(301).redirect('/login'); // redirect to login
        }
    });
};

exports.unlock = function (req, res) {
    // if user is undefined
    if (req.session.user === undefined)
        return res.redirect('/login'); // redirect to login page

    // lock user session
    req.session.user.locked = true;

    // render lockscreen page
    return res.render('pages/lockscreen', {
        // send user session if exists
        user: req.session.user || null,
        projects: req.app.locals.projects,
        reload: req.app.settings.reload
    });
};

function renderScriptEditor(err, res, req, testscript, projects) {
    // if no error occured
    if (!err) {
        // if testscript was found
        if (testscript) {
            // display script editor page and pass testscript data
            res.render('layout', {
                sidebarmenu: new SidebarMenuActive('editor', 'scripteditor'),
                renderContent: 'content/scripteditor',
                renderBreadcrumbs: 'content/breadcrumbs/scripteditor',
                renderScripts: 'scripts/scripteditor',
                // send user session if exists
                user: req.session.user || null,
                projects: projects,
                // send testscript document
                existingScript: testscript,
                // send query
                query: req.query || {},
                reload: req.app.settings.reload
            });
        } else {
            // if testscript was not found, display script editor
            res.render('layout', {
                sidebarmenu: new SidebarMenuActive('editor', 'scripteditor'),
                renderContent: 'content/scripteditor',
                renderBreadcrumbs: 'content/breadcrumbs/scripteditor',
                renderScripts: 'scripts/scripteditor',
                // send user session if exists
                user: req.session.user || null,
                projects: projects,
                // send testscript as boolean false
                existingScript: false,
                // send query
                query: req.query || {},
                reload: req.app.settings.reload
            });
        }
    } else {
        // if error occured, display testeditor
        res.render('layout', {
            sidebarmenu: new SidebarMenuActive('editor', 'scripteditor'),
            renderContent: 'content/scripteditor',
            renderBreadcrumbs: 'content/breadcrumbs/scripteditor',
            renderScripts: 'scripts/scripteditor',
            // send user session if exists
            user: req.session.user || null,
            projects: projects,
            // send testscript as boolean false
            existingScript: false,
            // send query
            query: req.query || {},
            reload: req.app.settings.reload
        });
    }
}

exports.scriptEditor = function (req, res) {
    var accessibleProjects = [];
    if (req.session.user) {
        if (req.session.user.isSuper || req.session.user.isAdmin) {
            accessibleProjects = req.app.locals.projects;
        } else {
            req.session.user.roles.forEach(function (role) {
                if (req.app.locals.projects.some(_ => _.projectKey == role)) {
                    accessibleProjects.push(req.app.locals.projects.filter(_ => _.projectKey == role).shift());
                }
            });
        }
    }

    if (!req.query.project) {
        // if no query, display test editor
        return res.render('layout', {
            sidebarmenu: new SidebarMenuActive('editor', 'scripteditor'),
            renderContent: 'content/scripteditor',
            renderBreadcrumbs: 'content/breadcrumbs/scripteditor',
            renderScripts: 'scripts/scripteditor',
            // send user session if exists
            user: req.session.user || null,
            projects: accessibleProjects || [],
            // send testscript as boolean false
            existingScript: false,
            // send query
            query: req.query || {},
            reload: req.app.settings.reload
        });
    }

    // if request has project query
    // if request has subproject query and ifS request has testname queryS
    // search mongo if testscript exists
    return Script.findOne({
        project: req.query.project,
        module: req.query.module,
        testName: req.query.testName
    }).lean().exec(function (err, testscript) {
        renderScriptEditor(err, res, req, testscript, accessibleProjects);
    });
};

function renderScenarioEditor(err, res, req, template, projects) {
    // if no error occured
    if (!err) {
        // if testscript was found
        if (template) {
            // display script editor page and pass testscript data
            res.render('layout', {
                sidebarmenu: new SidebarMenuActive('editor', 'scenarioeditor'),
                renderContent: 'content/scenarioeditor',
                renderBreadcrumbs: 'content/breadcrumbs/scenarioeditor',
                renderScripts: 'scripts/scenarioeditor',
                // send user session if exists
                user: req.session.user || null,
                projects: projects,
                // send testscript document
                existingTemplate: template,
                // send query
                query: req.query || {},
                reload: req.app.settings.reload
            });
        } else {
            // if testscript was not found, display script editor
            res.render('layout', {
                sidebarmenu: new SidebarMenuActive('editor', 'scenarioeditor'),
                renderContent: 'content/scenarioeditor',
                renderBreadcrumbs: 'content/breadcrumbs/scenarioeditor',
                renderScripts: 'scripts/scenarioeditor',
                // send user session if exists
                user: req.session.user || null,
                projects: projects,
                // send testscript as boolean false
                existingTemplate: false,
                // send query
                query: req.query || {},
                reload: req.app.settings.reload
            });
        }
    } else {
        // if error occured, display testeditor
        res.render('layout', {
            sidebarmenu: new SidebarMenuActive('editor', 'scenarioeditor'),
            renderContent: 'content/scenarioeditor',
            renderBreadcrumbs: 'content/breadcrumbs/scenarioeditor',
            renderScripts: 'scripts/scenarioeditor',
            // send user session if exists
            user: req.session.user || null,
            projects: projects,
            // send testscript as boolean false
            existingTemplate: false,
            // send query
            query: req.query || {},
            reload: req.app.settings.reload
        });
    }
}

exports.scenarioEditor = function (req, res) {
    var accessibleProjects = [];
    if (req.session.user) {
        if (req.session.user.isSuper || req.session.user.isAdmin) {
            accessibleProjects = req.app.locals.projects;
        } else {
            req.session.user.roles.forEach(function (role) {
                if (req.app.locals.projects.some(_ => _.projectKey == role)) {
                    accessibleProjects.push(req.app.locals.projects.filter(_ => _.projectKey == role).shift());
                }
            });
        }
    }

    if (!req.query.project) {
        // if no query, display test editor
        return res.render('layout', {
            sidebarmenu: new SidebarMenuActive('editor', 'scenarioeditor'),
            renderContent: 'content/scenarioeditor',
            renderBreadcrumbs: 'content/breadcrumbs/scenarioeditor',
            renderScripts: 'scripts/scenarioeditor',
            // send user session if exists
            user: req.session.user || null,
            projects: accessibleProjects,
            // send testscript as boolean false
            existingTemplate: false,
            // send query
            query: req.query || {},
            reload: req.app.settings.reload
        });
    }

    // if request has project query
    // if request has subproject query and ifS request has testname queryS
    // search mongo if testscript exists
    return Scenario.Scenario.findOne({
        project: req.query.project,
        //subProject: req.query.subproject,
        name: req.query.testname
    }).lean().exec(function (err, template) {
        renderScenarioEditor(err, res, req, template, accessibleProjects);
    });
};

exports.suiteEditor = function (req, res) {
    if (req.query.project) {
        if (req.query.suitename) {
            return Suite.findOne({
                project: req.query.project,
                suiteName: req.query.suitename
            }).exec(function (error, suite) {
                if (error)
                    return res.status(500).send({ success: false, message: 'Internal Server Error 500.\n' + error });

                if (suite) {
                    if (req.app.locals.projects.some(_ => _.projectKey == req.query.project)) {
                        var project = req.app.locals.projects.filter(_ => _.projectKey == req.query.project)[0];
                        return res.render('layout', {
                            sidebarmenu: new SidebarMenuActive('editor', 'suiteeditor'),
                            renderContent: 'content/suiteeditor',
                            renderBreadcrumbs: 'content/breadcrumbs/suiteeditor',
                            renderScripts: 'scripts/suiteeditor',
                            // send user session if exists
                            user: req.session.user || null,
                            projects: req.app.locals.projects,
                            project: project,
                            existingSuite: suite || false,
                            // send query
                            query: req.query || {},
                            reload: req.app.settings.reload
                        });
                    } else {
                        return res.render('pages/404');
                    }
                } else {
                    return res.render('pages/404');
                }
            });
        } else {
            if (req.app.locals.projects.some(_ => _.projectKey == req.query.project)) {
                var project = req.app.locals.projects.filter(_ => _.projectKey == req.query.project)[0];
                // if no query, display test editor
                return res.render('layout', {
                    sidebarmenu: new SidebarMenuActive('editor', 'suiteeditor'),
                    renderContent: 'content/suiteeditor',
                    renderBreadcrumbs: 'content/breadcrumbs/suiteeditor',
                    renderScripts: 'scripts/suiteeditor',
                    // send user session if exists
                    user: req.session.user || null,
                    projects: req.app.locals.projects,
                    project: project,
                    existingSuite: false,
                    // send query
                    query: req.query || {},
                    reload: req.app.settings.reload
                });
            } else {
                return res.render('pages/404');
            }
        }
    } else {
        return res.render('pages/404');
    }
};

exports.editors = function (req, res) {
    return res.render('layout', {
        sidebarmenu: new SidebarMenuActive('editor'),
        renderContent: 'content/editors',
        renderBreadcrumbs: 'content/breadcrumbs/editors',
        renderScripts: undefined,
        user: req.session.user || null,
        projects: req.app.locals.projects,
        reload: req.app.settings.reload
    });
};

exports.repositories = function (req, res) {
    return res.render('layout', {
        sidebarmenu: new SidebarMenuActive('repositories'),
        renderContent: 'content/repositories',
        renderBreadcrumbs: 'content/breadcrumbs/repositories',
        renderScripts: undefined,
        user: req.session.user || null,
        projects: req.app.locals.projects,
        reload: req.app.settings.reload
    });
};

exports.scenarioRepository = function (req, res) {
    var project = req.app.locals.projects.filter(_ => _.projectKey == req.params.project)[0];
    if (project) {
        return res.render('layout', {
            sidebarmenu: new SidebarMenuActive('repository', 'scenariosrepo', req.params.project),
            renderContent: 'content/scenariorepository',
            renderBreadcrumbs: 'content/breadcrumbs/scenariorepository',
            renderScripts: 'scripts/scenariorepository',
            user: req.session.user || null,
            projects: req.app.locals.projects,
            project: project,
            reload: req.app.settings.reload
        });
    } else {
        return res.render('pages/404');
    }
};

exports.scriptsRepository = function (req, res) {
    var project = req.app.locals.projects.filter(_ => _.projectKey == req.params.project)[0];
    if (project) {
        return res.render('layout', {
            sidebarmenu: new SidebarMenuActive('repository', 'scriptsrepo', req.params.project),
            renderContent: 'content/scriptsrepository',
            renderBreadcrumbs: 'content/breadcrumbs/scriptsrepository',
            renderScripts: 'scripts/scriptsrepository',
            user: req.session.user || null,
            projects: req.app.locals.projects,
            project: project,
            reload: req.app.settings.reload
        });
    } else {
        return res.render('pages/404');
    }
};

exports.pages = function (req, res) {
    // query Objects that matches parameter project
    return Object.Page.find({ project: req.params.project }, function (err, pages) {
        if (err)
            return res.status(400).send({ success: false, message: 'error occured while querying pages\n' + err });

        var project = req.app.locals.projects.filter(_ => _.projectKey == req.params.project)[0];
        if (project) {
            return res.render('layout', {
                sidebarmenu: new SidebarMenuActive('repository', 'objectsrepo', req.params.project),
                renderContent: 'content/pages',
                renderBreadcrumbs: 'content/breadcrumbs/pages',
                renderScripts: 'scripts/pages',
                user: req.session.user || null,
                pages: pages || undefined,
                projects: req.app.locals.projects,
                project: project,
                reload: req.app.settings.reload
            });
        } else {
            return res.render('pages/404');
        }
    });
};

exports.administrator = function (req, res) {
    return res.render('layout', {
        sidebarmenu: new SidebarMenuActive('administrator'),
        renderContent: 'content/administrator',
        renderBreadcrumbs: 'content/breadcrumbs/administrator',
        renderScripts: undefined,
        user: req.session.user || null,
        projects: req.app.locals.projects,
        reload: req.app.settings.reload
    });
};

exports.userManagement = function (req, res) {
    return res.render('layout', {
        sidebarmenu: new SidebarMenuActive('administrator', 'usermanagement'),
        renderContent: 'content/usermanagement',
        renderBreadcrumbs: 'content/breadcrumbs/usermanagement',
        renderScripts: 'scripts/usermanagement',
        user: req.session.user || null,
        projects: req.app.locals.projects,
        reload: req.app.settings.reload
    });
};

exports.projectManagement = function (req, res) {
    return res.render('layout', {
        sidebarmenu: new SidebarMenuActive('administrator', 'projectmanagement'),
        renderContent: 'content/projectmanagement',
        renderBreadcrumbs: 'content/breadcrumbs/projectmanagement',
        renderScripts: 'scripts/projectmanagement',
        user: req.session.user || null,
        projects: req.app.locals.projects,
        reload: req.app.settings.reload
    });
};


exports.userProfile = function (req, res) {
    return User.findOne({ username: req.params.username }, function (err, user) {
        if (err)
            return res.status(400).send({ success: false, message: 'an error occured while querying users\n' + err });

        if (user) {
            var userModified = JSON.parse(JSON.stringify(user));
            userModified.password = undefined; // set password to undefined
            userModified.fullname =
                `${ToTitleCase(user.firstName)} ${ToTitleCase(user.lastName)}`; // set fullname of user

            return res.render('layout', {
                sidebarmenu: new SidebarMenuActive(),
                renderContent: 'content/userprofile',
                renderBreadcrumbs: 'content/breadcrumbs/userprofile',
                renderScripts: undefined,
                user: req.session.user || null,
                profile: userModified,
                projects: req.app.locals.projects,
                reload: req.app.settings.reload
            });
        }
    });
};

exports.userSettings = function (req, res) {
    if (req.params.username == req.session.user.username)
        return res.render('layout', {
            sidebarmenu: new SidebarMenuActive(),
            renderContent: 'content/usersettings',
            renderBreadcrumbs: 'content/breadcrumbs/usersettings',
            renderScripts: 'scripts/usersettings',
            user: req.session.user || null,
            projects: req.app.locals.projects,
            reload: req.app.settings.reload
        })
    else
        return res.redirect(`/user/${req.params.username}`);
};

exports.userInvitation = function (req, res) {
    return res.render('pages/user_invitation', {
        sidebarmenu: new SidebarMenuActive(),
        user: req.session.user || null,
        projects: req.app.locals.projects,
        reload: req.app.settings.reload
    });
};

exports.mailbox = function (req, res) {
    return res.render('layout', {
        sidebarmenu: new SidebarMenuActive(),
        renderContent: 'content/mailbox',
        renderBreadcrumbs: undefined,
        renderScripts: undefined,
        user: req.session.user || null,
        projects: req.app.locals.projects,
        reload: req.app.settings.reload
    })
};

exports.execution = function (req, res) {
    return res.render('layout', {
        sidebarmenu: new SidebarMenuActive('execution'),
        renderContent: 'content/execution',
        renderBreadcrumbs: 'content/breadcrumbs/execution',
        renderScripts: undefined,
        user: req.session.user || null,
        projects: req.app.locals.projects,
        reload: req.app.settings.reload
    });
};

exports.runtest = function (req, res) {
    return res.render('layout', {
        sidebarmenu: new SidebarMenuActive('execution', 'runtest'),
        renderContent: 'content/runtest',
        renderBreadcrumbs: 'content/breadcrumbs/runtest',
        renderScripts: undefined,
        user: req.session.user || null,
        projects: req.app.locals.projects,
        reload: req.app.settings.reload
    });
};

exports.runOnDemand = function (req, res) {
    return res.render('layout', {
        sidebarmenu: new SidebarMenuActive('execution', 'runtest', 'runondemand'),
        renderContent: 'content/runondemand',
        renderBreadcrumbs: 'content/breadcrumbs/runondemand',
        renderScripts: 'scripts/runondemand',
        execution: executionConfig || undefined,
        user: req.session.user || null,
        projects: req.app.locals.projects || undefined,
        reload: req.app.settings.reload
    });
};

exports.viewTestResults = function (req, res) {
    return res.render('layout', {
        sidebarmenu: new SidebarMenuActive('execution', 'testresults'),
        renderContent: 'content/viewtestresults',
        renderBreadcrumbs: 'content/breadcrumbs/viewtestresults',
        renderScripts: 'scripts/viewtestresults',
        execution: executionConfig || undefined,
        user: req.session.user || null,
        projects: req.app.locals.projects || undefined,
        activeTab: req.query.activeTab || undefined,
        reload: req.app.settings.reload
    });
}

exports.viewTestResult = function (req, res) {
    var testresult_id = undefined;
    if (req.params.suite_id && req.params.script_id)
        testresult_id = req.params.script_id;
    else
        testresult_id = req.params.id;

    return TestResult.findById(testresult_id, function (error, testresult) {
        if (error)
            return res.status(500).send(error);
        else {
            if (testresult) {
                return res.render('layout', {
                    sidebarmenu: new SidebarMenuActive('execution', 'testresults'),
                    renderContent: 'content/viewtestresult',
                    renderBreadcrumbs: 'content/breadcrumbs/viewtestresult',
                    renderScripts: 'scripts/viewtestresult',
                    execution: executionConfig || undefined,
                    user: req.session.user || null,
                    projects: req.app.locals.projects || undefined,
                    suiteId: req.params.suite_id || undefined,
                    scriptId: testresult_id || undefined,
                    testresult: testresult,
                    reload: req.app.settings.reload
                });
            } else {
                return res.render('pages/404');
            }
        }
    });
}

exports.suiteRepository = function (req, res) {
    var project = req.app.locals.projects.filter(_ => _.projectKey == req.params.project)[0];
    if (project) {
        return res.render('layout', {
            sidebarmenu: new SidebarMenuActive('repository', 'suitesrepo', req.params.project),
            renderContent: 'content/suiterepository',
            renderBreadcrumbs: 'content/breadcrumbs/suiterepository',
            renderScripts: 'scripts/suiterepository',
            user: req.session.user || null,
            projects: req.app.locals.projects,
            project: project,
            reload: req.app.settings.reload
        });
    } else {
        return res.render('pages/404');
    }
};

exports.dashboardReport = function (req, res) {
    Project.findOne({ projectKey: req.params.project }, function (error, project) {
        if (error)
            return res.render('pages/404'); // render page 500
        else {
            if (project) {
                return res.render('layout', {
                    sidebarmenu: new SidebarMenuActive('dashboard', 'reports'),
                    renderContent: 'content/dashboardreport',
                    renderBreadcrumbs: 'content/breadcrumbs/dashboardreport',
                    renderScripts: 'scripts/dashboardreport',
                    user: req.session.user || null,
                    projects: req.app.locals.projects,
                    project: { projectKey: project.projectKey, name: project.name },
                    reload: req.app.settings.reload
                });
            } else {
                return res.render('pages/404');
            }
        }
    });
};

exports.viewApplicationLogs = function (req, res) {
    readApplicationLogs(function(error, logs) {
        if (error)
            console.error(error);

        res.setHeader('Content-Type', 'text/plain');
        return res.send(logs);
    });
};

exports.viewAccessLogs = function (req, res) {
    readAccessLogs(function(error, logs) {
        if (error)
            console.error(error);

        res.setHeader('Content-Type', 'text/plain');
        return res.send(logs);
    });
};

exports.pageMissing = function (req, res) {
    return res.render('pages/404');
};

function SidebarMenuActive(l1, l2, l3) {
    this.l1 = l1 || undefined;
    this.l2 = l2 || undefined;
    this.l3 = l3 || undefined;
    return this;
};