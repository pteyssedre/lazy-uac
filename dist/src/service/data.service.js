/// <reference path="../../typings/index.d.ts"/>
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var lazyboyjs_1 = require("lazyboyjs");
var LazyBoy = lazyboyjs_1.lazyboyjs.LazyBoy;
var DataService;
(function (DataService) {
    var LazyDataServer = (function () {
        function LazyDataServer(options) {
            this.isReady = false;
            this.Options = options;
            this._validateOptions();
            this.LazyBoy = new LazyBoy(this.Options.LazyBoyOptions);
            this.LazyBoy
                .Databases(this.Options.credential_db, this.Options.profile_db)
                .InitializeAllDatabases(this._onDatabasesInitialized);
        }
        LazyDataServer.prototype._validateOptions = function () {
            var _this = this;
            var instance = this;
            this._onDatabasesInitialized = function (error, report) {
                if (error) {
                    return console.error("ERROR", new Date(), JSON.stringify(error), error);
                }
                else {
                    instance.isReady = true;
                }
                console.log(report);
                _this.LazyBoy.Connect();
            };
            if (!this.Options) {
                this.Options = {
                    credential_db: "auth",
                    profile_db: "profile"
                };
            }
            if (this.Options.LazyBoyOptions) {
                this.Options.LazyBoyOptions.prefix = "uac";
                this.Options.LazyBoyOptions.autoConnect = true;
            }
            else {
                this.Options.LazyBoyOptions = { prefix: "uac", autoConnect: true, views: {} };
            }
            this._injectLazyUacViews();
        };
        LazyDataServer.prototype._injectLazyUacViews = function () {
            this.Options.LazyBoyOptions.views["uac_" + this.Options.credential_db] = userViews;
            this.Options.LazyBoyOptions.views["uac_" + this.Options.profile_db] = profileViews;
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
    var userByEmail = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Email')){ emit(doc.instance.Email, doc.instance ); }}",
        reduce: "_count()"
    };
    var userByUserId = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Id')) { emit(doc.instance.Id, doc.instance); } }",
        reduce: "_count()"
    };
    var userViews = {
        version: 1,
        type: 'javascript',
        views: {
            'userByUserId': userByUserId,
            'userByEmail': userByEmail,
        }
    };
    var profileByUserId = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('UserId')){ emit(doc.instance.UserId, doc.instance); }}",
        reduce: "_count()"
    };
    var profileViews = {
        version: 1,
        type: 'javascript',
        views: {
            'profileByUserId': profileByUserId,
        }
    };
    var DataSourceException = (function (_super) {
        __extends(DataSourceException, _super);
        function DataSourceException(message) {
            _super.call(this, message);
            this.message = message;
        }
        return DataSourceException;
    }(Error));
    DataService.DataSourceException = DataSourceException;
})(DataService = exports.DataService || (exports.DataService = {}));
