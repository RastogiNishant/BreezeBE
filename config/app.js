'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

const {
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
} = require('../app/constants')

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
    type: 'service_account',
    project_id: 'breeze-87b50',
    private_key_id: '8bb7a990f0f71ef9bce7102ce3bf3800318b9023',
    private_key:
      '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC1YYKlcues4tke\n2IoApVlnmtxpmsq01k3bxA2eoTbfH0eMkmijuFqGeuP0pQyWbTEd0ppvEyCgTn2k\nADC1QZxKxZ+0UYOQx+lOI6b4X99sy8Lb2PdYOf7KZR1MjS+FID620sM/KsfAL0iC\nnamN6vXXPTx6Uwtv74Lr/TzJZKfxpbsj5Mih8lfnBpWThPLkzQEI/+NDmb/1X85R\nm9witijuwF3DsYCpa0aKDAwH6sTKodk3uFkQ5MaD7Z00A9s5OcZSarw7jQRAczJ3\nliJoLxg9WiPcf6Idy/JP1v4Wrds3nlxgDkVYy75o+OJ4ka4t0vWnyEgRU3x6ueRn\naz8OCbLjAgMBAAECggEAAK4bhEcoPDs4edDGwfrcvb6LRCDeAZIbGGS996o7a5tI\nHArNvFsKZM7vA1xG+jXlOS5I6Kw8tjNDntD5FKPEXVTWtDOyI8Mx2X8WAyrVn80S\njdsx6anNDgnANq7pgnDsP9lK/Tj0lL2XH5vHyAx4qOVPAT6zqU0AZThG4+gMjE49\nXcliwC7ABtjLLlot9JY9EXhIOaZ07ef4FyMPV0BXFXQeGwHLf8kmMxoRu2EVQnul\no7cFFutJ3/FYPg/icCweapWL3OgtjFtuluSpwOW+N7TyqqZOHwe394GO7czx+UPN\nSE9aE2jWsSt/XkVl9JvzZpmRqgiJXu1FJvb2Opjl+QKBgQD1rYEDOs/KI4uPQzW5\nb9XzS2spxdGYt0SrRj+yY39s6tkWep2XvnIEMzxTdr1+NyvZ77xdIMARNCAX4syx\ndUgq742kYN3P7pr/iFD13wnP0t0eTnUjQXk43l1bQ42gV8F/k4BOFUhrtqYD9Ia1\nfLMGU0cfjvJbZXJHzJaivKLIewKBgQC9AG7ee5KMTGLciniGUbcYwnMV+xMgcLy2\nZHjotaZAHKVv7t7ygd/NB0h9fQ4mqL2TzSOAeo0yug6P1P1lFiJBCaiQcwlQSWHX\nXhQbp9s5EKZzrmohMw4lIWg3kj8MWNEOY6sOQeQAadkRTpX74kJtNMmCN5wptA0E\naYA/6XDWuQKBgQDtaHwqhdO0j8LWb2lkSDllQXVOSbZwsHFwXZNCLLo/o3ajLVxK\n/iOqAWUDdtRJOsFqeiv5hqN0PH3i9y09M4vIyfODbIQM4pPv6WfrIVyW8zrwhXrW\n1fdxyBhJEC+1SfhX807ipdh1Fmy5l7vxd458x08MpRN41MCpt3+9xTI9LwKBgGqF\nuPcJ/KG4V6vnG2DQ43o/9e84kCIjiCjgXckCwE24F4ILxno1urZq2W9osTYWuqp3\n3v+Fktk5RgXIzHxRykKPuAKZ43DtuwhQTNL9ezAhcz8V2VkW1m0U9BEGCyThVgpf\nIESr3F5jSeVYPm41qqy0KLKMtyZGBWQsNg1Pe7p5AoGBAO6edyrFOx20bYXjLyhp\ne/bjdaYmfEmk9g6wFrkEZ1OgAiZ0UNJa0LVwt6nvxQbNzU2bufxtZ5XDNONJKB6M\nmLahQVY1Byt8qFaobmf/6z2YuyaWmC9NZUm3mtejBwGT8j+vBdKiuWeJBZcvKS/J\nw9toD8DrWZsKTR4IHc2nkUW3\n-----END PRIVATE KEY-----\n',
    client_email: 'firebase-adminsdk-i7t6y@breeze-87b50.iam.gserviceaccount.com',
    client_id: '104542712974222505249',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url:
      'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-i7t6y%40breeze-87b50.iam.gserviceaccount.com',
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
    googleAccountPrivateKey: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    appleShareSecret: Env.get('APPLE_SHARED_SECRET'),
    iapTestMode: Env.get('IAP_TEST_MODE'),
  },

  localize: {
    projectId: '1793da5d3fb996546d6ea103110e9c4b',
    accessToken: 'f9181d4a284578d5793f11080375cc610a5d12be5cac4e333311e3e4d529e52f',
  },
}
