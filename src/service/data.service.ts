/// <reference path="../../typings/index.d.ts"/>

import {lazyboyjs} from  "lazyboyjs";

import {DataModel} from "../model/models";

export module DataService {

    export class LazyDataServer implements UacDBA {

        private LazyBoy: lazyboyjs.LazyBoy;
        private Options: LazyDataSourceConfig;
        private _onDatabasesInitialized: lazyboyjs.DbInitializeAllCallback;

        public isReady: boolean = false;
        private _connectCallback: Callback;

        constructor(options?: LazyDataSourceConfig) {
            this.Options = options;
            this._validateOptions();
            this.LazyBoy = new lazyboyjs.LazyBoy(this.Options.LazyBoyOptions);
        }

        public Connect(callback: Callback): void {
            this._connectCallback = callback;
            this.LazyBoy
                .Databases(this.Options.credential_db, this.Options.profile_db)
                .InitializeAllDatabases(this._onDatabasesInitialized);
        }

        private _validateOptions(): void {
            let instance = this;
            this._onDatabasesInitialized = (error: Error, report: lazyboyjs.ReportInitialization): void => {
                if (error) {
                    console.error("ERROR", new Date(), JSON.stringify(error), error);
                    throw error;
                } else {
                    instance.isReady = true;
                }
                if (report.success.length == 2 && report.success.filter((l): boolean=> {
                        let valid = lazyboyjs.DbCreateStatus.UpToDate | lazyboyjs.DbCreateStatus.Created;
                        return !!(l.status & valid);
                    })) {
                    this.LazyBoy.Connect();
                    this._connectCallback(null, report);
                } else {
                    this._connectCallback(new DataSourceException("Databases were not generated properly", UserCodeException.NOT_FOUND), report);
                }
            };
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

        public UserExistAsync(email: string, callback: DataService.Callback): void {
            this.GetUserByUsernameAsync(email, (error: DataService.DataSourceException, data: any): void => {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    if (error.code) {
                        switch (error.code) {
                            case DataService.UserCodeException.NOT_FOUND:
                                break;
                            case DataService.UserCodeException.ALREADY_EXIST:
                                break;
                            case DataService.UserCodeException.DUPLICATE_FOUND:
                                break;
                            default:
                                throw error;
                        }
                    } else {
                        throw error;
                    }
                } else {
                    console.log(data);
                    callback(null, data.length > 0);
                }
            });
        }

        public GetUserAsync(user: DataModel.User, callback: DataService.Callback): void {
        }

        public GetUserByUserIdAsync(userId: string, callback: DataService.Callback): void {
            this.LazyBoy.GetViewResult(
                this.Options.credential_db,
                "userByUserId",
                {key: userId, reduce: false},
                (error: Error, result: any): void => {
                    if (error) {
                        console.error("ERROR", new Date(), error);
                        throw error;
                    }
                    console.log("DEBUG", new Date(), JSON.stringify(result));
                    callback(null, result);
                });
        }

        public GetUserByUsernameAsync(username: string,
                                      callback: (error: DataService.DataSourceException,
                                                 user: DataModel.User)=>void): void {
            this.LazyBoy.GetViewResult(
                this.Options.credential_db,
                "userByEmail",
                {key: username, reduce: false},
                (error: Error, result: any): void => {
                    if (error) {
                        console.error("ERROR", new Date(), error);
                        throw error;
                    }
                    if (result.length == 0) {
                        return callback(
                            new DataSourceException("no user found", UserCodeException.NOT_FOUND),
                            null);
                    } else if (result.length > 1) {
                        return callback(
                            new DataSourceException("more than one user was found", UserCodeException.DUPLICATE_FOUND),
                            null);
                    }
                    let v = result[0].value;
                    let u = new DataModel.User();
                    let keys = Object.keys(v);
                    for (var i = 0; i < keys.length; i++) {
                        let p = keys[i];
                        u[p] = v[p];
                    }
                    callback(null, u);
                });
        }

        public InsertUserAsync(user: DataModel.User, callback: DataService.Callback): void {
            this.UserExistAsync(user.Email, (error: Error, result: boolean): void => {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                if (!result) {
                    let entry = lazyboyjs.LazyBoy.NewEntry(user, "user");
                    this.LazyBoy.AddEntry(
                        this.Options.credential_db,
                        entry,
                        (error: Error, code: lazyboyjs.InstanceCreateStatus, entry: lazyboyjs.LazyInstance): void => {
                            if (error) {
                                console.error("ERROR", new Date(), error, code);
                                throw error;
                            }
                            console.log("DEBUG", new Date(), entry);
                            switch (code) {
                                case lazyboyjs.InstanceCreateStatus.Created:
                                    console.log("INFO", new Date(), "Instance Created");
                                    break;
                                case lazyboyjs.InstanceCreateStatus.Conflict:
                                    console.log("INFO", new Date(), "Instance Conflict");
                                    break;
                                default:
                                    console.log("INFO", new Date(), "code", code);
                                    break;
                            }
                        });
                    callback(null, result);
                } else {
                    callback(new DataSourceException("user already exist", UserCodeException.ALREADY_EXIST), null);
                }
            });
        }

        public UpdateUserAsync(user: DataModel.User, callback: DataService.Callback): void {
        }

        public DeleteUserAsync(userId: string, callback: DataService.Callback): void {
        }
    }


    let userByEmail: lazyboyjs.LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Email')){ emit(doc.instance.Email, doc.instance ); }}",
        reduce: "_count()"
    };
    let userByUserId: lazyboyjs.LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Id')) { emit(doc.instance.Id, doc.instance); } }",
        reduce: "_count()"
    };
    let userViews: lazyboyjs.LazyDesignViews = {
        version: 1,
        type: 'javascript',
        views: {
            'userByUserId': userByUserId,
            'userByEmail': userByEmail,
        }
    };
    let profileByUserId: lazyboyjs.LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('UserId')){ emit(doc.instance.UserId, doc.instance); }}",
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
        NOT_FOUND = 0,
        ALREADY_EXIST = 1,
        DUPLICATE_FOUND = 2
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
        Connect(callback: Callback): void;
        isReady: boolean;
        UserExistAsync(email: string, callback: Callback): void;
        GetUserAsync(user: DataModel.User, callback: Callback): void;
        GetUserByUserIdAsync(userId: string, callback: Callback): void;
        GetUserByUsernameAsync(username: string, callback: Callback): void;
        InsertUserAsync(user: DataModel.User, callback: Callback): void;
        UpdateUserAsync(user: DataModel.User, callback: Callback): void;
        DeleteUserAsync(userId: string, callback: Callback): void;
    }

}