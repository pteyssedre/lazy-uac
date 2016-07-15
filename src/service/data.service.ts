import { lazyboyjs } from  "lazyboyjs";

import { DataModel } from "../model/models";

import lazyFormatLogger = require("lazy-format-logger");

export module DataService {

    let Log: lazyFormatLogger.Logger = new lazyFormatLogger.Logger();


    /**
     * @classdesc Data source server use to CREATE, READ, UPDATE and DELETE, {@link DataModel.User} and {@link DataModel.Profile} instances.
     */
    export class LazyDataServer implements UacDBA {

        /**
         * In order to restrict log to a specific level the variable {@link Log}
         * is reset and the level is propagated to {@link DataModel} and {@link LazyBoy} classes.
         * @param level {@link LogLevel}
         */
        public static setLevel(level: lazyFormatLogger.LogLevel): void {
            Log = new lazyFormatLogger.Logger(level);
            DataModel.Utils.setLevel(level);
            lazyboyjs.LazyBoy.setLevel(level);
        }

        private LazyBoy: lazyboyjs.LazyBoy;
        private Options: LazyDataSourceConfig;

        public isReady: boolean = false;

        /**
         * @param options {@link LazyDataSourceConfig}
         */
        constructor(options?: LazyDataSourceConfig) {
            this.Options = options;
            this._validateOptions();
            this.LazyBoy = this.Options.LazyBoy;
            if (!this.LazyBoy) {
                this.LazyBoy = new lazyboyjs.LazyBoy(this.Options.LazyBoyOptions);
            }else{
                this.Options.LazyBoyOptions = this.LazyBoy.options;
            }
        }

        /**
         * By calling the Connect function, two databases will be added to the {@link LazyBoy} instance and initialized.
         * Since the LazyBoy instance can be external we may have more than 2 database.
         * So using array filtering we select the databases than contains the name of "credential_db"  and "profile_db"
         * @param callback {function(error: DataSourceException, result: lazyboyjs.ReportInitialization): void}
         */
        public Connect(callback: Callback): void {
            let instance = this;
            this.LazyBoy.Databases(this.Options.credential_db, this.Options.profile_db);
            this.LazyBoy.InitializeAllDatabases((error: Error, report: lazyboyjs.ReportInitialization): void => {
                if (error) {
                    Log.c("LazyDataServer", "Connect", "InitializeAllDatabases", error);
                    throw error;
                } else {
                    instance.isReady = true;
                }
                if (report.success.length == 2 && report.success.filter((l): boolean=> {
                        let valid = lazyboyjs.DbCreateStatus.UpToDate | lazyboyjs.DbCreateStatus.Created;
                        return (l.name.indexOf(this.Options.credential_db) > 0 || l.name.indexOf(this.Options.profile_db) > 0) && !!(l.status & valid);
                    })) {
                    this.LazyBoy.Connect();
                    Log.i("LazyDataServer", "Connect", "LazyBoyConnect called");
                    callback(null, report);
                } else {
                    callback(new DataSourceException("Databases were not generated properly"), report);
                }
            });
        }

        /**
         * Given an userId, if a match is found a {@link DataModel.User} instance will be return.
         * @param userId {string}
         * @param callback {function(user: DataModel.User): void}
         */
        public GetUserByUserId(userId: string, callback: (user: DataModel.User)=>void): void {
            this._getEntryByUserId(userId, (entry: lazyboyjs.LazyInstance): void=> {
                if (entry) {
                    callback(new DataModel.User(entry));
                } else {
                    callback(null);
                }
            });
        }

        /**
         *
         * @param username
         * @param callback {function(user: DataModel.User): void}
         */
        public GetUserByUserName(username: string, callback: (user: DataModel.User)=>void): void {
            this._getEntryByUserName(username, (entry: lazyboyjs.LazyInstance): void => {
                if (entry) {
                    callback(new DataModel.User(entry));
                } else {
                    callback(null);
                }
            });
        }

        /**
         *
         * @param user {DataModel.User}
         * @param callback {function(success: boolean): void}
         */
        public InsertUser(user: DataModel.User, callback: (success: boolean) => void): void {
            this._userExist(user, (exist: boolean): void => {
                if (!exist) {
                    this._addUserEntry(user, "user", callback);
                } else {
                    callback(false);
                }
            });
        }

        /**
         *
         * @param user {DataModel.User}
         * @param callback {function(success: boolean): void}
         */
        public UpdateUser(user: DataModel.User, callback: (success: boolean) => void): void {
            this._getUserEntry(user, (entry: lazyboyjs.LazyInstance): void => {
                if (entry) {
                    entry.instance = user;
                    this._updateUserEntry(entry, callback);
                } else {
                    callback(false);
                }
            });
        }

