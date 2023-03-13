'use strict'

const EstateFoundByHash = require('../app/Middleware/EstateFoundByHash')

/** @type {import('@adonisjs/framework/src/Server')} */
const Server = use('Server')

/*
|--------------------------------------------------------------------------
| Global Middleware
|--------------------------------------------------------------------------
|
| Global middleware are executed on each http request only when the routes
| match.
|
*/
const globalMiddleware = [
  'App/Middleware/QueryParse',
  'Adonis/Middleware/BodyParser',
  'App/Middleware/ConvertEmptyStringsToNull',
]

/*
|--------------------------------------------------------------------------
| Named Middleware
|--------------------------------------------------------------------------
|
| Named middleware is key/value object to conditionally add middleware on
| specific routes or group of routes.
|
| // define
| {
|   auth: 'Adonis/Middleware/Auth'
| }
|
| // use
| Route.get().middleware('auth')
|
*/
const namedMiddleware = {
  auth: 'Adonis/Middleware/Auth',
  guest: 'Adonis/Middleware/AllowGuestOnly',
  is: 'Adonis/Acl/Is',
  can: 'Adonis/Acl/Can',
  pagination: 'App/Middleware/Pagination',
  valid: 'App/Middleware/Validator',
  agreement: 'App/Middleware/Agreement',
  userCanValidlyChangeEmail: 'App/Middleware/UserCanValidlyChangeEmail',
  ViewEstateInvitationCodeExist: 'App/Middleware/ViewEstateInvitationCodeExist',
  ProspectHasNotRegisterYet: 'App/Middleware/ProspectHasNotRegisterYet',
  EstateFoundByHash: 'App/Middleware/EstateFoundByHash',
  UserWithEmailExists: 'App/Middleware/UserWithEmailExist',
  UserCanGetInvitationLink: 'App/Middleware/UserCanGetInvitationLink',
  LandlordOwnsThisEstate: 'App/Middleware/LandlordOwnsThisEstate',
  RoomBelongsToEstate: 'App/Middleware/RoomBelongsToEstate',
  ValidOpenImmoImport: 'App/Middleware/ValidOpenImmoImport',
  EstateFoundById: 'App/Middleware/EstateFoundById',
}

/*
|--------------------------------------------------------------------------
| Server Middleware
|--------------------------------------------------------------------------
|
| Server level middleware are executed even when route for a given URL is
| not registered. Features like `static assets` and `cors` needs better
| control over request lifecycle.
|
*/
const serverMiddleware = ['Adonis/Middleware/Static', 'Adonis/Middleware/Cors']

Server.registerGlobal(globalMiddleware).registerNamed(namedMiddleware).use(serverMiddleware)
