import {DataModel} from "../model/models";
import lazyFormatLogger = require("lazy-format-logger");
import {lazyboyjs} from "lazyboyjs";
import mime = require('mime');

export module DataService {

    import ReadableStream = NodeJS.ReadableStream;
    let Log: lazyFormatLogger.Logger = new lazyFormatLogger.Logger();


    export class LazyDataServerBase {

        /**
         * In order to restrict log to a specific level the variable {@link Log}
         * is reset and the level is propagated to {@link DataModel} and {@link LazyBoy} classes.
         * @param level {@link LogLevel}
         */
        static setLevel(level: lazyFormatLogger.LogLevel): void {
            Log = new lazyFormatLogger.Logger(level);
            DataModel.Utils.setLevel(level);
            lazyboyjs.setLevel(level);
        }

        protected Options: LazyDataSourceConfig;

        constructor(options?: LazyDataSourceConfig) {
            this.Options = options;
            this._validateOptions();

        }

        /**
         * Validation of the {@link Options} object, the defaults value will be enforce is they are not present
         * inside the object.
         * @protected
         */
        protected _validateOptions(): void {
            if (!this.Options) {
                this.Options = {};
            }
            if (!this.Options.credential_db) {
                this.Options.credential_db = "auth";
            }
            if (!this.Options.profile_db) {
                this.Options.profile_db = "profile";
            }
            if (!this.Options.LazyBoyOptions) {
                this.Options.LazyBoyOptions = {
                    prefix: "uac",
                    autoConnect: true,
                    cache:true,
                    forceSave:true,
                    raw:false,
                    views: {}
                };
            } else {
                if (!this.Options.LazyBoyOptions.prefix) {
                    this.Options.LazyBoyOptions.prefix = "uac";
                }
                if (!this.Options.LazyBoyOptions.autoConnect) {
                    this.Options.LazyBoyOptions.autoConnect = true;
                }
            }
            this._injectLazyUacViews();
        }

        /**
         * Enforce the default require {@link lazyboyjs.LazyDesignViews} for {@link LazyUAC}.
         * @private
         */
        private _injectLazyUacViews(): void {
            if (!this.Options.LazyBoyOptions.views) {
                this.Options.LazyBoyOptions.views = {};
            }
            this.Options.LazyBoyOptions.views[this.Options.LazyBoyOptions.prefix + "_" + this.Options.credential_db] = userViews;
            this.Options.LazyBoyOptions.views[this.Options.LazyBoyOptions.prefix + "_" + this.Options.profile_db] = profileViews;
        }
    }
    /**
     * @classdesc Data source server use to CREATE, READ, UPDATE and DELETE, {@link DataModel.User} and {@link DataModel.Profile} instances.
     */
    export class LazyDataServer extends LazyDataServerBase implements UacDBA {

        protected LazyBoy: lazyboyjs.LazyBoy;

        isReady: boolean = false;

        /**
         * @param options {@link LazyDataSourceConfig}
         */
        constructor(options?: LazyDataSourceConfig) {
            super(options);
            this.LazyBoy = this.Options.LazyBoy;
            if (!this.LazyBoy) {
                this.LazyBoy = new lazyboyjs.LazyBoy(this.Options.LazyBoyOptions);
            } else {
                this.Options.LazyBoyOptions = this.LazyBoy.options;
            }
        }

        /**
         * By calling the Connect function, two databases will be added to the {@link LazyBoy} instance and initialized.
         * Since the LazyBoy instance can be external we may have more than 2 database.
         * So using array filtering we select the databases than contains the name of "credential_db"  and "profile_db"
         * @param callback {function(error: DataSourceException, result: lazyboyjs.ReportInitialization): void}
         */
        Connect(callback: Callback): void {
            let instance = this;
            this.LazyBoy.Databases(this.Options.credential_db, this.Options.profile_db);
            this.LazyBoy.InitializeAllDatabases((error: Error, report: lazyboyjs.ReportInitialization): void => {
                if (error) {
                    Log.c("LazyDataServer", "Connect", "InitializeAllDatabases", error);
                    throw error;
                } else {
                    instance.isReady = true;
                }
                if (report.success.length == 2 && report.success.filter((l): boolean => {
                        let valid = lazyboyjs.DbCreateStatus.UpToDate | lazyboyjs.DbCreateStatus.Created;
                        return (l.name.indexOf(this.Options.credential_db) > 0 || l.name.indexOf(this.Options.profile_db) > 0) && !!(l.status & valid);
                    })) {
                    this.LazyBoy.Connect();
                    Log.i("LazyDataServer", "Connect", "LazyBoyConnect called");
                    callback(null, report);
                } else {
                    callback(new DataSourceException("Databases were not generated properly"), report);
                }
            });
        }

