import { lazyboyjs } from "lazyboyjs";
import { DataModel } from "../model/models";
import lazyFormatLogger = require("lazy-format-logger");
export declare module DataService {
    class LazyDataServerBase {
        /**
         * In order to restrict log to a specific level the variable {@link Log}
         * is reset and the level is propagated to {@link DataModel} and {@link LazyBoy} classes.
         * @param level {@link LogLevel}
         */
        static setLevel(level: lazyFormatLogger.LogLevel): void;
        protected Options: LazyDataSourceConfig;
        constructor(options?: LazyDataSourceConfig);
        /**
         * Validation of the {@link Options} object, the defaults value will be enforce is they are not present
         * inside the object.
         * @protected
         */
        protected _validateOptions(): void;
        /**
         * Enforce the default require {@link lazyboyjs.LazyDesignViews} for {@link LazyUAC}.
         * @private
         */
        private _injectLazyUacViews();
    }
    /**
     * @classdesc Data source server use to CREATE, READ, UPDATE and DELETE, {@link DataModel.User} and {@link DataModel.Profile} instances.
     */
    class LazyDataServer extends LazyDataServerBase implements UacDBA {
        protected LazyBoy: lazyboyjs.LazyBoy;
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
        GetAllUsers(callback: (list: DataModel.User[]) => void): void;
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
    /**
     * @classdesc Data source using Async/Await to ensure the use of {@link Promise} toward the library.
     */
    class LazyDataServerAsync extends LazyDataServerBase implements UacDdaAsync {
        private LazyBoyAsync;
        /**
         * @param options {@link LazyDataSourceConfig}
         */
        constructor(options?: LazyDataSourceConfig);
        /**
         * In order to establish connection with all the require databases, this method should be call before
         * any data manipulation.
         * @return {Promise<{error: DataSourceException, result: any}>}
         */
        ConnectAsync(): Promise<{
            error: DataSourceException;
            result: any;
        }>;
        /**
         * Given an userId, if a match is found a {@link DataModel.User} instance will be return.
         * @param userId {string}
         * @return {Promise<DataModel.User>}
         */
        GetUserByUserIdAsync(userId: string): Promise<DataModel.User>;
        /**
         * Async shorter to retrieve a {@link DataModel.User} instance from the {@link lazyboyjs.LazyInstance}
         * from the {@link LazyBoyAsync}
         * @param username
         * @return {Promise<DataModel.User>}
         */
        GetUserByUserNameAsync(username: string): Promise<DataModel.User>;
        /**
         * Async shorter to insert a {@link DataModel.User} instance into the database.
         * @param user {DataModel.User}
         * @return {Promise<{added:boolean, user: DataModel.User}>}
         */
        InsertUserAsync(user: DataModel.User): Promise<{
            added: boolean;
            user: DataModel.User;
        }>;
        /**
         * Async shorter to update User {@link DataModel.User} instance in the deb
         * @param user {DataModel.User}
         * @return {Promise<{updated:boolean, user:DataModel.User}>}
         */
        UpdateUserAsync(user: DataModel.User): Promise<{
            updated: boolean;
            user: DataModel.User;
        }>;
        /**
         * Given the userId the {@link lazyboyjs.LazyInstance} will be flag as deleted.
         * @param userId {string}
         * @return {Promise<boolean>}
         */
        DeleteUserAsync(userId: string): Promise<boolean>;
        /**
         * Async shorter
         * @return {Promise<DataModel.User[]>}
         * @constructor
         */
        GetAllUsersAsync(): Promise<DataModel.User[]>;
        /**
         * Shorter to search entry by UserId or UserName if one of those properties exist in the {@code user}
         * @param user {@link DataModel.User}
         * @throw {@link DataSourceException}
         * @return {Promise<boolean>}
         * @private
         */
        private _userExistAsync(user);
        /**
         * Shorter to retrieve the entry {@link lazyboyjs.LazyInstance} from the database using either the
         * UserId or the UserName property of the parameter {@code user}
         * @param user {DataModel.User}
         * @return {Promise<lazyboyjs.LazyInstance>}
         * @private
         */
        private _getUserEntryAsync(user);
        /**
         * Shorter to execute {@link AddEntry} on "credential_db". All conflict, update or delete
         * should be managed here.
         * @param data {object}
         * @return {Promise<{success: boolean, entry: lazyboyjs.LazyInstance}>}
         * @private
         */
        private _addUserEntryAsync(data);
        /**
         * Shorter to select an {@link DataModel.User} instance given an userId.
         * This function execute {@link GetViewResult} using the following parameters :
         * <pre>
         *      Options.credential_db, "entryByUserId", {key: userId, reduce: false},
         * </pre>
         * @param userId {string}
         * @return {Promise<lazyboyjs.LazyInstance>}
         * @private
         */
        private _getEntryByUserIdAsync(userId);
        /**
         * Shorter to select an {@link DataModel.User} instance given an username.
         * This function execute {@link GetViewResult} using the following parameters :
         * <pre>
         *      Options.credential_db, "entryByEmail", {key: username, reduce: false},
         * </pre>
         * @param username {string}
         * @return {Promise<lazyboyjs.LazyInstance>}
         * @private
         */
        private _getEntryByUserNameAsync(username);
        /**
         * Shorter to execute {@link LazyDataServer.UpdateEntry} on the "credential_db".
         * @param entry {lazyboyjs.LazyInstance}
         * @return {Promise<{error: Error, updated: boolean, data: lazyboyjs.LazyInstance}>}
         * @private
         */
        private _updateUserEntryAsync(entry);
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
        credential_db?: string;
        profile_db?: string;
        LazyBoy?: lazyboyjs.LazyBoy;
        LazyBoyAsync?: lazyboyjs.LazyBoyAsync;
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
        GetAllUsers(callback: (list: DataModel.User[]) => void): void;
    }
    interface UacDdaAsync {
        ConnectAsync(): Promise<{
            error: DataSourceException;
            result: any;
        }>;
        GetUserByUserIdAsync(userId: string): Promise<DataModel.User>;
        GetUserByUserNameAsync(username: string): Promise<DataModel.User>;
        InsertUserAsync(user: DataModel.User): Promise<{
            added: boolean;
            user: DataModel.User;
        }>;
        UpdateUserAsync(user: DataModel.User): Promise<{
            updated: boolean;
            user: DataModel.User;
        }>;
        DeleteUserAsync(userId: string): Promise<boolean>;
        GetAllUsersAsync(): Promise<DataModel.User[]>;
    }
}
