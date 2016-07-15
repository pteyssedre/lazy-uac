"use strict";
var bcript = require("bcrypt-nodejs");
var lazyFormatLogger = require("lazy-format-logger");
var DataModel;
(function (DataModel) {
    var Log = new lazyFormatLogger.Logger();
    var Utils = (function () {
        function Utils() {
        }
        Utils.newGuid = function () {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        Utils.setLevel = function (level) {
            Log = new lazyFormatLogger.Logger(level);
        };
        return Utils;
    }());
    DataModel.Utils = Utils;
    (function (Role) {
        Role[Role["VIEWER"] = 1] = "VIEWER";
        Role[Role["USER"] = 2] = "USER";
        Role[Role["ADMIN"] = 4] = "ADMIN";
        Role[Role["SUPER_ADMIN"] = 8] = "SUPER_ADMIN";
    })(DataModel.Role || (DataModel.Role = {}));
    var Role = DataModel.Role;
    var User = (function () {
        function User(firstName, lastName, email, password, roles) {
            this.Id = Utils.newGuid();
            this.FirstName = firstName;
            this.LastName = lastName;
            this.Email = email;
            this.Roles = roles;
            this.AddPasswordSync(password);
        }
        User.prototype.AddPassword = function (password, callback) {
            var it = this;
            var round = (Math.floor(Math.random() * 10) + 1);
            Log.d("User", "AddPassword", "Generating Salt", round);
            bcript.genSalt(round, function (error, salt) {
                if (error) {
                    Log.c("User", "AddPassword", "bcript.genSalt", error);
                    throw error;
                }
                Log.d("User", "Generating Hash", salt);
                bcript.hash(password, salt, it.cryptingProgress, function (error, hash) {
                    if (error) {
                        Log.c("User", "AddPassword", "bcript.hash", error);
                        throw error;
                    }
                    Log.d("User", "AddPassword", "password encrypted", hash);
                    it.Password = hash;
                    callback();
                });
            });
        };
        User.prototype.AddPasswordSync = function (password) {
            if (password) {
                var it = this;
                var round = (Math.floor(Math.random() * 10) + 1);
                Log.d("User", "AddPasswordSync", "Generating SaltSync", round);
                var salt = bcript.genSaltSync(round);
                Log.d("User", "AddPasswordSync", "Generating HashSync", salt);
                var hash = bcript.hashSync(password, salt);
                Log.d("User", "AddPasswordSync", "password encrypted", hash);
                it.Password = hash;
            }
        };
        User.prototype.ComparePassword = function (password, callback) {
            bcript.compare(password, this.Password, function (error, result) {
                if (error) {
                    Log.c("User", "ComparePassword", error);
                    throw error;
                }
                callback(result);
            });
        };
        User.prototype.ComparePasswordSync = function (password) {
            Log.d("User", "ComparePasswordSync", "comparing", password, this.Password);
            return bcript.compareSync(password, this.Password);
        };
        User.prototype.cryptingProgress = function () {
            //Log.d("", "in progress");
        };
        return User;
    }());
    DataModel.User = User;
    var Profile = (function () {
        function Profile(user, description, avatar, pkey, prkey) {
            this.UserId = user ? user.Id : '';
            this.Description = description;
            this.Avatar = avatar;
            this.PublicKey = pkey;
            this.PrivateKey = prkey;
        }
        return Profile;
    }());
    DataModel.Profile = Profile;
})(DataModel = exports.DataModel || (exports.DataModel = {}));