        /**
         * Given an userId, if a match is found a {@link DataModel.User} instance will be return.
         * @param userId {string}
         * @param callback {function(user: DataModel.User): void}
         */
        GetUserByUserId(userId: string, callback: (user: DataModel.User) => void): void {
            this._getEntryByUserId(userId, (entry: lazyboyjs.LazyInstance): void => {
                if (entry) {
                    callback(new DataModel.User(entry));
                } else {
                    callback(null);
                }
            });
        }

        /**
         *
         * @param username
         * @param callback {function(user: DataModel.User): void}
         */
        GetUserByUserName(username: string, callback: (user: DataModel.User) => void): void {
            this._getEntryByUserName(username, (entry: lazyboyjs.LazyInstance): void => {
                if (entry) {
                    callback(new DataModel.User(entry));
                } else {
                    callback(null);
                }
            });
        }

        /**
         *
         * @param user {DataModel.User}
         * @param callback {function(success: boolean): void}
         */
        InsertUser(user: DataModel.User, callback: (success: boolean) => void): void {
            this._userExist(user, (exist: boolean): void => {
                if (!exist) {
                    this._addUserEntry(user, "user", callback);
                } else {
                    callback(false);
                }
            });
        }

        /**
         *
         * @param user {DataModel.User}
         * @param callback {function(success: boolean): void}
         */
        UpdateUser(user: DataModel.User, callback: (success: boolean) => void): void {
            this._getUserEntry(user, (entry: lazyboyjs.LazyInstance): void => {
                if (entry) {
                    entry.instance = user;
                    this._updateUserEntry(entry, callback);
                } else {
                    callback(false);
                }
            });
        }

        /**
         * Given the userId the {@link lazyboyjs.LazyInstance} will be flag as deleted.
         * @param userId {string}
         * @param callback {function(success: boolean): void}
         */
        DeleteUser(userId: string, callback: (success: boolean) => void): void {
            this._getEntryByUserId(userId, (entry: lazyboyjs.LazyInstance): void => {
                if (entry) {
                    this.LazyBoy.DeleteEntry(this.Options.credential_db, entry,
                        (error: Error, deleted: boolean): void => {
                            if (error) {
                                Log.c("LazyDataServer", "DeleteUser", "LazyBoy.DeleteEntry", error);
                                throw error;
                            }
                            Log.d("LazyDataServer", "DeleteUser", "LazyBoy.DeleteEntry", deleted);
                            callback(deleted);
                        }, false);
                } else {
                    callback(false);
                }
            });
        }

        GetAllUsers(callback: (list: DataModel.User[]) => void): void {
            this.LazyBoy.GetViewResult(this.Options.credential_db, "allUsersNotDeleted", {reduce: false}, (error, data) => {
                if (error) {
                    Log.c("LazyDataServer", "GetViewResult", "LazyBoy.GetViewResult", error);
                    throw error;
                }
                Log.d("LazyDataServer", "GetAllUsers", "LazyBoy.GetViewResult", data);
                callback(data);
            });
        }

        AddAvatar(userId: string, path: string, callback: (success: boolean) => void): void {
            if (!userId) {
                return callback(false);
            }
            this._getEntryByUserId(userId, (entry) => {
                if (!entry) {
                    return callback(false);
                }
            });
        }

        /**
         * Shorter to search entry by UserId or UserName if one of those properties exist in the {@code user}
         * @param user {@link DataModel.User}
         * @param callback {function(exist:boolean)}
         * @throw {@link DataSourceException}
         */
        private _userExist(user: DataModel.User, callback: (exist: boolean) => void): void {
            if (user) {
                if (user.Id) {
                    this._getEntryByUserId(user.Id, (entry: lazyboyjs.LazyInstance): void => {
                        if (user.Email) {
                            this._getEntryByUserName(user.Email, (entry: lazyboyjs.LazyInstance): void => {
                                callback(entry != null && !entry.isDeleted);
                            });
                        } else {
                            callback(entry != null && !entry.isDeleted);
                        }
                    });
                } else if (user.Email) {
                    this._getEntryByUserName(user.Email, (entry: lazyboyjs.LazyInstance): void => {
                        callback(entry != null && !entry.isDeleted);
                    });
                } else {
                    let error = new DataSourceException("invalid data");
                    Log.c("LazyDataServer", "userExist", error.toString());
                    throw error;
                }
            } else {
                let error = new DataSourceException("invalid data");
                Log.c("LazyDataServer", "userExist", error);
                throw error;
            }
        }

