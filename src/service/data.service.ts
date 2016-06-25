/// <reference path="../../typings/index.d.ts"/>

import {lazyboyjs} from  "lazyboyjs";

import {DataModel} from "../model/models";

export module DataService {

    export class LazyDataServer implements UacDBA {

        private LazyBoy: lazyboyjs.LazyBoy;
        private Options: LazyDataSourceConfig;

        public isReady: boolean = false;

        constructor(options?: LazyDataSourceConfig) {
            this.Options = options;
            this._validateOptions();
            this.LazyBoy = new lazyboyjs.LazyBoy(this.Options.LazyBoyOptions);
        }

        public Connect(callback: Callback): void {
            let instance = this;
            this.LazyBoy.Databases(this.Options.credential_db, this.Options.profile_db);
            this.LazyBoy.InitializeAllDatabases((error: Error, report: lazyboyjs.ReportInitialization): void => {
                if (error) {
                    console.error("ERROR", "_validateOptions", new Date(), JSON.stringify(error), error);
                    throw error;
                } else {
                    instance.isReady = true;
                }
                if (report.success.length == 2 && report.success.filter((l): boolean=> {
                        let valid = lazyboyjs.DbCreateStatus.UpToDate | lazyboyjs.DbCreateStatus.Created;
                        return !!(l.status & valid);
                    })) {
                    this.LazyBoy.Connect();
                    console.log("INFO", new Date(), "LazyBoyConnect called");
                    callback(null, report);
                } else {
                    callback(new DataSourceException("Databases were not generated properly", UserCodeException.NOT_FOUND), report);
                }
            });
        }

        private _validateOptions(): void {
            if (!this.Options) {
                this.Options = {
                    credential_db: "auth",
                    profile_db: "profile"
                };
            }
            if (this.Options.LazyBoyOptions) {
                this.Options.LazyBoyOptions.prefix = "uac";
                this.Options.LazyBoyOptions.autoConnect = true;
            } else {
                this.Options.LazyBoyOptions = {prefix: "uac", autoConnect: true, views: {}};
            }
            this._injectLazyUacViews();
        }

