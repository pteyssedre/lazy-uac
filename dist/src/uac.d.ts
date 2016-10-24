import { DataModel } from "./model/models";
import { DataService } from "./service/data.service";
import lazyFormatLogger = require("lazy-format-logger");
export declare module LazyUAC {
    interface UacOptions {
        logLevel?: lazyFormatLogger.LogLevel;
        useAsync?: boolean;
        dataSource?: DataService.UacDBA;
        dataSourceAsync?: DataService.UacDdaAsync;
        dataSourceOptions?: DataService.LazyDataSourceConfig;
    }
    class UserManager {
        options: UacOptions;
        static setLevel(level: lazyFormatLogger.LogLevel): void;
        private _dataSourceAsync;
        private _dataSource;
        constructor(options?: UacOptions);
        /**
         * Starting the Manager to connect and initialized the databases, if needed.
         * @param callback {function(error: Error, result: Object)}
         * @return {LazyUAC.UserManager} current instance.
         */
        StartManager(callback: (error: Error, result: any) => void): this;
        /**
         * Starting the Manager to connect and initialized the databases, if needed.
         * @return {Promise<boolean>}
         * @constructor
         */
        StartManagerAsync(): Promise<boolean>;
        /**
         * In order to add a user to the system, we add VIEWER and USER role to the user.
         * @param user {User}
         * @param callback {function(error:Error, user:User)}
         * @return {LazyUAC.UserManager} current instance.
         */
        AddUser(user: DataModel.User, callback: (user: DataModel.User) => void): this;
        /**
         * Shorter to add user and enforce admin right to it.
         * @param user {@link DataModel.User} user to save as Admin User
         * @param callback {function(user: DataModel.User)} callback when operation is completed.
         * @return {LazyUAC.UserManager}
         */
        AddAdmin(user: DataModel.User, callback: (user: DataModel.User) => void): this;
        /**
         * In order to add a user to the system, we add VIEWER and USER role to the user.
         * @param user {DataModel.User}
         * @return {Promise<DataModel.User>}
         */
        AddUserAsync(user: DataModel.User): Promise<DataModel.User>;
        /**
         * Shorter Async to add user and enforce admin right to it.
         * @param user {DataModel.User} User to insert in the db.
         * @return {Promise<DataModel.User>} resutl of the operation.
         */
        AddAdminAsync(user: DataModel.User): Promise<DataModel.User>;
        /**
         * To produce the access string for an User, the identity of the User as to be validated.
         * @param username {string} email address to retrieve the User inside the db.
         * @param password {string} password in clear to be compare with the one on the user instance
         * @param callback {function(match: boolean, user: DataModel.User)}
         * @return {LazyUAC.UserManager} current instance.
         */
        Authenticate(username: string, password: string, callback: (match: boolean, user: DataModel.User) => void): this;
        /**
         * To produce the access string for an User, the identity of the User as to be validated.
         * @param username {string} email address to retrieve the User inside the db.
         * @param password {string} password in clear to be compare with the one on the user instance
         * @return {Promise<{match: boolean, user: DataModel.User}>}
         */
        AuthenticateAsync(username: string, password: string): Promise<{
            match: boolean;
            user: DataModel.User;
        }>;
        /**
         * To remove an user the {@link lazyboyjs.LazyInstance} will be flag to delete.
         * @param userId {string} unique id of the instance to delete.
         * @param callback {function(delete: boolean)}
         * @return {LazyUAC.UserManager} current instance.
         */
        DeleteUser(userId: string, callback: (deleted: boolean) => void): this;
        /**
         * To remove an user the {@link lazyboyjs.LazyInstance} will be flag to delete.
         * @param userId {string} unique id of the instance to delete.
         * @return {Promise<boolean>}
         */
        DeleteUserAsync(userId: string): Promise<boolean>;
        /**
         * To retrieve user trough database and return the only one match value.
         * @param username {string} user name to search.
         * @param callback {function(user: DataModel#User)}
         * @return {LazyUAC.UserManager} current instance.
         */
        GetUserByUserName(username: string, callback: (user: DataModel.User) => void): this;
        /**
         * To retrieve user trough database and return the only one match value.
         * @param username {string} user name to search.
         * @return {Promise<DataModel.User>}
         */
        GetUserByUserNameAsync(username: string): Promise<DataModel.User>;
        /**
         * To retrieve user trough database and return the only one match value.
         * @param userId {string}
         * @param callback {function(user: DataModel.User)}
         * @return {LazyUAC.UserManager}
         */
        GetUserById(userId: string, callback: (user: DataModel.User) => void): this;
        /**
         * To retrieve user trough database and return the only one match value.
         * @param userId {string}
         * @return {Promise<DataModel.User>}
         */
        GetUserByIdAsync(userId: string): Promise<DataModel.User>;
        /**
         * Function to retrieved all users from db.
         * @param callback {function(list: DataModel.User[])}
         * @return {LazyUAC.UserManager}
         */
        GetAllUsers(callback: (list: DataModel.User[]) => void): this;
        GetAllUsersAsync(): Promise<DataModel.User[]>;
        /**
         * In order to add {@link Role} to an {@link User}, the userId is used
         * to retrieve from the {@link _dataSource}
         * @param userId {string}
         * @param role {@link DataModel.Role}
         * @param callback {function(error: Error, done: boolean)}
         * @return {LazyUAC.UserManager} current instance.
         */
        AddRolesToUser(userId: string, role: DataModel.Role, callback: (valid: boolean) => void): this;
        /**
         * In order to add {@link Role} to an {@link User}, the userId is used
         * to retrieve from the {@link _dataSource}
         * @param userId
         * @param role {@link DataModel.Role}
         * @return {Promise<boolean>}
         */
        AddRolesToUserAsync(userId: string, role: DataModel.Role): Promise<boolean>;
        /**
         *
         * @param userId {string}
         * @param role {DataModel.Role}
         * @param callback {function(done: boolean)}
         * @return {LazyUAC.UserManager}
         */
        RemoveRolesToUser(userId: string, role: DataModel.Role, callback: (done: boolean) => void): this;
        /**
         * Remove {@link DataModel.User#Roles} from user given an UserId.
         * @param userId {string} unique identifier.
         * @param role {DataModel.Role}
         * @return {Promise<boolean>}
         */
        RemoveRolesToUserAsync(userId: string, role: DataModel.Role): Promise<boolean>;
        /**
         *
         * @param user {DataModel.User}
         * @param callback {function(done: boolean)}
         */
        UpdateUser(user: DataModel.User, callback: (done: boolean) => void): void;
        /**
         *
         * @param user {DataModel.User}
         * @return {Promise<boolean>}
         */
        UpdateUserAsync(user: DataModel.User): Promise<boolean>;
        /**
         * Helper to validate the state of the {@link _dataSource} property.
         * @private
         */
        private _ValidateDataSource();
    }
}
