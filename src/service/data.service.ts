/// <reference path="../../typings/index.d.ts"/>

import {lazyboyjs} from  "lazyboyjs";
import LazyBoy = lazyboyjs.LazyBoy;
import LazyDesignViews = lazyboyjs.LazyDesignViews;
import LazyView = lazyboyjs.LazyView;
import LazyOptions = lazyboyjs.LazyOptions;
import DbInitializeAllCallback = lazyboyjs.DbInitializeAllCallback;
import ReportInitialization = lazyboyjs.ReportInitialization;

import {DataModel} from "../model/models";
import User = DataModel.User;
import Role = DataModel.Role;

export module DataService {

    export class LazyDataServer implements UacDBA {

        private LazyBoy: LazyBoy;
        private Options: LazyDataSourceConfig;
        private _onDatabasesInitialized: DbInitializeAllCallback;

        public isReady: boolean = false;

        constructor(options?: LazyDataSourceConfig) {
            this.Options = options;
            this._validateOptions();
            this.LazyBoy = new LazyBoy(this.Options.LazyBoyOptions);
            this.LazyBoy
                .Databases(this.Options.credential_db, this.Options.profile_db)
                .InitializeAllDatabases(this._onDatabasesInitialized);
        }

        private _validateOptions(): void {
            let instance = this;
            this._onDatabasesInitialized = (error: Error, report: ReportInitialization): void => {
                if (error) {
                    return console.error("ERROR", new Date(), JSON.stringify(error), error);
                }else{
                    instance.isReady = true;
                }
                console.log(report);
                this.LazyBoy.Connect();
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

        public UserExistAsync(userId: string, callback: DataService.Callback): void {
        }

        public GetUserAsync(user: User, callback: DataService.Callback): void {
        }

        public GetUserByUserIdAsync(userId: string, callback: DataService.Callback): void {
        }

        public GetUserByUsernameAsync(username: string, callback: DataService.Callback): void {
        }

        public InsertUserAsync(user: User, callback: DataService.Callback): void {
        }

        public UpdateUserAsync(user: User, callback: DataService.Callback): void {
        }

        public DeleteUserAsync(userId: string, callback: DataService.Callback): void {
        }
    }


    let userByEmail: LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Email')){ emit(doc.instance.Email, doc.instance ); }}",
        reduce: "_count()"
    };
    let userByUserId: LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Id')) { emit(doc.instance.Id, doc.instance); } }",
        reduce: "_count()"
    };
    let userViews: LazyDesignViews = {
        version: 1,
        type: 'javascript',
        views: {
            'userByUserId': userByUserId,
            'userByEmail': userByEmail,
        }
    };
    let profileByUserId: LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('UserId')){ emit(doc.instance.UserId, doc.instance); }}",
        reduce: "_count()"
    };
    let profileViews: LazyDesignViews = {
        version: 1,
        type: 'javascript',
        views: {
            'profileByUserId': profileByUserId,
        }
    };

    export class DataSourceException extends Error {
        constructor(public message: string) {
            super(message);
        }
    }

    export interface Callback {
        (error: DataSourceException, result: any|{}): void;
    }

    export interface LazyDataSourceConfig {
        credential_db: string,
        profile_db: string,
        LazyBoyOptions?: LazyOptions
    }

    export interface UacDBA {
        isReady: boolean;
        UserExistAsync(userId: string, callback: Callback): void;
        GetUserAsync(user: User, callback: Callback): void;
        GetUserByUserIdAsync(userId: string, callback: Callback): void;
        GetUserByUsernameAsync(username: string, callback: Callback): void;
        InsertUserAsync(user: User, callback: Callback): void;
        UpdateUserAsync(user: User, callback: Callback): void;
        DeleteUserAsync(userId: string, callback: Callback): void;
    }

}