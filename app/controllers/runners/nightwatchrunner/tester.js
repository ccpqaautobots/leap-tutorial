const Q = require('./nightwatch_q');
const Script = require('./nightwatch_script');
const Suite = require('./nightwatch_suite');

var script1 = new Script(Q, 'script 1', 5000);
var script2 = new Script(Q, 'script 2', 2000);
var script3 = new Script(Q, 'script 3', 4000);

var suite = new Suite(Q, [
    { name: 'suite script 1', timeout: 10000 },
    { name: 'suite script 2', timeout: 5000 },
    { name: 'suite script 3', timeout: 12000 },
    { name: 'suite script 4', timeout: 12000 },
    { name: 'suite script 5', timeout: 15000 },
    { name: 'suite script 6', timeout: 20000 },
    { name: 'suite script 7', timeout: 3000 }], 'suite 1');

var suite2 = new Suite(Q, [
    { name: 'suite script 1', timeout: 10000 },
    { name: 'suite script 2', timeout: 5000 },
    { name: 'suite script 3', timeout: 20000 },
    { name: 'suite script 4', timeout: 3000 }], 'suite 2');

Q.emit('receive', suite);
Q.emit('receive', script1);
Q.emit('receive', script2);
Q.emit('receive', suite2);
Q.emit('receive', script3);