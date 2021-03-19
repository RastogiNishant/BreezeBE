'use strict'

const path = require('path')
const Helpers = use('Helpers')

/*
|--------------------------------------------------------------------------
| Providers
|--------------------------------------------------------------------------
|
| Providers are building blocks for your Adonis app. Anytime you install
| a new Adonis specific package, chances are you will register the
| provider here.
|
*/
let providers = []

providers.push('@adonisjs/framework/providers/AppProvider')
providers.push('adonis-sentry/providers/Sentry')
providers.push('@adonisjs/auth/providers/AuthProvider')
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
providers.push('adonis-cache/providers/CacheProvider')

providers.push('adonis-acl/providers/AclProvider')
providers.push(path.join(__dirname, '..', 'providers', 'RequestLog/Provider'))

providers.push(path.join(__dirname, '..', 'providers', 'Notifications/Provider'))
providers.push(path.join(__dirname, '..', 'providers', 'Static/Provider'))

// add this only on non command execute
if (!Helpers.isAceCommand() || process.env.NODE_ENV === 'testing') {
  providers.push(path.join(__dirname, '..', 'providers', 'DataStorage/Provider'))
}

if (process.env.NODE_ENV !== 'production') {
  providers.push('adonis-swagger/providers/SwaggerProvider')
}

const aceProviders = [
  '@adonisjs/lucid/providers/MigrationsProvider',
  'adonis-acl/providers/CommandsProvider',
  '@adonisjs/vow/providers/VowProvider',
  'adonis-cache/providers/CommandsProvider',
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

/*
|--------------------------------------------------------------------------
| Commands
|--------------------------------------------------------------------------
|
| Here you store ace commands for your package
|
*/
const commands = []

const http = {
  loggerEnv: ['development', 'production'],
}

module.exports = { providers, aceProviders, aliases, commands, http }