        /**
         * Shorter to retrieve the entry {@link lazyboyjs.LazyInstance} from the database using either the
         * UserId or the UserName property of the parameter {@code user}
         * @param user
         * @param callback {function(entry: lazyboyjs.LazyInstance)}
         * @throw DataSourceException if one of {@link DataModel.User} or {@link DataModel.User#Id} or {@link DataModel.User#Email} is null.
         */
        private _getUserEntry(user: DataModel.User, callback: (entry: lazyboyjs.LazyInstance) => void): void {
            if (user) {
                if (user.Id && user.Id.length > 0) {
                    this._getEntryByUserId(user.Id, (entry: lazyboyjs.LazyInstance): void => {
                        callback(entry.isDeleted ? null : entry);
                    });
                } else if (user.Email && user.Email.length > 0) {
                    this._getEntryByUserName(user.Email, (entry: lazyboyjs.LazyInstance): void => {
                        callback(entry.isDeleted ? null : entry);
                    });
                } else {
                    let error = new DataSourceException("invalid data");
                    Log.c("LazyDataServer", "userExist", error);
                    throw error;
                }
            } else {
                let error = new DataSourceException("invalid data");
                Log.c("LazyDataServer", "userExist", error);
                throw error;
            }
        }

        /**
         * Shorter to execute {@link AddEntry} on "credential_db". All conflict, update or delete
         * should be managed here.
         * @param data {object}
         * @param type {string}
         * @param callback {function(success: boolean):void}
         * @private
         */
        private _addUserEntry(data: any, type: string, callback: (success: boolean) => void) {
            let entry = lazyboyjs.LazyBoy.NewEntry(data, type);
            this.LazyBoy.AddEntry(this.Options.credential_db, entry, (error: Error, code: lazyboyjs.InstanceCreateStatus, entry: lazyboyjs.LazyInstance): void => {
                if (error) {
                    Log.c("LazyDataServer", "addUserEntry", "LazyBoy.AddEntry", error, code);
                    throw error;
                }
                Log.d("LazyDataServer", "addUserEntry", "LazyBoy.AddEntry", entry);
                switch (code) {
                    case lazyboyjs.InstanceCreateStatus.Created:
                        Log.d("LazyDataServer", "addUserEntry", "LazyBoy.AddEntry", "Instance Created");
                        callback(true);
                        break;
                    case lazyboyjs.InstanceCreateStatus.Conflict:
                        Log.d("LazyDataServer", "addUserEntry", "LazyBoy.AddEntry", "Instance Conflict");
                        callback(false);
                        break;
                    default:
                        Log.c("LazyDataServer", "addUserEntry", "LazyBoy.AddEntry", "unmanaged code : " + code);
                        callback(false);
                        break;
                }
            });
        }

        /**
         * Shorter to select an {@link DataModel.User} instance given an userId.
         * This function execute {@link GetViewResult} using the following parameters :
         * <pre>
         *      Options.credential_db, "entryByUserId", {key: userId, reduce: false},
         * </pre>
         * @param userId {string}
         * @param callback {function(entry: lazyboyjs.LazyInstance):void}
         * @private
         */
        private _getEntryByUserId(userId: string, callback: (entry: lazyboyjs.LazyInstance) => void): void {
            this.LazyBoy.GetViewResult(
                this.Options.credential_db,
                "entryByUserId",
                {key: userId, reduce: false},
                (error: Error, result: any): void => {
                    if (error) {
                        Log.c("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", error);
                        throw error;
                    }
                    if (result.length == 0) {
                        // throw new DataSourceException("no user found", UserCodeException.NOT_FOUND);
                        Log.d("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", "no entry found");
                        return callback(null);
                    } else if (result.length > 1) {
                        //throw new DataSourceException("more than one user was found", UserCodeException.DUPLICATE_FOUND);
                        Log.d("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", "more than one entry was found");
                        return callback(null);
                    }
                    Log.d("LazyDataServer", "getEntryByUserId", "LazyBoy.GetViewResult", "one entry was found");
                    callback(result[0].value);
                });
        }

        /**
         * Shorter to select an {@link DataModel.User} instance given an username.
         * This function execute {@link GetViewResult} using the following parameters :
         * <pre>
         *      Options.credential_db, "entryByEmail", {key: username, reduce: false},
         * </pre>
         * @param username {string}
         * @param callback {function(entry: lazyboyjs.LazyInstance):void}
         * @private
         */
        private _getEntryByUserName(username: string, callback: (entry: lazyboyjs.LazyInstance) => void): void {
            this.LazyBoy.GetViewResult(
                this.Options.credential_db,
                "entryByEmail",
                {key: username, reduce: false},
                (error: Error, result: any): void => {
                    if (error) {
                        Log.c("LazyDataServer", "_getEntryByUserName", "LazyBoy.GetViewResult", error);
                        throw error;
                    }
                    if (result.length == 0) {
                        // throw new DataSourceException("no user found", UserCodeException.NOT_FOUND);
                        Log.d("LazyDataServer", "_getEntryByUserName", "LazyBoy.GetViewResult", "no user found");
                        return callback(null);
                    } else if (result.length > 1) {
                        //throw new DataSourceException("more than one user was found", UserCodeException.DUPLICATE_FOUND);
                        Log.d("LazyDataServer", "_getEntryByUserName", "LazyBoy.GetViewResult", "more than one user was found");
                        return callback(null);
                    }
                    Log.d("LazyDataServer", "_getEntryByUserName", "LazyBoy.GetViewResult", "one user was found");
                    callback(result[0].value);
                });
        }

