"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const uac_1 = require("../src/uac");
const models_1 = require("../src/model/models");
const logF = require("lazy-format-logger");
const lazyboyjs_1 = require("lazyboyjs");
let expect = chai.expect;
function GetDefaultUser() {
    return new models_1.DataModel.User(lazyboyjs_1.lazyboyjs.newEntry({
        Id: "1235567", FirstName: "Pierre",
        LastName: "Teyssedre", Email: "pierre@teyssedre.ca",
        Role: models_1.DataModel.Role.VIEWER
    }));
}
function GetDefaultUserWithPassword(password) {
    let user = GetDefaultUser();
    user.AddPasswordSync(password);
    return user;
}
function GenerateUac() {
    let options = {
        logLevel: logF.LogLevel.VERBOSE,
        useAsync: false
    };
    return new uac_1.LazyUAC.UserManager(options);
}
describe('Module', function () {
    describe('DataModel', function () {
        describe('UserModel test', function () {
            it('Should create an User and encrypt a Password in async mode', function (done) {
                let user = GetDefaultUser();
                user.AddPassword("chiendechasse", function () {
                    expect(user.Password).to.not.equal("chiendechasse");
                    expect(user.ComparePasswordSync("chiendechasse")).to.equal(true);
                    done();
                });
            });
            it('Should create an User and encrypt a Password in sync mode', function () {
                let user = GetDefaultUser();
                user.AddPasswordSync("chiendechasse");
                expect(user.Password).to.not.equal("chiendechasse");
                expect(user.ComparePasswordSync("chiendechasse")).to.equal(true);
            });
            it('Should return true on password compare in async mode', function () {
                let user = GetDefaultUser();
                user.AddPassword("chiendechasse", function () {
                    expect(user.Password).to.not.equal("chiendechasse");
                    user.ComparePassword("chiendechasse", function (match) {
                        expect(match).to.equal(true);
                    });
                });
            });
            it('Should return true on password compare in sync mode', function () {
                let user = GetDefaultUser();
                user.AddPasswordSync("chiendechasse");
                expect(user.Password).to.not.equal("chiendechasse");
                let match = user.ComparePasswordSync("chiendechasse");
                expect(match).to.equal(true);
            });
            it('Should create two user using the same password but the hash should not be equal', function () {
                let user = GetDefaultUser();
                let user2 = GetDefaultUser();
                user.AddPasswordSync("chiendechasse");
                user2.AddPasswordSync("chiendechasse");
                expect(user.Password).to.not.equal(user2.Password);
            });
        });
        describe('ProfileModel test', function () {
            it('Should create a profile', function () {
                let user = GetDefaultUser();
                let profile = new models_1.DataModel.Profile(lazyboyjs_1.lazyboyjs.newEntry({ UserId: user.Id }, "user"));
                expect(profile).to.not.equal(null);
                expect(profile.UserId).to.equal(user.Id);
            });
        });
    });
    describe('lazyUAC', function () {
        let mockPassword = "Reacts987";
        let mockUser = GetDefaultUserWithPassword(mockPassword);
        let uac;
        describe('Default options test', function () {
            it('Should create UAC databases and connect to them', function (done) {
                uac = GenerateUac();
                expect(uac).to.not.equal(null);
                uac.StartManager(function (error, result) {
                    expect(error).to.equal(null);
                    expect(result).to.not.equal(null);
                    done();
                });
            });
            it('Should create an User and insert it inside the db', function (done) {
                uac.AddUser(mockUser, function (result) {
                    expect(result).to.not.equal(null);
                    expect(result.Id).to.equal(mockUser.Id);
                    done();
                });
            });
            it('Should validate the insertion of the user in the db', function (done) {
                uac.GetUserByUserName(mockUser.Email, function (user) {
                    expect(user).to.not.equal(null);
                    expect(user.Id).to.equal(mockUser.Id);
                    done();
                });
            });
            it('Should authenticated the user and return a object', function (done) {
                uac.Authenticate(mockUser.Email, mockPassword, function (authenticated, user) {
                    expect(authenticated).to.equal(true);
                    expect(user).to.not.equal(null);
                    expect(user.Id).to.equal(mockUser.Id);
                    done();
                });
            });
            it('Should return all users non deleted in database ', function (done) {
                uac.AddAdmin(new models_1.DataModel.User(lazyboyjs_1.lazyboyjs.newEntry({
                    Id: new Date().getTime(),
                    FirstName: "1",
                    LastName: "1",
                    Email: "1@1.com"
                })), function (u1) {
                    expect(u1).to.not.equal(null);
                    uac.GetAllUsers(function (data) {
                        expect(data.length).to.equal(2);
                        uac.DeleteUser(u1.Id, function (complete) {
                            expect(complete).to.equal(true);
                            done();
                        });
                    });
                });
            });
            it('Should get user and add role to it', function (done) {
                uac.AddRolesToUser(mockUser.Id, models_1.DataModel.Role.ADMIN, function (success) {
                    expect(success).to.equal(true);
                    uac.GetUserById(mockUser.Id, function (user) {
                        expect(user).to.not.equal(null);
                        expect(user.HasRole(models_1.DataModel.Role.ADMIN)).to.equal(true);
                        done();
                    });
                });
            });
            it('Should get user and modify role without saving', function (done) {
                uac.GetUserById(mockUser.Id, function (user) {
                    expect(user).to.not.equal(null);
                    expect(user.HasRole(models_1.DataModel.Role.ADMIN)).to.equal(true);
                    user.RemoveRole(models_1.DataModel.Role.ADMIN);
                    expect(user.HasRole(models_1.DataModel.Role.ADMIN)).to.equal(false);
                    uac.GetUserById(mockUser.Id, function (u) {
                        expect(u.HasRole(models_1.DataModel.Role.ADMIN)).to.equal(true);
                        done();
                    });
                });
            });
            it('Should validate that user has mask of Role', function (done) {
                let mask = models_1.DataModel.Role.ADMIN | models_1.DataModel.Role.SUPER_ADMIN;
                uac.GetUserById(mockUser.Id, function (user) {
                    expect(user).to.not.equal(null);
                    expect(user.Any(mask)).to.equal(true);
                    done();
                });
            });
            it('Should remove role to user', function (done) {
                uac.RemoveRolesToUser(mockUser.Id, models_1.DataModel.Role.ADMIN, function (success) {
                    expect(success).to.equal(true);
                    done();
                });
            });
            it('Should validate the should not have role', function (done) {
                uac.GetUserById(mockUser.Id, function (user) {
                    expect(user).to.not.equal(null);
                    expect(user.HasRole(models_1.DataModel.Role.ADMIN)).to.equal(false);
                    done();
                });
            });
            it('Should delete the user', function (done) {
                uac.DeleteUser(mockUser.Id, function (deleted) {
                    expect(deleted).to.equal(true);
                    done();
                });
            });
        });
    });
});
