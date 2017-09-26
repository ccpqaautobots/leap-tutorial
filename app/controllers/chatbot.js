var apiai = require('apiai');
var app = apiai('a24b41556efc40ecb321180a68f64b20');

class AgentResponse {
    constructor (request, response, data) {
        this.request = request;
        this.response = response;
        this.data = data;
    }
};

AgentResponse.prototype.HandleAction = function () {
    var action = this.data.result.action;
    var parameters = this.data.result.parameters;

    if (action == 'navigate')
        this.Navigate(parameters.items, parameters.project);
    else if (action == 'create')
        this.Create(parameters.items, parameters.project);
    else
        this.response.status(400).send('Action is not supported.');
};

AgentResponse.prototype.Create = function(what, project) {
    if (what == 'script')
        this.response.status(200).send({ action: 'create', to: '/scripteditor' + ((project) ? `?project=${project}` : '') });
    else if (what == 'suite')
        this.response.status(200).send({ action: 'create', to: '/suiteeditor' + ((project) ? `?project=${project}` : '') });
    else if (what == 'object')
        this.response.status(200).send({ action: 'create', to: '/pages' + ((project) ? `/${project}` : '') });
};

AgentResponse.prototype.Navigate = function(where, project) {
    if (where == 'script') 
        this.response.status(200).send({ action: 'redirect', to: '/scriptsrepository' + ((project) ? `/${project}` : '') });
    else if (where == 'suite')
        this.response.status(200).send({ action: 'redirect', to: '/suiterepository' + ((project) ? `/${project}` : '') });
    else if (where == 'object')
        this.response.status(200).send({ action: 'redirect', to: '/pages' + ((project) ? `/${project}` : '') });
    else if (where == 'scripteditor')
        this.response.status(200).send({ action: 'redirect', to: '/scripteditor' + ((project) ? `?project=${project}` : '') });
    else if (where == 'suiteeditor')
        this.response.status(200).send({ action: 'redirect', to: '/suiteeditor' + ((project) ? `?project${project}` : '') });
    else
        this.response.status(200).send({ action: 'redirect', to: '/404' });
};

exports.chat = function (req, res) {
    var request = app.textRequest(req.body.t || req.query.t, { sessionId: 'sessionId' });
    request.on('response', function (response) {
        new AgentResponse(req, res, response).HandleAction();
    });
    request.on('error', function (error) {
        res.status(500).send(error);
    });
    request.end();
};