        /**
         * Given the userId the {@link lazyboyjs.LazyInstance} will be flag as deleted.
         * @param userId {string}
         * @param callback {function(success: boolean): void}
         */
        public DeleteUser(userId: string, callback: (success: boolean) => void): void {
            this._getEntryByUserId(userId, (entry: lazyboyjs.LazyInstance): void => {
                if (entry) {
                    this.LazyBoy.DeleteEntry(this.Options.credential_db, entry,
                        (error: Error, deleted: boolean): void => {
                            if (error) {
                                Log.c("LazyDataServer", "DeleteUser", "LazyBoy.DeleteEntry", error);
                                throw error;
                            }
                            Log.d("LazyDataServer", "DeleteUser", "LazyBoy.DeleteEntry", deleted);
                            callback(deleted);
                        }, false);
                } else {
                    callback(false);
                }
            });
        }

        /**
         * Validation of the {@link Options} object, the defaults value will be enforce is they are not present
         * inside the object.
         * @private
         */
        private _validateOptions(): void {
            if (!this.Options) {
                this.Options = { };
            }
            if(!this.Options.credential_db){
                this.Options.credential_db = "auth";
            }
            if(!this.Options.profile_db){
                this.Options.profile_db = "profile";
            }
            if (!this.Options.LazyBoyOptions) {
                this.Options.LazyBoyOptions = {
                    prefix: "uac",
                    autoConnect: true,
                    views: {}
                };
            } else {
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
        private _injectLazyUacViews(): void {
            if (!this.Options.LazyBoyOptions.views) {
                this.Options.LazyBoyOptions.views = {};
            }
            this.Options.LazyBoyOptions.views[this.Options.LazyBoyOptions.prefix + "_" + this.Options.credential_db] = userViews;
            this.Options.LazyBoyOptions.views[this.Options.LazyBoyOptions.prefix + "_" + this.Options.profile_db] = profileViews;
        }

        /**
         * Shorter to search entry by UserId or UserName if one of those properties exist in the {@code user}
         * @param user {@link DataModel.User}
         * @param callback {function(exist:boolean)}
         * @throw {@link DataSourceException}
         */
        private _userExist(user: DataModel.User, callback: (exist: boolean) => void): void {
            if (user) {
                if (user.Id) {
                    this._getEntryByUserId(user.Id, (entry: lazyboyjs.LazyInstance): void => {
                        if (user.Email) {
                            this._getEntryByUserName(user.Email, (entry: lazyboyjs.LazyInstance): void => {
                                callback(entry != null && !entry.isDeleted);
                            });
                        } else {
                            callback(entry != null && !entry.isDeleted);
                        }
                    });
                } else if (user.Email) {
                    this._getEntryByUserName(user.Email, (entry: lazyboyjs.LazyInstance): void => {
                        callback(entry != null && !entry.isDeleted);
                    });
                } else {
                    let error = new DataSourceException("invalid data");
                    Log.c("LazyDataServer", "userExist", error);
                    throw error;
                }
            } else {
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
        private _getUserEntry(user: DataModel.User, callback: (entry: lazyboyjs.LazyInstance) => void): void {
            if (user) {
                if (user.Id && user.Id.length > 0) {
                    this._getEntryByUserId(user.Id, (entry: lazyboyjs.LazyInstance): void => {
                        callback(entry.isDeleted ? null : entry);
                    });
                } else if (user.Email && user.Email.length > 0) {
                    this._getEntryByUserName(user.Email, (entry: lazyboyjs.LazyInstance): void => {
                        callback(entry.isDeleted ? null : entry);
                    });
                } else {
                    let error = new DataSourceException("invalid data");
                    Log.c("LazyDataServer", "userExist", error);
                    throw error;
                }
            } else {
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
        private _addUserEntry(data: any, type: string, callback: (success: boolean)=>void) {
            let entry = lazyboyjs.LazyBoy.NewEntry(data, type);
            this.LazyBoy.AddEntry(this.Options.credential_db, entry, (error: Error, code: lazyboyjs.InstanceCreateStatus, entry: lazyboyjs.LazyInstance): void => {
                if (error) {
                    Log.c("LazyDataServer", "addUserEntry", "LazyBoy.AddEntry", error, code);
                    throw error;
                }
                Log.d("LazyDataServer", "addUserEntry", "LazyBoy.AddEntry", entry);
                switch (code) {
                    case lazyboyjs.InstanceCreateStatus.Created:
                        Log.d("LazyDataServer", "addUserEntry", "LazyBoy.AddEntry", "Instance Created");
                        callback(true);
                        break;
                    case lazyboyjs.InstanceCreateStatus.Conflict:
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
        private _getEntryByUserId(userId: string, callback: (entry: lazyboyjs.LazyInstance)=>void): void {
            this.LazyBoy.GetViewResult(
                this.Options.credential_db,
                "entryByUserId",
                {key: userId, reduce: false},
                (error: Error, result: any): void => {
                    if (error) {
                        Log.c("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", error);
                        throw error;
                    }
                    if (result.length == 0) {
                        // throw new DataSourceException("no user found", UserCodeException.NOT_FOUND);
                        Log.d("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", "no entry found");
                        return callback(null);
                    } else if (result.length > 1) {
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
        private _getEntryByUserName(username: string, callback: (entry: lazyboyjs.LazyInstance)=>void): void {
            this.LazyBoy.GetViewResult(
                this.Options.credential_db,
                "entryByEmail",
                {key: username, reduce: false},
                (error: Error, result: any): void => {
                    if (error) {
                        Log.c("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", error);
                        throw error;
                    }
                    if (result.length == 0) {
                        // throw new DataSourceException("no user found", UserCodeException.NOT_FOUND);
                        Log.d("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", "no user found");
                        return callback(null);
                    } else if (result.length > 1) {
                        //throw new DataSourceException("more than one user was found", UserCodeException.DUPLICATE_FOUND);
                        Log.d("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", "more than one user was found");
                        return callback(null);
                    }
                    Log.d("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", "one user was found");
                    callback(result[0].value);
                });
        }

        /**
         * Shorter to execute {@link LazyDataServer.UpdateEntry} on the "credential_db".
         * @param entry {lazyboyjs.LazyInstance}
         * @param callback {function(updated: boolean):void}
         * @private
         */
        private _updateUserEntry(entry: lazyboyjs.LazyInstance, callback: (updated: boolean)=>void): void {
            this.LazyBoy.UpdateEntry(
                this.Options.credential_db,
                entry,
                (error: any, updated: boolean, updatedEntry: lazyboyjs.LazyInstance): void => {
                    if (error) {
                        Log.c("LazyDataServer", "updateUserEntry", "LazyBoy.UpdateEntry", error);
                        throw error;
                    }
                    Log.d("LazyDataServer", "updateUserEntry", "LazyBoy.UpdateEntry", updated, updatedEntry);
                    callback(updated);
                });
        }
    }


    let userByEmail: lazyboyjs.LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Email') && !doc.isDeleted){ emit(doc.instance.Email, doc.instance ); }}",
        reduce: "_count()"
    };
    let userByUserId: lazyboyjs.LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Id') && !doc.isDeleted) { emit(doc.instance.Id, doc.instance); } }",
        reduce: "_count()"
    };
    let entryByEmail: lazyboyjs.LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Email') && !doc.isDeleted){ emit(doc.instance.Email, doc); }}",
        reduce: "_count()"
    };
    let entryByUserId: lazyboyjs.LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Id') && !doc.isDeleted) { emit(doc.instance.Id, doc); } }",
        reduce: "_count()"
    };
    let deletedTypeEntry: lazyboyjs.LazyView = {
        map: "function(doc){ if(doc.isDeleted) { emit(doc.type, doc); } }",
        reduce: "_count()"
    };
    let userViews: lazyboyjs.LazyDesignViews = {
        version: 1,
        type: 'javascript',
        views: {
            'userByUserId': userByUserId,
            'userByEmail': userByEmail,
            'entryByUserId': entryByUserId,
            'entryByEmail': entryByEmail,
            'deletedTypeEntry': deletedTypeEntry
        }
    };
    let profileByUserId: lazyboyjs.LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('UserId') && !doc.isDeleted){ emit(doc.instance.UserId, doc.instance); }}",
        reduce: "_count()"
    };
    let profileViews: lazyboyjs.LazyDesignViews = {
        version: 1,
        type: 'javascript',
        views: {
            'profileByUserId': profileByUserId,
        }
    };

    export enum UserCodeException {
        NOT_FOUND = 1,
        ALREADY_EXIST = 1 << 1,
        DUPLICATE_FOUND = 1 << 2
    }

    export class DataSourceException extends Error {
        private code: UserCodeException;

        constructor(public message: string, code?: UserCodeException) {
            super(message);
            this.code = code;
        }
    }

    export interface Callback {
        (error: DataSourceException, result: any|{}): void;
    }

    export interface LazyDataSourceConfig {
        credential_db?: string,
        profile_db?: string,
        LazyBoy?: lazyboyjs.LazyBoy,
        LazyBoyOptions?: lazyboyjs.LazyOptions
    }

    /**
     *
     * @classdesc Interface representing the requirements for a valid DataSource Object.
     */
    export interface UacDBA {
        isReady: boolean;
        Connect(callback: Callback): void;
        GetUserByUserId(userId: string, callback: (user: DataModel.User) => void): void;
        GetUserByUserName(username: string, callback: (user: DataModel.User) => void): void;
        InsertUser(user: DataModel.User, callback: (success: boolean) => void): void;
        UpdateUser(user: DataModel.User, callback: (success: boolean) => void): void;
        DeleteUser(userId: string, callback: (success: boolean) => void): void;
    }

}