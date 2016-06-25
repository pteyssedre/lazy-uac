var chai = require("chai");
var expect = chai.expect;
var LazyUAC = require('../dist/src/uac').LazyUAC;
var DataModel = require('../dist/src/model/models').DataModel;

//noinspection JSUnresolvedFunction
describe('Module', function () {
    //noinspection JSUnresolvedFunction
    describe('DataModel', function () {

        //noinspection JSUnresolvedFunction
        describe('UserModel test', function () {
            //noinspection JSUnresolvedFunction
            it('Should create an User and encrypt a Password in async mode', function (done) {
                var user = new DataModel.User("Pierre", "Teyssedre", "pierre@teyssedre.ca");
                user.AddPassword("chiendechasse", function () {
                    //noinspection JSUnresolvedVariable
                    expect(user.Password).to.not.equal("chiendechasse");
                    //noinspection JSUnresolvedVariable
                    expect(user.ComparePasswordSync("chiendechasse")).to.equal(true);
                    done();
                });
            });
            //noinspection JSUnresolvedFunction
            it('Should create an User and encrypt a Password in sync mode', function () {
                var user = new DataModel.User("Pierre", "Teyssedre", "pierre@teyssedre.ca");
                user.AddPasswordSync("chiendechasse");
                //noinspection JSUnresolvedVariable
                expect(user.Password).to.not.equal("chiendechasse");
                //noinspection JSUnresolvedVariable
                expect(user.ComparePasswordSync("chiendechasse")).to.equal(true);
            });
            //noinspection JSUnresolvedFunction
            it('Should return true on password compare in async mode', function () {
                var user = new DataModel.User("Pierre", "Teyssedre", "pierre@teyssedre.ca");
                user.AddPassword("chiendechasse", function () {
                    //noinspection JSUnresolvedVariable
                    expect(user.Password).to.not.equal("chiendechasse");
                    user.ComparePassword("chiendechasse", function (match) {
                        //noinspection JSUnresolvedVariable
                        expect(match).to.equal(true);
                    });
                });
            });
            //noinspection JSUnresolvedFunction
            it('Should return true on password compare in sync mode', function () {
                var user = new DataModel.User("Pierre", "Teyssedre", "pierre@teyssedre.ca");
                user.AddPasswordSync("chiendechasse");
                //noinspection JSUnresolvedVariable
                expect(user.Password).to.not.equal("chiendechasse");
                var match = user.ComparePasswordSync("chiendechasse");
                //noinspection JSUnresolvedVariable
                expect(match).to.equal(true);
            });
            //noinspection JSUnresolvedFunction
            it('Should create two user using the same password but the hash should not be equal', function () {
                var user = new DataModel.User("Pierre", "Teyssedre", "pierre@teyssedre.ca");
                var user2 = new DataModel.User("Pierre2", "Teyssedre2", "pierre@teyssedre.ca");
                user.AddPasswordSync("chiendechasse");
                user2.AddPasswordSync("chiendechasse");
                //noinspection JSUnresolvedVariable
                expect(user.Password).to.not.equal(user2.Password);
            });
        });
        //noinspection JSUnresolvedFunction
        describe('ProfileModel test', function () {
            //noinspection JSUnresolvedFunction
            it('Should create a profile', function () {
                var user = new DataModel.User("Pierre", "Teyssedre", "pierre@teyssedre.ca");
                var profile = new DataModel.Profile(user);
                //noinspection JSUnresolvedVariable
                expect(profile).to.not.equal(null);
                //noinspection JSUnresolvedVariable
                expect(profile.UserId).to.equal(user.Id);
            });
        });
    });
    //noinspection JSUnresolvedFunction
    describe('lazyUAC', function () {

        var mockPassword = "Reacts987";
        var mockUser = new DataModel.User("Pierre",
            "Teyssedre",
            "pierre@teyssedre.ca",
            mockPassword,
            DataModel.Role.VIEWER | DataModel.Role.USER
        );
        var uac;

        //noinspection JSUnresolvedFunction
        describe('Default options test', function () {
            //noinspection JSUnresolvedFunction
            it('Should create UAC databases and connect to them', function (done) {
                uac = new LazyUAC.UserManager();
                //noinspection JSUnresolvedVariable
                expect(uac).to.not.equal(null);
                uac.StartManager(function (error, result) {
                    //noinspection JSUnresolvedVariable
                    expect(error).to.equal(null);
                    //noinspection JSUnresolvedVariable
                    expect(result).to.not.equal(null);
                    done();
                });
            });
            //noinspection JSUnresolvedFunction
            it('Should create an User and insert it inside the db', function (done) {
                uac.AddUser(mockUser, function (result) {
                    //noinspection JSUnresolvedVariable
                    expect(result).to.not.equal(null);
                    //noinspection JSUnresolvedVariable
                    expect(result.Id).to.equal(mockUser.Id);
                    done();
                });
            });
            //noinspection JSUnresolvedFunction
            it('Should validate the insertion of the user in the db', function (done) {
                uac.GetUserByUserName(mockUser.Email, function (user) {
                    //noinspection JSUnresolvedVariable
                    expect(user).to.not.equal(null);
                    //noinspection JSUnresolvedVariable
                    expect(user.Id).to.equal(mockUser.Id);
                    done();
                });
            });
            //noinspection JSUnresolvedFunction
            it('Should authenticated the user and return a object', function (done) {
                uac.Authenticate(mockUser.Email, mockPassword, function (authenticated) {
                    //noinspection JSUnresolvedVariable
                    expect(authenticated).to.equal(true);
                    done();
                });
            });
            //noinspection JSUnresolvedFunction
            it('Should authenticated the user and return a object', function (done) {
                uac.DeleteUser(mockUser.Id, function (deleted) {
                    //noinspection JSUnresolvedVariable
                    expect(deleted).to.equal(true);
                    done();
                });
            });
        });
    });
});