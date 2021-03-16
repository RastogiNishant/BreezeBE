'use strict'

const Env = use('Env')

module.exports = {

  default: Env.get('CACHE_STORE', null),

  /*
  |--------------------------------------------------------------------------
  | Cache Stores
  |--------------------------------------------------------------------------
  |
  | Here you may define all of the cache "stores" for your application as
  | well as their drivers. You may even define multiple stores for the
  | same cache driver to group types of items stored in your caches.
  |
  | Supported drivers: "object", "database", "redis"
  |
  | Hint: Use "null" driver for disabling caching
  | Warning: Use the "object" driver only for development, it does not have a garbage collector.
  |
  */

  stores: {
    object: {
      driver: 'object',
    },

    database: {
      driver: 'database',
      table: 'cache',
      connection: 'sqlite',
    },

    redis: {
      driver: 'redis',
      connection: 'local',
    },

    null: {
      driver: 'null',
    },
  },

  prefix: 'breeze',
}
