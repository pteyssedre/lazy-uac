/// <reference path="../../../typings/index.d.ts" />
import { DataModel } from "../model/models";
import User = DataModel.User;
export declare module DataService {
    interface Callback {
        (error: any, result: any): void;
    }
    interface UacDBA {
        UserExistAsync(userId: string, callback: Callback): void;
        GetUserAsync(user: User, callback: Callback): void;
        GetUserByUserIdAsync(userId: string, callback: Callback): void;
        GetUserByUsernameAsync(username: string, callback: Callback): void;
        InsertUserAsync(user: User, callback: Callback): void;
        UpdateUserAsync(user: User, callback: Callback): void;
        DeleteUserAsync(userId: string, callback: Callback): void;
    }
    class DataServer {
        private LazyBoy;
    }
}
