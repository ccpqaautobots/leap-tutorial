const transform_payload = require('./transform_payload');
const process_payload = require('./process_payload');
const generate_runmodel = require('./generate_runmodel');

module.exports = (payload, sender, callback) => {
    const _sender = sender || {
        name: 'unknown sender',
        username: 'unknown sender'
    };
    transform_payload(payload, (payload_error, transformed_payload) => {
        if (payload_error)
            callback(payload_error);
        else {
            process_payload(transformed_payload, (process_error, processed_payload) => {
                if (process_error)
                    callback(process_error);
                else {
                    generate_runmodel(processed_payload, _sender, (generate_error, generated_runmodels) => {
                        if (generate_error)
                            callback(generate_error);
                        else
                            callback(null, generated_runmodels);
                    });
                }
            });
        }
    });
};