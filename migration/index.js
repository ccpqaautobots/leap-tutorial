const async = require('async');
const mongoose = require('mongoose');
const models = require('../app/models');

mongoose.Promise = require('bluebird');

module.exports = (modelName, fnUpdate) => {
    let targetModel = models;
    modelName.split('.').forEach(function(name) {
        targetModel = targetModel[name];
    });

    mongoose.connect(require('../app/config/mongodb')(), { useMongoClient: true }, (error) => {
        if (error)
            throw new Error(error);
        else {
            console.log('Connected to mongo database...');
            console.log(`Fetching ${modelName}...`);
            targetModel.find({}).lean().exec((error, items) => {
                if (error)
                    throw new Error(error);

                console.log('Total items fetched: ' + items.length);
                async.eachSeries(items, (item, callback) => {
                    console.log('Updating item with id: ' + item._id);

                    fnUpdate(item, (error, updated_item) => {
                        if (error)
                            throw new Error(error);
                        
                        targetModel.update({ _id: item._id }, updated_item, (error, updated_item) => {
                            callback();
                        });
                    });
                }, (error) => {
                    console.log(`${modelName} migration done...`);
                    process.exit(0);
                });
            });
        }
    });
}