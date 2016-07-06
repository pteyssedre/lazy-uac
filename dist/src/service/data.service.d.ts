import { lazyboyjs } from "lazyboyjs";
import { DataModel } from "../model/models";
import lazyFormatLogger = require("lazy-format-logger");
export declare module DataService {
    /**
     * @classdesc Data source server use to CREATE, READ, UPDATE and DELETE, {@link DataModel.User} and {@link DataModel.Profile} instances.
     */
    class LazyDataServer implements UacDBA {
        /**
         * In order to restrict log to a specific level the variable {@link Log}
         * is reset and the level is propagated to {@link DataModel} and {@link LazyBoy} classes.
         * @param level {@link LogLevel}
         */
        static setLevel(level: lazyFormatLogger.LogLevel): void;
        private LazyBoy;
        private Options;
        isReady: boolean;
        /**
         * @param options {@link LazyDataSourceConfig}
         */
        constructor(options?: LazyDataSourceConfig);
        /**
         * By calling the Connect function, two databases will be added to the {@link LazyBoy} instance and initialized.
         * Since the LazyBoy instance can be external we may have more than 2 database.
         * So using array filtering we select the databases than contains the name of "credential_db"  and "profile_db"
         * @param callback {function(error: DataSourceException, result: lazyboyjs.ReportInitialization): void}
         */
        Connect(callback: Callback): void;
        /**
         * Given an userId, if a match is found a {@link DataModel.User} instance will be return.
         * @param userId {string}
         * @param callback {function(user: DataModel.User): void}
         */
        GetUserByUserId(userId: string, callback: (user: DataModel.User) => void): void;
        /**
         *
         * @param username
         * @param callback {function(user: DataModel.User): void}
         */
        GetUserByUserName(username: string, callback: (user: DataModel.User) => void): void;
        /**
         *
         * @param user {DataModel.User}
         * @param callback {function(success: boolean): void}
         */
        InsertUser(user: DataModel.User, callback: (success: boolean) => void): void;
        /**
         *
         * @param user {DataModel.User}
         * @param callback {function(success: boolean): void}
         */
        UpdateUser(user: DataModel.User, callback: (success: boolean) => void): void;
        /**
         * Given the userId the {@link lazyboyjs.LazyInstance} will be flag as deleted.
         * @param userId {string}
         * @param callback {function(success: boolean): void}
         */
        DeleteUser(userId: string, callback: (success: boolean) => void): void;
        /**
         * Validation of the {@link Options} object, the defaults value will be enforce is they are not present
         * inside the object.
         * @private
         */
        private _validateOptions();
        /**
         * Enforce the default require {@link lazyboyjs.LazyDesignViews} for {@link LazyUAC}.
         * @private
         */
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
        /**
         * Shorter to execute {@link AddEntry} on "credential_db". All conflict, update or delete
         * should be managed here.
         * @param data {object}
         * @param type {string}
         * @param callback {function(success: boolean):void}
         * @private
         */
        private _addUserEntry(data, type, callback);
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
        private _getEntryByUserId(userId, callback);
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
        private _getEntryByUserName(username, callback);
        /**
         * Shorter to execute {@link LazyDataServer.UpdateEntry} on the "credential_db".
         * @param entry {lazyboyjs.LazyInstance}
         * @param callback {function(updated: boolean):void}
         * @private
         */
        private _updateUserEntry(entry, callback);
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
        LazyBoy?: lazyboyjs.LazyBoy;
        LazyBoyOptions?: lazyboyjs.LazyOptions;
    }
    /**
     *
     * @classdesc Interface representing the requirements for a valid DataSource Object.
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
