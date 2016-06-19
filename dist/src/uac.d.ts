/// <reference path="../../typings/index.d.ts" />
import { DataModel } from "./model/models";
import { DataService } from "./service/data.service";
import User = DataModel.User;
import Role = DataModel.Role;
import UacDBA = DataService.UacDBA;
export declare module LazyUAC {
    class UserManager {
        private _dataSource;
        constructor(dataSource?: UacDBA);
        /**
         *
         * @param user {User}
         * @param callback {function(error:Error, user:User)}
         */
        AddUser(user: User, callback: (error: Error, user: User) => void): void;
        ValidateAuthentication(user: User, callback: (error: Error, valid: User) => void): void;
        AddRolesToUser(userId: string, roles: Role[], callback: (error: Error, valid: boolean) => void): void;
        private _ValidateDataSource();
        private _UpdateRoles(u, rs);
        private _UserAsOneOfRoles(a, b);
    }
}
