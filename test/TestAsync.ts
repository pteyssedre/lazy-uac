import chai = require("chai");
import {LazyUAC} from '../src/uac';
import {DataModel} from '../src/model/models';
import {LogLevel} from "lazy-format-logger/dist/index";
import {lazyboyjs} from "lazyboyjs";
import path = require('path');
import fs = require('fs');
import UacOptions = LazyUAC.UacOptions;
import WritableStream = NodeJS.WritableStream;
import ReadableStream = NodeJS.ReadableStream;

let expect = chai.expect;

function GetDefaultUser() {
    return new DataModel.User(lazyboyjs.newEntry({
        Id: "1235567", FirstName: "Pierre",
        LastName: "Teyssedre", Email: "pierre@teyssedre.ca",
        Roles: DataModel.Role.VIEWER | DataModel.Role.USER
    }, "user"));
}

function GetDefaultUserWithPassword(password) {
    let user = GetDefaultUser();
    user.FirstName = "Fake";
    user.LastName = "User";
    user.AddPasswordSync(password);
    user.Roles = DataModel.Role.USER;
    return user;
}
function GenerateUac() {
    let options: UacOptions = {
        logLevel: LogLevel.VERBOSE,
        useAsync: true,
        dataSourceOptions: {LazyBoyOptions: {cache: false, forceSave: true, raw: false}}
    };
    return new LazyUAC.UserManager(options);
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
                let profile = new DataModel.Profile({
                    instance: {UserId: user.Id},
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
            it('Should create UAC databases and connect to them', async function () {
                uac = GenerateUac();
                expect(uac).to.not.equal(null);
                let started = await uac.StartManagerAsync();
                expect(started).to.equal(true);
            });
            it('Should create an User and insert it inside the db', async function () {
                let result = await uac.AddUserAsync(mockUser);
                expect(result).to.not.equal(null);
                expect(result.Id).to.equal(mockUser.Id);
            });
            it('Should validate the insertion of the user in the db', async function () {
                let user = await uac.GetUserByUserNameAsync(mockUser.Email);
                expect(user).to.not.equal(null);
                expect(user.Id).to.equal(mockUser.Id);
            });
            it('Should authenticated the user and return a object', async function () {
                let report = await uac.AuthenticateAsync(mockUser.Email, mockPassword);
                expect(report.match).to.equal(true);
                expect(report.user).to.not.equal(null);
                expect(report.user.Id).to.equal(mockUser.Id);
            });
            it('Should return all users non deleted in database ', async function () {
                let users = await uac.GetAllUsersAsync();
                expect(users).to.not.equal(null);
            });
            it('Should add avatar to user', async() => {
                let result = await uac.AddAvatarAsync(mockUser.Id, "./test/avatar.jpg");
                expect(result).to.equal(true);

            });
            it('Should retrieve the stream avatar of the user', async() => {
                let avatar = await uac.GetUserAvatarStreamAsync(mockUser.Id);
                let downloadPath = path.join(__dirname, avatar.name + "_" + mockUser.Id + "." + avatar.extension);
                let sourcePath = path.join(__dirname, "avatar.jpg");
                let write = fs.createWriteStream(downloadPath);
                avatar.data.on('end', () => {
                    let buff1 = fs.readFileSync(downloadPath);
                    let buff2 = fs.readFileSync(sourcePath);
                    let equals = buff1.toString() === buff2.toString();
                    expect(equals).to.equal(true);
                });
                avatar.data.pipe(write);
            });

            it('Should retrieve the buffered avatar of the user', async() => {
                let avatar = await uac.GetUserAvatarAsync(mockUser.Id);
                let downloadPath = path.join(__dirname, avatar.name + "_" + mockUser.Id + "2." + avatar.extension);
                let sourcePath = path.join(__dirname, "avatar.jpg");

                fs.writeSync(fs.openSync(downloadPath, 'w'), avatar.data, 0);

                let buff1 = fs.readFileSync(downloadPath);
                let buff2 = fs.readFileSync(sourcePath);
                let equals = buff1.toString() === buff2.toString();
                expect(equals).to.equal(true);
            });

            async function WriteFileAsync(read: ReadableStream, write: WritableStream): Promise<boolean> {
                return new Promise<boolean>((resolve, reject) => {
                    try {
                        write.on('error', () => {
                            return reject("error write");
                        });
                        write.on('end', () => {
                            return resolve(true);
                        });
                        read.on('error', () => {
                            return reject("error read");
                        });
                        read.on('end', () => {
                            return resolve(true);
                        });
                        read.pipe(write);
                    } catch (exception) {
                        return reject(exception)
                    }
                });
            }
            it('Should update avatar of user', async()=>{

                let avatar = await uac.GetUserAvatarStreamAsync(mockUser.Id);
                let downloadPath1 = path.join(__dirname, avatar.name + "_" + mockUser.Id + "." + avatar.extension);
                let sourcePath1 = path.join(__dirname, "avatar.jpg");
                let write = fs.createWriteStream(downloadPath1);
                await WriteFileAsync(avatar.data, write);

                let buff1 = fs.readFileSync(downloadPath1);
                let buff2 = fs.readFileSync(sourcePath1);
                let equals1 = buff1.toString() === buff2.toString();

                expect(equals1).to.equal(true);

                let result = await uac.AddAvatarAsync(mockUser.Id, "./test/avatar-2.jpg");
                expect(result).to.equal(true);


                let avatar2 = await uac.GetUserAvatarStreamAsync(mockUser.Id);
                let downloadPath2 = path.join(__dirname, avatar.name + "_" + mockUser.Id + "." + avatar.extension);
                let sourcePath2 = path.join(__dirname, "avatar-2.jpg");
                let write2 = fs.createWriteStream(downloadPath1);
                await WriteFileAsync(avatar2.data, write2);

                let buff3 = fs.readFileSync(downloadPath2);
                let buff4 = fs.readFileSync(sourcePath2);
                let equals2 = buff3.toString() === buff4.toString();

                expect(equals2).to.equal(true);
            });
            it('Should delete the user and return a true', async function () {
                let deleted = await uac.DeleteUserAsync(mockUser.Id);
                expect(deleted).to.equal(true);
            });
        });
    });
});