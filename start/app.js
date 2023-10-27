'use strict'

const path = require('path')

const providers = [
  '@adonisjs/framework/providers/AppProvider',
  'adonis-sentry/providers/Sentry',
  '@adonisjs/auth/providers/AuthProvider',
  '@adonisjs/ally/providers/AllyProvider',
  'adonis-advanced-serializer',
  '@adonisjs/bodyparser/providers/BodyParserProvider',
  '@adonisjs/cors/providers/CorsProvider',
  '@adonisjs/lucid/providers/LucidProvider',
  'adonis-lucid-filter/providers/LucidFilterProvider',
  '@adonisjs/framework/providers/ViewProvider',
  '@adonisjs/validator/providers/ValidatorProvider',
  '@adonisjs/redis/providers/RedisProvider',
  '@adonisjs/drive/providers/DriveProvider',
  '@adonisjs/antl/providers/AntlProvider',
  '@adonisjs/mail/providers/MailProvider',
  'adonis-twilio-node/providers/TwilioProvider',
  '@adonisjs/websocket/providers/WsProvider',

  'adonis-cache/providers/CacheProvider',

  'adonis-acl/providers/AclProvider',
  path.join(__dirname, '..', 'providers', 'RequestLog/Provider'),
  path.join(__dirname, '..', 'providers', 'GoogleOAuthProvider'),

  path.join(__dirname, '..', 'providers', 'Notifications/Provider'),
  path.join(__dirname, '..', 'providers', 'Static/Provider'),
  path.join(__dirname, '..', 'providers', 'DataStorage/Provider'),
  path.join(__dirname, '..', 'providers', 'Localize/Provider'),

  path.join(__dirname, '..', 'providers', 'GeoAPIProvider'),
  path.join(__dirname, '..', 'providers', 'QueueProvider'),

  path.join(__dirname, '..', 'providers', 'Zendesk/Provider')
]

// 'barudo-adonis-swagger/providers/SwaggerProvider',

const aceProviders = [
  '@adonisjs/lucid/providers/MigrationsProvider',
  'adonis-acl/providers/CommandsProvider',
  '@adonisjs/vow/providers/VowProvider',
  'adonis-cache/providers/CommandsProvider',
  'adonis-twilio-node/providers/TwilioProvider'
]

/*
|--------------------------------------------------------------------------
| Aliases
|--------------------------------------------------------------------------
|
| Aliases are short unique names for IoC container bindings. You are free
| to create your own aliases.
|
| For example:
|   { Route: 'Adonis/Src/Route' }
|
*/
const aliases = {
  Role: 'Adonis/Acl/Role',
  Permission: 'Adonis/Acl/Permission',
  Cache: 'Adonis/Addons/Cache'
}

const commands = [
  'App/Commands/CreateAdmin',
  'App/Commands/ClearCache',
  'App/Commands/Recalc',
  'App/Commands/PullOhnemakler',
  'App/Commands/PullGewobag',
  'App/Commands/FillWbs',
  'App/Commands/FillCitizen'
]

const http = {
  loggerEnv: ['development', 'production']
}

module.exports = { providers, aceProviders, aliases, commands, http }
