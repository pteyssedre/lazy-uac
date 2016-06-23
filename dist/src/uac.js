/// <reference path="../typings/index.d.ts" />
"use strict";
var models_1 = require("./model/models");
var data_service_1 = require("./service/data.service");
var LazyUAC;
(function (LazyUAC) {
    var UserManager = (function () {
        function UserManager(dataSource) {
            this._dataSource = dataSource;
            if (!this._dataSource) {
                this._dataSource = new data_service_1.DataService.LazyDataServer();
            }
            this._ValidateDataSource();
        }
        /**
         * Starting the Manager to connect and initialized the databases, if needed.
         * @param callback {function(error: Error, result: Object)}
         */
        UserManager.prototype.StartManager = function (callback) {
            this._dataSource.Connect(function (error, result) {
                callback(error, result);
            });
        };
        /**
         * In order to add a user to the system, we add VIEWER and USER role to the user.
         * @param user {User}
         * @param callback {function(error:Error, user:User)}
         */
        UserManager.prototype.AddUser = function (user, callback) {
            this._ValidateDataSource();
            user.Roles |= models_1.DataModel.Role.VIEWER | models_1.DataModel.Role.USER;
            this._dataSource.InsertUserAsync(user, function (error, result) {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                callback(error, result);
            });
        };
        /**
         * To produce the access string for an User, the identity of the User as to be validated.
         * @param username {string} email address to retrieve the User inside the db.
         * @param password {string} password in clear to be compare with the one on the user instance
         * @param callback
         */
        UserManager.prototype.Authenticate = function (username, password, callback) {
            console.log("INFO", new Date(), "Authenticating", username);
            this._ValidateDataSource();
            this._dataSource.GetUserByUsernameAsync(username, function (error, user) {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                user.ComparePassword(password, function (match) {
                    callback(match);
                });
            });
        };
        /**
         * To retrieve user trough database and return the only one match value.
         * @param username {string} user name to search.
         * @param callback {function(user: DataModel#User)}
         */
        UserManager.prototype.GetUserByUserName = function (username, callback) {
            this._ValidateDataSource();
            this._dataSource.GetUserByUsernameAsync(username, function (error, user) {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                callback(user);
            });
        };
        /**
         * In order to add {@link Role} to an {@link User}, the userId is used
         * to retrieve from the {@link _dataSource}
         * @param userId {string}
         * @param role {@link DataModel.Role}
         * @param callback {function(error: Error, done: boolean)}
         */
        UserManager.prototype.AddRolesToUser = function (userId, role, callback) {
            this._ValidateDataSource();
            this._dataSource.GetUserByUserIdAsync(userId, function (error, user) {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                if (!user) {
                    return callback(new data_service_1.DataService.DataSourceException("No user found"), null);
                }
                user.Roles |= role;
                return callback(null, true);
            });
        };
        /**
         * Helper to validate the state of the {@link _dataSource} property.
         * @private
         */
        UserManager.prototype._ValidateDataSource = function () {
            if (!this._dataSource) {
                throw new data_service_1.DataService.DataSourceException("data source can't be null");
            }
        };
        return UserManager;
    }());
    LazyUAC.UserManager = UserManager;
})(LazyUAC = exports.LazyUAC || (exports.LazyUAC = {}));
