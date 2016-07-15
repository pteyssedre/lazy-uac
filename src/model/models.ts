import * as bcript from "bcrypt-nodejs";

import lazyFormatLogger = require("lazy-format-logger");

export module DataModel {

    let Log: lazyFormatLogger.Logger = new lazyFormatLogger.Logger();

    export class Utils {
        public static newGuid(): string {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                let r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        public static setLevel(level: lazyFormatLogger.LogLevel): void {
            Log = new lazyFormatLogger.Logger(level);
        }
    }

    export enum Role {
        VIEWER = 1,
        USER = 1 << 1,
        ADMIN = 1 << 2,
        SUPER_ADMIN = 1 << 3
    }

    export class User {

        public Id: string;
        public FirstName: string;
        public LastName: string;
        public Email: string;
        public Password: string;
        public Roles: Role;

        constructor(firstName?: string, lastName?: string, email?: string, password?: string, roles?: Role) {
            this.Id = Utils.newGuid();
            this.FirstName = firstName;
            this.LastName = lastName;
            this.Email = email;
            this.Roles = roles;
            this.AddPasswordSync(password);
        }

        public AddPassword(password: string, callback: ()=>void): void {
            let it = this;
            let round = (Math.floor(Math.random() * 10) + 1);
            Log.d("User", "AddPassword", "Generating Salt", round);
            bcript.genSalt(round, (error: Error, salt: string): void => {
                if (error) {
                    Log.c("User", "AddPassword", "bcript.genSalt", error);
                    throw error;
                }
                Log.d("User", "Generating Hash", salt);
                bcript.hash(password, salt, it.cryptingProgress, (error: Error, hash: string): void => {
                    if (error) {
                        Log.c("User", "AddPassword", "bcript.hash", error);
                        throw error;
                    }
                    Log.d("User", "AddPassword", "password encrypted", hash);
                    it.Password = hash;
                    callback();
                });
            });
        }

        public AddPasswordSync(password: string): void {
            if (password) {
                let it = this;
                let round = (Math.floor(Math.random() * 10) + 1);
                Log.d("User", "AddPasswordSync", "Generating SaltSync", round);
                let salt = bcript.genSaltSync(round);
                Log.d("User", "AddPasswordSync", "Generating HashSync", salt);
                let hash = bcript.hashSync(password, salt);
                Log.d("User", "AddPasswordSync", "password encrypted", hash);
                it.Password = hash;
            }
        }

        public ComparePassword(password: string, callback: (match: boolean)=>void): void {
            bcript.compare(password, this.Password, (error: Error, result: boolean): void => {
                if (error) {
                    Log.c("User", "ComparePassword", error);
                    throw error;
                }
                callback(result);
            });
        }

        public ComparePasswordSync(password: string): boolean {
            Log.d("User", "ComparePasswordSync", "comparing", password, this.Password);
            return bcript.compareSync(password, this.Password);
        }


        private cryptingProgress(): void {
            //Log.d("", "in progress");
        }
    }

    export class Profile {
        public UserId: string;
        public Description: string;
        public Avatar: string;
        public PublicKey: string;
        public PrivateKey: string;

        constructor(user?: User, description?: string, avatar?: string, pkey?: string, prkey?: string) {
            this.UserId = user ? user.Id : '';
            this.Description = description;
            this.Avatar = avatar;
            this.PublicKey = pkey;
            this.PrivateKey = prkey;
        }
    }

}