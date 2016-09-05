import { DataModel } from "./model/models";
import { DataService } from "./service/data.service";
import lazyFormatLogger = require("lazy-format-logger");
export declare module LazyUAC {
    interface UacOptions {
        logLevel?: lazyFormatLogger.LogLevel;
        dataSource?: DataService.UacDBA;
        dataSourceOptions?: DataService.LazyDataSourceConfig;
    }
    class UserManager {
        options: UacOptions;
        static setLevel(level: lazyFormatLogger.LogLevel): void;
        private _dataSource;
        constructor(options?: UacOptions);
        /**
         * Starting the Manager to connect and initialized the databases, if needed.
         * @param callback {function(error: Error, result: Object)}
         * @return {LazyUAC.UserManager} current instance.
         */
        StartManager(callback: (error: Error, result: any) => void): this;
        /**
         * In order to add a user to the system, we add VIEWER and USER role to the user.
         * @param user {User}
         * @param callback {function(error:Error, user:User)}
         * @return {LazyUAC.UserManager} current instance.
         */
        AddUser(user: DataModel.User, callback: (user: DataModel.User) => void): this;
        /**
         * To produce the access string for an User, the identity of the User as to be validated.
         * @param username {string} email address to retrieve the User inside the db.
         * @param password {string} password in clear to be compare with the one on the user instance
         * @param callback {function(match: boolean, user: DataModel.User)}
         * @return {LazyUAC.UserManager} current instance.
         */
        Authenticate(username: string, password: string, callback: (match: boolean, user: DataModel.User) => void): this;
        /**
         * To remove an user the {@link lazyboyjs.LazyInstance} will be flag to delete.
         * @param userId {string} unique id of the instance to delete.
         * @param callback {function(delete: boolean)}
         * @return {LazyUAC.UserManager} current instance.
         */
        DeleteUser(userId: string, callback: (deleted: boolean) => void): this;
        /**
         * To retrieve user trough database and return the only one match value.
         * @param username {string} user name to search.
         * @param callback {function(user: DataModel#User)}
         * @return {LazyUAC.UserManager} current instance.
         */
        GetUserByUserName(username: string, callback: (user: DataModel.User) => void): this;
        /**
         *
         * @param userId {string}
         * @param callback {function(user: DataModel.User)}
         * @return {LazyUAC.UserManager}
         */
        GetUserById(userId: string, callback: (user: DataModel.User) => void): this;
        /**
         * Function to retrieved all users from db.
         * @param callback {function(list: DataModel.User[])}
         * @return {LazyUAC.UserManager}
         */
        GetAllUsers(callback: (list: DataModel.User[]) => void): this;
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
         *
         * @param userId {string}
         * @param role {DataModel.Role}
         * @param callback {function(done: boolean)}
         * @return {LazyUAC.UserManager}
         */
        RemoveRolesToUser(userId: string, role: DataModel.Role, callback: (done: boolean) => void): this;
        /**
         *
         * @param user {DataModel.User}
         * @param callback {function(done: boolean)}
         */
        UpdateUser(user: DataModel.User, callback: (done: boolean) => void): void;
        /**
         * Helper to validate the state of the {@link _dataSource} property.
         * @private
         */
        private _ValidateDataSource();
    }
}
