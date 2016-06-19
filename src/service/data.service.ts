/// <reference path="../../typings/index.d.ts"/>

import {lazyboyjs} from  "lazyboyjs";
import LazyBoy = lazyboyjs.LazyBoy;
import {DataModel} from "../model/models";
import User = DataModel.User;
import Role = DataModel.Role;

export module DataService {

    import LazyDesignViews = lazyboyjs.LazyDesignViews;
    export class DataSourceException extends Error {
        constructor(public message: string) {
            super(message);
        }
    }

    export interface Callback {
        (error: DataSourceException, result: any): void;
    }

    export interface LazyDataSourceConfig {
        credential_db: string,
        profile_db: string,
        LazyBoyOptions?: lazyboyjs.LazyOptions
    }

    export interface UacDBA {
        UserExistAsync(userId: string, callback: Callback): void;
        GetUserAsync(user: User, callback: Callback): void;
        GetUserByUserIdAsync(userId: string, callback: Callback): void;
        GetUserByUsernameAsync(username: string, callback: Callback): void;
        InsertUserAsync(user: User, callback: Callback): void;
        UpdateUserAsync(user: User, callback: Callback): void;
        DeleteUserAsync(userId: string, callback: Callback): void;
    }

    export class LazyDataServer implements UacDBA {

        private LazyBoy: LazyBoy;
        private Options: LazyDataSourceConfig;

        constructor(options?: LazyDataSourceConfig) {
            this.Options = options;
            this._validateOptions();
            this.LazyBoy = new lazyboyjs.LazyBoy(options.LazyBoyOptions);
            //TODO: init lazyboy for data
        }

        private _validateOptions(): void {
            if (!this.Options) {
                this.Options = {
                    credential_db: "auth",
                    profile_db: "profile",
                    LazyBoyOptions: {
                        prefix: "uac"
                    }
                };
            }
            //TODO: validate LazyBoyOptions prefix
            this._injectLazyViews();
        }

        private _injectLazyViews(): void {
            if (this.Options.LazyBoyOptions) {
                var name = "TODO";
                let view: LazyDesignViews = {version: 1, type: "javascript", views: {}};
                view.views["auth"] = {map: "function(doc){emit(doc._id, doc._rev);}", reduce: "_count()"};
                this.Options.LazyBoyOptions.views[name] = view;
            }
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
}