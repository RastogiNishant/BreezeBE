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
])
// Route.put('/api/v1/users/password_reset', 'AccountController.passwordReset')
// Route.put('/api/v1/users/password_confirm', 'AccountController.passwordConfirm')

Route.get('/api/v1/references', 'CommonController.getReferences')

// Auth google
Route.get('/auth/google', 'OAuthController.googleAuth')
Route.get('/auth/google/authenticated', 'OAuthController.googleAuthConfirm')
Route.get('/auth/google/mobile', 'OAuthController.tokenAuth').middleware([
  'valid:SignInGoogleMobile',
])

Route.post('api/v1/admin/login', 'Admin/UserController.login').middleware('guest')
Route.group(() => {
  Route.get('/', 'Admin/UserController.getUsers').middleware(['pagination'])
  Route.get('/:user_id', 'Admin/UserController.getUser')
  Route.post('/:user_id', 'Admin/UserController.updateUser')
})
  .prefix('api/v1/admin/users')
  .middleware(['auth:jwtAdmin', 'is:admin'])
