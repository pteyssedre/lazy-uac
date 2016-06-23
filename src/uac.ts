/// <reference path="../typings/index.d.ts" />

import {DataModel} from "./model/models";
import {DataService} from "./service/data.service";

export module LazyUAC {

    export class UserManager {
        private _dataSource: DataService.UacDBA;

        constructor(dataSource?: DataService.UacDBA) {
            this._dataSource = dataSource;
            if (!this._dataSource) {
                this._dataSource = new DataService.LazyDataServer();
            }
            this._ValidateDataSource();
        }

        /**
         * Starting the Manager to connect and initialized the databases, if needed.
         * @param callback {function(error: Error, result: Object)}
         */
        public StartManager(callback: (error: Error, result: any)=>void): void {
            this._dataSource.Connect((error: Error, result: any): void => {
                callback(error, result);
            });
        }

        /**
         * In order to add a user to the system, we add VIEWER and USER role to the user.
         * @param user {User}
         * @param callback {function(error:Error, user:User)}
         */
        public AddUser(user: DataModel.User, callback: (error: Error, user: DataModel.User) => void): void {
            this._ValidateDataSource();
            user.Roles |= DataModel.Role.VIEWER | DataModel.Role.USER;
            this._dataSource.InsertUserAsync(user, (error: Error, result: any): void => {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                callback(error, result);
            });
        }

        /**
         * To produce the access string for an User, the identity of the User as to be validated.
         * @param username {string} email address to retrieve the User inside the db.
         * @param password {string} password in clear to be compare with the one on the user instance
         * @param callback
         */
        public Authenticate(username: string, password: string, callback: (match: boolean) => void) {
            console.log("INFO", new Date(), "Authenticating", username);
            this._ValidateDataSource();
            this._dataSource.GetUserByUsernameAsync(username, (error: Error, user: DataModel.User): void => {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                user.ComparePassword(password, (match: boolean): void => {
                    callback(match);
                });
            });
        }

        /**
         * To retrieve user trough database and return the only one match value.
         * @param username {string} user name to search.
         * @param callback {function(user: DataModel#User)}
         */
        public GetUserByUserName(username: string, callback: (user: DataModel.User) => void) {
            this._ValidateDataSource();
            this._dataSource.GetUserByUsernameAsync(username, (error: Error, user: DataModel.User): void => {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                callback(user);
            });
        }

        /**
         * In order to add {@link Role} to an {@link User}, the userId is used
         * to retrieve from the {@link _dataSource}
         * @param userId {string}
         * @param role {@link DataModel.Role}
         * @param callback {function(error: Error, done: boolean)}
         */
        public AddRolesToUser(userId: string, role: DataModel.Role, callback: (error: DataService.DataSourceException, valid: boolean)=>void): void {
            this._ValidateDataSource();
            this._dataSource.GetUserByUserIdAsync(userId, (error: DataService.DataSourceException, user: DataModel.User): void=> {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                if (!user) {
                    return callback(new DataService.DataSourceException("No user found"), null);
                }
                user.Roles |= role;
                return callback(null, true);
            });
        }

        /**
         * Helper to validate the state of the {@link _dataSource} property.
         * @private
         */
        private _ValidateDataSource(): void {
            if (!this._dataSource) {
                throw new DataService.DataSourceException("data source can't be null");
            }
        }
    }
}