/// <reference path="../typings/index.d.ts" />
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var bcrypt = require("bcrypt-nodejs");
var LazyUAC;
(function (LazyUAC) {
    var DataSourceException = (function (_super) {
        __extends(DataSourceException, _super);
        function DataSourceException(message) {
            _super.call(this, message);
            this.message = message;
        }
        return DataSourceException;
    }(Error));
    LazyUAC.DataSourceException = DataSourceException;
    var UserManager = (function () {
        function UserManager(dataSource) {
            this._dataSource = dataSource;
            this._ValidateDataSource();
        }
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
                        user.Id = response.id;
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
                    return callback(new Error("no user found"), null);
                }
                var done = _this._UpdateRoles(response, roles);
                return callback(null, done);
            });
        };
        UserManager.prototype._ValidateDataSource = function () {
            if (!this._dataSource) {
                throw new DataSourceException("data source can't be null");
            }
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
