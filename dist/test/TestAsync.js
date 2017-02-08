"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const chai = require("chai");
const uac_1 = require('../src/uac');
const models_1 = require('../src/model/models');
const index_1 = require("lazy-format-logger/dist/index");
let expect = chai.expect;
function GetDefaultUser() {
    return new models_1.DataModel.User({
        instance: {
            Id: "1235567", FirstName: "Pierre",
            LastName: "Teyssedre", Email: "pierre@teyssedre.ca",
            Roles: models_1.DataModel.Role.VIEWER | models_1.DataModel.Role.USER
        },
        created: new Date().getTime(),
        modified: new Date().getTime(),
        isDeleted: false,
        type: "user"
    });
}
function GetDefaultUserWithPassword(password) {
    let user = GetDefaultUser();
    user.FirstName = "Fake";
    user.LastName = "User";
    user.AddPasswordSync(password);
    user.Roles = models_1.DataModel.Role.USER;
    return user;
}
function GenerateUac() {
    let options = {
        logLevel: index_1.LogLevel.INFO,
        useAsync: true
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
                let profile = new models_1.DataModel.Profile({
                    instance: { UserId: user.Id },
                    created: null,
                    modified: null,
                    isDeleted: false,
                    type: "user"
                });
                expect(profile).to.not.equal(null);
                expect(profile.UserId).to.equal(user.Id);
            });
        });
    });
    describe('lazyUACAsync', function () {
        let mockPassword = "Reacts987";
        let mockUser = GetDefaultUserWithPassword(mockPassword);
        let uac;
        describe('Default options test', function () {
            it('Should create UAC databases and connect to them', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    uac = GenerateUac();
                    expect(uac).to.not.equal(null);
                    let started = yield uac.StartManagerAsync();
                    expect(started).to.equal(true);
                });
            });
            it('Should create an User and insert it inside the db', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    let result = yield uac.AddUserAsync(mockUser);
                    expect(result).to.not.equal(null);
                    expect(result.Id).to.equal(mockUser.Id);
                });
            });
            it('Should validate the insertion of the user in the db', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    let user = yield uac.GetUserByUserNameAsync(mockUser.Email);
                    expect(user).to.not.equal(null);
                    expect(user.Id).to.equal(mockUser.Id);
                });
            });
            it('Should authenticated the user and return a object', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    let report = yield uac.AuthenticateAsync(mockUser.Email, mockPassword);
                    expect(report.match).to.equal(true);
                    expect(report.user).to.not.equal(null);
                    expect(report.user.Id).to.equal(mockUser.Id);
                });
            });
            it('Should return all users non deleted in database ', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    let users = yield uac.GetAllUsersAsync();
                    expect(users).to.not.equal(null);
                });
            });
            it('Should delete the user and return a true', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    let deleted = yield uac.DeleteUserAsync(mockUser.Id);
                    expect(deleted).to.equal(true);
                });
            });
        });
    });
});
