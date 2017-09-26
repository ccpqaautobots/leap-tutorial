var mongoose = require('mongoose');
var User = require('../controllers/models/user');
var server = require('../config').testing.getHost();
var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var random = require('randomstring');

chai.use(chaiHttp);

var assert = require('assert');
describe('user administration', function () {
    this.timeout(10000);
    var user = {
        username: random.generate(10),
        password: random.generate(10),
        firstName: random.generate(10),
        lastName: random.generate(10),
        jobTitle: random.generate(10),
        firstNameUpdate: random.generate(15),
        lastNameUpdate: random.generate(15),
<<<<<<< HEAD
        jobTitleUpdate: random.generate(15) 
=======
        jobTitleUpdate: random.generate(15),
        email: `${random.generate(10)}@yopmail.com`
>>>>>>> 25ed8f8a1cca99909275831dc86bfc11c1d0ce9c
    };
    var userId;
    describe('create user', function () {
        it('should create user via POST/api/user', function (done) {
<<<<<<< HEAD
            this.timeout(3000);
=======
            this.timeout(10000);
>>>>>>> 25ed8f8a1cca99909275831dc86bfc11c1d0ce9c
            chai.request(server)
                .post('/api/user')
                .send(user)
                .end(function (err, res) {
<<<<<<< HEAD
                    res.should.have.status(201);
=======
                    res.should.have.status(200);
>>>>>>> 25ed8f8a1cca99909275831dc86bfc11c1d0ce9c
                    res.body.should.be.a('object');
                    res.body.success.should.be.true;
                    done();
                })
        });
    });
    describe('retrive user', function () {
        it('should retrieve user via GET/api/user/:username', function (done) {
            this.timeout(3000);
            chai.request(server)
                .get('/api/user/' + user.username)
                .end(function (err, res) {
                    res.should.have.status(200);
                    userId = res.body._id;
                    res.body.should.be.a('object');
                    res.body.username.should.be.equal(user.username);
                    res.body.password.should.be.equal(user.password);
                    res.body.firstName.should.be.equal(user.firstName);
                    res.body.lastName.should.be.equal(user.lastName);
                    res.body.jobTitle.should.be.equal(user.jobTitle);
                    done();
                })
        });
    });
    describe('update user', function () {
        it('should update user via PUT/api/user/:username', function (done) {
            this.timeout(3000);
            chai.request(server)
                .put('/api/user/' + user.username)
                .send({
                    firstName: user.firstNameUpdate,
                    lastName: user.lastNameUpdate,
                    jobTitle: user.jobTitleUpdate
                })
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.success.should.be.true;
                    done();
                })
        });
        it('should retrieve the updated user', function(done) {
            this.timeout(3000);
            chai.request(server)
                .get('/api/user/' + user.username)
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body._id.should.be.equal(userId);
                    res.body.username.should.be.equal(user.username);
                    res.body.password.should.be.equal(user.password);
                    res.body.firstName.should.be.equal(user.firstNameUpdate);
                    res.body.lastName.should.be.equal(user.lastNameUpdate);
                    res.body.jobTitle.should.be.equal(user.jobTitleUpdate);
                    done();
                })
        });
    });
    describe('delete user', function () {
        it('should delete user via DELETE/api/user/:username', function (done) {
            this.timeout(3000);
            chai.request(server)
                .delete('/api/user/' + user.username)
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.body.success.should.be.true;
                    done();
                })
        });
        it('should not retrieve the deleted user', function(done) {
            this.timeout(3000);
            chai.request(server)
                .get('/api/user/' + user.username)
                .end(function (err, res) {
                    res.should.have.status(200);
                    Object.keys(res.body).length.should.be.equal(0);
                    done();
                })
        });
    });
});