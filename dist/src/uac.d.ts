/// <reference path="../../typings/index.d.ts" />
import { DataModel } from "./model/models";
import { DataService } from "./service/data.service";
export declare module LazyUAC {
    class UserManager {
        private _dataSource;
        constructor(dataSource?: DataService.UacDBA);
        /**
         * Starting the Manager to connect and initialized the databases, if needed.
         * @param callback {function(error: Error, result: Object)}
         */
        StartManager(callback: (error: Error, result: any) => void): void;
        /**
         * In order to add a user to the system, we add VIEWER and USER role to the user.
         * @param user {User}
         * @param callback {function(error:Error, user:User)}
         */
        AddUser(user: DataModel.User, callback: (error: Error, user: DataModel.User) => void): void;
        /**
         * To produce the access string for an User, the identity of the User as to be validated.
         * @param username {string} email address to retrieve the User inside the db.
         * @param password {string} password in clear to be compare with the one on the user instance
         * @param callback
         */
        Authenticate(username: string, password: string, callback: (match: boolean) => void): void;
        /**
         * To retrieve user trough database and return the only one match value.
         * @param username {string} user name to search.
         * @param callback {function(user: DataModel#User)}
         */
        GetUserByUserName(username: string, callback: (user: DataModel.User) => void): void;
        /**
         * In order to add {@link Role} to an {@link User}, the userId is used
         * to retrieve from the {@link _dataSource}
         * @param userId {string}
         * @param role {@link DataModel.Role}
         * @param callback {function(error: Error, done: boolean)}
         */
        AddRolesToUser(userId: string, role: DataModel.Role, callback: (error: DataService.DataSourceException, valid: boolean) => void): void;
        /**
         * Helper to validate the state of the {@link _dataSource} property.
         * @private
         */
        private _ValidateDataSource();
    }
}
