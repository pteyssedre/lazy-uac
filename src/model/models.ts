
export module DataModel {

    export class Role{
        public id:string;
        public name:string;
    }

    export class User {
        public Id: string;
        public FirstName: string;
        public LastName: string;
        public Email: string;
        public Password: string;
        public Roles: Role[];
    }

    export class Profile{
        public UserId: string;
        public Description: string;
        public Avatar: string;
        public PublicKey: string;
        public PrivateKey: string;
    }

}