        /**
         * Shorter to execute {@link LazyDataServer.UpdateEntry} on the "credential_db".
         * @param entry {lazyboyjs.LazyInstance}
         * @param callback {function(updated: boolean):void}
         * @private
         */
        private _updateUserEntry(entry: lazyboyjs.LazyInstance, callback: (updated: boolean) => void): void {
            this.LazyBoy.UpdateEntry(
                this.Options.credential_db,
                entry,
                (error: any, updated: boolean, updatedEntry: lazyboyjs.LazyInstance): void => {
                    if (error) {
                        Log.c("LazyDataServer", "updateUserEntry", "LazyBoy.UpdateEntry", error);
                        throw error;
                    }
                    Log.d("LazyDataServer", "updateUserEntry", "LazyBoy.UpdateEntry", updated, updatedEntry);
                    callback(updated);
                });
        }
    }
    /**
     * @classdesc Data source using Async/Await to ensure the use of {@link Promise} toward the library.
     */
    export class LazyDataServerAsync extends LazyDataServerBase implements UacDdaAsync {

        private LazyBoyAsync: lazyboyjs.LazyBoyAsync;

        /**
         * @param options {@link LazyDataSourceConfig}
         */
        constructor(options?: LazyDataSourceConfig) {
            super(options);
            this.LazyBoyAsync = this.Options.LazyBoyAsync;
            if (!this.LazyBoyAsync) {
                this.LazyBoyAsync = new lazyboyjs.LazyBoyAsync(this.Options.LazyBoyOptions);
            }
        }

        /**
         * In order to establish connection with all the require databases, this method should be call before
         * any data manipulation.
         * @return {Promise<{error: DataSourceException, result: any}>}
         */
        async ConnectAsync(): Promise<{error: DataSourceException, result: any}> {
            return new Promise<{error: DataSourceException, result: any}>(async(resolve, reject) => {
                let r: {error: DataSourceException, result: any} = {error: null, result: null};
                try {
                    let boy = this.LazyBoyAsync.Databases(this.Options.credential_db, this.Options.profile_db);
                    let report = await boy.InitializeAllDatabasesAsync();
                    if (report.success.length !== 2) {
                        r.error = new DataSourceException("Databases were not generated properly");
                        r.result = report;
                        return resolve(r);
                    }
                    await boy.ConnectAsync();
                    return resolve(r);
                } catch (exception) {
                    Log.c("LazyDataServerAsync", "ConnectAsync", exception);
                    return reject(exception)
                }
            });
        }

        /**
         * Given an userId, if a match is found a {@link DataModel.User} instance will be return.
         * @param userId {string}
         * @return {Promise<DataModel.User>}
         */
        async GetUserByUserIdAsync(userId: string): Promise<DataModel.User> {
            return new Promise<DataModel.User>(async(resolve, reject) => {
                try {
                    let r = await this._getEntryByUserIdAsync(userId);
                    return resolve(new DataModel.User(r));
                } catch (exception) {
                    Log.c("LazyDataServerAsync", "GetUserByUserIdAsync", exception);
                    return reject(exception)
                }
            });
        }

        /**
         * Async shorter to retrieve a {@link DataModel.User} instance from the {@link lazyboyjs.LazyInstance}
         * from the {@link LazyBoyAsync}
         * @param username
         * @return {Promise<DataModel.User>}
         */
        async GetUserByUserNameAsync(username: string): Promise<DataModel.User> {
            return new Promise<DataModel.User>(async(resolve, reject) => {
                try {
                    let r = await this._getEntryByUserNameAsync(username);
                    return resolve(r != null ? new DataModel.User(r) : null);
                } catch (exception) {
                    Log.c("LazyDataServerAsync", "GetUserByUserIdAsync", exception);
                    return reject(exception)
                }
            });
        }

        /**
         * Async shorter to insert a {@link DataModel.User} instance into the database.
         * @param user {DataModel.User}
         * @return {Promise<{added:boolean, user: DataModel.User}>}
         */
        async InsertUserAsync(user: DataModel.User): Promise<{added: boolean, user: DataModel.User}> {
            return new Promise<{added: boolean, user: DataModel.User}>(async(resolve, reject) => {
                let r: {added: boolean, user: DataModel.User} = {added: false, user: null};
                try {
                    let exist = await this._userExistAsync(user);
                    if (!exist) {
                        let report = await this._addUserEntryAsync(user);
                        r.added = report.success;
                        r.user = new DataModel.User(report.entry);
                    }
                    return resolve(r);
                } catch (exception) {
                    Log.c("LazyDataServerAsync", "InsertUserAsync", exception);
                    return reject(exception)
                }
            });
        }

