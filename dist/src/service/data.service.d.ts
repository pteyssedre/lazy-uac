/// <reference path="../../../typings/index.d.ts" />
import { lazyboyjs } from "lazyboyjs";
import { DataModel } from "../model/models";
import lazyFormatLogger = require("lazy-format-logger");
export declare module DataService {
    class LazyDataServer implements UacDBA {
        static setLevel(level: lazyFormatLogger.LogLevel): void;
        private LazyBoy;
        private Options;
        isReady: boolean;
        constructor(options?: LazyDataSourceConfig);
        Connect(callback: Callback): void;
        private _validateOptions();
        private _injectLazyUacViews();
        /**
         * Shorter to search entry by UserId or UserName if one of those properties exist in the {@code user}
         * @param user {@link DataModel.User}
         * @param callback {function(exist:boolean)}
         * @throw {@link DataSourceException}
         */
        private _userExist(user, callback);
        /**
         * Shorter to retrieve the entry {@link lazyboyjs.LazyInstance} from the database using either the
         * UserId or the UserName property of the parameter {@code user}
         * @param user
         * @param callback {function(entry: lazyboyjs.LazyInstance)}
         * @throw DataSourceException if one of {@link DataModel.User} or {@link DataModel.User#Id} or {@link DataModel.User#Email} is null.
         */
        private _getUserEntry(user, callback);
        private _addUserEntry(data, type, callback);
        private _getEntryByUserId(userId, callback);
        private _getEntryByUserName(username, callback);
        private _updateUserEntry(entry, callback);
        GetUserByUserId(userId: string, callback: (user: DataModel.User) => void): void;
        GetUserByUserName(username: string, callback: (user: DataModel.User) => void): void;
        InsertUser(user: DataModel.User, callback: (success: boolean) => void): void;
        UpdateUser(user: DataModel.User, callback: (success: boolean) => void): void;
        DeleteUser(userId: string, callback: (success: boolean) => void): void;
    }
    enum UserCodeException {
        NOT_FOUND = 1,
        ALREADY_EXIST = 2,
        DUPLICATE_FOUND = 4,
    }
    class DataSourceException extends Error {
        message: string;
        private code;
        constructor(message: string, code?: UserCodeException);
    }
    interface Callback {
        (error: DataSourceException, result: any | {}): void;
    }
    interface LazyDataSourceConfig {
        credential_db: string;
        profile_db: string;
        LazyBoyOptions?: lazyboyjs.LazyOptions;
    }
    /**
     * Interface representing the requirements for a valid DataSource Object.
     */
    interface UacDBA {
        isReady: boolean;
        Connect(callback: Callback): void;
        GetUserByUserId(userId: string, callback: (user: DataModel.User) => void): void;
        GetUserByUserName(username: string, callback: (user: DataModel.User) => void): void;
        InsertUser(user: DataModel.User, callback: (success: boolean) => void): void;
        UpdateUser(user: DataModel.User, callback: (success: boolean) => void): void;
        DeleteUser(userId: string, callback: (success: boolean) => void): void;
    }
}
