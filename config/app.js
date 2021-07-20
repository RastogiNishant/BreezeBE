'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

module.exports = {
  name: Env.get('APP_NAME', 'breeze'),
  appKey: Env.getOrFail('APP_KEY'),

  http: {
    /*
    |--------------------------------------------------------------------------
    | Allow Method Spoofing
    |--------------------------------------------------------------------------
    |
    | Method spoofing allows to make requests by spoofing the http verb.
    | Which means you can make a GET request but instruct the server to
    | treat as a POST or PUT request. If you want this feature, set the
    | below value to true.
    |
    */
    allowMethodSpoofing: true,

    /*
    |--------------------------------------------------------------------------
    | Trust Proxy
    |--------------------------------------------------------------------------
    |
    | Trust proxy defines whether X-Forwarded-* headers should be trusted or not.
    | When your application is behind a proxy server like nginx, these values
    | are set automatically and should be trusted. Apart from setting it
    | to true or false Adonis supports handful or ways to allow proxy
    | values. Read documentation for that.
    |
    */
    trustProxy: false,

    /*
    |--------------------------------------------------------------------------
    | Subdomains
    |--------------------------------------------------------------------------
    |
    | Offset to be used for returning subdomains for a given request.For
    | majority of applications it will be 2, until you have nested
    | sudomains.
    | cheatsheet.adonisjs.com      - offset - 2
    | virk.cheatsheet.adonisjs.com - offset - 3
    |
    */
    subdomainOffset: 2,

    /*
    |--------------------------------------------------------------------------
    | JSONP Callback
    |--------------------------------------------------------------------------
    |
    | Default jsonp callback to be used when callback query string is missing
    | in request url.
    |
    */
    jsonpCallback: 'callback',

    /*
    |--------------------------------------------------------------------------
    | Etag
    |--------------------------------------------------------------------------
    |
    | Set etag on all HTTP response. In order to disable for selected routes,
    | you can call the `response.send` with an options object as follows.
    |
    | response.send('Hello', { ignoreEtag: true })
    |
    */
    etag: false,
  },

  views: {
    /*
    |--------------------------------------------------------------------------
    | Cache Views
    |--------------------------------------------------------------------------
    |
    | Define whether or not to cache the compiled view. Set it to true in
    | production to optimize view loading time.
    |
    */
    cache: Env.get('CACHE_VIEWS', true),
  },

  static: {
    /*
    |--------------------------------------------------------------------------
    | Dot Files
    |--------------------------------------------------------------------------
    |
    | Define how to treat dot files when trying to server static resources.
    | By default it is set to ignore, which will pretend that dotfiles
    | does not exists.
    |
    | Can be one of the following
    | ignore, deny, allow
    |
    */
    dotfiles: 'ignore',

    /*
    |--------------------------------------------------------------------------
    | ETag
    |--------------------------------------------------------------------------
    |
    | Enable or disable etag generation
    |
    */
    etag: true,

    /*
    |--------------------------------------------------------------------------
    | Extensions
    |--------------------------------------------------------------------------
    |
    | Set file extension fallbacks. When set, if a file is not found, the given
    | extensions will be added to the file name and search for. The first
    | that exists will be served. Example: ['html', 'htm'].
    |
    */
    extensions: false,
  },

  locales: {
    loader: 'file',

    locale: 'en',
  },

  /**
   * Logger
   */
  logger: {
    transport: 'console',

    console: {
      driver: 'console',
      name: 'adonis-app',
      level: 'info',
    },

    file: {
      driver: 'file',
      name: 'adonis-app',
      filename: 'adonis.log',
      level: 'info',
    },

    notfound: {
      driver: 'file',
      name: 'adonis-app',
      filename: 'notfound.log',
      level: 'info',
    },
  },

  /*
  |--------------------------------------------------------------------------
  | Generic Cookie Options
  |--------------------------------------------------------------------------
  |
  | The following cookie options are generic settings used by AdonisJs to create
  | cookies. However, some parts of the application like `sessions` can have
  | separate settings for cookies inside `config/session.js`.
  |
  */
  cookie: {
    httpOnly: true,
    sameSite: false,
    path: '/',
    maxAge: 7200,
  },

  settings: {
    gameInviteNotificationTTL: 60, // 60 second while invite valid
    gamePlayTTL: 20 * 60, // 20 min, until game finish
  },

  httpLog: {
    env: null, // All env
    excludeRoutes: [],
  },

  firebase: {
    project_id: 'breeze-62982',
    private_key: 'firebase-adminsdk-orkfs@breeze-62982.iam.gserviceaccount.com',
    client_email:
      '-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQCdZVaOnzDLzMfI\nawhppEGRsAng9XK4IDhLg/oVYd/WUBN2KD1mlwFe3JnOWXu7yP+Bjayd+58gKwQd\nARbfnPnox3/M0yaPwq8zCra9dXXeruxjP2xPU8weYE63s34M4CGXiJ/LHSzh2plu\nUSzRrUvtTelMhoDHRrocD7WhNP9GQMgyn9UnVUL3VYGSPkTS0XCQFGQPXv8NvngJ\nx/2BUiv9hdP/9C9AkdR18b6Ahxo/uKdsUodvwILLDUW87mtnGFIIiNwQ4RZN5nvG\nC9fysRBbSRmT/qXbI/uITSKakHUqCrLmcVZVGJDDQY2LsOP7j+GKst7+Rzq0BF/w\nx/VsgkEBAgMBAAECgf8FwQehDLr7OFyxgeiv+dICIyo9KwHGZY/fmagqH3c0+uOY\nVzIzFXGs9WYL/xj8ANeKxx4MBo9cYNkdKbpdjgty5HFpzqxkKO2CI9LbZHOLaIbF\n/AQSIWBNb2Eb/1f5rpYAKUd1+CEj60VTGS7LAGa+MRL5A6UuL3aHh9oJ0jKJra8X\nsVki8RFrrMUpYpiSbaPPPwliv9QCzIYsxAoLFNjxROGHUJMTdKwhe2kVfRbfFDru\naBOetztaIR7I8KtnehGTfEqwukWQWf/0DVzpAnNdvwz7xiGc30qDxZ/l1oOBXy3Z\nK/S7CgRuq9SkxN6XcYQgVpElpDBOHyE8LWGBtKECgYEA2oKwJlBqN6ox5vbndulL\nkFMdU4FAL59UIhopLh2WXRGpttxbUQ0of/OA5t1dnx5ft+T44MVDtVFCY9/BDj6P\naYgAHEdRGo1LCau62J/ubxDwDUW/5Wp/FUOxdNj6a/dK1wUfN0Lc4mXhpwKxyWtG\nqL6Ts8MfZsL/fSVwQUbaN2ECgYEAuGZm9Kf6tzSRridLGCGwx0N5NjwPKvN5W+lL\n6wS8cLtXwtU/r/KaW2PEzg+N6FUiChvDoxdCttiwkhhzLLrYp6SjQvfWzbotlYoD\nIi5vTG/UkrMkOKVjyvnCX9Ua+3talWLnANH4zddS9Rs2ijYUfYb7ztNV+TPHpGCQ\nCAPljaECgYAH3Kfl2QLZWeBNxRhy6NX1LWhitsXOcNcgGvzcUeg1FQucLrWCZwzL\n/cDnjZNuxDMBdNWXkMFs5q2S1lwl3Q5f56rJWa+LWwYWJP2mCasUh/F7KMVMxdYo\nt7TM1Xm9JLqmneKPpHI6GxxRXAF1k8yJCcJat2yLz/xNTmmJj7kOQQKBgQCrmcAd\n1WSfsTAQ3UgowNF93fCi4+lJkyJQwh6AKvwh/HWDPmfyGNZETegLyrXIi9ENjyDU\nWQUgmy5WBqLH8WlFORUlcPZYpPVev/yChqvUeg1cJ5GBlYf0j9Cu1eYyOWzmsA9A\n2CWtiMAOkLCElicjWcZjho/vRJx4/9OJYfbxgQKBgA8slJfiudlu639hkmYOQ4T3\n2PNsgcXynHDkJEw0qX89onjS8DHSuwvAUOM14q/RzfxMAbFkr+OgTviOm5My1lk0\n1AvZi+Fj6RvUGSy+WlQUyG+V+Cu0uBrVQsOpYDPLrDwJPgfFcZ460Sj7zwivbUCH\nnhtMmd3gFwcxxRVutJxL\n-----END PRIVATE KEY-----\n',
  },

  sms: {
    id: Env.get('TWILIO_ID'),
    secret: Env.get('TWILIO_TOKEN'),
    from: Env.get('TWILIO_FROM'),
    disable: Env.get('SMS_DISABLED', false),
  },

  images: {
    avatar: {
      width: 429,
      height: 429,
    },
  },

  geo: {
    apiKey: Env.get('GEO_API_KEY'),
  },

  product: {
    googleAccountEmail: Env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
    googleAccountPrivateKey: Env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'),
    appleShareSecret: Env.get('APPLE_SHARED_SECRET'),
    iapTestMode: Env.get('IAP_TEST_MODE'),
  },

  localize: {
    projectId: '1793da5d3fb996546d6ea103110e9c4b',
    accessToken: 'f9181d4a284578d5793f11080375cc610a5d12be5cac4e333311e3e4d529e52f',
  },
}
