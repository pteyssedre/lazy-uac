export declare module DataModel {
    class Role {
        id: string;
        name: string;
    }
    class User {
        Id: string;
        FirstName: string;
        LastName: string;
        Email: string;
        Password: string;
        Roles: Role[];
    }
}
