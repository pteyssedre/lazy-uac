/// <reference path="../typings/index.d.ts" />
"use strict";
var bcrypt = require("bcrypt-nodejs");
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
        /**
         *
         * @param user {User}
         * @param callback {function(error:Error, user:User)}
         */
        UserManager.prototype.AddUser = function (user, callback) {
            var _this = this;
            this._ValidateDataSource();
            var round = Math.floor(Math.random() * Math.floor((Math.random() * 100)));
            bcrypt.genSalt(round, function (error, salt) {
                if (error) {
                    return callback(error, null);
                }
                bcrypt.hash(user.Password, salt, function (error, encrypted) {
                    if (error) {
                        return callback(error, null);
                    }
                    user.Password = encrypted;
                    _this._dataSource.GetUserAsync(user, function (error, response) {
                        if (error) {
                            return callback(error, null);
                        }
                        user.Id = response.Id;
                        delete user.Password;
                        return callback(null, user);
                    });
                });
            });
        };
        UserManager.prototype.ValidateAuthentication = function (user, callback) {
            this._ValidateDataSource();
            if (!user) {
                throw new Error("no user provided");
            }
            this._dataSource.GetUserAsync(user, function (error, response) {
                if (error) {
                    return callback(error, null);
                }
                var u = response;
                bcrypt.compare(user.Password, u.Password, function (error, same) {
                    if (error) {
                        return callback(error, null);
                    }
                    if (!same) {
                        return callback(null, null);
                    }
                    delete u.Password;
                    return callback(null, u);
                });
            });
        };
        UserManager.prototype.AddRolesToUser = function (userId, roles, callback) {
            var _this = this;
            this._ValidateDataSource();
            this._dataSource.GetUserByUserIdAsync(userId, function (error, response) {
                if (error) {
                    return callback(error, null);
                }
                if (!response) {
                    return callback(new DataSourceException("no user found"), null);
                }
                var done = _this._UpdateRoles(response, roles);
                return callback(null, done);
            });
        };
        UserManager.prototype._ValidateDataSource = function () {
            if (!this._dataSource) {
                throw new DataSourceException("data source can't be null");
            }
            while (!this._dataSource.isReady) {
            }
            console.log("looks like it's ready");
        };
        UserManager.prototype._UpdateRoles = function (u, rs) {
            if (!u) {
                throw new DataSourceException("no user");
            }
            var a = u.Roles.concat(rs);
            for (var i = 0; i < a.length; ++i) {
                for (var j = i + 1; j < a.length; ++j) {
                    if (a[i].id === a[j].id)
                        a.splice(j--, 1);
                }
            }
            u.Roles = a;
            return u.Roles.length >= rs.length;
        };
        UserManager.prototype._UserAsOneOfRoles = function (a, b) {
            if (!a) {
                throw new DataSourceException("no user");
            }
            if (a.Roles.length == 0) {
                return false;
            }
            for (var _i = 0, b_1 = b; _i < b_1.length; _i++) {
                var r = b_1[_i];
                for (var _a = 0, _b = a.Roles; _a < _b.length; _a++) {
                    var r1 = _b[_a];
                    if (r1.id == r.id) {
                        return true;
                    }
                }
            }
            return false;
        };
        return UserManager;
    }());
    LazyUAC.UserManager = UserManager;
})(LazyUAC = exports.LazyUAC || (exports.LazyUAC = {}));
