# LAZY-UAC #

Base on [LazyBoyJs](https://github.com/pteyssedre/lazyboyjs) this library provide an User-Access-Control  layer.
Easily add users with authentication and roles to quickly develop an application using CouchDB as database.

### Install ###
```
npm install lazy-uac
```

### Setup ###


* Without configuration

```typescript
import  LazyUAC = require("lazy-uac");

let manager = new LazyUAC.UserManager()
```
the `UserManager` will use the default settings values
```typescript
{
        logLevel: lazyFormatLogger.LogLevel.VERBOSE,
        useAsync: false,
        dataSource: new DataService.UacDBA(),
        dataSourceAsync: null,
        dataSourceOptions: {
            credential_db: "auth",
            profile_db: "profile",
            LazyBoyOptions: {
                prefix: "uac",
                autoConnect: true,
                views: {}
            }
        }
    }
```