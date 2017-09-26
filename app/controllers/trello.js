var path = require('path');
var mime = require('mime');
var appConfig = require('../config/app');
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, path.join(__dirname, '..', '..', '..', 'public', 'uploads'));
    },
    filename: function(req, file, callback) {
        callback(null, `${file.fieldname}-${Date.now()}.${mime.extension(file.mimetype)}`);
    }
});
var upload = multer({
    storage: storage
}).array('trello-files', 5);

var Trello = require('trello');

exports.trelloRaise = function(req, res) {
    var trello = new Trello('240f0872e3d6b6e557b23c94857dc26f', req.query.token);
    upload(req, res, function(err) {
        if (req.files.length > 0) {
            if (err)
                return res.status(400).send({ success: false, message: 'failed to upload files' });

            return trello.addCard(req.body.name, `Desc: ${req.body.description}\nUrl: ${req.body.url}`, '58b02d0fc746234b072e2112', function(err, card) {
                if (err)
                    return res.status(400).send({ success: false, message: 'failed to create a trello card\n' + err });

                if (card) {
                    var attachFailed = [];
                    req.files.forEach(function(attachment) {
                        trello.addAttachmentToCard(card.id, `http://${appConfig.host}:${appConfig.port}/uploads/${attachment.filename}`, function(err) {
                            if (err)
                                attachFailed.push({ name: `failed to attach : ${attachment.filename}` });
                        })
                    });
                    return res.status(200).send({ success: true, errors: attachFailed });
                } else {
                    return res.status(400).send({ success: false, message: 'failed to create a trello card' });
                }
            });
        } else {
            return trello.addCard(req.body.name, `Desc: ${req.body.description}\nUrl: ${req.body.url}`, '58b02d0fc746234b072e2112', function(err, card) {
                if (err)
                    return res.status(400).send({ success: false, message: 'failed to create a trello card\n' + err });

                if (card) {
                    return res.status(200).send({ success: true, message: 'trello card created successfully' });
                }
            })
        }
    });
};