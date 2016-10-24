import { lazyboyjs } from "lazyboyjs";
import lazyFormatLogger = require("lazy-format-logger");
export declare module DataModel {
    class Utils {
        static newGuid(): string;
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
        constructor(entry?: lazyboyjs.LazyInstance);
        AddPassword(password: string, callback: () => void): void;
        AddPasswordSync(password: string): void;
        ComparePassword(password: string, callback: (match: boolean) => void): void;
        ComparePasswordSync(password: string): boolean;
        Any(role: Role): boolean;
        Has(role: Role): boolean;
        Equal(role: Role): boolean;
        private cryptingProgress();
    }
    class Profile {
        UserId: string;
        Description: string;
        Avatar: string;
        PublicKey: string;
        PrivateKey: string;
        constructor(entry: lazyboyjs.LazyInstance);
    }
}
