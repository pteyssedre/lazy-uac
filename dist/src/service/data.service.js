/// <reference path="../../typings/index.d.ts"/>
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var lazyboyjs_1 = require("lazyboyjs");
var models_1 = require("../model/models");
var DataService;
(function (DataService) {
    var DbCreateStatus = lazyboyjs_1.lazyboyjs.DbCreateStatus;
    var LazyDataServer = (function () {
        function LazyDataServer(options) {
            this.isReady = false;
            this.Options = options;
            this._validateOptions();
            this.LazyBoy = new lazyboyjs_1.lazyboyjs.LazyBoy(this.Options.LazyBoyOptions);
        }
        LazyDataServer.prototype.Connect = function (callback) {
            this._connectCallback = callback;
            this.LazyBoy
                .Databases(this.Options.credential_db, this.Options.profile_db)
                .InitializeAllDatabases(this._onDatabasesInitialized);
        };
        LazyDataServer.prototype._validateOptions = function () {
            var _this = this;
            var instance = this;
            this._onDatabasesInitialized = function (error, report) {
                if (error) {
                    console.error("ERROR", new Date(), JSON.stringify(error), error);
                    throw error;
                }
                else {
                    instance.isReady = true;
                }
                if (report.success.length == 2 && report.success.filter(function (l) {
                    var valid = DbCreateStatus.UpToDate | DbCreateStatus.Created;
                    return !!(l.status & valid);
                })) {
                    _this.LazyBoy.Connect();
                    _this._connectCallback(null, report);
                }
                else {
                    _this._connectCallback(new DataSourceException("Databases were not generated properly"), null);
                }
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
        LazyDataServer.prototype.UserExistAsync = function (email, callback) {
            this.GetUserByUsernameAsync(email, function (error, data) {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                //TODO: add code to explain with its false ...
                callback(null, data.length > 0);
            });
        };
        LazyDataServer.prototype.GetUserAsync = function (user, callback) {
        };
        LazyDataServer.prototype.GetUserByUserIdAsync = function (userId, callback) {
            this.LazyBoy.GetViewResult(this.Options.credential_db, "userByUserId", { key: userId, reduce: false }, function (error, result) {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                console.log("DEBUG", new Date(), JSON.stringify(result));
                callback(null, result);
            });
        };
        LazyDataServer.prototype.GetUserByUsernameAsync = function (username, callback) {
            this.LazyBoy.GetViewResult(this.Options.credential_db, "userByEmail", { key: username, reduce: false }, function (error, result) {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                if (result.length == 0) {
                    return callback(new DataSourceException("no user found"), null);
                }
                else if (result.length > 1) {
                    return callback(new DataSourceException("more than one user was found"), null);
                }
                var v = result[0].value;
                var u = new models_1.DataModel.User();
                var keys = Object.keys(v);
                for (var i = 0; i < keys.length; i++) {
                    var p = keys[i];
                    u[p] = v[p];
                }
                callback(null, u);
            });
        };
        LazyDataServer.prototype.InsertUserAsync = function (user, callback) {
            var _this = this;
            this.UserExistAsync(user.Email, function (error, result) {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                if (!result) {
                    var entry = lazyboyjs_1.lazyboyjs.LazyBoy.NewEntry(user, "user");
                    _this.LazyBoy.AddEntry(_this.Options.credential_db, entry, function (error, code, entry) {
                        if (error) {
                            console.error("ERROR", new Date(), error, code);
                            throw error;
                        }
                        console.log("DEBUG", new Date(), entry);
                        switch (code) {
                            case lazyboyjs_1.lazyboyjs.InstanceCreateStatus.Created:
                                console.log("INFO", new Date(), "Instance Created");
                                break;
                            case lazyboyjs_1.lazyboyjs.InstanceCreateStatus.Conflict:
                                console.log("INFO", new Date(), "Instance Conflict");
                                break;
                            default:
                                console.log("INFO", new Date(), "code", code);
                                break;
                        }
                    });
                    callback(error, result);
                }
                else {
                    callback(new DataSourceException("user already exist"), null);
                }
            });
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
