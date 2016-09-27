import {DataModel} from "./model/models";
import {DataService} from "./service/data.service";
import lazyFormatLogger = require("lazy-format-logger");

export module LazyUAC {

    let Log: lazyFormatLogger.Logger = new lazyFormatLogger.Logger();

    export interface UacOptions {
        logLevel?: lazyFormatLogger.LogLevel,
        dataSource?: DataService.UacDdaAsync,
        dataSourceOptions?: DataService.LazyDataSourceConfig
    }

    export class UserManager {

        public static setLevel(level: lazyFormatLogger.LogLevel): void {
            Log = new lazyFormatLogger.Logger(level);
            DataService.LazyDataServer.setLevel(level);
        }

        private _dataSource: DataService.UacDdaAsync;

        constructor(public options?: UacOptions) {
            if (!this.options) {
                this.options = {};
            }
            this._dataSource = this.options.dataSource;
            if (!this._dataSource) {
                this._dataSource = new DataService.LazyDataServerAsync(this.options.dataSourceOptions);
            }
            this._ValidateDataSource();
        }

        /**
         * Starting the Manager to connect and initialized the databases, if needed.
         * @param callback {function(error: Error, result: Object)}
         * @return {LazyUAC.UserManager} current instance.
         */
        public StartManager(callback: (error: Error, result: any)=>void): this {
            this._dataSource.Connect((error: Error, result: any): void => {
                return callback(error, result);
            });
            return this;
        }

        /**
         * Starting the Manager to connect and initialized the databases, if needed.
         * @return {Promise<boolean>}
         * @constructor
         */
        async StartManagerAsync(): Promise<boolean> {
            return new Promise<boolean>(async(resolve, reject)=> {
                let r: boolean = false;
                try {
                    let result = await this._dataSource.ConnectAsync();
                    r = !result.error;
                    return resolve(r);
                } catch (exception) {
                    return reject(exception)
                }
            });
        }

        /**
         * In order to add a user to the system, we add VIEWER and USER role to the user.
         * @param user {User}
         * @param callback {function(error:Error, user:User)}
         * @return {LazyUAC.UserManager} current instance.
         */
        public AddUser(user: DataModel.User, callback: (user: DataModel.User) => void): this {
            this._ValidateDataSource();
            user.Roles |= DataModel.Role.VIEWER | DataModel.Role.USER;
            this._dataSource.InsertUser(user, (success: boolean): void => {
                callback(success ? user : null);
            });
            return this;
        }

        /**
         * In order to add a user to the system, we add VIEWER and USER role to the user.
         * @param user {DataModel.User}
         * @return {Promise<DataModel.User>}
         */
        async AddUserAsync(user: DataModel.User): Promise<DataModel.User> {
            return new Promise<DataModel.User>(async(resolve, reject)=> {
                let r: DataModel.User = null;
                try {
                    user.Roles |= DataModel.Role.VIEWER | DataModel.Role.USER;
                    let report = await this._dataSource.InsertUserAsync(user);
                    r = report.user;
                    return resolve(r);
                } catch (exception) {
                    return reject(exception)
                }
            });
        }

        /**
         * To produce the access string for an User, the identity of the User as to be validated.
         * @param username {string} email address to retrieve the User inside the db.
         * @param password {string} password in clear to be compare with the one on the user instance
         * @param callback {function(match: boolean, user: DataModel.User)}
         * @return {LazyUAC.UserManager} current instance.
         */
        public Authenticate(username: string, password: string, callback: (match: boolean, user: DataModel.User) => void): this {
            this._ValidateDataSource();
            this._dataSource.GetUserByUserName(username, (user: DataModel.User): void => {
                if (user) {
                    user.ComparePassword(password, (match: boolean): void => {
                        return callback(match, user);
                    });
                } else {
                    return callback(false, null);
                }
            });
            return this;
        }

