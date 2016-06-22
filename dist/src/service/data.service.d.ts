/// <reference path="../../../typings/index.d.ts" />
import { lazyboyjs } from "lazyboyjs";
import { DataModel } from "../model/models";
export declare module DataService {
    class LazyDataServer implements UacDBA {
        private LazyBoy;
        private Options;
        private _onDatabasesInitialized;
        isReady: boolean;
        private _connectCallback;
        constructor(options?: LazyDataSourceConfig);
        Connect(callback: Callback): void;
        private _validateOptions();
        private _injectLazyUacViews();
        UserExistAsync(email: string, callback: DataService.Callback): void;
        GetUserAsync(user: DataModel.User, callback: DataService.Callback): void;
        GetUserByUserIdAsync(userId: string, callback: DataService.Callback): void;
        GetUserByUsernameAsync(username: string, callback: DataService.Callback): void;
        InsertUserAsync(user: DataModel.User, callback: DataService.Callback): void;
        UpdateUserAsync(user: DataModel.User, callback: DataService.Callback): void;
        DeleteUserAsync(userId: string, callback: DataService.Callback): void;
    }
    class DataSourceException extends Error {
        message: string;
        constructor(message: string);
    }
    interface Callback {
        (error: DataSourceException, result: any | {}): void;
    }
    interface LazyDataSourceConfig {
        credential_db: string;
        profile_db: string;
        LazyBoyOptions?: lazyboyjs.LazyOptions;
    }
    interface UacDBA {
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
