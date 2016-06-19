/// <reference path="../../../typings/index.d.ts" />
import { lazyboyjs } from "lazyboyjs";
import { DataModel } from "../model/models";
import User = DataModel.User;
export declare module DataService {
    class DataSourceException extends Error {
        message: string;
        constructor(message: string);
    }
    interface Callback {
        (error: DataSourceException, result: any): void;
    }
    interface LazyDataSourceConfig {
        credential_db: string;
        profile_db: string;
        LazyBoyOptions?: lazyboyjs.LazyOptions;
    }
    interface UacDBA {
        UserExistAsync(userId: string, callback: Callback): void;
        GetUserAsync(user: User, callback: Callback): void;
        GetUserByUserIdAsync(userId: string, callback: Callback): void;
        GetUserByUsernameAsync(username: string, callback: Callback): void;
        InsertUserAsync(user: User, callback: Callback): void;
        UpdateUserAsync(user: User, callback: Callback): void;
        DeleteUserAsync(userId: string, callback: Callback): void;
    }
    class LazyDataServer implements UacDBA {
        private LazyBoy;
        private Options;
        constructor(options?: LazyDataSourceConfig);
        private _validateOptions();
        private _injectLazyViews();
        UserExistAsync(userId: string, callback: DataService.Callback): void;
        GetUserAsync(user: User, callback: DataService.Callback): void;
        GetUserByUserIdAsync(userId: string, callback: DataService.Callback): void;
        GetUserByUsernameAsync(username: string, callback: DataService.Callback): void;
        InsertUserAsync(user: User, callback: DataService.Callback): void;
        UpdateUserAsync(user: User, callback: DataService.Callback): void;
        DeleteUserAsync(userId: string, callback: DataService.Callback): void;
    }
}
