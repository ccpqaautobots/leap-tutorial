const async = require('async');
var models = require('../../models-sc');
const Script = models.Script;
const Suite = models.Suite;

/**
 * @param {script id} id 
 * @param {callback(error, data)} callback
 */
function GetScriptById(id, callback) {
    Script.findOne({ _id: id }, (error, script_document) => {                   // fetch script from mongodb
        if (error)
            callback('error occured while querying scripts \n' + error);        // if error occured -> return error to sender
        else {
            callback(null, script_document);                                    // if no error occured -> return data to sender
        }
    });
};

module.exports = (payload, callback) => {
    var trans = {
        scripts: [],                            // stores formatted scripts
        suites: [],                             // stores formatted suites
        options: payload.options || {}          // stores options (run setup)
    };

    if (payload.tests instanceof Array) {                                                                           // if payload is an instance of array
        async.forEachOf(payload.tests, (payload_data, i, first_callback) => {                                       // iterate thru payload
            if (payload_data.scripts && payload_data.scripts instanceof Array) {                                    // if payload has {scripts} property which is also an array -> expected suite
                async.forEachOf(payload_data.scripts, (payload_script, j, second_callback) => {                     // iterate thru scripts
                    if (!payload_script.disabled) {                                                                 // if script is not disabled
                        GetScriptById(payload_script.scriptId, (get_script_error, get_script_response) => {         // get script from mongodb
                            if (get_script_error)                                                                   // terminate iteration if an error occured
                                second_callback(get_script_error);                                                  // complete script iteration
                            else {
                                if (get_script_response) {                                                          // if script exists
                                    payload.tests[i].scripts[j] = get_script_response;                              // replace iteration data of script document
                                    second_callback();                                                              // complete script iteration
                                } else {
                                    second_callback();                                                              // else ignore script -> non existing script -> complete script iteration
                                }
                            }
                        });
                    } else {
                        second_callback();                                                                          // else if script id disabled -> skip script -> complete script iteration
                    }
                }, (second_callback_error) => {
                    if (second_callback_error)
                        first_callback(second_callback_error);                                                      // if error occured while iterating suites -> complete payload iteration with error
                    else {
                        const executable_scripts = payload.tests[i].scripts.filter(_ => _.scriptId == undefined);   // filter all scripts that was properly rendered
                        payload.tests[i].scripts = executable_scripts;                                              // replace current scripts with the filtered
                        trans.suites.push(payload.tests[i]);                                                        // push modified data to transformed payload model
                        first_callback();                                                                           // complete payload iteration
                    }
                });
            } else if (payload_data.scenarios && payload_data.scenarios instanceof Array) {                         // if payload has {scenarios} property which is also an array -> expected script    
                trans.scripts.push(payload.tests[i]);                                                               // push script into transformed payload model
                first_callback();                                                                                   // complete payload iteration
            } else {                                                                                                // if payload does not match any condition
                first_callback('malformed payload received: \n' + data);                                            // complete payload iteration with error
            }
        }, (first_callback_error) => {
            if (first_callback_error)                                                                               // if payload iteration has errors
                callback(first_callback_error);                                                                     // return error to sender
            else                                                                                                    // else if no errors
                callback(null, trans);                                                                              // return transformed model to sender
        });
    }
};