        /**
         * Async shorter to update User {@link DataModel.User} instance in the deb
         * @param user {DataModel.User}
         * @return {Promise<{updated:boolean, user:DataModel.User}>}
         */
        async UpdateUserAsync(user: DataModel.User): Promise<{updated: boolean, user: DataModel.User}> {
            return new Promise<{updated: boolean, user: DataModel.User}>(async(resolve, reject) => {
                let r: {updated: boolean, user: DataModel.User} = {updated: false, user: null};
                try {
                    let entry = await this._getUserEntryAsync(user);
                    if (entry) {
                        entry.instance = user;
                        let report = await this._updateUserEntryAsync(entry);
                        r.updated = report.updated;
                        r.user = new DataModel.User(report.data);
                    }
                    return resolve(r);
                } catch (exception) {
                    Log.c("LazyDataServerAsync", "UpdateUserAsync", exception);

                    return reject(exception)
                }
            });
        }

        /**
         * Given the userId the {@link lazyboyjs.LazyInstance} will be flag as deleted.
         * @param userId {string}
         * @return {Promise<boolean>}
         */
        async DeleteUserAsync(userId: string): Promise<boolean> {
            return new Promise<boolean>(async(resolve, reject) => {
                let r: boolean = false;
                try {
                    let entry = await this._getEntryByUserIdAsync(userId);
                    if (entry) {
                        let report = await this.LazyBoyAsync.DeleteEntryAsync(this.Options.credential_db, entry, false);
                        r = report.deleted;
                    }
                    return resolve(r);
                } catch (exception) {
                    Log.c("LazyDataServerAsync", "DeleteUserAsync", exception);
                    return reject(exception)
                }
            });
        }

        /**
         * Async shorter
         * @return {Promise<DataModel.User[]>}
         * @constructor
         */
        async GetAllUsersAsync(): Promise<DataModel.User[]> {
            return new Promise<DataModel.User[]>(async(resolve, reject) => {
                let r: DataModel.User[] = [];
                try {
                    let report = await this.LazyBoyAsync.GetViewResultAsync(
                        this.Options.credential_db,
                        "allUsersNotDeleted", {reduce: false});
                    if (report.result && report.result.length > 0) {
                        for (let i = 0; i < report.result.length; i++) {
                            let e = report.result[i].value;
                            let u = new DataModel.User();
                            let keys = Object.keys(e);
                            for (let key of keys) {
                                u[key] = e[key];
                            }
                            r.push(u);
                        }
                    }
                    return resolve(r);
                } catch (exception) {
                    Log.c("LazyDataServerAsync", "GetAllUsersAsync", exception);
                    return reject(exception)
                }
            });
        }

        async AddAvatarAsync(userId: string, path: string): Promise<boolean> {
            return new Promise<boolean>(async(resolve) => {
                if (!userId || !path) {
                    return resolve(false);
                }
                let entry = await this._getProfileEntryByUserId(userId);
                if (!entry) {
                    let insert = await this.LazyBoyAsync.AddEntryAsync(this.Options.profile_db, {
                        type: 'avatar',
                        data: {UserId: userId}
                    });
                    if (insert.error) {
                        Log.e("LazyDataServerAsync", "AddAvatarAsync", "AddEntryAsync", insert.error.toString());
                        return resolve(false);
                    }
                    entry = insert.entry;
                }
                let doc = await this.LazyBoyAsync.AddFileAsAttachmentAsync(this.Options.profile_db, entry._id, entry._rev, "avatar", path);
                if (doc.error) {
                    Log.e("LazyDataServerAsync", "AddAvatarAsync", "AddFileAsAttachment", doc.error.toString());
                    return resolve(false);
                }
                return resolve(true);
            });
        }

        async GetUserAvatarAsync(userId: string): Promise<{name: string; extension: string; data: Buffer}> {
            return new Promise<{name: string; extension: string; data: Buffer}>(async(resolve) => {
                if (!userId) {
                    return resolve(null);
                }
                let entry = await this._getProfileEntryByUserId(userId);
                if (!entry) {
                    return resolve(null);
                }
                let info = await this.LazyBoyAsync.GetAttachmentInfoAsync(this.Options.profile_db, entry._id, "avatar");
                if (!info) {
                    return resolve(null);
                }
                let data = await this.LazyBoyAsync.GetAttachmentAsync(this.Options.profile_db, entry._id, "avatar");
                return resolve({
                    name: 'avatar',
                    extension: mime.extension(info.content_type),
                    data: new Buffer(data.body.buffer, 'utf-8')
                });
            });
        }


