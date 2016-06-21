import * as bcript from "bcrypt-nodejs";

export module DataModel {

    class Utils {
        public static newGuid(): string {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                let r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    }

    export class Role {
        public id: string;
        public name: string;
    }

    export class User {
        public Id: string;
        public FirstName: string;
        public LastName: string;
        public Email: string;
        public Password: string;
        public Roles: Role[];

        constructor(firstName: string, lastName: string, email: string) {
            this.Id = Utils.newGuid();
            this.FirstName = firstName;
            this.LastName = lastName;
            this.Email = email;
        }

        public AddPassword(password: string, callback: ()=>void) {
            let it = this;
            let round = (Math.floor(Math.random() * 10) + 1);
            console.log("DEBUG", new Date(), "Generating Salt", round);
            bcript.genSalt(round, (error: Error, salt: string): void => {
                if (error) {
                    console.error("ERROR", new Date(), error);
                    throw error;
                }
                console.log("DEBUG", new Date(), "Generating Hash", salt);
                bcript.hash(password, salt, it.cryptingProgress, (error: Error, hash: string): void => {
                    if (error) {
                        console.error("ERROR", new Date(), error);
                        throw error;
                    }
                    console.log("DEBUG", new Date(), "password encrypted", hash);
                    it.Password = hash;
                    callback();
                });
            });
        }

        public AddPasswordSync(password: string) {
            let it = this;
            let round = (Math.floor(Math.random() * 10) + 1);
            console.log("DEBUG", new Date(), "Generating Salt", round);
            let salt = bcript.genSaltSync(round);
            console.log("DEBUG", new Date(), "Generating Hash", salt);
            let hash = bcript.hashSync(password, salt);
            console.log("DEBUG", new Date(), "password encrypted", hash);
            it.Password = hash;
        }

        public ComparePassword(password: string, callback: (match: boolean)=>void): void {
            bcript.compare(password, this.Password, (error: Error, result: boolean): void => {
                if (error) {
                    console.error("ERROR", new Date(), error);
                }
                callback(result);
            });
        }

        public ComparePasswordSync(password: string): boolean {
            console.log("DEBUG", new Date(), "comparing", password, this.Password);
            return bcript.compareSync(password, this.Password);
        }


        private cryptingProgress(): void {
            //console.log("DEBUG", new Date(), "in progress");
        }
    }

    export class Profile {
        public UserId: string;
        public Description: string;
        public Avatar: string;
        public PublicKey: string;
        public PrivateKey: string;
    }

}