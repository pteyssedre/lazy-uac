var chai = require("chai");
var expect = chai.expect;
var LazyUAC = require('../dist/src/uac').LazyUAC;
var DataService = require('../dist/src/service/data.service').DataService;


describe('lazyUAC', function () {

    describe('Default options test', function () {
        it('Should create UAC databases and connect to them', function () {
            var uac = new LazyUAC.UserManager();
            expect(uac).to.not.equal(null);

        });
    });
});