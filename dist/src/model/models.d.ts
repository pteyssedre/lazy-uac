export declare module DataModel {
    enum Role {
        VIEWER = 1,
        USER = 2,
        ADMIN = 4,
        SUPER_ADMIN = 8,
    }
    class User {
        Id: string;
        FirstName: string;
        LastName: string;
        Email: string;
        Password: string;
        Roles: Role;
        constructor(firstName?: string, lastName?: string, email?: string, password?: string, roles?: Role);
        AddPassword(password: string, callback: () => void): void;
        AddPasswordSync(password: string): void;
        ComparePassword(password: string, callback: (match: boolean) => void): void;
        ComparePasswordSync(password: string): boolean;
        private cryptingProgress();
    }
    class Profile {
        UserId: string;
        Description: string;
        Avatar: string;
        PublicKey: string;
        PrivateKey: string;
        constructor(user?: User, description?: string, avatar?: string, pkey?: string, prkey?: string);
    }
}
