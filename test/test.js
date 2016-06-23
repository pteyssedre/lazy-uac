var chai = require("chai");
var expect = chai.expect;
var LazyUAC = require('../dist/src/uac').LazyUAC;
var DataService = require('../dist/src/service/data.service').DataService;
var DataModel = require('../dist/src/model/models').DataModel;


describe('DataModel', function () {

    describe('UserModel test', function () {
        it('Should create an User and encrypt a Password in async mode', function (done) {
            var user = new DataModel.User("Pierre", "Teyssedre", "pierre@teyssedre.ca");
            user.AddPassword("chiendechasse", function () {
                expect(user.Password).to.not.equal("chiendechasse");
                done();
            });
        });
        it('Should create an User and encrypt a Password in sync mode', function () {
            var user = new DataModel.User("Pierre", "Teyssedre", "pierre@teyssedre.ca");
            user.AddPasswordSync("chiendechasse");
            expect(user.Password).to.not.equal("chiendechasse");
        });
        it('Should return true on password compare in async mode', function () {
            var user = new DataModel.User("Pierre", "Teyssedre", "pierre@teyssedre.ca");
            user.AddPassword("chiendechasse", function (error, result) {
                expect(user.Password).to.not.equal("chiendechasse");
                user.ComparePassword("chiendechasse", function (match) {
                    expect(match).to.equal(true);
                });
            });
        });
        it('Should return true on password compare in sync mode', function () {
            var user = new DataModel.User("Pierre", "Teyssedre", "pierre@teyssedre.ca");
            user.AddPasswordSync("chiendechasse");
            expect(user.Password).to.not.equal("chiendechasse");
            var match = user.ComparePasswordSync("chiendechasse");
            expect(match).to.equal(true);
        });
        it('Should create two user using the same password but the hash should not be equal', function () {
            var user = new DataModel.User("Pierre", "Teyssedre", "pierre@teyssedre.ca");
            var user2 = new DataModel.User("Pierre2", "Teyssedre2", "pierre@teyssedre.ca");
            user.AddPasswordSync("chiendechasse");
            user2.AddPasswordSync("chiendechasse");
            expect(user.Password).to.not.equal(user2.Password);
        });
    });
    describe('ProfileModel test', function () {
        it('Should create a profile', function () {
            var user = new DataModel.User("Pierre", "Teyssedre", "pierre@teyssedre.ca");
            var profile = new DataModel.Profile(user);
            expect(profile).to.not.equal(null);
            expect(profile.UserId).to.equal(user.Id);
        });
    });
});
describe('lazyUAC', function () {

    var mockPassword = "Reacts987";
    var mockUser = new DataModel.User("Pierre",
        "Teyssedre",
        "pierre@teyssedre.ca",
        mockPassword,
        DataModel.Role.VIEWER | DataModel.Role.USER
    );

    describe('Default options test', function () {
        it('Should create UAC databases and connect to them', function () {
            var uac = new LazyUAC.UserManager();
            expect(uac).to.not.equal(null);
        });
    });
    describe('Adding User in db', function () {
        it('Should create an User and insert it inside the db', function (done) {
            var uac = new LazyUAC.UserManager();
            uac.StartManager(function (error, result) {
                expect(error).to.equal(null);
                expect(result).to.not.equal(null);
                uac.AddUser(mockUser, function (error, result) {
                    expect(error).to.equal(null);
                    expect(result).to.not.equal(null);
                    done();
                });
            });
        });
        it('Should validate the insertion of the user in the db', function (done) {
            var uac = new LazyUAC.UserManager();
            uac.StartManager(function (error, result) {
                expect(error).to.equal(null);
                expect(result).to.not.equal(null);
                uac.GetUserByUserName(mockUser.Email, function (user) {
                    expect(error).to.equal(null);
                    expect(user.Id).to.equal(mockUser.Id);
                    done();
                });
            });
        });
        it('Should authenticated the user and return a object', function (done) {
            var uac = new LazyUAC.UserManager();
            uac.StartManager(function (error, result) {
                expect(error).to.equal(null);
                expect(result).to.not.equal(null);
                uac.Authenticate(mockUser.Email, mockPassword, function (error, result) {
                    if (error) {
                        console.error("ERROR", new Date(), error);
                        throw error;
                    }
                    expect(error).to.equal(null);
                    expect(result).to.equal(null);
                    done();
                });
            });
        });
    });
});