        async GetUserAvatarStreamAsync(userId: string): Promise<{name: string; extension: string; data: NodeJS.ReadableStream}> {
            return new Promise<{name: string; extension: string; data: NodeJS.ReadableStream}>(async(resolve) => {
                if (!userId) {
                    return resolve(null);
                }
                let entry = await this._getProfileEntryByUserId(userId);
                if (!entry) {
                    return resolve(null);
                }
                let info = await this.LazyBoyAsync.GetAttachmentInfoAsync(this.Options.profile_db, entry._id, "avatar");
                if (!info) {
                    return resolve(null);
                }
                let stream = await this.LazyBoyAsync.GetAttachmentStreamAsync(this.Options.profile_db, entry._id, "avatar");
                return resolve({name: 'avatar', extension: mime.extension(info.content_type), data: stream});
            });
        }

        /**
         * Shorter to search entry by UserId or UserName if one of those properties exist in the {@code user}
         * @param user {@link DataModel.User}
         * @throw {@link DataSourceException}
         * @return {Promise<boolean>}
         * @private
         */
        private async _userExistAsync(user: DataModel.User): Promise<boolean> {
            return new Promise<boolean>(async(resolve) => {
                let r: boolean = false;
                if (user) {
                    if (user.Id) {
                        let entry = await this._getEntryByUserIdAsync(user.Id);
                        r = entry != null && !entry.isDeleted;
                        return resolve(r);
                    } else if (user.Email) {
                        let entry = await this._getEntryByUserNameAsync(user.Email);
                        r = entry != null && !entry.isDeleted;
                        return resolve(r);
                    } else {
                        let error = new DataSourceException("invalid data");
                        Log.c("LazyDataServer", "userExistAsync", error);
                        throw error;
                    }
                } else {
                    let error = new DataSourceException("invalid data");
                    Log.c("LazyDataServer", "userExistAsync", error);
                    throw error;
                }
            });
        }

        /**
         * Shorter to retrieve the entry {@link lazyboyjs.LazyInstance} from the database using either the
         * UserId or the UserName property of the parameter {@code user}
         * @param user {DataModel.User}
         * @return {Promise<lazyboyjs.LazyInstance>}
         * @private
         */
        private async _getUserEntryAsync(user: DataModel.User): Promise<lazyboyjs.LazyInstance> {
            return new Promise<lazyboyjs.LazyInstance>(async(resolve, reject) => {
                let r: lazyboyjs.LazyInstance = null;
                try {
                    if (user) {
                        if (user.Id && user.Id.length > 0) {
                            let entry = await this._getEntryByUserIdAsync(user.Id);
                            r = entry.isDeleted ? null : entry
                        } else if (user.Email && user.Email.length > 0) {
                            let entry = await this._getEntryByUserNameAsync(user.Email);
                            r = entry.isDeleted ? null : entry
                        }
                    }
                    return resolve(r);
                } catch (exception) {
                    Log.c("LazyDataServerAsync", "_getUserEntryAsync", exception);
                    return reject(exception)
                }
            });
        }

        /**
         * Shorter to execute {@link AddEntry} on "credential_db". All conflict, update or delete
         * should be managed here.
         * @param data {object}
         * @return {Promise<{success: boolean, entry: lazyboyjs.LazyInstance}>}
         * @private
         */
        private async _addUserEntryAsync(data: any): Promise<{success: boolean, entry: lazyboyjs.LazyInstance}> {
            return new Promise<{success: boolean, entry: lazyboyjs.LazyInstance}>(async(resolve, reject) => {
                let r: {success: boolean, entry: lazyboyjs.LazyInstance} = {success: false, entry: null};
                try {
                    let report = await this.LazyBoyAsync.AddEntryAsync(this.Options.credential_db, {
                        type: "user",
                        data: data
                    });
                    Log.d("LazyDataServer", "addUserEntryAsync", "LazyBoyAsync.AddEntryAsync", report.entry);
                    switch (report.result) {
                        case lazyboyjs.InstanceCreateStatus.Created:
                            Log.d("LazyDataServer", "addUserEntryAsync", "LazyBoyAsync.AddEntryAsync", "Instance Created");
                            r.success = true;
                            r.entry = report.entry;
                            break;
                        case lazyboyjs.InstanceCreateStatus.Conflict:
                            Log.d("LazyDataServer", "addUserEntryAsync", "LazyBoyAsync.AddEntryAsync", "Instance Conflict");

                            r.success = false;
                            r.entry = report.entry;
                            break;
                        default:
                            Log.c("LazyDataServer", "addUserEntryAsync", "LazyBoyAsync.AddEntryAsync", "not managed code : " + report.result);
                            r.success = false;
                            r.entry = report.entry;
                            break;
                    }
                    return resolve(r);
                } catch (exception) {
                    Log.c("LazyDataServerAsync", "_addUserEntryAsync", exception);
                    return reject(exception)
                }
            });
        }

