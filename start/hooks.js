const { hooks } = require('@adonisjs/ignitor')
const { ioc } = require('@adonisjs/fold')
const debug = require('debug')('query')
const KnexPostgis = require('knex-postgis')

const { truncate, reduce, get, toString, isString } = require('lodash')

const {
  extendsValidator,
  extendsRequest,
  extendsResponse,
  extendsView,
} = require('../app/Libs/Extends.js')
const { GLOBAL_CACHE_KEY, GLOBAL_CACHE_OPTION } = require('../app/constants.js')

ioc.bind('App/Serializers/UserSerializer', () => {
  return require('../app/Serializers/UserSerializer')
})

// After app started
hooks.after.providersBooted(async () => {
  // const Socket = use('Socket')
  const Helpers = use('Helpers')
  const Event = use('Event')
  const Logger = use('Logger')
  const Database = use('Database')
  const DataStorage = use('DataStorage')
  Database.gis = KnexPostgis(Database)

  if (!Helpers.isAceCommand() || process.env.NODE_ENV === 'testing') {
    const Static = use('Static')
    await Static.init()
  }

  // Load i18n dictionaries
  const Localize = use('Localize')
  await Localize.init()

  if (!Helpers.isAceCommand()) {
    const Queue = use('Queue')
    await Queue.init()
  }

  await DataStorage.remove(GLOBAL_CACHE_KEY, GLOBAL_CACHE_OPTION)

  // Log all internal events
  Event.onAny((name, data) => {
    // Do not log Cache event
    if (name.search('Cache') === 0) {
      return false
    }
    Logger.info(truncate(JSON.stringify({ name, data }), { length: 500 }))
  })

  // Log all queries
  Database.on('query', ({ sql, bindings }) => {
    debug(
      reduce(
        sql.split('?'),
        (n, v, k) => {
          const rawVal = get(bindings, k)
          const value = isString(rawVal) ? `'${rawVal}'` : toString(rawVal)
          return `${n}${v}${value}`
        },
        ''
      )
    )
  })

  extendsView()
  extendsValidator()
  extendsRequest()
  extendsResponse()
})