        /**
         * To produce the access string for an User, the identity of the User as to be validated.
         * @param username {string} email address to retrieve the User inside the db.
         * @param password {string} password in clear to be compare with the one on the user instance
         * @return {Promise<{match: boolean, user: DataModel.User}>}
         */
        async AuthenticateAsync(username: string, password: string): Promise<{match: boolean, user: DataModel.User}> {
            return new Promise<{match: boolean, user: DataModel.User}>(async(resolve, reject)=> {
                let r: {match: boolean, user: DataModel.User} = {match: false, user: null};
                try {
                    let user = await this._dataSource.GetUserByUserNameAsync(username);
                    r.user = user;
                    if (user) {
                        user.ComparePassword(password, (match: boolean): void => {
                            r.match = match;
                            return resolve(r);
                        });
                    } else {
                        return resolve(r);
                    }
                } catch (exception) {
                    return reject(exception)
                }
            });
        }

        /**
         * To remove an user the {@link lazyboyjs.LazyInstance} will be flag to delete.
         * @param userId {string} unique id of the instance to delete.
         * @param callback {function(delete: boolean)}
         * @return {LazyUAC.UserManager} current instance.
         */
        public DeleteUser(userId: string, callback: (deleted: boolean) => void): this {
            this._ValidateDataSource();
            this._dataSource.DeleteUser(userId, callback);
            return this;
        }

        /**
         * To remove an user the {@link lazyboyjs.LazyInstance} will be flag to delete.
         * @param userId {string} unique id of the instance to delete.
         * @return {Promise<boolean>}
         */
        async DeleteUserAsync(userId: string): Promise<boolean> {
            return new Promise<boolean>(async(resolve, reject)=> {
                let r: boolean = false;
                try {
                    r = await this._dataSource.DeleteUserAsync(userId);
                    return resolve(r);
                } catch (exception) {
                    return reject(exception)
                }
            });
        }

        /**
         * To retrieve user trough database and return the only one match value.
         * @param username {string} user name to search.
         * @param callback {function(user: DataModel#User)}
         * @return {LazyUAC.UserManager} current instance.
         */
        public GetUserByUserName(username: string, callback: (user: DataModel.User) => void): this {
            this._ValidateDataSource();
            this._dataSource.GetUserByUserName(username, callback);
            return this;
        }

        /**
         * To retrieve user trough database and return the only one match value.
         * @param username {string} user name to search.
         * @return {Promise<DataModel.User>}
         */
        async GetUserByUserNameAsync(username: string): Promise<DataModel.User> {
            return new Promise<DataModel.User>(async(resolve, reject)=> {
                let r: DataModel.User = null;
                try {
                    r = await this._dataSource.GetUserByUserNameAsync(username);
                    return resolve(r);
                } catch (exception) {
                    return reject(exception)
                }
            });
        }

        /**
         * To retrieve user trough database and return the only one match value.
         * @param userId {string}
         * @param callback {function(user: DataModel.User)}
         * @return {LazyUAC.UserManager}
         */
        public GetUserById(userId: string, callback: (user: DataModel.User) => void): this {
            this._ValidateDataSource();
            this._dataSource.GetUserByUserId(userId, callback);
            return this;
        }

        /**
         * To retrieve user trough database and return the only one match value.
         * @param userId {string}
         * @return {Promise<DataModel.User>}
         */
        async GetUserByIdAsync(userId: string): Promise<DataModel.User> {
            return new Promise<DataModel.User>(async(resolve, reject)=> {
                let r: DataModel.User = null;
                try {
                    r = await this._dataSource.GetUserByUserIdAsync(userId);
                    return resolve(r);
                } catch (exception) {
                    return reject(exception)
                }
            });
        }

        /**
         * Function to retrieved all users from db.
         * @param callback {function(list: DataModel.User[])}
         * @return {LazyUAC.UserManager}
         */
        public GetAllUsers(callback: (list: DataModel.User[]) => void): this {
            this._ValidateDataSource();
            this._dataSource.GetAllUsers(callback);
            return this;
        }