        /**
         * Shorter to select an {@link DataModel.User} instance given an userId.
         * This function execute {@link GetViewResult} using the following parameters :
         * <pre>
         *      Options.credential_db, "entryByUserId", {key: userId, reduce: false},
         * </pre>
         * @param userId {string}
         * @return {Promise<lazyboyjs.LazyInstance>}
         * @private
         */
        private async _getEntryByUserIdAsync(userId: string): Promise<lazyboyjs.LazyInstance> {
            return new Promise<lazyboyjs.LazyInstance>(async(resolve) => {
                let r: lazyboyjs.LazyInstance = null;
                let report = await this.LazyBoyAsync.GetViewResultAsync(this.Options.credential_db, "entryByUserId", {
                    key: userId,
                    reduce: false
                });
                if (report.error) {
                    Log.c("LazyDataServerAsync", "getEntryByUserIdAsync", "LazyBoyAsync.GetViewResultAsync", report.error);
                    throw report.error;
                }
                if (report.result.length == 0) {
                    Log.d("LazyDataServer", "getEntryByUserIdAsync", "LazyBoyAsync.GetViewResultAsync", "no entry found");
                    return resolve(r);
                } else if (report.result.length > 1) {
                    //throw new DataSourceException("more than one user was found", UserCodeException.DUPLICATE_FOUND);
                    Log.d("LazyDataServer", "getEntryByUserIdAsync", "LazyBoyAsync.GetViewResultAsync", "more than one entry was found");
                    return resolve(r);
                }
                Log.d("LazyDataServer", "getEntryByUserIdAsync", "LazyBoyAsync.GetViewResultAsync", "one entry was found");
                return resolve(report.result[0].value);
            });
        }

        /**
         * Shorter to select an {@link DataModel.User} instance given an username.
         * This function execute {@link GetViewResult} using the following parameters :
         * <pre>
         *      Options.credential_db, "entryByEmail", {key: username, reduce: false},
         * </pre>
         * @param username {string}
         * @return {Promise<lazyboyjs.LazyInstance>}
         * @private
         */
        private async _getEntryByUserNameAsync(username: string): Promise<lazyboyjs.LazyInstance> {
            return new Promise<lazyboyjs.LazyInstance>(async(resolve, reject) => {
                try {
                    let report = await this.LazyBoyAsync.GetViewResultAsync(
                        this.Options.credential_db, "entryByEmail", {key: username, reduce: false});
                    if (report.result.length == 0) {
                        // throw new DataSourceException("no user found", UserCodeException.NOT_FOUND);
                        Log.d("LazyDataServer", "getEntryByUserNameAsync", "LazyBoyAsync.GetViewResultAsync", "no user found");
                        return resolve(null);
                    } else if (report.result.length > 1) {
                        //throw new DataSourceException("more than one user was found", UserCodeException.DUPLICATE_FOUND);
                        Log.d("LazyDataServer", "getEntryByUserNameAsync", "LazyBoyAsync.GetViewResultAsync", "more than one user was found");
                        return resolve(null);
                    }
                    Log.d("LazyDataServer", "getEntryByUserNameAsync", "LazyBoyAsync.GetViewResultAsync", "one user was found");
                    return resolve(report.result[0].value);
                } catch (exception) {
                    Log.c("LazyDataServerAsync", "_getEntryByUserNameAsync", exception);
                    return reject(exception)
                }
            });
        }

        /**
         * Shorter to execute {@link LazyDataServer.UpdateEntry} on the "credential_db".
         * @param entry {lazyboyjs.LazyInstance}
         * @return {Promise<{error: Error, updated: boolean, data: lazyboyjs.LazyInstance}>}
         * @private
         */
        private async _updateUserEntryAsync(entry: lazyboyjs.LazyInstance): Promise<{
            error: Error, updated: boolean,
            data: lazyboyjs.LazyInstance
        }> {
            return new Promise<{error: Error; updated: boolean; data: lazyboyjs.LazyInstance;}>(
                async(resolve, reject) => {
                    try {
                        let report = await this.LazyBoyAsync.UpdateEntryAsync(this.Options.credential_db, entry);
                        Log.d("LazyDataServer", "updateUserEntryAsync", "LazyBoyAsync.UpdateEntryAsync", report.updated, report.data);
                        return resolve(report);
                    } catch (exception) {
                        Log.c("LazyDataServerAsync", "_updateUserEntryAsync", exception);
                        return reject(exception)
                    }
                });
        }

        private async _getProfileEntryByUserId(userId: string) {
            return new Promise<lazyboyjs.LazyInstance>(async(resolve, reject) => {
                let view = await this.LazyBoyAsync.GetViewResultAsync(this.Options.profile_db, "profileEntryByUserId", {
                    key: userId,
                    reduce: false
                });
                if (view.error) {
                    Log.e("LazyDataServerAsync", "_getProfileEntryByUserId", "GetViewResultAsync", view.error);
                    return reject(view.error);
                }
                if (view.result.length === 0 || view.result.length > 1) {
                    return resolve(null);
                }
                return resolve(view.result[0].value);
            });
        }
    }


