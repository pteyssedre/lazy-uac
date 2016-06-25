"use strict";
var bcript = require("bcrypt-nodejs");
var DataModel;
(function (DataModel) {
    var Utils = (function () {
        function Utils() {
        }
        Utils.newGuid = function () {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        return Utils;
    }());
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
            console.log("DEBUG", new Date(), "Generating Salt", round);
            bcript.genSalt(round, function (error, salt) {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                console.log("DEBUG", new Date(), "Generating Hash", salt);
                bcript.hash(password, salt, it.cryptingProgress, function (error, hash) {
                    if (error) {
                        console.error("ERROR", new Date(), error);
                        throw error;
                    }
                    console.log("DEBUG", new Date(), "password encrypted", hash);
                    it.Password = hash;
                    callback();
                });
            });
        };
        User.prototype.AddPasswordSync = function (password) {
            var it = this;
            var round = (Math.floor(Math.random() * 10) + 1);
            console.log("DEBUG", new Date(), "Generating Salt", round);
            var salt = bcript.genSaltSync(round);
            console.log("DEBUG", new Date(), "Generating Hash", salt);
            var hash = bcript.hashSync(password, salt);
            console.log("DEBUG", new Date(), "password encrypted", hash);
            it.Password = hash;
        };
        User.prototype.ComparePassword = function (password, callback) {
            bcript.compare(password, this.Password, function (error, result) {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                callback(result);
            });
        };
        User.prototype.ComparePasswordSync = function (password) {
            console.log("DEBUG", new Date(), "comparing", password, this.Password);
            return bcript.compareSync(password, this.Password);
        };
        User.prototype.cryptingProgress = function () {
            //console.log("DEBUG", new Date(), "in progress");
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
