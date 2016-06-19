/// <reference path="../typings/index.d.ts" />

import * as bcrypt from "bcrypt-nodejs";
import {DataModel} from "./model/models";
import {DataService} from "./service/data.service";
import User = DataModel.User;
import Role = DataModel.Role;
import UacDBA = DataService.UacDBA;
import DataSourceException = DataService.DataSourceException;

export module LazyUAC {

    export class UserManager {
        private _dataSource: UacDBA;

        constructor(dataSource?: UacDBA) {
            this._dataSource = dataSource;
            if (!this._dataSource) {
                this._dataSource = new DataService.LazyDataServer();
            }
            this._ValidateDataSource();
        }

        /**
         *
         * @param user {User}
         * @param callback {function(error:Error, user:User)}
         */
        public AddUser(user: User, callback: (error: Error, user: User)=>void): void {
            this._ValidateDataSource();
            var round = Math.floor(Math.random() * Math.floor((Math.random() * 100)));
            bcrypt.genSalt(round, (error: any, salt: string): void=> {
                if (error) {
                    return callback(error, null);
                }
                bcrypt.hash(user.Password, salt, (error: DataSourceException, encrypted: string): void=> {
                    if (error) {
                        return callback(error, null);
                    }
                    user.Password = encrypted;
                    this._dataSource.GetUserAsync(user, (error: DataSourceException, response: User): void=> {
                        if (error) {
                            return callback(error, null);
                        }
                        user.Id = response.Id;
                        delete user.Password;
                        return callback(null, user);
                    });
                });
            });
        }

        public ValidateAuthentication(user: User, callback: (error: Error, valid: User)=>void): void {
            this._ValidateDataSource();
            if (!user) {
                throw new Error("no user provided");
            }
            this._dataSource.GetUserAsync(user, (error: DataSourceException, response: User): void=> {
                if (error) {
                    return callback(error, null);
                }
                let u = response;

                bcrypt.compare(user.Password, u.Password, (error: DataSourceException, same: boolean): void=> {
                    if (error) {
                        return callback(error, null);
                    }
                    if (!same) {
                        return callback(null, null);
                    }
                    delete u.Password;
                    return callback(null, u);
                });
            });
        }

        public AddRolesToUser(userId: string, roles: Role[], callback: (error: Error, valid: boolean)=>void): void {
            this._ValidateDataSource();
            this._dataSource.GetUserByUserIdAsync(userId, (error: DataSourceException, response: User): void=> {
                if (error) {
                    return callback(error, null);
                }
                if (!response) {
                    return callback(new DataSourceException("no user found"), null);
                }
                var done = this._UpdateRoles(response, roles);
                return callback(null, done);
            });
        }

        private _ValidateDataSource(): void {
            if (!this._dataSource) {
                throw new DataSourceException("data source can't be null");
            }
        }

        private _UpdateRoles(u: User, rs: Role[]): boolean {
            if (!u) {
                throw new DataSourceException("no user");
            }
            var a = u.Roles.concat(rs);
            for (var i = 0; i < a.length; ++i) {
                for (var j = i + 1; j < a.length; ++j) {
                    if (a[i].id === a[j].id)
                        a.splice(j--, 1);
                }
            }
            u.Roles = a;
            return u.Roles.length >= rs.length;
        }

        private _UserAsOneOfRoles(a: User, b: Role[]): boolean {
            if (!a) {
                throw new DataSourceException("no user");
            }
            if (a.Roles.length == 0) {
                return false;
            }
            for (var r of b) {
                for (var r1 of a.Roles) {
                    if (r1.id == r.id) {
                        return true;
                    }
                }
            }
            return false;
        }

    }
}