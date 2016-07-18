"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var lazyboyjs_1 = require("lazyboyjs");
var models_1 = require("../model/models");
var lazyFormatLogger = require("lazy-format-logger");
var DataService;
(function (DataService) {
    var Log = new lazyFormatLogger.Logger();
    /**
     * @classdesc Data source server use to CREATE, READ, UPDATE and DELETE, {@link DataModel.User} and {@link DataModel.Profile} instances.
     */
    var LazyDataServer = (function () {
        /**
         * @param options {@link LazyDataSourceConfig}
         */
        function LazyDataServer(options) {
            this.isReady = false;
            this.Options = options;
            this._validateOptions();
            this.LazyBoy = this.Options.LazyBoy;
            if (!this.LazyBoy) {
                this.LazyBoy = new lazyboyjs_1.lazyboyjs.LazyBoy(this.Options.LazyBoyOptions);
            }
            else {
                this.Options.LazyBoyOptions = this.LazyBoy.options;
            }
        }
        /**
         * In order to restrict log to a specific level the variable {@link Log}
         * is reset and the level is propagated to {@link DataModel} and {@link LazyBoy} classes.
         * @param level {@link LogLevel}
         */
        LazyDataServer.setLevel = function (level) {
            Log = new lazyFormatLogger.Logger(level);
            models_1.DataModel.Utils.setLevel(level);
            lazyboyjs_1.lazyboyjs.LazyBoy.setLevel(level);
        };
        /**
         * By calling the Connect function, two databases will be added to the {@link LazyBoy} instance and initialized.
         * Since the LazyBoy instance can be external we may have more than 2 database.
         * So using array filtering we select the databases than contains the name of "credential_db"  and "profile_db"
         * @param callback {function(error: DataSourceException, result: lazyboyjs.ReportInitialization): void}
         */
        LazyDataServer.prototype.Connect = function (callback) {
            var _this = this;
            var instance = this;
            this.LazyBoy.Databases(this.Options.credential_db, this.Options.profile_db);
            this.LazyBoy.InitializeAllDatabases(function (error, report) {
                if (error) {
                    Log.c("LazyDataServer", "Connect", "InitializeAllDatabases", error);
                    throw error;
                }
                else {
                    instance.isReady = true;
                }
                if (report.success.length == 2 && report.success.filter(function (l) {
                    var valid = lazyboyjs_1.lazyboyjs.DbCreateStatus.UpToDate | lazyboyjs_1.lazyboyjs.DbCreateStatus.Created;
                    return (l.name.indexOf(_this.Options.credential_db) > 0 || l.name.indexOf(_this.Options.profile_db) > 0) && !!(l.status & valid);
                })) {
                    _this.LazyBoy.Connect();
                    Log.i("LazyDataServer", "Connect", "LazyBoyConnect called");
                    callback(null, report);
                }
                else {
                    callback(new DataSourceException("Databases were not generated properly"), report);
                }
            });
        };
        /**
         * Given an userId, if a match is found a {@link DataModel.User} instance will be return.
         * @param userId {string}
         * @param callback {function(user: DataModel.User): void}
         */
        LazyDataServer.prototype.GetUserByUserId = function (userId, callback) {
            this._getEntryByUserId(userId, function (entry) {
                if (entry) {
                    callback(new models_1.DataModel.User(entry));
                }
                else {
                    callback(null);
                }
            });
        };
        /**
         *
         * @param username
         * @param callback {function(user: DataModel.User): void}
         */
        LazyDataServer.prototype.GetUserByUserName = function (username, callback) {
            this._getEntryByUserName(username, function (entry) {
                if (entry) {
                    callback(new models_1.DataModel.User(entry));
                }
                else {
                    callback(null);
                }
            });
        };
        /**
         *
         * @param user {DataModel.User}
         * @param callback {function(success: boolean): void}
         */
        LazyDataServer.prototype.InsertUser = function (user, callback) {
            var _this = this;
            this._userExist(user, function (exist) {
                if (!exist) {
                    _this._addUserEntry(user, "user", callback);
                }
                else {
                    callback(false);
                }
            });
        };
        /**
         *
         * @param user {DataModel.User}
         * @param callback {function(success: boolean): void}
         */
        LazyDataServer.prototype.UpdateUser = function (user, callback) {
            var _this = this;
            this._getUserEntry(user, function (entry) {
                if (entry) {
                    entry.instance = user;
                    _this._updateUserEntry(entry, callback);
                }
                else {
                    callback(false);
                }
            });
        };
        /**
         * Given the userId the {@link lazyboyjs.LazyInstance} will be flag as deleted.
         * @param userId {string}
         * @param callback {function(success: boolean): void}
         */
        LazyDataServer.prototype.DeleteUser = function (userId, callback) {
            var _this = this;
            this._getEntryByUserId(userId, function (entry) {
                if (entry) {
                    _this.LazyBoy.DeleteEntry(_this.Options.credential_db, entry, function (error, deleted) {
                        if (error) {
                            Log.c("LazyDataServer", "DeleteUser", "LazyBoy.DeleteEntry", error);
                            throw error;
                        }
                        Log.d("LazyDataServer", "DeleteUser", "LazyBoy.DeleteEntry", deleted);
                        callback(deleted);
                    }, false);
                }
                else {
                    callback(false);
                }
            });
        };
        LazyDataServer.prototype.GetAllUsers = function (callback) {
            this.LazyBoy.GetViewResult(this.Options.credential_db, "allUsersNotDeleted", { reduce: false }, function (error, data) {
                if (error) {
                    Log.c("LazyDataServer", "GetViewResult", "LazyBoy.GetViewResult", error);
                    throw error;
                }
                Log.d("LazyDataServer", "GetAllUsers", "LazyBoy.GetViewResult", data);
                callback(data);
            });
        };
        /**
         * Validation of the {@link Options} object, the defaults value will be enforce is they are not present
         * inside the object.
         * @private
         */
        LazyDataServer.prototype._validateOptions = function () {
            if (!this.Options) {
                this.Options = {};
            }
            if (!this.Options.credential_db) {
                this.Options.credential_db = "auth";
            }
            if (!this.Options.profile_db) {
                this.Options.profile_db = "profile";
            }
            if (!this.Options.LazyBoyOptions) {
                this.Options.LazyBoyOptions = {
                    prefix: "uac",
                    autoConnect: true,
                    views: {}
                };
            }
            else {
                if (!this.Options.LazyBoyOptions.prefix) {
                    this.Options.LazyBoyOptions.prefix = "uac";
                }
                if (!this.Options.LazyBoyOptions.autoConnect) {
                    this.Options.LazyBoyOptions.autoConnect = true;
                }
            }
            this._injectLazyUacViews();
        };
        /**
         * Enforce the default require {@link lazyboyjs.LazyDesignViews} for {@link LazyUAC}.
         * @private
         */
        LazyDataServer.prototype._injectLazyUacViews = function () {
            if (!this.Options.LazyBoyOptions.views) {
                this.Options.LazyBoyOptions.views = {};
            }
            this.Options.LazyBoyOptions.views[this.Options.LazyBoyOptions.prefix + "_" + this.Options.credential_db] = userViews;
            this.Options.LazyBoyOptions.views[this.Options.LazyBoyOptions.prefix + "_" + this.Options.profile_db] = profileViews;
        };
        /**
         * Shorter to search entry by UserId or UserName if one of those properties exist in the {@code user}
         * @param user {@link DataModel.User}
         * @param callback {function(exist:boolean)}
         * @throw {@link DataSourceException}
         */
        LazyDataServer.prototype._userExist = function (user, callback) {
            var _this = this;
            if (user) {
                if (user.Id) {
                    this._getEntryByUserId(user.Id, function (entry) {
                        if (user.Email) {
                            _this._getEntryByUserName(user.Email, function (entry) {
                                callback(entry != null && !entry.isDeleted);
                            });
                        }
                        else {
                            callback(entry != null && !entry.isDeleted);
                        }
                    });
                }
                else if (user.Email) {
                    this._getEntryByUserName(user.Email, function (entry) {
                        callback(entry != null && !entry.isDeleted);
                    });
                }
                else {
                    var error = new DataSourceException("invalid data");
                    Log.c("LazyDataServer", "userExist", error);
                    throw error;
                }
            }
            else {
                var error = new DataSourceException("invalid data");
                Log.c("LazyDataServer", "userExist", error);
                throw error;
            }
        };
        /**
         * Shorter to retrieve the entry {@link lazyboyjs.LazyInstance} from the database using either the
         * UserId or the UserName property of the parameter {@code user}
         * @param user
         * @param callback {function(entry: lazyboyjs.LazyInstance)}
         * @throw DataSourceException if one of {@link DataModel.User} or {@link DataModel.User#Id} or {@link DataModel.User#Email} is null.
         */
        LazyDataServer.prototype._getUserEntry = function (user, callback) {
            if (user) {
                if (user.Id && user.Id.length > 0) {
                    this._getEntryByUserId(user.Id, function (entry) {
                        callback(entry.isDeleted ? null : entry);
                    });
                }
                else if (user.Email && user.Email.length > 0) {
                    this._getEntryByUserName(user.Email, function (entry) {
                        callback(entry.isDeleted ? null : entry);
                    });
                }
                else {
                    var error = new DataSourceException("invalid data");
                    Log.c("LazyDataServer", "userExist", error);
                    throw error;
                }
            }
            else {
                var error = new DataSourceException("invalid data");
                Log.c("LazyDataServer", "userExist", error);
                throw error;
            }
        };
        /**
         * Shorter to execute {@link AddEntry} on "credential_db". All conflict, update or delete
         * should be managed here.
         * @param data {object}
         * @param type {string}
         * @param callback {function(success: boolean):void}
         * @private
         */
        LazyDataServer.prototype._addUserEntry = function (data, type, callback) {
            var entry = lazyboyjs_1.lazyboyjs.LazyBoy.NewEntry(data, type);
            this.LazyBoy.AddEntry(this.Options.credential_db, entry, function (error, code, entry) {
                if (error) {
                    Log.c("LazyDataServer", "addUserEntry", "LazyBoy.AddEntry", error, code);
                    throw error;
                }
                Log.d("LazyDataServer", "addUserEntry", "LazyBoy.AddEntry", entry);
                switch (code) {
                    case lazyboyjs_1.lazyboyjs.InstanceCreateStatus.Created:
                        Log.d("LazyDataServer", "addUserEntry", "LazyBoy.AddEntry", "Instance Created");
                        callback(true);
                        break;
                    case lazyboyjs_1.lazyboyjs.InstanceCreateStatus.Conflict:
                        Log.d("LazyDataServer", "addUserEntry", "LazyBoy.AddEntry", "Instance Conflict");
                        callback(false);
                        break;
                    default:
                        Log.c("LazyDataServer", "addUserEntry", "LazyBoy.AddEntry", "unmanaged code : " + code);
                        callback(false);
                        break;
                }
            });
        };
        /**
         * Shorter to select an {@link DataModel.User} instance given an userId.
         * This function execute {@link GetViewResult} using the following parameters :
         * <pre>
         *      Options.credential_db, "entryByUserId", {key: userId, reduce: false},
         * </pre>
         * @param userId {string}
         * @param callback {function(entry: lazyboyjs.LazyInstance):void}
         * @private
         */
        LazyDataServer.prototype._getEntryByUserId = function (userId, callback) {
            this.LazyBoy.GetViewResult(this.Options.credential_db, "entryByUserId", { key: userId, reduce: false }, function (error, result) {
                if (error) {
                    Log.c("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", error);
                    throw error;
                }
                if (result.length == 0) {
                    // throw new DataSourceException("no user found", UserCodeException.NOT_FOUND);
                    Log.d("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", "no entry found");
                    return callback(null);
                }
                else if (result.length > 1) {
                    //throw new DataSourceException("more than one user was found", UserCodeException.DUPLICATE_FOUND);
                    Log.d("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", "more than one entry was found");
                    return callback(null);
                }
                Log.d("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", "one entry was found");
                callback(result[0].value);
            });
        };
        /**
         * Shorter to select an {@link DataModel.User} instance given an username.
         * This function execute {@link GetViewResult} using the following parameters :
         * <pre>
         *      Options.credential_db, "entryByEmail", {key: username, reduce: false},
         * </pre>
         * @param username {string}
         * @param callback {function(entry: lazyboyjs.LazyInstance):void}
         * @private
         */
        LazyDataServer.prototype._getEntryByUserName = function (username, callback) {
            this.LazyBoy.GetViewResult(this.Options.credential_db, "entryByEmail", { key: username, reduce: false }, function (error, result) {
                if (error) {
                    Log.c("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", error);
                    throw error;
                }
                if (result.length == 0) {
                    // throw new DataSourceException("no user found", UserCodeException.NOT_FOUND);
                    Log.d("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", "no user found");
                    return callback(null);
                }
                else if (result.length > 1) {
                    //throw new DataSourceException("more than one user was found", UserCodeException.DUPLICATE_FOUND);
                    Log.d("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", "more than one user was found");
                    return callback(null);
                }
                Log.d("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", "one user was found");
                callback(result[0].value);
            });
        };
        /**
         * Shorter to execute {@link LazyDataServer.UpdateEntry} on the "credential_db".
         * @param entry {lazyboyjs.LazyInstance}
         * @param callback {function(updated: boolean):void}
         * @private
         */
        LazyDataServer.prototype._updateUserEntry = function (entry, callback) {
            this.LazyBoy.UpdateEntry(this.Options.credential_db, entry, function (error, updated, updatedEntry) {
                if (error) {
                    Log.c("LazyDataServer", "updateUserEntry", "LazyBoy.UpdateEntry", error);
                    throw error;
                }
                Log.d("LazyDataServer", "updateUserEntry", "LazyBoy.UpdateEntry", updated, updatedEntry);
                callback(updated);
            });
        };
        return LazyDataServer;
    }());
    DataService.LazyDataServer = LazyDataServer;
    var userByEmail = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Email') && !doc.isDeleted){ emit(doc.instance.Email, doc.instance ); }}",
        reduce: "_count()"
    };
    var userByUserId = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Id') && !doc.isDeleted) { emit(doc.instance.Id, doc.instance); } }",
        reduce: "_count()"
    };
    var entryByEmail = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Email') && !doc.isDeleted){ emit(doc.instance.Email, doc); }}",
        reduce: "_count()"
    };
    var entryByUserId = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Id') && !doc.isDeleted) { emit(doc.instance.Id, doc); } }",
        reduce: "_count()"
    };
    var deletedTypeEntry = {
        map: "function(doc){ if(doc.isDeleted) { emit(doc.type, doc); } }",
        reduce: "_count()"
    };
    var allUsersNotDeleted = {
        map: "function(doc){ if(!doc.isDeleted && doc.type.toLowerCase() == 'user') { emit(doc.type, doc.instance); } }",
        reduce: "_count()"
    };
    var userViews = {
        version: 1,
        type: 'javascript',
        views: {
            'userByUserId': userByUserId,
            'userByEmail': userByEmail,
            'entryByUserId': entryByUserId,
            'entryByEmail': entryByEmail,
            'deletedTypeEntry': deletedTypeEntry,
            'allUsersNotDeleted': allUsersNotDeleted
        }
    };
    var profileByUserId = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('UserId') && !doc.isDeleted){ emit(doc.instance.UserId, doc.instance); }}",
        reduce: "_count()"
    };
    var profileViews = {
        version: 1,
        type: 'javascript',
        views: {
            'profileByUserId': profileByUserId,
        }
    };
    (function (UserCodeException) {
        UserCodeException[UserCodeException["NOT_FOUND"] = 1] = "NOT_FOUND";
        UserCodeException[UserCodeException["ALREADY_EXIST"] = 2] = "ALREADY_EXIST";
        UserCodeException[UserCodeException["DUPLICATE_FOUND"] = 4] = "DUPLICATE_FOUND";
    })(DataService.UserCodeException || (DataService.UserCodeException = {}));
    var UserCodeException = DataService.UserCodeException;
    var DataSourceException = (function (_super) {
        __extends(DataSourceException, _super);
        function DataSourceException(message, code) {
            _super.call(this, message);
            this.message = message;
            this.code = code;
        }
        return DataSourceException;
    }(Error));
    DataService.DataSourceException = DataSourceException;
})(DataService = exports.DataService || (exports.DataService = {}));
