'use strict';

// ================================================================
// dependencies
// ================================================================

// express
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var compression = require('compression');
var minify = require('express-minify');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var session = require('express-session');
var MemoryStore = require('session-memory-store')(session);
var morgan = require('morgan');

// helpers
var console = require('./helpers/consoleOverride')(console);
var writableStreams = require('./helpers/writableStreams');
var appLogger = require('./helpers/streamLogger')(writableStreams.applicationLogs);
var errorLogger = require('./helpers/streamLogger')(writableStreams.errorLogs);

// database
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

// developer
var reload = require('reload');
var dotenv = require('dotenv');

// initialization
var app = express(); // express application
var server = require('http').createServer(app); // http server for express
var io = require('socket.io')(server); // socket io attach to server
var ios = require('socket.io-express-session'); // socket io session sharing

// ================================================================
// express setup
// ================================================================

// environment variables defaults
process.env.NODE_ENV = process.env.NODE_ENV || 'development'; // default environment is development

// load environment variables
if (process.env.NODE_ENV) {
    dotenv.load({ path: '.env.' + process.env.NODE_ENV.toLowerCase() });
}

app.use(compression());
app.use(express.static('app/public'));
app.set('view engine', 'ejs');
app.set('views', 'app/views');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(cors());
app.use(session({
    secret: process.env.SESSION_SECRET || 's96fd2h6fgh231fghz21xc5swqu',
    name: process.env.SESSION_COOKIE_NAME || 'cookie-leap',
    resave: true,
    rolling: true,
    saveUninitialized: true,
    store: new MemoryStore()
}));

// ================================================================
// express setup error handling
// ================================================================
if (process.env.NODE_ENV === 'development') {
    console.log('[SERVER] Started configured as development mode ...');
    app.set('reload', true);
    var errorhandler = require('./helpers/errorhandler');

    app.use(errorhandler({
        consoleLog: true,
        hostNotification: true,
        emailNotification: true,
        displayError: true
    }));

    app.use(morgan('combined', {
        stream: writableStreams.accessLogs
    }));

    // ================================================================
    // hot reload
    // ================================================================
    reload(server, app); // automated development - reload when changes happen
} else if (process.env.NODE_ENV === 'production') {
    console.log('[SERVER] Started configured as production mode ...');
    app.set('reload', false);
    var errorhandler = require('./helpers/errorhandler');

    app.use(errorhandler({
        consoleLog: true,
        hostNotification: true,
        emailNotification: true
    }));

    app.use(morgan('combined', {
        stream: writableStreams.accessLogs
    }));
}

// ================================================================
// load express routes
// ================================================================
app.use(require('./router'));

// ================================================================
// process exception handling
// ================================================================
process.on('uncaughtException', 
    require('./helpers/uncaughtexceptionhandler')({
        consoleLog: true,
        emailNotification: true
}));

// ================================================================
// process events
// ================================================================
var sockets = {},
    nextSocketId = 0;
server.on('connection', function (socket) {
    var socketId = nextSocketId++;
    sockets[socketId] = socket;

    socket.on('close', function () {
        delete sockets[socketId];
    });
});

function Shutdown() {
    Object.keys(sockets).forEach(function (socket) {
        if (socket)
            sockets[socket].destroy();
    });

    server.close(function () {
        process.exit();
    });
}

// listen for TERM signal .e.g. kill 
process.on('SIGTERM', function () {
    Shutdown();
});

// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', function () {
    Shutdown();
});

process.openStdin().addListener('data', function (data) {
    if (data.toString().trim() === '--shutdown') {
        Shutdown();
    }
});

io.use(ios(session));

var pubChat = io.of('/public-chat').use(ios(session));
pubChat.on('connection', function (socket) {
    var userSession = socket.handshake.session || undefined;
    if (userSession.user) {
        var user = {
            id: userSession.user._id,
            fullname: userSession.user.fullname
        }
    }

    pubChat.emit('user connected', { user: user });

    socket.on('typing', function (userTyping) {
        socket.broadcast.emit('status typing', userTyping);
    });

    socket.on('not typing', function (userTyping) {
        socket.broadcast.emit('status not typing', userTyping);
    });

    socket.on('send message', function (data) {
        socket.broadcast.emit('receive message', data);
    });

    socket.on('disconnect', function () {

    });
});

// ================================================================
// mongoose connect and server startup
// ================================================================

// initalize projects
var models = require('./models');
var Project = models.Project;
function LoadProjects(callback) {
    return Project.find({
    }).select({
        _id: 0,
        environments: 0
    }).exec(function (err, projects) {
        if (err)
            callback(err);

        callback(null, projects);
    })
}

mongoose.connect(require('./config/mongodb')(), { useMongoClient: true }, function (mongoError) {
    if (mongoError)
        throw new Error('[ERROR] Unable to start server, failed to connect to mongo database.\n' + mongoError);
    else {
        var port = process.env.PORT || '8080';
        LoadProjects(function (error, projects) {
            app.locals.projects = projects;
            server.listen(port, function () {
                console.log('[SERVER] Started is now running at ' + port + ' ...');
            });
        });
    }
});