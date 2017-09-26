const async = require('async');
const migration = require('./');
const models = require('../app/models');

/* migration scenario
* update scenario.step.testData
* from object (array) to a string
*
* current schema:
*   testData [
*       { input: String, value: String }, 
*       { input: String, value: String }
*   ]
* migration should extract the first item in testData
* array and be stored as the new testData 
*/

migration('Scenario.Scenario', (item, callback) => {

    async.eachSeries(item.steps, (step, step_callback) => {
        if (typeof step.testData == 'object' ||
            step.testData == '[object Object]') {
            step.testData = step.testData[0].input;
        }

        // update page
        models.Object.Page.findOne({ name: step.page }, (page_find_error, step_found_page) => {
            if (page_find_error)
                return step_callback(page_find_error);
            else {
                if (step_found_page) {
                    console.log('inside step ...');
                    console.log('updating page ...');
                    step.pageId = step_found_page._id;
                    if (step_found_page.elements.some(_ => _.name == step.object)) {
                        console.log('updating object ...');
                        const step_element = step_found_page.elements.filter(_ => _.name == step.object).shift();
                        step.objectId = step_element._id;
                    } else {
                        step.objectId = undefined;
                    }
                    async.eachSeries(step.assertions, (assertion, assertion_callback) => {
                        models.Object.Page.findOne({ name: assertion.page }, '', (assertion_find_error, assertion_found_page) => {
                            if (assertion_find_error)
                                return assertion_callback(assertion_find_error);
                            else {
                                if (assertion_found_page) {
                                    console.log('inside assertion ...');
                                    console.log('updating page ...');
                                    assertion.pageId = assertion_found_page._id;
                                    if (assertion_found_page.elements.some(_ => _.name == assertion.element)) {
                                        console.log('updating object ...');
                                        const assertion_element = assertion_found_page.elements.filter(_ => _.name == assertion.element).shift();
                                        assertion.objectId = assertion_element._id;
                                    }
                                } else {
                                    assertion.pageId = undefined;
                                    assertion.objectId = undefined;
                                }
                            }
                            assertion_callback();
                        }, (assertion_error) => {
                            if (assertion_error)
                                return step_callback('ERROR: ' + assertion_error);

                            step_callback();
                        });
                    });
                } else {
                    step.pageId = undefined;
                    step.objectId = undefined;
                }
            }
            step_callback();
        });
    }, (step_error) => {
        if (step_error)
            return callback('ERROR: ' + step_error);

        callback(null, item);
    });
});