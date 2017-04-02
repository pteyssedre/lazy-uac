"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../model/models");
const lazyFormatLogger = require("lazy-format-logger");
const lazyboyjs_1 = require("lazyboyjs");
const mime = require("mime");
var DataService;
(function (DataService) {
    let Log = new lazyFormatLogger.Logger();
    class LazyDataServerBase {
        constructor(options) {
            this.Options = options;
            this._validateOptions();
        }
        /**
         * In order to restrict log to a specific level the variable {@link Log}
         * is reset and the level is propagated to {@link DataModel} and {@link LazyBoy} classes.
         * @param level {@link LogLevel}
         */
        static setLevel(level) {
            Log = new lazyFormatLogger.Logger(level);
            models_1.DataModel.Utils.setLevel(level);
            lazyboyjs_1.lazyboyjs.setLevel(level);
        }
        /**
         * Validation of the {@link Options} object, the defaults value will be enforce is they are not present
         * inside the object.
         * @protected
         */
        _validateOptions() {
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
                    cache: true,
                    forceSave: true,
                    raw: false,
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
        }
        /**
         * Enforce the default require {@link lazyboyjs.LazyDesignViews} for {@link LazyUAC}.
         * @private
         */
        _injectLazyUacViews() {
            if (!this.Options.LazyBoyOptions.views) {
                this.Options.LazyBoyOptions.views = {};
            }
            this.Options.LazyBoyOptions.views[this.Options.LazyBoyOptions.prefix + "_" + this.Options.credential_db] = userViews;
            this.Options.LazyBoyOptions.views[this.Options.LazyBoyOptions.prefix + "_" + this.Options.profile_db] = profileViews;
        }
    }
    DataService.LazyDataServerBase = LazyDataServerBase;
    /**
     * @classdesc Data source server use to CREATE, READ, UPDATE and DELETE, {@link DataModel.User} and {@link DataModel.Profile} instances.
     */
    class LazyDataServer extends LazyDataServerBase {
        /**
         * @param options {@link LazyDataSourceConfig}
         */
        constructor(options) {
            super(options);
            this.isReady = false;
            this.LazyBoy = this.Options.LazyBoy;
            if (!this.LazyBoy) {
                this.LazyBoy = new lazyboyjs_1.lazyboyjs.LazyBoy(this.Options.LazyBoyOptions);
            }
            else {
                this.Options.LazyBoyOptions = this.LazyBoy.options;
            }
        }
        /**
         * By calling the Connect function, two databases will be added to the {@link LazyBoy} instance and initialized.
         * Since the LazyBoy instance can be external we may have more than 2 database.
         * So using array filtering we select the databases than contains the name of "credential_db"  and "profile_db"
         * @param callback {function(error: DataSourceException, result: lazyboyjs.ReportInitialization): void}
         */
        Connect(callback) {
            let instance = this;
            this.LazyBoy.Databases(this.Options.credential_db, this.Options.profile_db);
            this.LazyBoy.InitializeAllDatabases((error, report) => {
                if (error) {
                    Log.c("LazyDataServer", "Connect", "InitializeAllDatabases", error);
                    throw error;
                }
                else {
                    instance.isReady = true;
                }
                if (report.success.length == 2 && report.success.filter((l) => {
                    let valid = lazyboyjs_1.lazyboyjs.DbCreateStatus.UpToDate | lazyboyjs_1.lazyboyjs.DbCreateStatus.Created;
                    return (l.name.indexOf(this.Options.credential_db) > 0 || l.name.indexOf(this.Options.profile_db) > 0) && !!(l.status & valid);
                })) {
                    this.LazyBoy.Connect();
                    Log.i("LazyDataServer", "Connect", "LazyBoyConnect called");
                    callback(null, report);
                }
                else {
                    callback(new DataSourceException("Databases were not generated properly"), report);
                }
            });
        }
        /**
         * Given an userId, if a match is found a {@link DataModel.User} instance will be return.
         * @param userId {string}
         * @param callback {function(user: DataModel.User): void}
         */
        GetUserByUserId(userId, callback) {
            this._getEntryByUserId(userId, (entry) => {
                if (entry) {
                    callback(new models_1.DataModel.User(entry));
                }
                else {
                    callback(null);
                }
            });
        }
        /**
         *
         * @param username
         * @param callback {function(user: DataModel.User): void}
         */
        GetUserByUserName(username, callback) {
            this._getEntryByUserName(username, (entry) => {
                if (entry) {
                    callback(new models_1.DataModel.User(entry));
                }
                else {
                    callback(null);
                }
            });
        }
        /**
         *
         * @param user {DataModel.User}
         * @param callback {function(success: boolean): void}
         */
        InsertUser(user, callback) {
            this._userExist(user, (exist) => {
                if (!exist) {
                    this._addUserEntry(user, "user", callback);
                }
                else {
                    callback(false);
                }
            });
        }
        /**
         *
         * @param user {DataModel.User}
         * @param callback {function(success: boolean): void}
         */
        UpdateUser(user, callback) {
            this._getUserEntry(user, (entry) => {
                if (entry) {
                    entry.instance = user;
                    this._updateUserEntry(entry, callback);
                }
                else {
                    callback(false);
                }
            });
        }
        /**
         * Given the userId the {@link lazyboyjs.LazyInstance} will be flag as deleted.
         * @param userId {string}
         * @param callback {function(success: boolean): void}
         */
        DeleteUser(userId, callback) {
            this._getEntryByUserId(userId, (entry) => {
                if (entry) {
                    this.LazyBoy.DeleteEntry(this.Options.credential_db, entry, (error, deleted) => {
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
        }
        GetAllUsers(callback) {
            this.LazyBoy.GetViewResult(this.Options.credential_db, "allUsersNotDeleted", { reduce: false }, (error, data) => {
                if (error) {
                    Log.c("LazyDataServer", "GetViewResult", "LazyBoy.GetViewResult", error);
                    throw error;
                }
                Log.d("LazyDataServer", "GetAllUsers", "LazyBoy.GetViewResult", data);
                callback(data);
            });
        }
        AddAvatar(userId, path, callback) {
            if (!userId) {
                return callback(false);
            }
            this._getEntryByUserId(userId, (entry) => {
                if (!entry) {
                    return callback(false);
                }
            });
        }
        /**
         * Shorter to search entry by UserId or UserName if one of those properties exist in the {@code user}
         * @param user {@link DataModel.User}
         * @param callback {function(exist:boolean)}
         * @throw {@link DataSourceException}
         */
        _userExist(user, callback) {
            if (user) {
                if (user.Id) {
                    this._getEntryByUserId(user.Id, (entry) => {
                        if (user.Email) {
                            this._getEntryByUserName(user.Email, (entry) => {
                                callback(entry != null && !entry.isDeleted);
                            });
                        }
                        else {
                            callback(entry != null && !entry.isDeleted);
                        }
                    });
                }
                else if (user.Email) {
                    this._getEntryByUserName(user.Email, (entry) => {
                        callback(entry != null && !entry.isDeleted);
                    });
                }
                else {
                    let error = new DataSourceException("invalid data");
                    Log.c("LazyDataServer", "userExist", error.toString());
                    throw error;
                }
            }
            else {
                let error = new DataSourceException("invalid data");
                Log.c("LazyDataServer", "userExist", error);
                throw error;
            }
        }
        /**
         * Shorter to retrieve the entry {@link lazyboyjs.LazyInstance} from the database using either the
         * UserId or the UserName property of the parameter {@code user}
         * @param user
         * @param callback {function(entry: lazyboyjs.LazyInstance)}
         * @throw DataSourceException if one of {@link DataModel.User} or {@link DataModel.User#Id} or {@link DataModel.User#Email} is null.
         */
        _getUserEntry(user, callback) {
            if (user) {
                if (user.Id && user.Id.length > 0) {
                    this._getEntryByUserId(user.Id, (entry) => {
                        callback(entry.isDeleted ? null : entry);
                    });
                }
                else if (user.Email && user.Email.length > 0) {
                    this._getEntryByUserName(user.Email, (entry) => {
                        callback(entry.isDeleted ? null : entry);
                    });
                }
                else {
                    let error = new DataSourceException("invalid data");
                    Log.c("LazyDataServer", "userExist", error);
                    throw error;
                }
            }
            else {
                let error = new DataSourceException("invalid data");
                Log.c("LazyDataServer", "userExist", error);
                throw error;
            }
        }
        /**
         * Shorter to execute {@link AddEntry} on "credential_db". All conflict, update or delete
         * should be managed here.
         * @param data {object}
         * @param type {string}
         * @param callback {function(success: boolean):void}
         * @private
         */
        _addUserEntry(data, type, callback) {
            let entry = lazyboyjs_1.lazyboyjs.LazyBoy.NewEntry(data, type);
            this.LazyBoy.AddEntry(this.Options.credential_db, entry, (error, code, entry) => {
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
        }
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
        _getEntryByUserId(userId, callback) {
            this.LazyBoy.GetViewResult(this.Options.credential_db, "entryByUserId", { key: userId, reduce: false }, (error, result) => {
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
        }
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
        _getEntryByUserName(username, callback) {
            this.LazyBoy.GetViewResult(this.Options.credential_db, "entryByEmail", { key: username, reduce: false }, (error, result) => {
                if (error) {
                    Log.c("LazyDataServer", "_getEntryByUserName", "LazyBoy.GetViewResult", error);
                    throw error;
                }
                if (result.length == 0) {
                    // throw new DataSourceException("no user found", UserCodeException.NOT_FOUND);
                    Log.d("LazyDataServer", "_getEntryByUserName", "LazyBoy.GetViewResult", "no user found");
                    return callback(null);
                }
                else if (result.length > 1) {
                    //throw new DataSourceException("more than one user was found", UserCodeException.DUPLICATE_FOUND);
                    Log.d("LazyDataServer", "_getEntryByUserName", "LazyBoy.GetViewResult", "more than one user was found");
                    return callback(null);
                }
                Log.d("LazyDataServer", "_getEntryByUserName", "LazyBoy.GetViewResult", "one user was found");
                callback(result[0].value);
            });
        }
        /**
         * Shorter to execute {@link LazyDataServer.UpdateEntry} on the "credential_db".
         * @param entry {lazyboyjs.LazyInstance}
         * @param callback {function(updated: boolean):void}
         * @private
         */
        _updateUserEntry(entry, callback) {
            this.LazyBoy.UpdateEntry(this.Options.credential_db, entry, (error, updated, updatedEntry) => {
                if (error) {
                    Log.c("LazyDataServer", "updateUserEntry", "LazyBoy.UpdateEntry", error);
                    throw error;
                }
                Log.d("LazyDataServer", "updateUserEntry", "LazyBoy.UpdateEntry", updated, updatedEntry);
                callback(updated);
            });
        }
    }
    DataService.LazyDataServer = LazyDataServer;
    /**
     * @classdesc Data source using Async/Await to ensure the use of {@link Promise} toward the library.
     */
    class LazyDataServerAsync extends LazyDataServerBase {
        /**
         * @param options {@link LazyDataSourceConfig}
         */
        constructor(options) {
            super(options);
            this.LazyBoyAsync = this.Options.LazyBoyAsync;
            if (!this.LazyBoyAsync) {
                this.LazyBoyAsync = new lazyboyjs_1.lazyboyjs.LazyBoyAsync(this.Options.LazyBoyOptions);
            }
        }
        /**
         * In order to establish connection with all the require databases, this method should be call before
         * any data manipulation.
         * @return {Promise<{error: DataSourceException, result: any}>}
         */
        ConnectAsync() {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = { error: null, result: null };
                    try {
                        let boy = this.LazyBoyAsync.Databases(this.Options.credential_db, this.Options.profile_db);
                        let report = yield boy.InitializeAllDatabasesAsync();
                        if (report.success.length !== 2) {
                            r.error = new DataSourceException("Databases were not generated properly");
                            r.result = report;
                            return resolve(r);
                        }
                        yield boy.ConnectAsync();
                        return resolve(r);
                    }
                    catch (exception) {
                        Log.c("LazyDataServerAsync", "ConnectAsync", exception);
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * Given an userId, if a match is found a {@link DataModel.User} instance will be return.
         * @param userId {string}
         * @return {Promise<DataModel.User>}
         */
        GetUserByUserIdAsync(userId) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        let r = yield this._getEntryByUserIdAsync(userId);
                        return resolve(new models_1.DataModel.User(r));
                    }
                    catch (exception) {
                        Log.c("LazyDataServerAsync", "GetUserByUserIdAsync", exception);
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * Async shorter to retrieve a {@link DataModel.User} instance from the {@link lazyboyjs.LazyInstance}
         * from the {@link LazyBoyAsync}
         * @param username
         * @return {Promise<DataModel.User>}
         */
        GetUserByUserNameAsync(username) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        let r = yield this._getEntryByUserNameAsync(username);
                        return resolve(r != null ? new models_1.DataModel.User(r) : null);
                    }
                    catch (exception) {
                        Log.c("LazyDataServerAsync", "GetUserByUserIdAsync", exception);
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * Async shorter to insert a {@link DataModel.User} instance into the database.
         * @param user {DataModel.User}
         * @return {Promise<{added:boolean, user: DataModel.User}>}
         */
        InsertUserAsync(user) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = { added: false, user: null };
                    try {
                        let exist = yield this._userExistAsync(user);
                        if (!exist) {
                            let report = yield this._addUserEntryAsync(user);
                            r.added = report.success;
                            r.user = new models_1.DataModel.User(report.entry);
                        }
                        return resolve(r);
                    }
                    catch (exception) {
                        Log.c("LazyDataServerAsync", "InsertUserAsync", exception);
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * Async shorter to update User {@link DataModel.User} instance in the deb
         * @param user {DataModel.User}
         * @return {Promise<{updated:boolean, user:DataModel.User}>}
         */
        UpdateUserAsync(user) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = { updated: false, user: null };
                    try {
                        let entry = yield this._getUserEntryAsync(user);
                        if (entry) {
                            entry.instance = user;
                            let report = yield this._updateUserEntryAsync(entry);
                            r.updated = report.updated;
                            r.user = new models_1.DataModel.User(report.data);
                        }
                        return resolve(r);
                    }
                    catch (exception) {
                        Log.c("LazyDataServerAsync", "UpdateUserAsync", exception);
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * Given the userId the {@link lazyboyjs.LazyInstance} will be flag as deleted.
         * @param userId {string}
         * @return {Promise<boolean>}
         */
        DeleteUserAsync(userId) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = false;
                    try {
                        let entry = yield this._getEntryByUserIdAsync(userId);
                        if (entry) {
                            let report = yield this.LazyBoyAsync.DeleteEntryAsync(this.Options.credential_db, entry, false);
                            r = report.deleted;
                        }
                        return resolve(r);
                    }
                    catch (exception) {
                        Log.c("LazyDataServerAsync", "DeleteUserAsync", exception);
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * Async shorter
         * @return {Promise<DataModel.User[]>}
         * @constructor
         */
        GetAllUsersAsync() {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = [];
                    try {
                        let report = yield this.LazyBoyAsync.GetViewResultAsync(this.Options.credential_db, "allUsersNotDeleted", { reduce: false });
                        if (report.result && report.result.length > 0) {
                            for (let i = 0; i < report.result.length; i++) {
                                let e = report.result[i].value;
                                let u = new models_1.DataModel.User();
                                let keys = Object.keys(e);
                                for (let key of keys) {
                                    u[key] = e[key];
                                }
                                r.push(u);
                            }
                        }
                        return resolve(r);
                    }
                    catch (exception) {
                        Log.c("LazyDataServerAsync", "GetAllUsersAsync", exception);
                        return reject(exception);
                    }
                }));
            });
        }
        AddAvatarAsync(userId, path) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    if (!userId || !path) {
                        return resolve(false);
                    }
                    let entry = yield this._getProfileEntryByUserId(userId);
                    if (!entry) {
                        let insert = yield this.LazyBoyAsync.AddEntryAsync(this.Options.profile_db, {
                            type: 'avatar',
                            data: { UserId: userId }
                        });
                        if (insert.error) {
                            Log.e("LazyDataServerAsync", "AddAvatarAsync", "AddEntryAsync", insert.error.toString());
                            return resolve(false);
                        }
                        entry = insert.entry;
                    }
                    let doc = yield this.LazyBoyAsync.AddFileAsAttachmentAsync(this.Options.profile_db, entry._id, entry._rev, "avatar", path);
                    if (doc.error) {
                        Log.e("LazyDataServerAsync", "AddAvatarAsync", "AddFileAsAttachment", doc.error.toString());
                        return resolve(false);
                    }
                    return resolve(true);
                }));
            });
        }
        GetUserAvatarAsync(userId) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    if (!userId) {
                        return resolve(null);
                    }
                    let entry = yield this._getProfileEntryByUserId(userId);
                    if (!entry) {
                        return resolve(null);
                    }
                    let info = yield this.LazyBoyAsync.GetAttachmentInfoAsync(this.Options.profile_db, entry._id, "avatar");
                    if (!info) {
                        return resolve(null);
                    }
                    let data = yield this.LazyBoyAsync.GetAttachmentAsync(this.Options.profile_db, entry._id, "avatar");
                    return resolve({
                        name: 'avatar',
                        extension: mime.extension(info.content_type),
                        data: new Buffer(data.body.buffer, 'utf-8')
                    });
                }));
            });
        }
        GetUserAvatarStreamAsync(userId) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    if (!userId) {
                        return resolve(null);
                    }
                    let entry = yield this._getProfileEntryByUserId(userId);
                    if (!entry) {
                        return resolve(null);
                    }
                    let info = yield this.LazyBoyAsync.GetAttachmentInfoAsync(this.Options.profile_db, entry._id, "avatar");
                    if (!info) {
                        return resolve(null);
                    }
                    let stream = yield this.LazyBoyAsync.GetAttachmentStreamAsync(this.Options.profile_db, entry._id, "avatar");
                    return resolve({ name: 'avatar', extension: mime.extension(info.content_type), data: stream });
                }));
            });
        }
        /**
         * Shorter to search entry by UserId or UserName if one of those properties exist in the {@code user}
         * @param user {@link DataModel.User}
         * @throw {@link DataSourceException}
         * @return {Promise<boolean>}
         * @private
         */
        _userExistAsync(user) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    let r = false;
                    if (user) {
                        if (user.Id) {
                            let entry = yield this._getEntryByUserIdAsync(user.Id);
                            r = entry != null && !entry.isDeleted;
                            return resolve(r);
                        }
                        else if (user.Email) {
                            let entry = yield this._getEntryByUserNameAsync(user.Email);
                            r = entry != null && !entry.isDeleted;
                            return resolve(r);
                        }
                        else {
                            let error = new DataSourceException("invalid data");
                            Log.c("LazyDataServer", "userExistAsync", error);
                            throw error;
                        }
                    }
                    else {
                        let error = new DataSourceException("invalid data");
                        Log.c("LazyDataServer", "userExistAsync", error);
                        throw error;
                    }
                }));
            });
        }
        /**
         * Shorter to retrieve the entry {@link lazyboyjs.LazyInstance} from the database using either the
         * UserId or the UserName property of the parameter {@code user}
         * @param user {DataModel.User}
         * @return {Promise<lazyboyjs.LazyInstance>}
         * @private
         */
        _getUserEntryAsync(user) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = null;
                    try {
                        if (user) {
                            if (user.Id && user.Id.length > 0) {
                                let entry = yield this._getEntryByUserIdAsync(user.Id);
                                r = entry.isDeleted ? null : entry;
                            }
                            else if (user.Email && user.Email.length > 0) {
                                let entry = yield this._getEntryByUserNameAsync(user.Email);
                                r = entry.isDeleted ? null : entry;
                            }
                        }
                        return resolve(r);
                    }
                    catch (exception) {
                        Log.c("LazyDataServerAsync", "_getUserEntryAsync", exception);
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * Shorter to execute {@link AddEntry} on "credential_db". All conflict, update or delete
         * should be managed here.
         * @param data {object}
         * @return {Promise<{success: boolean, entry: lazyboyjs.LazyInstance}>}
         * @private
         */
        _addUserEntryAsync(data) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = { success: false, entry: null };
                    try {
                        let report = yield this.LazyBoyAsync.AddEntryAsync(this.Options.credential_db, {
                            type: "user",
                            data: data
                        });
                        Log.d("LazyDataServer", "addUserEntryAsync", "LazyBoyAsync.AddEntryAsync", report.entry);
                        switch (report.result) {
                            case lazyboyjs_1.lazyboyjs.InstanceCreateStatus.Created:
                                Log.d("LazyDataServer", "addUserEntryAsync", "LazyBoyAsync.AddEntryAsync", "Instance Created");
                                r.success = true;
                                r.entry = report.entry;
                                break;
                            case lazyboyjs_1.lazyboyjs.InstanceCreateStatus.Conflict:
                                Log.d("LazyDataServer", "addUserEntryAsync", "LazyBoyAsync.AddEntryAsync", "Instance Conflict");
                                r.success = false;
                                r.entry = report.entry;
                                break;
                            default:
                                Log.c("LazyDataServer", "addUserEntryAsync", "LazyBoyAsync.AddEntryAsync", "not managed code : " + report.result);
                                r.success = false;
                                r.entry = report.entry;
                                break;
                        }
                        return resolve(r);
                    }
                    catch (exception) {
                        Log.c("LazyDataServerAsync", "_addUserEntryAsync", exception);
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * Shorter to select an {@link DataModel.User} instance given an userId.
         * This function execute {@link GetViewResult} using the following parameters :
         * <pre>
         *      Options.credential_db, "entryByUserId", {key: userId, reduce: false},
         * </pre>
         * @param userId {string}
         * @return {Promise<lazyboyjs.LazyInstance>}
         * @private
         */
        _getEntryByUserIdAsync(userId) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    let r = null;
                    let report = yield this.LazyBoyAsync.GetViewResultAsync(this.Options.credential_db, "entryByUserId", {
                        key: userId,
                        reduce: false
                    });
                    if (report.error) {
                        Log.c("LazyDataServerAsync", "getEntryByUserIdAsync", "LazyBoyAsync.GetViewResultAsync", report.error);
                        throw report.error;
                    }
                    if (report.result.length == 0) {
                        Log.d("LazyDataServer", "getEntryByUserIdAsync", "LazyBoyAsync.GetViewResultAsync", "no entry found");
                        return resolve(r);
                    }
                    else if (report.result.length > 1) {
                        //throw new DataSourceException("more than one user was found", UserCodeException.DUPLICATE_FOUND);
                        Log.d("LazyDataServer", "getEntryByUserIdAsync", "LazyBoyAsync.GetViewResultAsync", "more than one entry was found");
                        return resolve(r);
                    }
                    Log.d("LazyDataServer", "getEntryByUserIdAsync", "LazyBoyAsync.GetViewResultAsync", "one entry was found");
                    return resolve(report.result[0].value);
                }));
            });
        }
        /**
         * Shorter to select an {@link DataModel.User} instance given an username.
         * This function execute {@link GetViewResult} using the following parameters :
         * <pre>
         *      Options.credential_db, "entryByEmail", {key: username, reduce: false},
         * </pre>
         * @param username {string}
         * @return {Promise<lazyboyjs.LazyInstance>}
         * @private
         */
        _getEntryByUserNameAsync(username) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        let report = yield this.LazyBoyAsync.GetViewResultAsync(this.Options.credential_db, "entryByEmail", { key: username, reduce: false });
                        if (report.result.length == 0) {
                            // throw new DataSourceException("no user found", UserCodeException.NOT_FOUND);
                            Log.d("LazyDataServer", "getEntryByUserNameAsync", "LazyBoyAsync.GetViewResultAsync", "no user found");
                            return resolve(null);
                        }
                        else if (report.result.length > 1) {
                            //throw new DataSourceException("more than one user was found", UserCodeException.DUPLICATE_FOUND);
                            Log.d("LazyDataServer", "getEntryByUserNameAsync", "LazyBoyAsync.GetViewResultAsync", "more than one user was found");
                            return resolve(null);
                        }
                        Log.d("LazyDataServer", "getEntryByUserNameAsync", "LazyBoyAsync.GetViewResultAsync", "one user was found");
                        return resolve(report.result[0].value);
                    }
                    catch (exception) {
                        Log.c("LazyDataServerAsync", "_getEntryByUserNameAsync", exception);
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * Shorter to execute {@link LazyDataServer.UpdateEntry} on the "credential_db".
         * @param entry {lazyboyjs.LazyInstance}
         * @return {Promise<{error: Error, updated: boolean, data: lazyboyjs.LazyInstance}>}
         * @private
         */
        _updateUserEntryAsync(entry) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        let report = yield this.LazyBoyAsync.UpdateEntryAsync(this.Options.credential_db, entry);
                        Log.d("LazyDataServer", "updateUserEntryAsync", "LazyBoyAsync.UpdateEntryAsync", report.updated, report.data);
                        return resolve(report);
                    }
                    catch (exception) {
                        Log.c("LazyDataServerAsync", "_updateUserEntryAsync", exception);
                        return reject(exception);
                    }
                }));
            });
        }
        _getProfileEntryByUserId(userId) {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let view = yield this.LazyBoyAsync.GetViewResultAsync(this.Options.profile_db, "profileEntryByUserId", {
                        key: userId,
                        reduce: false
                    });
                    if (view.error) {
                        Log.e("LazyDataServerAsync", "_getProfileEntryByUserId", "GetViewResultAsync", view.error);
                        return reject(view.error);
                    }
                    if (view.result.length === 0 || view.result.length > 1) {
                        return resolve(null);
                    }
                    return resolve(view.result[0].value);
                }));
            });
        }
    }
    DataService.LazyDataServerAsync = LazyDataServerAsync;
    let userByEmail = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Email') && !doc.isDeleted){ emit(doc.instance.Email, doc.instance ); }}",
        reduce: "_count()"
    };
    let userByUserId = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Id') && !doc.isDeleted) { emit(doc.instance.Id, doc.instance); } }",
        reduce: "_count()"
    };
    let entryByEmail = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Email') && !doc.isDeleted){ emit(doc.instance.Email, doc); }}",
        reduce: "_count()"
    };
    let entryByUserId = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Id') && !doc.isDeleted) { emit(doc.instance.Id, doc); } }",
        reduce: "_count()"
    };
    let deletedTypeEntry = {
        map: "function(doc){ if(doc.isDeleted) { emit(doc.type, doc); } }",
        reduce: "_count()"
    };
    let allUsersNotDeleted = {
        map: "function(doc){ if(!doc.isDeleted && doc.type.toLowerCase() == 'user') { emit(doc.type, doc.instance); } }",
        reduce: "_count()"
    };
    let userViews = {
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
    let profileByUserId = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('UserId') && !doc.isDeleted){ emit(doc.instance.UserId, doc.instance); }}",
        reduce: "_count()"
    };
    let profileEntryByUserId = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('UserId') && !doc.isDeleted){ emit(doc.instance.UserId, doc); }}",
        reduce: "_count()"
    };
    let profileViews = {
        version: 2,
        type: 'javascript',
        views: {
            'profileByUserId': profileByUserId,
            'profileEntryByUserId': profileEntryByUserId
        }
    };
    var UserCodeException;
    (function (UserCodeException) {
        UserCodeException[UserCodeException["NOT_FOUND"] = 1] = "NOT_FOUND";
        UserCodeException[UserCodeException["ALREADY_EXIST"] = 2] = "ALREADY_EXIST";
        UserCodeException[UserCodeException["DUPLICATE_FOUND"] = 4] = "DUPLICATE_FOUND";
    })(UserCodeException = DataService.UserCodeException || (DataService.UserCodeException = {}));
    class DataSourceException extends Error {
        constructor(message, code) {
            super(message);
            this.code = code;
        }
        toString() {
            return this.message + " code: " + this.code;
        }
    }
    DataService.DataSourceException = DataSourceException;
})(DataService = exports.DataService || (exports.DataService = {}));
