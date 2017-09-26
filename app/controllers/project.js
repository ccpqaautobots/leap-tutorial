var models = require('./models-sc');
var Project = models.Project;

function MongooseValidationErrorHandler(error, response) {
    if (error.name == 'ValidationError') {
        var errors = [];
        Object.keys(error.errors).forEach(function (key) {
            if (error.errors.hasOwnProperty(key)) {
                errors.push(error.errors[key].message)
            }
        });
        response.status(400).send({ errors: errors });
    } else {
        response.status(500).send('Internal Server Error 500\n' + error);
    }
};

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
};

exports.getProjects = function (req, res) {
    if (!req.body.query)
        req.body.query = {};
    if (!req.body.options)
        req.body.options = {};

    return Project
        .find(req.body.query)
        .select(req.body.options.select || {})
        .limit(req.body.options.limit || 0)
        .skip(req.body.options.skip || 0)
        .exec(function (err, projects) {
            if (err)
                return res.status(400).send({ success: false, message: 'error occured while querying projects\n' + err });
            
            return res.status(200).json(projects);
        });
};

exports.createProject = function (req, res) {
    new Project(req.body).save(function (error, project) {
        if (error) return MongooseValidationErrorHandler(error, res);

        LoadProjects(function (error, projects) {
            req.app.locals.projects = projects;
            return res.status(201).send(project);
        });
    });
};

exports.updateProject = function (req, res) {
    Project.findOneAndUpdate(
        { _id: req.params.id }, // query
        req.body, // updated object,
        { new: true }, // options,
        function (error, project) { // callback
            if (error) return MongooseValidationErrorHandler(error, res);

            LoadProjects(function (error, projects) {
                req.app.locals.projects = projects;
                return res.status(200).send(project);
            });
        });
};

exports.deleteProject = function (req, res) {
    Project.findOneAndRemove({ _id: req.params.id }, function (error, project) {
        if (error) return MongooseValidationErrorHandler(error, res);
       
        LoadProjects(function (error, projects) {
            req.app.locals.projects = projects;
            return res.status(204).send();
        });
    });
};