"use strict";
var models_1 = require("./model/models");
var data_service_1 = require("./service/data.service");
var lazyFormatLogger = require("lazy-format-logger");
var LazyUAC;
(function (LazyUAC) {
    var Log = new lazyFormatLogger.Logger();
    var UserManager = (function () {
        function UserManager(options) {
            this.options = options;
            if (!this.options) {
                this.options = {};
            }
            this._dataSource = this.options.dataSource;
            if (!this._dataSource) {
                this._dataSource = new data_service_1.DataService.LazyDataServer(this.options.dataSourceOptions);
            }
            this._ValidateDataSource();
        }
        UserManager.setLevel = function (level) {
            Log = new lazyFormatLogger.Logger(level);
            data_service_1.DataService.LazyDataServer.setLevel(level);
        };
        /**
         * Starting the Manager to connect and initialized the databases, if needed.
         * @param callback {function(error: Error, result: Object)}
         * @return {LazyUAC.UserManager} current instance.
         */
        UserManager.prototype.StartManager = function (callback) {
            this._dataSource.Connect(function (error, result) {
                return callback(error, result);
            });
            return this;
        };
        /**
         * In order to add a user to the system, we add VIEWER and USER role to the user.
         * @param user {User}
         * @param callback {function(error:Error, user:User)}
         * @return {LazyUAC.UserManager} current instance.
         */
        UserManager.prototype.AddUser = function (user, callback) {
            this._ValidateDataSource();
            user.Roles |= models_1.DataModel.Role.VIEWER | models_1.DataModel.Role.USER;
            this._dataSource.InsertUser(user, function (success) {
                callback(success ? user : null);
            });
            return this;
        };
        /**
         * To produce the access string for an User, the identity of the User as to be validated.
         * @param username {string} email address to retrieve the User inside the db.
         * @param password {string} password in clear to be compare with the one on the user instance
         * @param callback {function(match: boolean, user: DataModel.User)}
         * @return {LazyUAC.UserManager} current instance.
         */
        UserManager.prototype.Authenticate = function (username, password, callback) {
            this._ValidateDataSource();
            this._dataSource.GetUserByUserName(username, function (user) {
                if (user) {
                    user.ComparePassword(password, function (match) {
                        return callback(match, user);
                    });
                }
                else {
                    return callback(false, null);
                }
            });
            return this;
        };
        /**
         * To remove an user the {@link lazyboyjs.LazyInstance} will be flag to delete.
         * @param userId {string} unique id of the instance to delete.
         * @param callback {function(delete: boolean)}
         * @return {LazyUAC.UserManager} current instance.
         */
        UserManager.prototype.DeleteUser = function (userId, callback) {
            this._ValidateDataSource();
            this._dataSource.DeleteUser(userId, callback);
            return this;
        };
        /**
         * To retrieve user trough database and return the only one match value.
         * @param username {string} user name to search.
         * @param callback {function(user: DataModel#User)}
         * @return {LazyUAC.UserManager} current instance.
         */
        UserManager.prototype.GetUserByUserName = function (username, callback) {
            this._ValidateDataSource();
            this._dataSource.GetUserByUserName(username, callback);
            return this;
        };
        /**
         *
         * @param userId {string}
         * @param callback {function(user: DataModel.User)}
         * @return {LazyUAC.UserManager}
         */
        UserManager.prototype.GetUserById = function (userId, callback) {
            this._ValidateDataSource();
            this._dataSource.GetUserByUserId(userId, callback);
            return this;
        };
        UserManager.prototype.GetAllUsers = function (callback) {
            this._ValidateDataSource();
            this._dataSource.GetAllUsers(callback);
            return this;
        };
        /**
         * In order to add {@link Role} to an {@link User}, the userId is used
         * to retrieve from the {@link _dataSource}
         * @param userId {string}
         * @param role {@link DataModel.Role}
         * @param callback {function(error: Error, done: boolean)}
         * @return {LazyUAC.UserManager} current instance.
         */
        UserManager.prototype.AddRolesToUser = function (userId, role, callback) {
            var _this = this;
            this._ValidateDataSource();
            this._dataSource.GetUserByUserId(userId, function (user) {
                if (user) {
                    user.Roles |= role;
                    _this.UpdateUser(user, callback);
                }
                else {
                    return callback(false);
                }
            });
            return this;
        };
        /**
         *
         * @param userId {string}
         * @param role {DataModel.Role}
         * @param callback {function(done: boolean)}
         * @return {LazyUAC.UserManager}
         */
        UserManager.prototype.RemoveRolesToUser = function (userId, role, callback) {
            var _this = this;
            this._ValidateDataSource();
            this._dataSource.GetUserByUserId(userId, function (user) {
                if (user) {
                    if (user.Roles >= role) {
                        user.Roles -= role;
                        _this.UpdateUser(user, callback);
                    }
                }
                return callback(false);
            });
            return this;
        };
        /**
         *
         * @param user {DataModel.User}
         * @param callback {function(done: boolean)}
         */
        UserManager.prototype.UpdateUser = function (user, callback) {
            this._ValidateDataSource();
            this._dataSource.UpdateUser(user, callback);
        };
        /**
         * Helper to validate the state of the {@link _dataSource} property.
         * @private
         */
        UserManager.prototype._ValidateDataSource = function () {
            if (!this._dataSource) {
                var error = new data_service_1.DataService.DataSourceException("data source can't be null");
                Log.c("UserManager", "ValidateDataSource", error);
                throw error;
            }
        };
        return UserManager;
    }());
    LazyUAC.UserManager = UserManager;
})(LazyUAC = exports.LazyUAC || (exports.LazyUAC = {}));
