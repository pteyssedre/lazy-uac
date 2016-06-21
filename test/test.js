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
            user.AddPassword("chiendechasse", function(error, result){
                expect(user.Password).to.not.equal("chiendechasse");
                user.ComparePassword("chiendechasse", function(match){
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
    });
});
describe('lazyUAC', function () {

    describe('Default options test', function () {
        it('Should create UAC databases and connect to them', function () {
            var uac = new LazyUAC.UserManager();
            expect(uac).to.not.equal(null);
            var user = new DataModel.User();
        });
    });
});