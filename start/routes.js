'use strict'

const Route = use('Route')
const Helpers = use('Helpers')
const fs = use('fs')

/**
 *  Admin entry point router
 */

const adminHandler = ({ response }) => {
  response.header('Content-Type', 'text/html')
  const content = fs.readFileSync(Helpers.publicPath('index.template'))
  response.send(content)
}
Route.any('*', adminHandler).prefix('admin')
Route.any('/admin/:1?', adminHandler)

// Live check method
Route.get('/ping', 'CommonController.ping')
Route.get('/api/v1/search/street', 'CommonController.searchStreet').middleware(['valid:SearchStreet'])

Route.get('/', () => {
  return {
    app: process.env.APP_NAME,
    main: process.env.APP_URL,
    node: process.version,
  }
})

Route.post('/api/v1/signup', 'AccountController.signup').middleware(['valid:SignUp'])
Route.post('/api/v1/login', 'AccountController.login').middleware(['valid:SignIn'])
Route.post('/api/v1/logout', 'AccountController.logout').middleware(['auth:jwt'])
Route.get('/api/v1/me', 'AccountController.me').middleware(['auth:jwtLandlord,jwt'])
Route.get('/api/v1/confirm_email', 'AccountController.confirmEmail').middleware([
  'valid:ConfirmEmail',
])
Route.put('/api/v1/users', 'AccountController.updateProfile').middleware(['auth:jwt,jwtLandlord'])
Route.put('/api/v1/users/avatar', 'AccountController.updateAvatar').middleware([
  'auth:jwt,jwtLandlord',
])
Route.put('/api/v1/users/password', 'AccountController.changePassword').middleware([
  'auth:jwt,jwtLandlord',
  'valid:ChangePassword',
])
Route.put('/api/v1/users/password/reset', 'AccountController.passwordReset').middleware([
  'valid:ResetEmailRequest',
])
Route.put('/api/v1/users/password/confirm', 'AccountController.passwordConfirm').middleware([
  'valid:ResetEmailConfirm',
])

Route.get('/api/v1/references', 'CommonController.getReferences')

// Auth google
Route.get('/auth/google', 'OAuthController.googleAuth')
Route.get('/auth/google/authenticated', 'OAuthController.googleAuthConfirm')
Route.get('/auth/google/mobile', 'OAuthController.tokenAuth').middleware([
  'valid:SignInGoogleMobile',
])

// Estate management
Route.group(() => {
  // Route.get('/', 'EstateController.getEstates').middleware(['valid:Pagination,EstateFilter'])
  Route.post('/', 'EstateController.createEstate').middleware(['valid:CreateEstate'])
  Route.post('/import', 'EstateController.importEstate')
  // Route.get('/:id', 'EstateController.getEstate').middleware(['valid:Id'])
  Route.put('/:id', 'EstateController.updateEstate').middleware(['valid:UpdateEstate'])
  Route.put('/:id/publish', 'EstateController.publishEstate').middleware(['valid:Id,PublishEstate'])
  Route.delete('/:id', 'EstateController.removeEstate').middleware(['valid:Id'])
  // Rooms manage
  Route.get('/:estate_id/rooms', 'RoomController.getEstateRooms').middleware(['valid:EstateId'])
  Route.post('/:estate_id/rooms', 'RoomController.createRoom').middleware([
    'valid:CreateRoom,EstateId',
  ])
  Route.post('/:estate_id/files', 'EstateController.addFile').middleware(['valid:EstateAddFile'])
  Route.put('/:estate_id/rooms/:room_id', 'RoomController.updateRoom').middleware([
    'valid:CreateRoom,EstateId,RoomId',
  ])
  Route.delete('/:estate_id/rooms/:room_id', 'RoomController.removeRoom').middleware([
    'valid:RoomId',
  ])
  // Room photos add
  Route.post('/:estate_id/rooms/:room_id/images', 'RoomController.addRoomPhoto').middleware([
    'valid:RoomId',
  ])
  Route.delete(
    '/:estate_id/rooms/:room_id/images/:index',
    'RoomController.removeRoomPhoto'
  ).middleware(['valid:RoomId,RemoveImage'])
})
  .prefix('/api/v1/estates')
  .middleware(['auth:jwtLandlord'])

// Allowed for Landlord and user data
Route.group(() => {
  Route.get('/', 'EstateController.getEstates').middleware(['valid:Pagination,EstateFilter'])
  Route.get('/:id', 'EstateController.getEstate').middleware(['valid:Id'])
})
  .prefix('/api/v1/estates')
  .middleware(['auth:jwtLandlord,jwt'])

// Admin user edit part
Route.post('api/v1/admin/login', 'Admin/UserController.login').middleware('guest')
Route.group(() => {
  Route.get('/', 'Admin/UserController.getUsers').middleware(['pagination'])
  Route.get('/:user_id', 'Admin/UserController.getUser')
  Route.post('/:user_id', 'Admin/UserController.updateUser')
})
  .prefix('api/v1/admin/users')
  .middleware(['auth:jwtAdmin', 'is:admin'])