    let userByEmail: lazyboyjs.LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Email') && !doc.isDeleted){ emit(doc.instance.Email, doc.instance ); }}",
        reduce: "_count()"
    };
    let userByUserId: lazyboyjs.LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Id') && !doc.isDeleted) { emit(doc.instance.Id, doc.instance); } }",
        reduce: "_count()"
    };
    let entryByEmail: lazyboyjs.LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Email') && !doc.isDeleted){ emit(doc.instance.Email, doc); }}",
        reduce: "_count()"
    };
    let entryByUserId: lazyboyjs.LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('Id') && !doc.isDeleted) { emit(doc.instance.Id, doc); } }",
        reduce: "_count()"
    };
    let deletedTypeEntry: lazyboyjs.LazyView = {
        map: "function(doc){ if(doc.isDeleted) { emit(doc.type, doc); } }",
        reduce: "_count()"
    };
    let allUsersNotDeleted: lazyboyjs.LazyView = {
        map: "function(doc){ if(!doc.isDeleted && doc.type.toLowerCase() == 'user') { emit(doc.type, doc.instance); } }",
        reduce: "_count()"
    };
    let userViews: lazyboyjs.LazyDesignViews = {
        version: 1,
        type: 'javascript',
        views: {
            'userByUserId': userByUserId,
            'userByEmail': userByEmail,
            'entryByUserId': entryByUserId,
            'entryByEmail': entryByEmail,
            'deletedTypeEntry': deletedTypeEntry,
            'allUsersNotDeleted': allUsersNotDeleted
        }
    };
    let profileByUserId: lazyboyjs.LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('UserId') && !doc.isDeleted){ emit(doc.instance.UserId, doc.instance); }}",
        reduce: "_count()"
    };
    let profileEntryByUserId: lazyboyjs.LazyView = {
        map: "function(doc){ if(doc.instance.hasOwnProperty('UserId') && !doc.isDeleted){ emit(doc.instance.UserId, doc); }}",
        reduce: "_count()"
    };
    let profileViews: lazyboyjs.LazyDesignViews = {
        version: 2,
        type: 'javascript',
        views: {
            'profileByUserId': profileByUserId,
            'profileEntryByUserId': profileEntryByUserId
        }
    };
    export enum UserCodeException {
        NOT_FOUND = 1,
        ALREADY_EXIST = 1 << 1,
        DUPLICATE_FOUND = 1 << 2
    }

    export class DataSourceException extends Error {
        private code: UserCodeException;

        constructor(message: string, code?: UserCodeException) {
            super(message);
            this.code = code;
        }

        toString() {
            return this.message + " code: " + this.code;
        }
    }

    export interface Callback {
        (error: DataSourceException, result: any|{}): void;
    }

    export interface LazyDataSourceConfig {
        credential_db?: string,
        profile_db?: string,
        LazyBoy?: lazyboyjs.LazyBoy,
        LazyBoyAsync?: lazyboyjs.LazyBoyAsync,
        LazyBoyOptions?: lazyboyjs.LazyOptions
    }

    /**
     *
     * @classdesc Interface representing the requirements for a valid DataSource Object.
     */
    export interface UacDBA {
        isReady: boolean;
        Connect(callback: Callback): void;
        GetUserByUserId(userId: string, callback: (user: DataModel.User) => void): void;
        GetUserByUserName(username: string, callback: (user: DataModel.User) => void): void;
        InsertUser(user: DataModel.User, callback: (success: boolean) => void): void;
        UpdateUser(user: DataModel.User, callback: (success: boolean) => void): void;
        DeleteUser(userId: string, callback: (success: boolean) => void): void;
        GetAllUsers(callback: (list: DataModel.User[]) => void): void;
        AddAvatar(userId: string, path: string, callback: (success: boolean) => void): void;
    }

    export interface UacDdaAsync {

        ConnectAsync(): Promise<{error: DataSourceException, result: any}>;
        GetUserByUserIdAsync(userId: string): Promise<DataModel.User>;
        GetUserByUserNameAsync(username: string): Promise<DataModel.User>;
        InsertUserAsync(user: DataModel.User): Promise<{added: boolean, user: DataModel.User}>;
        UpdateUserAsync(user: DataModel.User): Promise<{updated: boolean, user: DataModel.User}>;
        DeleteUserAsync(userId: string): Promise<boolean>;
        GetAllUsersAsync(): Promise<DataModel.User[]>;
        AddAvatarAsync(userId: string, path: string): Promise<boolean>;
        GetUserAvatarStreamAsync(userId: string): Promise<{name: string, extension: string, data: ReadableStream}>;
        GetUserAvatarAsync(userId: string): Promise<{name: string, extension: string, data: Buffer}>;
    }

}