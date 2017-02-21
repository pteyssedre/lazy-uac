import lazyboyjs = require("lazyboyjs");
import lazyFormatLogger = require("lazy-format-logger");
export declare module DataModel {
    class Utils {
        static setLevel(level: lazyFormatLogger.LogLevel): void;
    }
    enum Role {
        NONE = 0,
        VIEWER = 1,
        USER = 4,
        ADMIN = 8,
        SUPER_ADMIN = 16,
    }
    class User {
        Id: string;
        FirstName: string;
        LastName: string;
        Email: string;
        Password: string;
        Roles: Role;
        constructor(entry?: lazyboyjs.lazyboyjs.LazyInstance);
        AddPassword(password: string, callback: () => void): void;
        AddPasswordSync(password: string): void;
        ComparePassword(password: string, callback: (match: boolean) => void): void;
        ComparePasswordSync(password: string): boolean;
        Any(role: Role): boolean;
        HasRole(role: Role): boolean;
        AddRole(role: Role): void;
        RemoveRole(role: Role): void;
        private static encryptingProgress();
    }
    class Profile {
        UserId: string;
        Description: string;
        Avatar: string;
        PublicKey: string;
        PrivateKey: string;
        constructor(entry: lazyboyjs.lazyboyjs.LazyInstance);
    }
}
