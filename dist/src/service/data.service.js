/// <reference path="../../typings/index.d.ts"/>
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var lazyboyjs_1 = require("lazyboyjs");
var DataService;
(function (DataService) {
    var DataSourceException = (function (_super) {
        __extends(DataSourceException, _super);
        function DataSourceException(message) {
            _super.call(this, message);
            this.message = message;
        }
        return DataSourceException;
    }(Error));
    DataService.DataSourceException = DataSourceException;
    var LazyDataServer = (function () {
        function LazyDataServer(options) {
            this.Options = options;
            this._validateOptions();
            this.LazyBoy = new lazyboyjs_1.lazyboyjs.LazyBoy(options.LazyBoyOptions);
            //TODO: init lazyboy for data
        }
        LazyDataServer.prototype._validateOptions = function () {
            if (!this.Options) {
                this.Options = {
                    credential_db: "auth",
                    profile_db: "profile",
                    LazyBoyOptions: {
                        prefix: "uac"
                    }
                };
            }
            //TODO: validate LazyBoyOptions prefix
            this._injectLazyViews();
        };
        LazyDataServer.prototype._injectLazyViews = function () {
            if (this.Options.LazyBoyOptions) {
                var name = "TODO";
                var view = { version: 1, type: "javascript", views: {} };
                view.views["auth"] = { map: "function(doc){emit(doc._id, doc._rev);}", reduce: "_count()" };
                this.Options.LazyBoyOptions.views[name] = view;
            }
        };
        LazyDataServer.prototype.UserExistAsync = function (userId, callback) {
        };
        LazyDataServer.prototype.GetUserAsync = function (user, callback) {
        };
        LazyDataServer.prototype.GetUserByUserIdAsync = function (userId, callback) {
        };
        LazyDataServer.prototype.GetUserByUsernameAsync = function (username, callback) {
        };
        LazyDataServer.prototype.InsertUserAsync = function (user, callback) {
        };
        LazyDataServer.prototype.UpdateUserAsync = function (user, callback) {
        };
        LazyDataServer.prototype.DeleteUserAsync = function (userId, callback) {
        };
        return LazyDataServer;
    }());
    DataService.LazyDataServer = LazyDataServer;
})(DataService = exports.DataService || (exports.DataService = {}));
