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

Route.get('/', () => {
  return {
    app: process.env.APP_NAME,
    main: process.env.APP_URL,
    node: process.version,
  }
})

Route.post('/signup', 'AccountController.signup')
  .validator('SignUp') // This validator need for check uniq user
  .middleware(['valid:SignUp'])
Route.post('/login', 'AccountController.login').middleware(['valid:SignIn'])
Route.post('/logout', 'AccountController.logout').middleware(['auth:jwt'])

Route.post('api/v1/admin/login', 'Admin/UserController.login').middleware('guest')
Route.group(() => {
  Route.get('/', 'Admin/UserController.getUsers').middleware(['pagination'])
  Route.get('/:user_id', 'Admin/UserController.getUser')
  Route.post('/:user_id', 'Admin/UserController.updateUser')
})
  .prefix('api/v1/admin/users')
  .middleware(['auth:jwtAdmin', 'is:admin'])
