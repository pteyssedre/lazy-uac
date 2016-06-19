/// <reference path="../../typings/index.d.ts"/>

import {lazyboyjs} from  "lazyboyjs";
import LazyBoy = lazyboyjs.LazyBoy;
import {DataModel} from "../model/models";
import User = DataModel.User;
import Role = DataModel.Role;

export module DataService {


    export interface Callback {
        (error: any, result: any): void;
    }

    export interface UacDBA {
        UserExistAsync(userId: string, callback: Callback): void;
        GetUserAsync(user: User, callback: Callback): void;
        GetUserByUserIdAsync(userId: string, callback: Callback): void;
        GetUserByUsernameAsync(username: string, callback: Callback): void;
        InsertUserAsync(user: User, callback: Callback): void;
        UpdateUserAsync(user: User, callback: Callback): void;
        DeleteUserAsync(userId: string, callback: Callback): void;
    }
    export class DataServer {

        private LazyBoy: LazyBoy
    }
}