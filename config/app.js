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
    excludeRoutes: ['/stat'],
  },

  firebase: {
    project_id: '',
    private_key: '',
    client_email: '',
  },

  timeouts: {
    DELAY_SCORE_SETTINGS_EXPIRE: Env.get('DELAY_SCORE_SETTINGS', 300000),
    DELAY_SCORE_PROCESSING: Env.get('DELAY_SCORE_PROCESSING', 600000),
    DELAY_GUEST_INVITE_EXPIRE: Env.get('DELAY_GUEST_INVITE', 60000),
    DELAY_SCORE_REPORT_FIRST_EXPIRE: Env.get('DELAY_SCORE_REPORT_FIRST', 1800000), // 30 min until first score report
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

  ocr: {
    serverRoot: Env.get('OCR_SERVER_ROOT'),
  },

  product: {
    googleAccountEmail: Env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
    googleAccountPrivateKey: Env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY'),
    appleShareSecret: Env.get('APPLE_SHARED_SECRET'),
    iapTestMode: Env.get('IAP_TEST_MODE'),
  },
}
