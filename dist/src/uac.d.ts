/// <reference path="../../typings/index.d.ts" />
import { DataModel } from "./model/models";
import { DataService } from "./service/data.service";
import DataSourceException = DataService.DataSourceException;
export declare module LazyUAC {
    class UserManager {
        private _dataSource;
        constructor(dataSource?: DataService.UacDBA);
        StartManager(callback: (error: Error, result: any) => void): void;
        /**
         * In order to add a user to the system, we add VIEWER and USER role to the user.
         * @param user {User}
         * @param callback {function(error:Error, user:User)}
         */
        AddUser(user: DataModel.User, callback: (error: Error, user: DataModel.User) => void): void;
        Authenticate(username: string, password: string, callback: (match: boolean) => void): void;
        GetUserByUserName(username: string, callback: (user: DataModel.User) => void): void;
        AddRolesToUser(userId: string, role: DataModel.Role, callback: (error: DataSourceException, valid: boolean) => void): void;
        private _ValidateDataSource();
    }
}