        private _injectLazyUacViews(): void {
            this.Options.LazyBoyOptions.views["uac_" + this.Options.credential_db] = userViews;
            this.Options.LazyBoyOptions.views["uac_" + this.Options.profile_db] = profileViews;
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
                    throw new DataSourceException("invalid data");
                }
            } else {
                throw new DataSourceException("invalid data");
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
                    throw new DataSourceException("invalid data");
                }
            } else {
                throw new DataSourceException("invalid data");
            }
        }

        private _addUserEntry(data: any, type: string, callback: (success: boolean)=>void) {
            let entry = lazyboyjs.LazyBoy.NewEntry(data, type);
            this.LazyBoy.AddEntry(this.Options.credential_db, entry, (error: Error, code: lazyboyjs.InstanceCreateStatus, entry: lazyboyjs.LazyInstance): void => {
                if (error) {
                    console.error("ERROR", "InsertUserAsync", new Date(), error, code);
                    throw error;
                }
                console.log("DEBUG", new Date(), JSON.stringify(entry));
                switch (code) {
                    case lazyboyjs.InstanceCreateStatus.Created:
                        console.log("INFO", new Date(), "Instance Created");
                        callback(true);
                        break;
                    case lazyboyjs.InstanceCreateStatus.Conflict:
                        console.log("INFO", new Date(), "Instance Conflict");
                        callback(false);
                        break;
                    default:
                        console.error("ERROR", new Date(), "UNMANAGED code", code);
                        callback(false);
                        break;
                }
            });
        }

        private _getEntryByUserId(userId: string, callback: (entry: lazyboyjs.LazyInstance)=>void): void {
            this.LazyBoy.GetViewResult(
                this.Options.credential_db,
                "entryByUserId",
                {key: userId, reduce: false},
                (error: Error, result: any): void => {
                    if (error) {
                        console.error("ERROR", "_getEntryByUserId", new Date(), error);
                        throw error;
                    }
                    if (result.length == 0) {
                        // throw new DataSourceException("no user found", UserCodeException.NOT_FOUND);
                        return callback(null);
                    } else if (result.length > 1) {
                        //throw new DataSourceException("more than one user was found", UserCodeException.DUPLICATE_FOUND);
                        return callback(null);
                    }
                    callback(result[0].value);
                });
        }

        private _getEntryByUserName(username: string, callback: (entry: lazyboyjs.LazyInstance)=>void): void {
            this.LazyBoy.GetViewResult(
                this.Options.credential_db,
                "entryByEmail",
                {key: username, reduce: false},
                (error: Error, result: any): void => {
                    if (error) {
                        console.error("ERROR", "_getEntryByUserName", new Date(), error);
                        throw error;
                    }
                    if (result.length == 0) {
                        // throw new DataSourceException("no user found", UserCodeException.NOT_FOUND);
                        return callback(null);
                    } else if (result.length > 1) {
                        //throw new DataSourceException("more than one user was found", UserCodeException.DUPLICATE_FOUND);
                        return callback(null);
                    }
                    callback(result[0].value);
                });
        }

        private _updateUserEntry(entry: lazyboyjs.LazyInstance, callback: (updated: boolean)=>void): void {
            this.LazyBoy.UpdateEntry(
                this.Options.credential_db,
                entry,
                (error: any, updated: boolean, updatedEntry: lazyboyjs.LazyInstance): void => {
                    if (error) {
                        console.error("ERROR", new Date(), JSON.stringify(error));
                        throw error;
                    }
                    callback(updated);
                });
        }

        public GetUserByUserId(userId: string, callback: (user: DataModel.User)=>void): void {
            this._getEntryByUserId(userId, (entry: lazyboyjs.LazyInstance): void=> {
                if (entry) {
                    let u = new DataModel.User();
                    let keys = Object.keys(entry);
                    for (var i = 0; i < keys.length; i++) {
                        let p = keys[i];
                        u[p] = entry[p];
                    }
                    callback(u);
                } else {
                    callback(null);
                }
            });
        }

        public GetUserByUserName(username: string, callback: (user: DataModel.User)=>void): void {
            this._getEntryByUserName(username, (entry: lazyboyjs.LazyInstance): void => {
                if (entry) {
                    let u = new DataModel.User();
                    let keys = Object.keys(entry.instance);
                    for (var i = 0; i < keys.length; i++) {
                        let p = keys[i];
                        u[p] = entry.instance[p];
                    }
                    callback(u);
                } else {
                    callback(null);
                }
            });
        }

        public InsertUser(user: DataModel.User, callback: (success: boolean) => void): void {
            this._userExist(user, (exist: boolean): void => {
                if (!exist) {
                    this._addUserEntry(user, "user", callback);
                } else {
                    callback(false);
                }
            });
        }

        public UpdateUser(user: DataModel.User, callback: (success: boolean) => void): void {
            this._getUserEntry(user, (entry: lazyboyjs.LazyInstance): void => {
                if (entry) {
                    this._updateUserEntry(entry, callback);
                } else {
                    callback(false);
                }
            });
        }

        public DeleteUser(userId: string, callback: (success: boolean) => void): void {
            this._getEntryByUserId(userId, (entry: lazyboyjs.LazyInstance): void => {
                if (entry) {
                    this.LazyBoy.DeleteEntry(this.Options.credential_db, entry,
                        (error: Error, deleted: boolean): void => {
                            if (error) {
                                console.error("ERROR", new Date(), JSON.stringify(error));
                                throw error;
                            }
                            callback(deleted);
                        }, false);
                } else {
                    callback(false);
                }
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
        constructor(public message: string, public code?: UserCodeException) {
            super(message);
        }
    }

    export interface Callback {
        (error: DataSourceException, result: any|{}): void;
    }

    export interface LazyDataSourceConfig {
        credential_db: string,
        profile_db: string,
        LazyBoyOptions?: lazyboyjs.LazyOptions
    }

    /**
     * Interface representing the requirements for a valid DataSource Object.
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