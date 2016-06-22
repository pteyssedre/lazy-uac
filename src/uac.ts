/// <reference path="../typings/index.d.ts" />

import * as bcrypt from "bcrypt-nodejs";
import { DataModel } from "./model/models";
import { DataService } from "./service/data.service";
import DataSourceException = DataService.DataSourceException;

export module LazyUAC {

    import User = DataModel.User;
    export class UserManager {
        private _dataSource: DataService.UacDBA;

        constructor(dataSource?: DataService.UacDBA) {
            this._dataSource = dataSource;
            if (!this._dataSource) {
                this._dataSource = new DataService.LazyDataServer();
            }
            this._ValidateDataSource();
        }

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

        public AddRolesToUser(userId: string, role: DataModel.Role, callback: (error: DataSourceException, valid: boolean)=>void): void {
            this._ValidateDataSource();
            this._dataSource.GetUserByUserIdAsync(userId, (error: DataSourceException, user: DataModel.User): void=> {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                if (!user) {
                    return callback(new DataSourceException("no user found"), null);
                }
                user.Roles |= role;
                return callback(null, true);
            });
        }

        private _ValidateDataSource(): void {
            if (!this._dataSource) {
                throw new DataSourceException("data source can't be null");
            }
        }
    }
}