/// <reference path="../../typings/index.d.ts" />
import { DataModel } from "./model/models";
import { DataService } from "./service/data.service";
import User = DataModel.User;
import Role = DataModel.Role;
import UacDBA = DataService.UacDBA;
export declare module LazyUAC {
    class DataSourceException extends Error {
        message: string;
        constructor(message: string);
    }
    class UserManager {
        _dataSource: UacDBA;
        constructor(dataSource: UacDBA);
        AddUser(user: User, callback: (error: Error, valid: User) => void): void;
        ValidateAuthentication(user: User, callback: (error: Error, valid: User) => void): void;
        AddRolesToUser(userId: string, roles: Role[], callback: (error: Error, valid: boolean) => void): void;
        _ValidateDataSource(): void;
        _UpdateRoles(u: User, rs: Role[]): boolean;
        _UserAsOneOfRoles(a: User, b: Role[]): boolean;
    }
}
