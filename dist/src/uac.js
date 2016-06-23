/// <reference path="../typings/index.d.ts" />
"use strict";
var models_1 = require("./model/models");
var data_service_1 = require("./service/data.service");
var DataSourceException = data_service_1.DataService.DataSourceException;
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
            var _this = this;
            this._ValidateDataSource();
            user.Roles |= models_1.DataModel.Role.VIEWER | models_1.DataModel.Role.USER;
            this._dataSource.GetUserByUsernameAsync(user.Email, function (error, fetch) {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                if (fetch) {
                    callback(new Error("None unique email"), user);
                }
                _this._dataSource.InsertUserAsync(user, function (error, result) {
                    if (error) {
                        console.error("ERROR", new Date(), error);
                        throw error;
                    }
                    callback(error, result);
                });
            });
        };
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
        UserManager.prototype.AddRolesToUser = function (userId, role, callback) {
            this._ValidateDataSource();
            this._dataSource.GetUserByUserIdAsync(userId, function (error, user) {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                if (!user) {
                    return callback(new DataSourceException("no user found"), null);
                }
                user.Roles |= role;
                return callback(null, true);
            });
        };
        UserManager.prototype._ValidateDataSource = function () {
            if (!this._dataSource) {
                throw new DataSourceException("data source can't be null");
            }
        };
        return UserManager;
    }());
    LazyUAC.UserManager = UserManager;
})(LazyUAC = exports.LazyUAC || (exports.LazyUAC = {}));
