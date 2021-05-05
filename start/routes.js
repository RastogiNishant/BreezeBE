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
// Route.any('*', adminHandler).prefix('admin')
// Route.any('/admin/:1?', adminHandler)

// Live check method
Route.get('/ping', 'CommonController.ping')
Route.get('/api/v1/search/street', 'CommonController.searchStreet').middleware([
  'valid:SearchStreet',
])
Route.get('/api/v1/calc_price', 'CommonController.calcRentPrice').middleware([
  'valid:CalcRentPrice',
])

Route.get('/', () => {
  return {
    app: process.env.APP_NAME,
    main: process.env.APP_URL,
    node: process.version,
  }
})

Route.post('/api/v1/signup', 'AccountController.signup').middleware(['guest', 'valid:SignUp'])
Route.post('/api/v1/login', 'AccountController.login').middleware(['guest', 'valid:SignIn'])
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
Route.post('/api/v1/users/switch', 'AccountController.switchAccount').middleware([
  'auth:jwtLandlord,jwt',
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
  Route.get('/', 'EstateController.getEstates').middleware(['valid:Pagination,EstateFilter'])
  Route.post('/', 'EstateController.createEstate').middleware(['valid:CreateEstate'])
  Route.post('/import', 'EstateController.importEstate')
  Route.get('/:id', 'EstateController.getEstate').middleware(['valid:Id'])
  Route.put('/:id', 'EstateController.updateEstate').middleware(['valid:UpdateEstate'])
  Route.put('/:id/publish', 'EstateController.publishEstate').middleware(['valid:Id,PublishEstate'])
  Route.delete('/:id', 'EstateController.removeEstate').middleware(['valid:Id'])
  // Rooms manage
  Route.get('/:estate_id/rooms', 'RoomController.getEstateRooms').middleware(['valid:EstateId'])
  Route.post('/:estate_id/rooms', 'RoomController.createRoom').middleware([
    'valid:CreateRoom,EstateId',
  ])
  Route.post('/:estate_id/files', 'EstateController.addFile').middleware(['valid:EstateAddFile'])
  Route.delete('/:estate_id/files/:id', 'EstateController.removeFile').middleware([
    'valid:EstateId,Id',
  ])

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
    '/:estate_id/rooms/:room_id/images/:id',
    'RoomController.removeRoomPhoto'
  ).middleware(['valid:RoomId,Id'])
})
  .prefix('/api/v1/estates')
  .middleware(['auth:jwtLandlord'])

// Admin user edit part
Route.post('api/v1/admin/login', 'Admin/UserController.login').middleware(['guest', 'valid:SignIn'])
Route.group(() => {
  Route.get('/', 'Admin/UserController.getUsers').middleware(['pagination'])
  Route.get('/:user_id', 'Admin/UserController.getUser')
  Route.post('/:user_id', 'Admin/UserController.updateUser')
})
  .prefix('api/v1/admin/users')
  .middleware(['auth:jwtAdmin', 'is:admin'])

Route.group(() => {
  Route.get('/', 'Admin/AgreementController.getAgreements')
  Route.post('/', 'Admin/AgreementController.createAgreement').middleware(['valid:CreateAgreement'])
  Route.put('/:id', 'Admin/AgreementController.updateAgreement').middleware([
    'valid:CreateAgreement,Id',
  ])
  Route.delete('/:id', 'Admin/AgreementController.deleteAgreement').middleware(['valid:Id'])
})
  .prefix('api/v1/admin/agreements')
  .middleware(['auth:jwtAdmin', 'is:admin'])

// Terms
Route.group(() => {
  Route.get('/', 'Admin/AgreementController.getTerms')
  Route.post('/', 'Admin/AgreementController.createTerm').middleware(['valid:CreateAgreement'])
  Route.put('/:id', 'Admin/AgreementController.updateTerm').middleware(['valid:CreateAgreement,Id'])
  Route.delete('/:id', 'Admin/AgreementController.deleteTerm').middleware(['valid:Id'])
})
  .prefix('api/v1/admin/terms')
  .middleware(['auth:jwtAdmin', 'is:admin'])

Route.group(() => {
  Route.get('/', 'CommonController.getTermsAndConditions')
  Route.post('/', 'CommonController.acceptTermsAndConditions').middleware([
    'auth:jwtLandlord,jwt',
    'valid:AcceptTerms',
  ])
}).prefix('api/v1/terms')

// TENANT
// Tenant members
Route.group(() => {
  Route.get('/', 'MemberController.getMembers')
  Route.post('/', 'MemberController.addMember').middleware(['valid:CreateMember'])
  Route.put('/:id', 'MemberController.updateMember').middleware(['valid:CreateMember,Id'])
  Route.delete('/:id', 'MemberController.removeMember').middleware(['valid:Id'])
  Route.post('/income', 'MemberController.addMemberIncome')
  Route.delete('/income/:id', 'MemberController.removeMemberIncome')
})
  .prefix('api/v1/tenant/members')
  .middleware(['auth:jwt'])

Route.group(() => {
  Route.get('/', 'EstateController.getTenantEstates').middleware(['valid:Pagination'])
  Route.post('/invite', 'EstateController.acceptEstateInvite').middleware(['valid:Code'])
  Route.get('/:id', 'EstateController.getTenantEstate').middleware(['valid:Id'])
})
  .prefix('api/v1/tenant/estates')
  .middleware(['auth:jwt'])

// Force add named middleware to all requests
const excludeRoutes = ['/api/v1/terms', '/api/v1/me']
Route.list().forEach((r) => {
  if (Array.isArray(r.middlewareList) && !excludeRoutes.includes(r._route)) {
    if (r.middlewareList.length > 0) {
      r.middlewareList = [...r.middlewareList, 'agreement']
    }
  }
})
