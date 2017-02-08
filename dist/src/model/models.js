"use strict";
const bcript = require("bcrypt-nodejs");
const lazyFormatLogger = require("lazy-format-logger");
var DataModel;
(function (DataModel) {
    let Log = new lazyFormatLogger.Logger();
    class Utils {
        static setLevel(level) {
            Log = new lazyFormatLogger.Logger(level);
        }
    }
    DataModel.Utils = Utils;
    (function (Role) {
        Role[Role["NONE"] = 0] = "NONE";
        Role[Role["VIEWER"] = 1] = "VIEWER";
        Role[Role["USER"] = 4] = "USER";
        Role[Role["ADMIN"] = 8] = "ADMIN";
        Role[Role["SUPER_ADMIN"] = 16] = "SUPER_ADMIN";
    })(DataModel.Role || (DataModel.Role = {}));
    var Role = DataModel.Role;
    class User {
        constructor(entry) {
            if (entry && entry.instance) {
                let e = entry.instance;
                let keys = Object.keys(e);
                for (let key of keys) {
                    this[key] = e[key];
                }
            }
        }
        AddPassword(password, callback) {
            if (!password) {
                throw new Error("password doesn't contain value");
            }
            let it = this;
            let round = (Math.floor(Math.random() * 10) + 1);
            Log.d("User", "AddPassword", "Generating Salt", round);
            bcript.genSalt(round, (error, salt) => {
                if (error) {
                    Log.c("User", "AddPassword", "bcript.genSalt", error);
                    throw error;
                }
                Log.d("User", "Generating Hash", salt);
                bcript.hash(password, salt, DataModel.User.encryptingProgress, (error, hash) => {
                    if (error) {
                        Log.c("User", "AddPassword", "bcript.hash", error);
                        throw error;
                    }
                    Log.d("User", "AddPassword", "password encrypted", hash);
                    it.Password = hash;
                    callback();
                });
            });
        }
        AddPasswordSync(password) {
            if (password) {
                let it = this;
                let round = (Math.floor(Math.random() * 10) + 1);
                Log.d("User", "AddPasswordSync", "Generating SaltSync", round);
                let salt = bcript.genSaltSync(round);
                Log.d("User", "AddPasswordSync", "Generating HashSync", salt);
                let hash = bcript.hashSync(password, salt);
                Log.d("User", "AddPasswordSync", "password encrypted", hash);
                it.Password = hash;
            }
        }
        ComparePassword(password, callback) {
            if (!password) {
                throw new Error("password doesn't contain value");
            }
            bcript.compare(password, this.Password, (error, result) => {
                if (error) {
                    Log.c("User", "ComparePassword", error);
                    throw error;
                }
                callback(result);
            });
        }
        ComparePasswordSync(password) {
            if (!password) {
                throw new Error("password doesn't contain value");
            }
            Log.d("User", "ComparePasswordSync", "comparing", password, this.Password);
            return bcript.compareSync(password, this.Password);
        }
        Any(role) {
            return !!(this.Roles & role);
        }
        HasRole(role) {
            return ((this.Roles & role) === role);
        }
        AddRole(role) {
            this.Roles |= role;
        }
        RemoveRole(role) {
            this.Roles &= ~role;
        }
        static encryptingProgress() {
            Log.d("User", "in progress");
        }
    }
    DataModel.User = User;
    class Profile {
        constructor(entry) {
            let e = entry.instance;
            this.UserId = e.UserId;
            this.Description = e.Description;
            this.Avatar = e.Avatar;
            this.PublicKey = e.PublicKey;
            this.PrivateKey = e.PrivateKey;
        }
    }
    DataModel.Profile = Profile;
})(DataModel = exports.DataModel || (exports.DataModel = {}));