        async GetAllUsersAsync(): Promise<DataModel.User[]> {
            return new Promise<DataModel.User[]>(async(resolve, reject)=> {
                let r: DataModel.User[] = null;
                try {
                    r = await this._dataSource.GetAllUsersAsync();
                    return resolve(r);
                } catch (exception) {
                    return reject(exception)
                }
            });
        }

        /**
         * In order to add {@link Role} to an {@link User}, the userId is used
         * to retrieve from the {@link _dataSource}
         * @param userId {string}
         * @param role {@link DataModel.Role}
         * @param callback {function(error: Error, done: boolean)}
         * @return {LazyUAC.UserManager} current instance.
         */
        public AddRolesToUser(userId: string, role: DataModel.Role, callback: (valid: boolean)=>void): this {
            this._ValidateDataSource();
            this._dataSource.GetUserByUserId(userId, (user: DataModel.User): void => {
                if (user) {
                    user.Roles |= role;
                    this.UpdateUser(user, callback);
                } else {
                    return callback(false);
                }
            });
            return this;
        }

        /**
         * In order to add {@link Role} to an {@link User}, the userId is used
         * to retrieve from the {@link _dataSource}
         * @param userId
         * @param role {@link DataModel.Role}
         * @return {Promise<boolean>}
         */
        async AddRolesToUserAsync(userId: string, role: DataModel.Role): Promise<boolean> {
            return new Promise<boolean>(async(resolve, reject)=> {
                let r: boolean = false;
                try {
                    let user = await this._dataSource.GetUserByUserIdAsync(userId);
                    if (user) {
                        user.Roles |= role;
                        r = await this.UpdateUserAsync(user);
                    }
                    return resolve(r);
                } catch (exception) {
                    return reject(exception)
                }
            });
        }

        /**
         *
         * @param userId {string}
         * @param role {DataModel.Role}
         * @param callback {function(done: boolean)}
         * @return {LazyUAC.UserManager}
         */
        public RemoveRolesToUser(userId: string, role: DataModel.Role, callback: (done: boolean)=>void): this {
            this._ValidateDataSource();
            this._dataSource.GetUserByUserId(userId, (user: DataModel.User): void => {
                if (user) {
                    if (user.Roles >= role) {
                        user.Roles -= role;
                        this.UpdateUser(user, callback);
                    }
                }
                return callback(false);
            });
            return this;
        }

        /**
         * Remove {@link DataModel.User#Roles} from user given an UserId.
         * @param userId {string} unique identifier.
         * @param role {DataModel.Role}
         * @return {Promise<boolean>}
         */
        async RemoveRolesToUserAsync(userId: string, role: DataModel.Role): Promise<boolean> {
            return new Promise<boolean>(async(resolve, reject)=> {
                let r: boolean = false;
                try {
                    let user = await this._dataSource.GetUserByUserIdAsync(userId);
                    if (user) {
                        if (user.Roles >= role) {
                            user.Roles -= role;
                            r = await this.UpdateUserAsync(user);
                        }
                    }
                    return resolve(r);
                } catch (exception) {
                    return reject(exception)
                }
            });
        }

        /**
         *
         * @param user {DataModel.User}
         * @param callback {function(done: boolean)}
         */
        public UpdateUser(user: DataModel.User, callback: (done: boolean) => void): void {
            this._ValidateDataSource();
            this._dataSource.UpdateUser(user, callback);
        }

        /**
         *
         * @param user {DataModel.User}
         * @return {Promise<boolean>}
         */
        async UpdateUserAsync(user: DataModel.User): Promise<boolean> {
            return new Promise<boolean>(async(resolve, reject)=> {
                let r: boolean = false;
                try {
                    let report = await this._dataSource.UpdateUserAsync(user);
                    r = report.updated;
                    return resolve(r);
                } catch (exception) {
                    return reject(exception)
                }
            });
        }

        /**
         * Helper to validate the state of the {@link _dataSource} property.
         * @private
         */
        private _ValidateDataSource(): void {
            if (!this._dataSource) {
                let error = new DataService.DataSourceException("data source can't be null");
                Log.c("UserManager", "ValidateDataSource", error);
                throw error;
            }
        }
    }
}