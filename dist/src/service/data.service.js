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
    var LazyDataServer = (function () {
        function LazyDataServer(options) {
            this.isReady = false;
            this.Options = options;
            this._validateOptions();
            this.LazyBoy = new lazyboyjs_1.lazyboyjs.LazyBoy(this.Options.LazyBoyOptions);
        }
        LazyDataServer.setLevel = function (level) {
            Log = new lazyFormatLogger.Logger(level);
            models_1.DataModel.Utils.setLevel(level);
            lazyboyjs_1.lazyboyjs.LazyBoy.setLevel(level);
        };
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
                    return !!(l.status & valid);
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
        LazyDataServer.prototype._validateOptions = function () {
            if (!this.Options) {
                this.Options = {
                    credential_db: "auth",
                    profile_db: "profile"
                };
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
        LazyDataServer.prototype._injectLazyUacViews = function () {
            this.Options.LazyBoyOptions.views[this.Options.LazyBoyOptions.prefix + this.Options.credential_db] = userViews;
            this.Options.LazyBoyOptions.views[this.Options.LazyBoyOptions.prefix + this.Options.profile_db] = profileViews;
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
        LazyDataServer.prototype.GetUserByUserId = function (userId, callback) {
            this._getEntryByUserId(userId, function (entry) {
                if (entry) {
                    var u = new models_1.DataModel.User();
                    var keys = Object.keys(entry);
                    for (var i = 0; i < keys.length; i++) {
                        var p = keys[i];
                        u[p] = entry[p];
                    }
                    callback(u);
                }
                else {
                    callback(null);
                }
            });
        };
        LazyDataServer.prototype.GetUserByUserName = function (username, callback) {
            this._getEntryByUserName(username, function (entry) {
                if (entry) {
                    var u = new models_1.DataModel.User();
                    var keys = Object.keys(entry.instance);
                    for (var i = 0; i < keys.length; i++) {
                        var p = keys[i];
                        u[p] = entry.instance[p];
                    }
                    callback(u);
                }
                else {
                    callback(null);
                }
            });
        };
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
    var userViews = {
        version: 1,
        type: 'javascript',
        views: {
            'userByUserId': userByUserId,
            'userByEmail': userByEmail,
            'entryByUserId': entryByUserId,
            'entryByEmail': entryByEmail,
            'deletedTypeEntry': deletedTypeEntry
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
