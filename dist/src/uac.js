"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const models_1 = require("./model/models");
const data_service_1 = require("./service/data.service");
const lazyFormatLogger = require("lazy-format-logger");
var LazyUAC;
(function (LazyUAC) {
    let Log = new lazyFormatLogger.Logger();
    class UserManager {
        constructor(options) {
            this.options = options;
            if (!this.options) {
                this.options = {};
            }
            if (this.options.logLevel) {
                UserManager.setLevel(this.options.logLevel);
            }
            if (this.options.useAsync) {
                this._dataSourceAsync = this.options.dataSourceAsync;
                if (!this._dataSourceAsync) {
                    this._dataSourceAsync = new data_service_1.DataService.LazyDataServerAsync(this.options.dataSourceOptions);
                }
            }
            else {
                this._dataSource = this.options.dataSource;
                if (!this._dataSource && !this.options.useAsync) {
                    this._dataSource = new data_service_1.DataService.LazyDataServer(this.options.dataSourceOptions);
                }
            }
            this._ValidateDataSource();
        }
        static setLevel(level) {
            Log = new lazyFormatLogger.Logger(level);
            data_service_1.DataService.LazyDataServerBase.setLevel(level);
        }
        /**
         * Starting the Manager to connect and initialized the databases, if needed.
         * @param callback {function(error: Error, result: Object)}
         * @return {LazyUAC.UserManager} current instance.
         */
        StartManager(callback) {
            if (!this.options.useAsync) {
                this._dataSource.Connect((error, result) => {
                    return callback(error, result);
                });
            }
            else {
                Log.e("UAC", "StartManager", "non-Async method call with Async function");
            }
            return this;
        }
        /**
         * Starting the Manager to connect and initialized the databases, if needed.
         * @return {Promise<boolean>}
         * @constructor
         */
        StartManagerAsync() {
            return __awaiter(this, void 0, Promise, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = false;
                    try {
                        let result = yield this._dataSourceAsync.ConnectAsync();
                        r = !result.error;
                        return resolve(r);
                    }
                    catch (exception) {
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * In order to add a user to the system, we add VIEWER and USER role to the user.
         * @param user {User}
         * @param callback {function(error:Error, user:User)}
         * @return {LazyUAC.UserManager} current instance.
         */
        AddUser(user, callback) {
            this._ValidateDataSource();
            if (!this.options.useAsync) {
                user.Roles |= models_1.DataModel.Role.VIEWER | models_1.DataModel.Role.USER;
                this._dataSource.InsertUser(user, (success) => {
                    callback(success ? user : null);
                });
            }
            else {
                Log.e("UAC", "AddUser", "non-Async method call with Async function");
            }
            return this;
        }
        /**
         * Shorter to add user and enforce admin right to it.
         * @param user {@link DataModel.User} user to save as Admin User
         * @param callback {function(user: DataModel.User)} callback when operation is completed.
         * @return {LazyUAC.UserManager}
         */
        AddAdmin(user, callback) {
            this._ValidateDataSource();
            if (!this.options.useAsync) {
                user.Roles |= models_1.DataModel.Role.ADMIN | models_1.DataModel.Role.USER;
                this._dataSource.InsertUser(user, (success) => {
                    callback(success ? user : null);
                });
            }
            else {
                Log.e("UAC", "AddUser", "non-Async method call with Async function");
            }
            return this;
        }
        /**
         * In order to add a user to the system, we add VIEWER and USER role to the user.
         * @param user {DataModel.User}
         * @return {Promise<DataModel.User>}
         */
        AddUserAsync(user) {
            return __awaiter(this, void 0, Promise, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = null;
                    try {
                        user.Roles |= models_1.DataModel.Role.VIEWER | models_1.DataModel.Role.USER;
                        let report = yield this._dataSourceAsync.InsertUserAsync(user);
                        r = report.user;
                        return resolve(r);
                    }
                    catch (exception) {
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * Shorter Async to add user and enforce admin right to it.
         * @param user {DataModel.User} User to insert in the db.
         * @return {Promise<DataModel.User>} resutl of the operation.
         */
        AddAdminAsync(user) {
            return __awaiter(this, void 0, Promise, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = user;
                    try {
                        r.Roles |= models_1.DataModel.Role.ADMIN | models_1.DataModel.Role.USER;
                        let report = yield this._dataSourceAsync.InsertUserAsync(r);
                        r = report.user;
                        return resolve(r);
                    }
                    catch (exception) {
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * To produce the access string for an User, the identity of the User as to be validated.
         * @param username {string} email address to retrieve the User inside the db.
         * @param password {string} password in clear to be compare with the one on the user instance
         * @param callback {function(match: boolean, user: DataModel.User)}
         * @return {LazyUAC.UserManager} current instance.
         */
        Authenticate(username, password, callback) {
            this._ValidateDataSource();
            if (!this.options.useAsync) {
                this._dataSource.GetUserByUserName(username, (user) => {
                    if (user) {
                        user.ComparePassword(password, (match) => {
                            return callback(match, user);
                        });
                    }
                    else {
                        return callback(false, null);
                    }
                });
            }
            else {
                Log.e("UAC", "Authenticate", "non-Async method call with Async function");
            }
            return this;
        }
        /**
         * To produce the access string for an User, the identity of the User as to be validated.
         * @param username {string} email address to retrieve the User inside the db.
         * @param password {string} password in clear to be compare with the one on the user instance
         * @return {Promise<{match: boolean, user: DataModel.User}>}
         */
        AuthenticateAsync(username, password) {
            return __awaiter(this, void 0, Promise, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = { match: false, user: null };
                    try {
                        let user = yield this._dataSourceAsync.GetUserByUserNameAsync(username);
                        r.user = user;
                        if (user) {
                            user.ComparePassword(password, (match) => {
                                r.match = match;
                                return resolve(r);
                            });
                        }
                        else {
                            return resolve(r);
                        }
                    }
                    catch (exception) {
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * To remove an user the {@link lazyboyjs.LazyInstance} will be flag to delete.
         * @param userId {string} unique id of the instance to delete.
         * @param callback {function(delete: boolean)}
         * @return {LazyUAC.UserManager} current instance.
         */
        DeleteUser(userId, callback) {
            this._ValidateDataSource();
            if (!this.options.useAsync) {
                this._dataSource.DeleteUser(userId, callback);
            }
            else {
                Log.e("UAC", "DeleteUser", "non-Async method call with Async function");
            }
            return this;
        }
        /**
         * To remove an user the {@link lazyboyjs.LazyInstance} will be flag to delete.
         * @param userId {string} unique id of the instance to delete.
         * @return {Promise<boolean>}
         */
        DeleteUserAsync(userId) {
            return __awaiter(this, void 0, Promise, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = false;
                    try {
                        r = yield this._dataSourceAsync.DeleteUserAsync(userId);
                        return resolve(r);
                    }
                    catch (exception) {
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * To retrieve user trough database and return the only one match value.
         * @param username {string} user name to search.
         * @param callback {function(user: DataModel#User)}
         * @return {LazyUAC.UserManager} current instance.
         */
        GetUserByUserName(username, callback) {
            this._ValidateDataSource();
            if (!this.options.useAsync) {
                this._dataSource.GetUserByUserName(username, callback);
            }
            else {
                Log.e("UAC", "GetUserByUserName", "non-Async method call with Async function");
            }
            return this;
        }
        /**
         * To retrieve user trough database and return the only one match value.
         * @param username {string} user name to search.
         * @return {Promise<DataModel.User>}
         */
        GetUserByUserNameAsync(username) {
            return __awaiter(this, void 0, Promise, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = null;
                    try {
                        r = yield this._dataSourceAsync.GetUserByUserNameAsync(username);
                        return resolve(r);
                    }
                    catch (exception) {
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * To retrieve user trough database and return the only one match value.
         * @param userId {string}
         * @param callback {function(user: DataModel.User)}
         * @return {LazyUAC.UserManager}
         */
        GetUserById(userId, callback) {
            this._ValidateDataSource();
            if (!this.options.useAsync) {
                this._dataSource.GetUserByUserId(userId, callback);
            }
            else {
                Log.e("UAC", "GetUserById", "non-Async method call with Async function");
            }
            return this;
        }
        /**
         * To retrieve user trough database and return the only one match value.
         * @param userId {string}
         * @return {Promise<DataModel.User>}
         */
        GetUserByIdAsync(userId) {
            return __awaiter(this, void 0, Promise, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = null;
                    try {
                        r = yield this._dataSourceAsync.GetUserByUserIdAsync(userId);
                        return resolve(r);
                    }
                    catch (exception) {
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * Function to retrieved all users from db.
         * @param callback {function(list: DataModel.User[])}
         * @return {LazyUAC.UserManager}
         */
        GetAllUsers(callback) {
            this._ValidateDataSource();
            if (!this.options.useAsync) {
                this._dataSource.GetAllUsers(callback);
            }
            else {
                Log.e("UAC", "GetAllUsers", "non-Async method call with Async function");
            }
            return this;
        }
        GetAllUsersAsync() {
            return __awaiter(this, void 0, Promise, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = null;
                    try {
                        r = yield this._dataSourceAsync.GetAllUsersAsync();
                        return resolve(r);
                    }
                    catch (exception) {
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * In order to add {@link Role} to an {@link User}, the userId is used
         * to retrieve from the {@link _dataSource}
         * @param userId {string}
         * @param role {@link DataModel.Role}
         * @param callback {function(error: Error, done: boolean)}
         * @return {LazyUAC.UserManager} current instance.
         */
        AddRolesToUser(userId, role, callback) {
            this._ValidateDataSource();
            if (!this.options.useAsync) {
                this._dataSource.GetUserByUserId(userId, (user) => {
                    if (user) {
                        user.Roles |= role;
                        this.UpdateUser(user, callback);
                    }
                    else {
                        return callback(false);
                    }
                });
            }
            else {
                Log.e("UAC", "AddRolesToUser", "non-Async method call with Async function");
            }
            return this;
        }
        /**
         * In order to add {@link Role} to an {@link User}, the userId is used
         * to retrieve from the {@link _dataSource}
         * @param userId
         * @param role {@link DataModel.Role}
         * @return {Promise<boolean>}
         */
        AddRolesToUserAsync(userId, role) {
            return __awaiter(this, void 0, Promise, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = false;
                    try {
                        let user = yield this._dataSourceAsync.GetUserByUserIdAsync(userId);
                        if (user) {
                            user.Roles |= role;
                            r = yield this.UpdateUserAsync(user);
                        }
                        return resolve(r);
                    }
                    catch (exception) {
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         *
         * @param userId {string}
         * @param role {DataModel.Role}
         * @param callback {function(done: boolean)}
         * @return {LazyUAC.UserManager}
         */
        RemoveRolesToUser(userId, role, callback) {
            this._ValidateDataSource();
            if (!this.options.useAsync) {
                this._dataSource.GetUserByUserId(userId, (user) => {
                    if (user) {
                        user.Roles &= ~(role);
                        this.UpdateUser(user, callback);
                    }
                    else {
                        return callback(false);
                    }
                });
            }
            else {
                Log.e("UAC", "RemoveRolesToUser", "non-Async method call with Async function");
            }
            return this;
        }
        /**
         * Remove {@link DataModel.User#Roles} from user given an UserId.
         * @param userId {string} unique identifier.
         * @param role {DataModel.Role}
         * @return {Promise<boolean>}
         */
        RemoveRolesToUserAsync(userId, role) {
            return __awaiter(this, void 0, Promise, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = false;
                    try {
                        let user = yield this._dataSourceAsync.GetUserByUserIdAsync(userId);
                        if (user) {
                            if (user.Roles >= role) {
                                user.Roles -= role;
                                r = yield this.UpdateUserAsync(user);
                            }
                        }
                        return resolve(r);
                    }
                    catch (exception) {
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         *
         * @param user {DataModel.User}
         * @param callback {function(done: boolean)}
         */
        UpdateUser(user, callback) {
            this._ValidateDataSource();
            if (!this.options.useAsync) {
                this._dataSource.UpdateUser(user, callback);
            }
            else {
                Log.e("UAC", "UpdateUser", "non-Async method call with Async function");
            }
        }
        /**
         *
         * @param user {DataModel.User}
         * @return {Promise<boolean>}
         */
        UpdateUserAsync(user) {
            return __awaiter(this, void 0, Promise, function* () {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    let r = false;
                    try {
                        let report = yield this._dataSourceAsync.UpdateUserAsync(user);
                        r = report.updated;
                        return resolve(r);
                    }
                    catch (exception) {
                        return reject(exception);
                    }
                }));
            });
        }
        /**
         * Helper to validate the state of the {@link _dataSource} property.
         * @private
         */
        _ValidateDataSource() {
            if (!this._dataSource && !this._dataSourceAsync) {
                let error = new data_service_1.DataService.DataSourceException("data source can't be null");
                Log.c("UserManager", "ValidateDataSource", error);
                throw error;
            }
        }
    }
    LazyUAC.UserManager = UserManager;
})(LazyUAC = exports.LazyUAC || (exports.LazyUAC = {}));
