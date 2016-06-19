/// <reference path="../typings/index.d.ts" />

import * as bcrypt from "bcrypt-nodejs";
import {DataModel} from "./model/models";
import {DataService} from "./service/data.service";
import User = DataModel.User;
import Role = DataModel.Role;
import UacDBA = DataService.UacDBA;

export module LazyUAC {

    export class DataSourceException extends Error {
        constructor(public message: string) {
            super(message);
        }
    }

    export class UserManager {
        _dataSource: UacDBA;

        constructor(dataSource: UacDBA) {
            this._dataSource = dataSource;
            this._ValidateDataSource();
        }

        AddUser(user: User, callback: (error: Error, valid: User)=>void): void {
            this._ValidateDataSource();
            var round = Math.floor(Math.random() * Math.floor((Math.random() * 100)));
            bcrypt.genSalt(round, (error: any, salt: string): void=> {
                if (error) {
                    return callback(error, null);
                }
                bcrypt.hash(user.Password, salt, (error: any, encrypted: string): void=> {
                    if (error) {
                        return callback(error, null);
                    }
                    user.Password = encrypted;
                    this._dataSource.GetUserAsync(user, (error: any, response: any): void=> {
                        if (error) {
                            return callback(error, null);
                        }
                        user.Id = response.id;
                        delete user.Password;
                        return callback(null, user);
                    });
                });
            });
        }

        ValidateAuthentication(user: User, callback: (error: Error, valid: User)=>void): void {
            this._ValidateDataSource();
            if (!user) {
                throw new Error("no user provided");
            }
            this._dataSource.GetUserAsync(user, (error: any, response: User): void=> {
                if (error) {
                    return callback(error, null);
                }
                let u = response;

                bcrypt.compare(user.Password, u.Password, (error: any, same: boolean): void=> {
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

        AddRolesToUser(userId: string, roles: Role[], callback: (error: Error, valid: boolean)=>void): void {
            this._ValidateDataSource();
            this._dataSource.GetUserByUserIdAsync(userId, (error: any, response: User): void=> {
                if (error) {
                    return callback(error, null);
                }
                if (!response) {
                    return callback(new Error("no user found"), null);
                }
                var done = this._UpdateRoles(response, roles);
                return callback(null, done);
            });
        }

        _ValidateDataSource(): void {
            if (!this._dataSource) {
                throw new DataSourceException("data source can't be null");
            }
        }

        _UpdateRoles(u: User, rs: Role[]): boolean {
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

        _UserAsOneOfRoles(a: User, b: Role[]): boolean {
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