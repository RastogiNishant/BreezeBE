'use strict'

const path = require('path')
const Helpers = use('Helpers')

let providers = []

providers.push('@adonisjs/framework/providers/AppProvider')
providers.push('adonis-sentry/providers/Sentry')
providers.push('@adonisjs/auth/providers/AuthProvider')
providers.push('@adonisjs/ally/providers/AllyProvider')
providers.push('adonis-advanced-serializer')
providers.push('@adonisjs/bodyparser/providers/BodyParserProvider')
providers.push('@adonisjs/cors/providers/CorsProvider')
providers.push('@adonisjs/lucid/providers/LucidProvider')
providers.push('adonis-lucid-filter/providers/LucidFilterProvider')
providers.push('@adonisjs/framework/providers/ViewProvider')
providers.push('@adonisjs/validator/providers/ValidatorProvider')
providers.push('@adonisjs/redis/providers/RedisProvider')
providers.push('@adonisjs/drive/providers/DriveProvider')
providers.push('@adonisjs/antl/providers/AntlProvider')
providers.push('@adonisjs/mail/providers/MailProvider')
providers.push('adonis-twilio-node/providers/TwilioProvider')
providers.push('@adonisjs/websocket/providers/WsProvider')

providers.push('adonis-cache/providers/CacheProvider')

providers.push('adonis-acl/providers/AclProvider')
providers.push(path.join(__dirname, '..', 'providers', 'RequestLog/Provider'))
providers.push(path.join(__dirname, '..', 'providers', 'GoogleOAuthProvider'))

providers.push(path.join(__dirname, '..', 'providers', 'Notifications/Provider'))
providers.push(path.join(__dirname, '..', 'providers', 'Static/Provider'))
providers.push(path.join(__dirname, '..', 'providers', 'DataStorage/Provider'))
providers.push(path.join(__dirname, '..', 'providers', 'Localize/Provider'))

providers.push(path.join(__dirname, '..', 'providers', 'GeoAPIProvider'))
providers.push(path.join(__dirname, '..', 'providers', 'QueueProvider'))

providers.push(path.join(__dirname, '..', 'providers', 'Zendesk/Provider'))

providers.push('barudo-adonis-swagger/providers/SwaggerProvider')

const aceProviders = [
  '@adonisjs/lucid/providers/MigrationsProvider',
  'adonis-acl/providers/CommandsProvider',
  '@adonisjs/vow/providers/VowProvider',
  'adonis-cache/providers/CommandsProvider',
  'adonis-twilio-node/providers/TwilioProvider',
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
  Cache: 'Adonis/Addons/Cache',
}

const commands = ['App/Commands/CreateAdmin', 'App/Commands/ClearCache', 'App/Commands/Recalc']

const http = {
  loggerEnv: ['development', 'production'],
}

module.exports = { providers, aceProviders, aliases, commands, http }
