'use strict'

const Route = use('Route')
const Helpers = use('Helpers')
const fs = use('fs')
const Hash = use('Hash')
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
Route.get('/api/v1/search/profession', 'CommonController.searchProfession').middleware([
  'valid:ProfessionQuery',
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

/** New Administrator Endpoints */
Route.group(() => {
  //acivation
  Route.put('/activation', 'Admin/UserController.updateActivationStatus').middleware([
    'auth:jwtAdministrator',
    'valid:UpdateUserValidationStatus',
  ])

  //verify users
  Route.post('/verifyUsers', 'Admin/UserController.verifyUsers').middleware([
    'auth:jwtAdministrator',
    'valid:Ids,UserVerify',
  ])

  //users
  Route.get('/users/', 'Admin/UserController.getUsers').middleware([
    'auth:jwtAdministrator',
    'pagination',
  ])
  Route.get('/users/:user_id', 'Admin/UserController.getUser').middleware(['auth:jwtAdministrator']) //this is missing on Admin/UserController
  Route.post('/users/:user_id', 'Admin/UserController.updateUser').middleware([
    'auth:jwtAdministrator',
  ]) //this is missing on Admin/UserController. Note: this should be **put**

  //feature (Controllers should be moved to app/Controllers/Http/Admin)
  Route.post('/feature/', 'FeatureController.createFeature').middleware([
    'auth:jwtAdministrator',
    'valid:CreateFeature',
  ])
  Route.put('/feature/', 'FeatureController.updateFeature').middleware([
    'auth:jwtAdministrator',
    'valid:CreateFeature,Id',
  ])
  Route.delete('/feature/', 'FeatureController.removeFeature').middleware([
    'auth:jwtAdministrator',
    'valid:Ids',
  ])

  Route.post('/image/compress', 'ImageController.compressImage').middleware([
    'auth:jwtAdministrator',
  ])

  Route.post('/image/compress_pdf', 'ImageController.testCompressPDF').middleware(['auth:jwt'])

  //admin plan
  //Controllers should be moved to app/Controllers/Http/Admin
  Route.get('/plan/:id', 'PlanController.getPlan').middleware(['auth:jwtAdministrator', 'valid:Id'])
  Route.get('/plan/', 'PlanController.getPlanAll').middleware(['auth:jwtAdministrator'])
  Route.post('/plan/', 'PlanController.createPlan').middleware([
    'auth:jwtAdministrator',
    'valid:CreatePlan',
  ])
  Route.put('/plan/:id', 'PlanController.updatePlan').middleware([
    'auth:jwtAdministrator',
    'valid:CreatePlan,Id',
  ])
  Route.delete('/plan/', 'PlanController.deletePlan').middleware([
    'auth:jwtAdministrator',
    'valid:Ids',
  ])

  //admin authentication
  Route.post('/auth/login', 'Admin/AuthController.login').middleware(['guest', 'valid:AdminLogin'])

  Route.get('/me', 'Admin/AuthController.me').middleware(['auth:jwtAdministrator'])

  Route.get('/landlords', 'Admin/UserController.getLandlords').middleware([
    'auth:jwtAdministrator',
    'valid:Pagination,AdminGetsLandlords',
  ])

  Route.get('/predefinedMessage/:id', 'Admin/PredefinedMessageController.get').middleware([
    'auth:jwtAdministrator',
    'valid:Id',
  ])
  Route.get('/predefinedMessage', 'Admin/PredefinedMessageController.getAll').middleware([
    'auth:jwtAdministrator',
  ])
  Route.post('/predefinedMessage', 'Admin/PredefinedMessageController.create').middleware([
    'auth:jwtAdministrator',
    'valid:CreatePredefinedMessage',
  ])
  Route.put('/predefinedMessage/:id', 'Admin/PredefinedMessageController.update').middleware([
    'auth:jwtAdministrator',
    'valid:CreatePredefinedMessage,Id',
  ])
  Route.delete('/predefinedMessage/:id', 'Admin/PredefinedMessageController.delete').middleware([
    'auth:jwtAdministrator',
    'valid:Id',
  ])

  Route.get(
    '/predefinedMessageChoice/:id',
    'Admin/PredefinedMessageChoiceController.get'
  ).middleware(['auth:jwtAdministrator', 'valid:Id'])
  Route.get(
    '/predefinedMessageChoice',
    'Admin/PredefinedMessageChoiceController.getAll'
  ).middleware(['auth:jwtAdministrator', 'valid:PredefinedMessageChoiceFilter'])
  Route.post(
    '/predefinedMessageChoice',
    'Admin/PredefinedMessageChoiceController.create'
  ).middleware(['auth:jwtAdministrator', 'valid:CreatePredefinedMessageChoice'])
  Route.put(
    '/predefinedMessageChoice/:id',
    'Admin/PredefinedMessageChoiceController.update'
  ).middleware(['auth:jwtAdministrator', 'valid:CreatePredefinedMessageChoice,Id'])
  Route.delete(
    '/predefinedMessageChoice/:id',
    'Admin/PredefinedMessageChoiceController.delete'
  ).middleware(['auth:jwtAdministrator', 'valid:Id'])

  //estates
  Route.get('/estates', 'Admin/PropertyController.getProperties').middleware([
    'auth:jwtAdministrator',
  ])
  Route.put('/estates/publish-status', 'Admin/PropertyController.updatePublishStatus').middleware([
    'auth:jwtAdministrator',
    'valid:AdminUpdatePublishStatus',
  ])
}).prefix('api/v1/administration')

/** End administration */

Route.get(
  '/api/v1/estate-by-hash/:hash',
  'EstateViewInvitationController.getEstateByHash'
).middleware(['EstateFoundByHash'])
// get pertinent information for an invitation to view estate based on code
Route.get(
  '/api/v1/estate-view-invitation/:code',
  'EstateViewInvitationController.getByCode'
).middleware(['ViewEstateInvitationCodeExist'])

Route.post(
  '/api/v1/invited-signup/:code',
  'AccountController.signupProspectWithViewEstateInvitation'
).middleware([
  'ViewEstateInvitationCodeExist',
  'valid:SignupAfterViewEstateInvitation',
  'ProspectHasNotRegisterYet',
])

Route.post(
  '/api/v1/hash-invited-signup/:hash',
  'AccountController.signupProspectWithHash'
).middleware([
  'EstateFoundByHash',
  'valid:SignupAfterViewEstateInvitation',
  'ProspectHasNotRegisterYet',
])

Route.post('/api/v1/zendesk/notify', 'NoticeController.acceptZendeskNotification').middleware()

Route.post('/api/v1/signup', 'AccountController.signup').middleware(['guest', 'valid:SignUp'])
Route.post('/api/v1/login', 'AccountController.login').middleware(['guest', 'valid:SignIn'])
Route.post('/api/v1/logout', 'AccountController.logout').middleware([
  'auth:jwt,jwtLandlord,jwtHousekeeper,jwtPropertyManager,jwtAdministrator',
])
Route.get('/api/v1/closeAccount', 'AccountController.closeAccount').middleware([
  'auth:jwt,jwtLandlord,jwtHousekeeper,jwtPropertyManager',
])
Route.put('/api/v1/updateDeviceToken', 'AccountController.updateDeviceToken').middleware([
  'auth:jwt,jwtLandlord,jwtHousekeeper,jwtPropertyManager',
  'valid:DeviceToken',
])

//Payment Methods
Route.group(() => {
  Route.post('', 'PaymentMethodController.post')
  Route.get('', 'PaymentMethodController.get')
  Route.put('', 'PaymentMethodController.update')
})
  .prefix('/api/v1/landlord/paymentMethod')
  .middleware(['auth:jwtLandlord'])

//Billing Address
Route.group(() => {
  Route.post('', 'BillingAddressController.addBillingAddress')
  Route.get('', 'BillingAddressController.getUserBillingAddress')
  Route.put('', 'BillingAddressController.updateBillingAddress')
})
  .prefix('/api/v1/landlord/billingAddress')
  .middleware(['auth:jwtLandlord'])

//Payment
Route.group(() => {
  Route.post('', 'PaymentController.processPayment')
  Route.get('', 'PaymentController.getUserPayments')
  Route.post('/paypal', 'PaymentController.processPaypal')
})
  .prefix('/api/v1/landlord/payment')
  .middleware(['auth:jwtLandlord'])

//Housekepper
Route.post('/api/v1/housekeeperSignup', 'AccountController.housekeeperSignup').middleware([
  'guest',
  'valid:HosekeeperSignUp',
])
Route.post('/api/v1/confirmsms', 'AccountController.checkSignUpConfirmBySMS').middleware([
  'guest',
  'valid:ConfirmSMS',
])

Route.group(() => {
  Route.post('/', 'AccountController.sendCodeForgotPassword').middleware([
    'guest',
    'valid:ResetEmailRequest',
    'UserWithEmailExists',
  ])
  Route.post('/setPassword', 'AccountController.setPasswordForgotPassword').middleware([
    'guest',
    'valid:SetPassword',
  ])
}).prefix('/api/v1/forgotPassword')

Route.get('/api/v1/me', 'AccountController.me').middleware(['auth:jwtLandlord,jwt,jwtHousekeeper'])
Route.get('/api/v1/confirm_email', 'AccountController.confirmEmail').middleware([
  'valid:ConfirmEmail',
])

Route.put('/api/v1/users', 'AccountController.updateProfile').middleware([
  'auth:jwt,jwtLandlord',
  'valid:UpdateUser',
  'userCanValidlyChangeEmail',
])

Route.post('/api/v1/users/reconfirm', 'AccountController.resendUserConfirm').middleware([
  'valid:UserId',
])

Route.group(() => {
  Route.get('/', 'AccountController.onboard').middleware(['auth:jwt,jwtLandlord'])
  Route.get('/profile', 'AccountController.onboardProfile').middleware(['auth:jwt,jwtLandlord'])
  Route.get('/dashboard', 'AccountController.onboardDashboard').middleware(['auth:jwt,jwtLandlord'])
  Route.get('/selection', 'AccountController.onboardSelection').middleware(['auth:jwt,jwtLandlord'])
  Route.get('/verification', 'AccountController.onboardLandlordVerification').middleware([
    'auth:jwt,jwtLandlord',
  ])
}).prefix('/api/v1/onboarding')

Route.put('/api/v1/users/avatar', 'AccountController.updateAvatar').middleware([
  'auth:jwt,jwtLandlord',
])
Route.put('/api/v1/users/password', 'AccountController.changePassword').middleware([
  'auth:jwt,jwtLandlord',
  'valid:ChangePassword',
])
Route.group(() => {
  Route.get('/tenant/:id', 'AccountController.getTenantProfile').middleware([
    'auth:jwtLandlord',
    'valid:Id',
  ])
}).prefix('/api/v1/profile')

// Tenant params and preferences

Route.group(() => {
  Route.put('/', 'TenantController.updateTenant').middleware(['valid:UpdateTenant'])
  Route.post('/activate', 'TenantController.activateTenant')
  Route.post('/buddy/accept', 'TenantController.acceptBuddyInvite')
  Route.get('/map', 'TenantController.getTenantMap')
  Route.get('/all', 'TenantController.getAllTenants')
})
  .prefix('/api/v1/users/tenant')
  .middleware(['auth:jwt'])

// Common app references
Route.get('/api/v1/references', 'CommonController.getReferences')

// Auth google
Route.get('/auth/google', 'OAuthController.googleAuth')
Route.get('/auth/google/authenticated', 'OAuthController.googleAuthConfirm')
Route.get('/auth/google/mobile', 'OAuthController.tokenAuth').middleware([
  'valid:SignInGoogleMobile',
])

Route.get('/auth/apple/mobile', 'OAuthController.tokenAuthApple').middleware([
  'valid:SignInAppleMobile',
])

//Room Custom Amenities
Route.group(() => {
  Route.get('/amenities', 'RoomAmenityController.getAll').middleware([
    'valid:EstateId,RoomId',
    'LandlordOwnsThisEstate',
    'RoomBelongsToEstate',
  ])

  Route.post('/amenities', 'RoomAmenityController.add').middleware([
    'valid:EstateId,RoomId,CreateRoomAmenity',
    'LandlordOwnsThisEstate',
    'RoomBelongsToEstate',
  ])

  Route.delete('/amenities', 'RoomAmenityController.delete').middleware([
    'valid:EstateId,RoomId,Id',
    'LandlordOwnsThisEstate',
    'RoomBelongsToEstate',
  ])

  Route.put('/amenities', 'RoomAmenityController.update').middleware([
    'valid:EstateId,RoomId,UpdateRoomAmenity',
    'LandlordOwnsThisEstate',
    'RoomBelongsToEstate',
  ])
})
  .prefix('/api/v1/estates/:estate_id/rooms/:room_id')
  .middleware(['auth:jwtLandlord'])

// Estate management
Route.group(() => {
  Route.get('/', 'EstateController.getEstates').middleware(['valid:Pagination,EstateFilter'])
  Route.post('/with-filters', 'EstateController.getEstates').middleware([
    'valid:Pagination,EstateFilter',
  ])
  Route.delete('/', 'EstateController.deleteMultiple').middleware(['valid:EstateMultipleDelete'])
  Route.post('/', 'EstateController.createEstate').middleware(['valid:CreateEstate'])
  Route.post('/import', 'EstateController.importEstate')
  Route.get('/export/:lang', 'EstateController.export')
  Route.get('/export', 'EstateController.export')
  Route.get('/verifyPropertyId', 'EstateController.verifyPropertyId').middleware([
    'valid:PropertyId',
  ])
  // add slots
  Route.get('/:estate_id/slots', 'EstateController.getSlots').middleware(['valid:EstateId'])
  Route.post('/:estate_id/slots', 'EstateController.createSlot').middleware([
    'valid:EstateId,CreateSlot',
  ])
  Route.put('/:estate_id/slots/:slot_id', 'EstateController.updateSlot').middleware([
    'valid:EstateId,SlotId,UpdateSlot',
  ])
  Route.delete('/:estate_id/slots/:slot_id', 'EstateController.removeSlot').middleware([
    'valid:EstateId,SlotId',
  ])

  // Extend or deactivate Estate
  Route.put('/extend', 'EstateController.extendEstate')
  Route.get('/deactivate', 'EstateController.deactivateEstate')

  Route.get('/upcomingShows', 'MatchController.getLandlordUpcomingVisits')
  Route.get('/quickLinks', 'EstateController.getEstatesQuickLinks')

  Route.get('/latest', 'EstateController.getLatestEstates').middleware(['valid:Pagination'])

  Route.get('/:id', 'EstateController.getEstate').middleware(['valid:Id'])
  Route.put('/:id', 'EstateController.updateEstate').middleware(['valid:UpdateEstate'])

  //Estate Amenities
  Route.get('/:estate_id/amenities', 'EstateAmenityController.get').middleware([
    'valid:EstateId',
    'LandlordOwnsThisEstate',
  ])
  Route.get('/:estate_id/amenities/:location', 'EstateAmenityController.get').middleware([
    'valid:EstateId,EstateAmenitiesLocation',
    'LandlordOwnsThisEstate',
  ])
  Route.post('/:estate_id/amenities', 'EstateAmenityController.add').middleware([
    'valid:EstateId,CreateEstateAmenity',
    'LandlordOwnsThisEstate',
  ])
  Route.put('/:estate_id/amenities/:location', 'EstateAmenityController.update').middleware([
    'valid:EstateId,EstateAmenitiesLocation,UpdateEstateAmenity',
    'LandlordOwnsThisEstate',
  ])
  Route.delete('/:estate_id/amenities/:location', 'EstateAmenityController.delete').middleware([
    'valid:EstateId,EstateAmenitiesLocation,Id',
    'LandlordOwnsThisEstate',
  ])

  Route.put('/:id/publish', 'EstateController.publishEstate').middleware(['valid:Id,PublishEstate'])
  Route.put('/:id/offline', 'EstateController.makeEstateOffline').middleware(['valid:Id'])
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
  Route.get('/:estate_id/rooms/:room_id', 'RoomController.getRoomById').middleware([
    'valid:EstateId,RoomId',
    'LandlordOwnsThisEstate',
    'RoomBelongsToEstate',
  ])
  Route.put('/:estate_id/rooms/order', 'RoomController.updateOrder').middleware(['valid:Ids'])

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
  Route.put('/:estate_id/rooms/:room_id/images/order', 'RoomController.orderRoomPhoto').middleware([
    'valid:RoomId,Ids',
  ])
  Route.delete(
    '/:estate_id/rooms/:room_id/images/:id',
    'RoomController.removeRoomPhoto'
  ).middleware(['valid:RoomId,Id'])

  Route.post('/:estate_id/invite-to-view', 'EstateController.inviteToView').middleware([
    'valid:LandlordInviteToView',
    'LandlordOwnsThisEstate',
  ])

  Route.get('/:estate_id/me_tenant_detail', 'EstateController.landlordTenantDetailInfo').middleware(
    ['valid:EstateId,TenantId']
  )

  Route.post(
    '/tenant/invite/email',
    'EstateCurrentTenantController.inviteTenantToAppByEmail'
  ).middleware(['valid:InvitationIds'])

  Route.post(
    '/tenant/invite/letter',
    'EstateCurrentTenantController.inviteTenantToAppByLetter'
  ).middleware(['valid:InvitationIds'])

  Route.post(
    '/tenant/invite/sms',
    'EstateCurrentTenantController.inviteTenantToAppBySMS'
  ).middleware(['valid:InvitationIds'])

  Route.put('/tenant/revoke', 'EstateCurrentTenantController.revokeInvitation').middleware([
    'valid:InvitationIds',
  ])

  Route.post('/tenant/disconnect', 'EstateCurrentTenantController.disconnect').middleware([
    'valid:InvitationIds',
  ])

  Route.put('/:id/let', 'EstateController.changeLettingType').middleware(['valid:UpdateEstate'])
})
  .prefix('/api/v1/estates')
  .middleware(['auth:jwtLandlord,jwtAdministrator'])

Route.get(
  '/api/v1/estates/tenant/invite/letter/retrieve-link/:code',
  'EstateCurrentTenantController.retrieveLinkByCode'
).middleware(['valid:InvitationLinkRetrieveCode', 'UserCanGetInvitationLink'])

Route.post(
  '/api/v1/validate/outside_tenant/invitation',
  'EstateCurrentTenantController.validateInvitationQRCode'
).middleware(['valid:AlreadyRegisteredOutsideTenantInvite'])

Route.post(
  '/api/v1/accept/outside_tenant',
  'EstateCurrentTenantController.acceptOutsideTenant'
).middleware(['valid:OutsideTenantInvite'])

Route.post(
  '/api/v1/accept/outside_tenant/already_registered',
  'EstateCurrentTenantController.acceptAlreadyRegisterdOutsideTenant'
).middleware(['auth:jwt', 'valid:AlreadyRegisteredOutsideTenantInvite'])

// Change visits statuses
Route.group(() => {
  Route.put('/landlord', 'MatchController.updateVisitTimeslotLandlord').middleware([
    'auth:jwtLandlord',
    'valid:UpdateVisitStatusLord',
  ])
  Route.put('/landlord/come', 'MatchController.inviteToCome').middleware([
    'auth:jwtLandlord',
    'valid:InviteUserToCome',
  ])
  Route.put('/tenant', 'MatchController.updateVisitTimeslotTenant').middleware([
    'auth:jwt',
    'valid:UpdateVisitStatusTenant',
  ])
  Route.post('/notifications/followup', 'MatchController.followupVisit').middleware([
    'auth:jwtLandlord', //landlord for now
    'valid:FollowupVisit',
  ])
  Route.get(
    '/notifications/followup/:estate_id/:user_id',
    'MatchController.getFollowups'
  ).middleware(['auth:jwtLandlord', 'valid:FollowupVisit'])
}).prefix('/api/v1/visit')

Route.group(() => {
  Route.get('/', 'NoticeController.getNotices').middleware([
    'valid:GetNotifications',
    'auth:jwt,jwtLandlord',
  ])
  Route.get('/resetCount', 'AccountController.resetUnreadNotificationCount').middleware([
    'auth:jwt,jwtLandlord',
  ])
}).prefix('/api/v1/notices')

// Timeslots for tenant
Route.group(() => {
  Route.get('/:estate_id/slots/free', 'EstateController.getEstateFreeTimeslots').middleware([
    'valid:EstateId',
  ])
})
  .prefix('/api/v1/estates')
  .middleware(['auth:jwt'])

// Admin user edit part
Route.post('api/v1/admin/login', 'Admin/UserController.login').middleware(['guest', 'valid:SignIn'])

Route.group(() => {
  Route.get('/', 'Admin/UserController.getUsers').middleware(['pagination'])
  Route.get('/:user_id', 'Admin/UserController.getUser')
  Route.post('/:user_id', 'Admin/UserController.updateUser')
})
  .prefix('api/v1/admin/users')
  .middleware(['auth:jwtAdmin', 'is:admin'])

Route.post('api/v1/admin/verifyUsers', 'Admin/UserController.verifyUsers').middleware([
  'auth:jwtAdmin',
  'is:admin',
  'valid:Ids,UserVerify',
])

Route.put('api/v1/admin/activation', 'Admin/UserController.updateActivationStatus').middleware([
  'auth:jwtLandlord',
  'valid:UpdateUserValidationStatus',
])

Route.group(() => {
  Route.post('/', 'FeatureController.createFeature').middleware(['valid:CreateFeature'])
  Route.put('/', 'FeatureController.updateFeature').middleware(['valid:CreateFeature,Id'])
  Route.delete('/', 'FeatureController.removeFeature').middleware(['valid:Ids'])
})
  .prefix('api/v1/admin/feature')
  .middleware(['auth:jwtAdmin', 'is:admin'])

Route.group(() => {
  Route.get('/:id', 'PlanController.getPlan').middleware(['valid:Id'])
  Route.get('/', 'PlanController.getPlanAll')
  Route.post('/', 'PlanController.createPlan').middleware(['valid:CreatePlan'])
  Route.put('/:id', 'PlanController.updatePlan').middleware(['valid:CreatePlan,Id'])
  Route.delete('/', 'PlanController.deletePlan').middleware(['valid:Ids'])
})
  .prefix('api/v1/admin/plan')
  .middleware(['auth:jwtAdmin', 'is:admin'])

Route.group(() => {
  Route.post('/auth/login', 'Admin/AuthController.login').middleware(['valid:AdminLogin'])
}).prefix('api/v1/admin')

Route.group(() => {
  Route.get('/:id', 'TenantPaymentPlanController.getTenantPaymentPlanById').middleware(['valid:Id'])
  Route.get('/', 'TenantPaymentPlanController.getTenantPaymentPlan').middleware(['valid:PlanId'])
  Route.post('/', 'TenantPaymentPlanController.createTenantPaymentPlan').middleware([
    'valid:TenantPaymentPlan',
  ])
  Route.put('/:id', 'TenantPaymentPlanController.updateTenantPaymentPlan').middleware([
    'valid:TenantPaymentPlan,Id',
  ])
  Route.delete('/:id', 'TenantPaymentPlanController.deleteTenantPaymentPlan').middleware([
    'valid:Id',
  ])
})
  .prefix('api/v1/admin/tenant/paymentplan')
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
Route.get('/api/v1/tenant/file', 'TenantController.getProtectedFile').middleware([
  'auth:jwt,jwtLandlord',
  'valid:ProtectedFile',
])

// Tenant members
Route.group(() => {
  Route.post('/init', 'MemberController.initalizeTenantAdults').middleware([
    'valid:InitializeAdults',
  ])
  Route.post('/email', 'MemberController.addMember').middleware([
    'valid:CreateMember,Email,ProfileVisibilityToOther',
  ])
  Route.get('/invitation', 'MemberController.prepareHouseholdInvitationDetails')
  Route.put('/invitation/refuse', 'MemberController.refuseInvitation')
  Route.put('/invitation/accept', 'MemberController.acceptInvitation').middleware([
    'valid:ProfileVisibilityToOther',
  ])
  Route.get('/visible', 'MemberController.checkVisibilitySetting').middleware(['valid:MemberId'])
  Route.put('/visible', 'MemberController.showMe').middleware([
    'valid:MemberId,ProfileVisibilityToOther',
  ])
  Route.delete('/:id', 'MemberController.removeMember').middleware(['valid:Id'])
})
  .prefix('api/v1/tenant/members')
  .middleware(['auth:jwt'])

Route.group(() => {
  Route.get('/', 'MemberController.getMembers')
  Route.put('/:id', 'MemberController.updateMember').middleware(['valid:CreateMember,Id'])
  Route.delete('/:id/:field', 'MemberController.removeMemberDocs').middleware([
    'valid:RemoveMemberDocs',
  ])
  Route.post('/:id/income', 'MemberController.addMemberIncome').middleware([
    'valid:Id,CreateIncome',
  ])
  Route.put('/:id/income/:income_id', 'MemberController.editIncome').middleware([
    'valid:Id,IncomeId,CreateIncome',
  ])
  Route.delete('/:id/income/:income_id', 'MemberController.removeMemberIncome').middleware([
    'valid:Id,IncomeId',
  ])
  Route.delete('/:id/passport/:member_file_id', 'MemberController.deleteExtraImage').middleware([
    'valid:Id,MemberFileId',
  ])
  Route.delete('/:id/extraproof/:member_file_id', 'MemberController.deleteExtraImage').middleware([
    'valid:Id,MemberFileId',
  ])
  Route.post('/:id/passport', 'MemberController.addPassportImage').middleware(['valid:Id'])
  Route.post('/:id/extraproof', 'MemberController.addPassportImage').middleware([
    'valid:Id,ExtraFileType',
  ])
  Route.post('/invite/:id', 'MemberController.sendInviteCode').middleware(['valid:Id'])
  Route.post('/sendsms', 'MemberController.sendUserConfirmBySMS').middleware([
    'valid:MemberId,Phone',
  ])
  Route.post('/confirmsms', 'MemberController.confirmBySMS').middleware([
    'valid:MemberId,Code,Phone',
  ])
})
  .prefix('api/v1/tenant/members')
  .middleware(['auth:jwt,jwtHousekeeper'])

// Add income files
Route.group(() => {
  Route.post('/:income_id/proof', 'MemberController.addMemberIncomeProof').middleware([
    'valid:IncomeId,AddIncomeProof',
  ])
  Route.delete('/:income_id/proof/:id', 'MemberController.removeMemberIncomeProof').middleware([
    'valid:Id,IncomeId',
  ])
})
  .prefix('api/v1/tenant/income')
  .middleware(['auth:jwt,jwtHousekeeper'])

const EstateViewInvite = use('App/Models/EstateViewInvite')
const EstateViewInvitedUser = use('App/Models/EstateViewInvitedUser')

Route.group(() => {
  Route.get('/', async ({ request, auth, response }) => {
    const myInvites = await EstateViewInvitedUser.query()
      .where('user_id', auth.user.id)
      .where('sticky', true)
      .first()

    response.res(myInvites)
  })
})
  .prefix('api/v1/view-estate-invitations')
  .middleware(['auth:jwt'])

Route.group(() => {
  Route.get('/unread_messages_count', 'ChatController.getUnreadMessagesCount')
  Route.post('/', 'TaskController.createTask').middleware(['valid:CreateTask'])
  Route.post('/init', 'TaskController.init').middleware(['valid:InitTask'])
  Route.put('/:id', 'TaskController.updateTask').middleware(['valid:CreateTask,Id'])
  Route.delete('/:id', 'TaskController.deleteTask').middleware(['valid:Id'])
  Route.put('/:id/addImage', 'TaskController.addImage').middleware(['valid:Id'])
  Route.delete('/:id/removeImage', 'TaskController.removeImage').middleware([
    'valid:Id,RemoveImage',
  ])
  Route.get('/:id', 'TaskController.getTaskById').middleware(['valid:Id'])
  //Route.post('/edit', 'TaskController.onEditMessage')
})
  .prefix('api/v1/connect/task')
  .middleware(['auth:jwt,jwtLandlord'])

Route.group(() => {
  Route.get('/', 'ChatController.getByTaskId').middleware(['valid:TaskId,Pagination,LastId'])
})
  .prefix('api/v1/connect/chat')
  .middleware(['auth:jwt,jwtLandlord'])

Route.group(() => {
  Route.post('/estate/:id/with-filters', 'TaskController.getEstateTasks').middleware([
    'valid:Pagination,Id,TaskFilter',
  ])
  Route.post('/with-filters', 'TaskController.getLandlordTasks').middleware([
    'valid:Pagination,TaskFilter',
  ])
})
  .prefix('api/v1/connect/task')
  .middleware(['auth:jwtLandlord'])

Route.group(() => {
  Route.get('/', 'TaskController.getAllTasks').middleware(['valid:TenantTaskFilter,Pagination'])
})
  .prefix('api/v1/connect/task')
  .middleware(['auth:jwt,jwtLandlord'])

Route.group(() => {
  Route.post('/', 'PredefinedAnswerController.createPredefinedAnswer').middleware([
    'valid:createPredefinedAnswer',
  ])
  Route.put('/:id', 'PredefinedAnswerController.updatePredefinedAnswer').middleware([
    'valid:createPredefinedAnswer,Id',
  ])
  Route.delete('/:id', 'PredefinedAnswerController.deletePredefinedAnswer').middleware(['valid:Id'])
})
  .prefix('api/v1/connect/predefinedAnswer')
  .middleware(['auth:jwt'])

Route.group(() => {
  Route.get('/:id', 'Admin/PredefinedMessageController.get').middleware(['valid:Id'])
  Route.get('/', 'Admin/PredefinedMessageController.getAll').middleware([
    'valid:PredefinedMessageFilter',
  ])
})
  .prefix('api/v1/connect/predefinedMessage')
  .middleware(['auth:jwt,jwtLandlord'])

Route.group(() => {
  Route.get('/', 'Admin/PredefinedMessageChoiceController.getAll').middleware([
    'valid:PredefinedMessageChoiceFilter',
  ])
})
  .prefix('api/v1/connect/predefinedMessageChoice')
  .middleware(['auth:jwt,jwtLandlord'])

Route.group(() => {
  Route.get('/', 'EstateController.getTenantEstates').middleware(['valid:TenantEstateFilter'])
  Route.post('/invite', 'EstateController.acceptEstateInvite').middleware(['valid:Code'])
  Route.post('/:id/like', 'EstateController.likeEstate').middleware(['valid:Id'])
  Route.delete('/:id/like', 'EstateController.unlikeEstate').middleware(['valid:Id'])
  Route.post('/:id/dislike', 'EstateController.dislikeEstate').middleware(['valid:Id'])
  Route.delete('/:id/dislike', 'EstateController.removeEstateDislike').middleware(['valid:Id'])
  Route.get('/:id', 'EstateController.getTenantEstate').middleware(['valid:Id'])
})
  .prefix('api/v1/tenant/estates')
  .middleware(['auth:jwt'])

Route.group(() => {
  Route.get('/myTenants', 'LandlordController.getAllTenants')
})
  .prefix('api/v1/landlords')
  .middleware(['auth:jwtLandlord'])

Route.group(() => {
  Route.get('/', 'LandlordController.landlords')
  Route.get('/getLandlords', 'LandlordController.landlords')
  Route.get('/toggle', 'LandlordController.toggleStatus')
  Route.post('/buddies/import', 'BuddyController.importBuddies')
  Route.get('/buddies/get', 'BuddyController.getBuddies')
  Route.delete('/buddies', 'BuddyController.removeBuddies')
})
  .prefix('api/v1/landlords')
  .middleware(['auth:jwtLandlord,jwt'])

Route.get('/map', 'MapController.getMap')

Route.get('/api/v1/match/tenant', 'MatchController.getMatchesListTenant').middleware([
  'auth:jwt',
  'valid:MatchListTenant,Pagination',
])

Route.get(
  '/api/v1/match/tenant/check/commitedAlready',
  'MatchController.checkTenantMatchCommitedAlready'
).middleware(['auth:jwt'])

Route.get('/api/v1/match/tenant/upcoming', 'MatchController.getTenantUpcomingVisits').middleware([
  'auth:jwt',
])
Route.get('/api/v1/match/tenant/count', 'MatchController.getMatchesCountsTenant').middleware([
  'auth:jwt',
  'valid:MatchListTenant,Pagination',
])
Route.get(
  '/api/v1/match/tenant/stage/count',
  'MatchController.getMatchesStageCountsTenant'
).middleware(['auth:jwt'])

Route.get('/api/v1/match/tenant/search', 'MatchController.searchForTenant').middleware([
  'auth:jwt',
  'valid:Pagination,EstateFilter',
])
Route.get('/api/v1/match/landlord/search', 'MatchController.searchForLandlord').middleware([
  'auth:jwtLandlord',
  'valid:Pagination,EstateFilter',
])

Route.get('/api/v1/match/landlord', 'MatchController.getMatchesListLandlord').middleware([
  'auth:jwtLandlord',
  'valid:MatchListLandlord,Pagination',
])

/**
 * sent email to current tenant for a specific estate
 */
Route.group(() => {
  Route.post('', 'MatchController.inviteTenantToEstate').middleware([
    'valid:InviteInToVisit,InviteTo',
  ])
  Route.delete('', 'MatchController.removeTenantEdit').middleware(['valid:InviteInToVisit'])
})
  .prefix('/api/v1/match/landlord/inviteTenantTo')
  .middleware(['auth:jwtLandlord'])

Route.group(() => {
  Route.post('', 'MatchController.updateProperty').middleware(['valid:EstateId,TenantProperty'])
  Route.put('', 'MatchController.updateProperty').middleware(['valid:EstateId,TenantProperty'])
  Route.delete('', 'MatchController.deleteProperty').middleware(['valid:EstateId'])
})
  .prefix('/api/v1/match/tenant/property')
  .middleware(['auth:jwt'])

Route.get(
  '/api/v1/match/landlord/estate',
  'MatchController.getMatchesSummaryLandlordEstate'
).middleware(['auth:jwtLandlord'])

Route.get('/api/v1/match/landlord/summary', 'MatchController.getLandlordSummary').middleware([
  'auth:jwtLandlord',
])

// Landlord specific routes
Route.group(() => {
  Route.get('/visit', 'LandlordController.getLordVisits')
  Route.post('/activate', 'LandlordController.activate')
  Route.get('/invite-to-view-estate', 'EstateController.getInviteToView').middleware([
    'LandlordOwnsThisEstate',
  ])
  Route.post('/invite-to-view-estate', 'EstateController.createInviteToViewCode').middleware([
    'valid:LandlordInviteToView',
    'LandlordOwnsThisEstate',
  ])
})
  .prefix('/api/v1/landlord')
  .middleware(['auth:jwtLandlord'])

// MATCH FLOW
Route.group(() => {
  Route.post('/knock', 'MatchController.knockEstate').middleware(['auth:jwt', 'valid:Knock'])
  Route.delete('/knock', 'MatchController.removeKnock').middleware(['auth:jwt'])
  // invite
  Route.post('/invite', 'MatchController.matchToInvite').middleware([
    'auth:jwtLandlord',
    'valid:MatchInvite',
  ])
  Route.delete('/invite', 'MatchController.removeInvite').middleware([
    'auth:jwtLandlord',
    'valid:MatchInvite',
  ])
  Route.delete('/invite/:estate_id', 'MatchController.removeInviteByTenant').middleware([
    'auth:jwt',
    'valid:EstateId',
  ])
  // Choose timeslot
  Route.post('/visit', 'MatchController.chooseVisitTimeslot').middleware([
    'auth:jwt',
    'valid:ChooseTimeslot',
  ])
  Route.post('/visit/inviteIn', 'MatchController.inviteTenantInToVisit').middleware([
    'auth:jwtLandlord',
    'valid:InviteInToVisit',
  ])
  Route.delete('/visit', 'MatchController.cancelVisit').middleware(['auth:jwt'])
  Route.delete('/landlordVisit', 'MatchController.cancelVisitByLandlord').middleware([
    'auth:jwtLandlord',
    'valid:LandlordVisitCancel',
  ])
  // Share tenant profile to landlord
  Route.post('/share', 'MatchController.shareTenantData').middleware(['auth:jwtLandlord'])
  Route.delete('/share', 'MatchController.cancelShare').middleware(['auth:jwt'])
  // Move/remove top tenant
  Route.post('/top', 'MatchController.moveUserToTop').middleware(['auth:jwtLandlord'])
  Route.delete('/top', 'MatchController.discardUserToTop').middleware(['auth:jwtLandlord'])
  Route.delete('/top/tenant', 'MatchController.cancelTopByTenant').middleware(['auth:jwt'])
  // Request confirmation
  Route.post('/request', 'MatchController.requestUserCommit').middleware(['auth:jwtLandlord'])
  Route.delete('/commit', 'MatchController.tenantCancelCommit').middleware(['auth:jwt'])
  // Final confirm
  Route.post('/confirm', 'MatchController.commitEstateRent').middleware([
    'auth:jwt',
    'valid:ConfirmRequest',
  ])
  Route.put('/order', 'MatchController.changeOrder').middleware([
    'auth:jwt,jwtLandlord',
    'valid:ChangeOrder',
  ])
}).prefix('api/v1/match')

/**
 * Landlord company manage
 */
Route.group(() => {
  Route.get('/', 'CompanyController.getCompany')
  Route.post('/', 'CompanyController.createCompany').middleware(['valid:CreateCompany'])
  Route.put('/:id', 'CompanyController.updateCompany').middleware(['valid:Id,UpdateCompany'])
  Route.delete('/:id', 'CompanyController.removeCompany').middleware(['valid:Id'])
})
  .middleware(['auth:jwtLandlord'])
  .prefix('api/v1/companies')

/**
 * Landlord notes
 */
Route.group(() => {
  Route.get('/', 'NoteController.getNotes').middleware(['valid:TenantId'])
  Route.post('/', 'NoteController.createNote').middleware(['valid:CreateNote'])
  Route.put('/', 'NoteController.updateNote').middleware(['valid:CreateNote'])
  Route.delete('/', 'NoteController.removeNote').middleware(['valid:TenantId'])
})
  .middleware(['auth:jwtLandlord'])
  .prefix('api/v1/notes')

Route.get('/api/v1/landlord/:id/company', 'CompanyController.getCompanyByLandlord').middleware([
  'auth:jwt',
  'valid:Id',
])

/**
 * Landlord company contacts manage
 */
Route.group(() => {
  Route.get('/', 'CompanyController.getContacts')
  Route.post('/', 'CompanyController.createContact').middleware(['valid:CreateContact'])
  Route.put('/:id', 'CompanyController.updateContact').middleware(['valid:Id,UpdateContact'])
  Route.delete('/:id', 'CompanyController.removeContact').middleware(['valid:Id'])
})
  .middleware(['auth:jwtLandlord'])
  .prefix('api/v1/contacts')

Route.post('/api/v1/debug/notifications', 'NoticeController.sendTestNotification').middleware([
  'auth:jwtLandlord,jwt',
  'valid:DebugNotification',
])

Route.get('/api/v1/feature', 'FeatureController.getFeatures')
  .middleware(['valid:CreateFeature'])
  .middleware(['auth:jwtLandlord,jwt'])

// MATCH FLOW
Route.group(() => {
  Route.post('/', 'EstateCurrentTenantController.create').middleware([
    'valid:CreateEstateCurrentTenant',
  ])
  Route.put('/:id', 'EstateCurrentTenantController.update').middleware([
    'valid:CreateEstateCurrentTenant,Id',
  ])
  Route.delete('/:id', 'EstateCurrentTenantController.delete').middleware(['valid:Id'])
  Route.put('/expire/:id', 'EstateCurrentTenantController.expire').middleware(['valid:Id'])
  Route.get('/', 'EstateCurrentTenantController.getAll').middleware([
    'valid:EstateCurrentTenantFilter',
  ])
})
  .middleware(['auth:jwtLandlord'])
  .prefix('api/v1/current_tenant')

Route.group(() => {
  Route.get('/:id', 'PlanController.getPlan').middleware(['valid:Id'])
  Route.get('/', 'PlanController.getPlanAll')
})
  .prefix('api/v1/plan')
  .middleware(['auth:jwtLandlord,jwt'])

Route.group(() => {
  Route.get('/:id', 'TenantPaymentPlanController.getTenantPaymentPlanById').middleware(['valid:Id'])
  Route.get('/', 'TenantPaymentPlanController.getTenantPaymentPlan').middleware(['valid:PlanId'])
})
  .prefix('api/v1/tenant/paymentplan')
  .middleware(['auth:jwt'])

Route.group(() => {
  Route.post('/', 'AccountController.updateTenantPremiumPlan').middleware([
    'auth:jwt',
    'valid:TenantPremiumPlan,AppType',
  ])
  Route.get('/', 'AccountController.getTenantPremiumPlans').middleware([
    'auth:jwt',
    'valid:AppType',
  ])
}).prefix('api/v1/tenantPremiumPlan')

Route.group(() => {
  Route.post('/', 'EstateAbuseController.reportEstateAbuse').middleware([
    'auth:jwt',
    'valid:CreateEstateAbuse',
  ])
}).prefix('api/v1/estateReportAbuse')

Route.group(() => {
  Route.post('/', 'TenantReportAbuseController.reportTenantAbuse').middleware([
    'auth:jwtLandlord',
    'valid:CreateEstateAbuse,TenantId',
  ])

  Route.delete('/:id', 'TenantReportAbuseController.deleteAbuse').middleware([
    'auth:jwtAdmin',
    'is:admin',
    'valid:Id',
  ])
}).prefix('api/v1/tenantReportAbuse')

Route.group(() => {
  Route.post('/id', 'EstatePermissionController.requestPermissionToLandlordById').middleware([
    'auth:jwtPropertyManager',
    'valid:Ids',
  ])
  Route.post('/email', 'EstatePermissionController.requestPermissionToLandlordByEmail').middleware([
    'auth:jwtPropertyManager',
    'valid:Emails',
  ])
  Route.delete('/pm', 'EstatePermissionController.deletePermissionByPM').middleware([
    'auth:jwtPropertyManager',
    'valid:Ids',
  ])
  Route.delete('/landlord', 'EstatePermissionController.deletePermissionByLandlord').middleware([
    'auth:jwtLandlord',
    'valid:Ids',
  ])
  Route.delete('/email', 'EstatePermissionController.deletePermissionLandlordByEmail').middleware([
    'auth:jwtPropertyManager',
    'valid:Emails',
  ])
  Route.post('/', 'EstatePermissionController.givePermissionToPropertyManager').middleware([
    'auth:jwtLandlord',
    'valid:EstatePermission',
  ])
  Route.put('/', 'EstatePermissionController.permissionToPropertyManager').middleware([
    'auth:jwtLandlord',
    'valid:EstatePermission',
  ])

  Route.get(
    '/propertyManagers',
    'EstatePermissionController.getPermittedPropertyManagers'
  ).middleware(['auth:jwtLandlord', 'valid:EstatePermissionFilter,Pagination'])
  Route.get('/landlords', 'EstatePermissionController.getLandlords').middleware([
    'auth:jwtPropertyManager',
    'valid:EstatePermissionFilter,Pagination',
  ])
}).prefix('api/v1/estatePermission')

Route.group(() => {
  Route.get('/', 'LetterTemplateController.get')
  Route.post('/', 'LetterTemplateController.update').middleware(['valid:LetterTemplate'])
  Route.put('/:id/delete_logo', 'LetterTemplateController.deleteLogo').middleware(['valid:Id'])
  Route.delete('/:id', 'LetterTemplateController.delete').middleware(['valid:Id'])
})
  .prefix('/api/v1/letter_template')
  .middleware(['auth:jwtLandlord'])

// Estate management by property manager
Route.group(() => {
  Route.get('/', 'EstateController.getEstatesByPM').middleware(['valid:Pagination,EstateFilter'])
  Route.post('/', 'EstateController.createEstateByPM').middleware(['valid:CreateEstate,LandlordId'])
  Route.post('/import', 'EstateController.importEstateByPM')
  // Route.get('/verifyPropertyId', 'EstateController.verifyPropertyId').middleware([
  //   'valid:PropertyId',
  // ])

  Route.get('/:id', 'EstateController.getEstateByPM').middleware(['valid:Id'])
  Route.put('/:id', 'EstateController.updateEstateByPM').middleware(['valid:UpdateEstate'])
  // // Rooms manage
  Route.get('/:estate_id/rooms', 'RoomController.getEstateRooms').middleware(['valid:EstateId'])
  Route.post('/:estate_id/rooms', 'RoomController.createRoom').middleware([
    'valid:CreateRoom,EstateId',
  ])
  Route.post('/:estate_id/files', 'EstateController.addFile').middleware(['valid:EstateAddFile'])

  Route.put('/:estate_id/rooms/:room_id', 'RoomController.updateRoom').middleware([
    'valid:CreateRoom,EstateId,RoomId',
  ])
  // // Room photos add
  Route.post('/:estate_id/rooms/:room_id/images', 'RoomController.addRoomPhoto').middleware([
    'valid:RoomId',
  ])
})
  .prefix('/api/v1/propertymanager/estates')
  .middleware(['auth:jwtPropertyManager'])

Route.post('/api/v1/image/createthumbnail', 'ImageController.tryCreateThumbnail').middleware([
  'auth:jwtLandlord',
])

Route.get('/populate_mautic_db/:secure_key', 'MauticController.populateMauticDB')
// Force add named middleware to all requests
const excludeRoutes = ['/api/v1/terms', '/api/v1/me', '/api/v1/logout']
Route.list().forEach((r) => {
  if (
    Array.isArray(r.middlewareList) &&
    !excludeRoutes.includes(r._route) &&
    !r._route.match(/\/administration/)
  ) {
    if (r.middlewareList.length > 0) {
      r.middlewareList = [...r.middlewareList, 'agreement']
    }
  }
})
/*
const MatchService = use('App/Services/MatchService')
const { omit } = require('lodash')
Route.get('/test/estate/:id', async ({ request, response }) => {
  let query = MatchService.getEstateForScoringQuery()
  const { id } = request.all()
  query.where('estates.id', id)
  let estate = await query.first()
  estate = omit(estate.toJSON(), [
    'verified_address',
    'bath_options',
    'kitchen_options',
    'equipment',
  ])
  return response.res(estate)
}).middleware(['valid:Id'])

Route.get('/test/prospect/:id/', async ({ request, response }) => {
  const { id } = request.all()
  let query = MatchService.getProspectForScoringQuery()
  query.where('tenants.user_id', id)
  let prospect = await query.first()
  return response.res(prospect)
}).middleware(['valid:Id'])

// const Matchservice = use('App/Services/Matchservice1')
// Route.get('/debug/test-match', async ({ request, response }) => {
//   if (!process.env.DEV) {
//     response.res(false)
//   }
//   let prospect = {
//     income: 0,
//     budget_max: 30,
//     credit_score: 90,
//     unpaid_rental: 1,
//     non_smoker: true,
//     members_age: [10, 65],
//     members_count: 7,
//     pets: 1,
//     space_min: 100,
//     space_max: 200,
//     rooms_min: 2,
//     rooms_max: 3,
//     floor_min: 1,
//     floor_max: 2,
//     apt_type: [1, 2],
//     house_type: [1, 2],
//     rent_start: '2022-05-20',
//     options: [1, 2, 3, 4, 5, 6, 7],
//   }

//   const estate = {
//     budget: 30,
//     credit_score: 90,
//     net_rent: 300,
//     area: 150,
//     min_age: 10,
//     max_age: 65,
//     non_smoker: true,
//     pets: 1,
//     rooms_number: 2,
//     number_floors: 2,
//     house_type: 1,
//     apt_type: 1,
//     options: [1, 2, 3, 4, 5, 6, 7],
//     vacant_date: '2022-05-20',
//     family_size_max: 6,
//   }

//   let scores = []
//   for (let k = 250; k <= 5000; k += 10) {
//     //for (let k = 10; k <= 100; k += 5) {
//     //prospect.credit_score = k
//     //prospect.income = 300
//     prospect.income = k
//     scores.push({
//       income: prospect.income,
//       scores: Matchservice.calculateMatchPercent(prospect, estate),
//     })
//   }
//   return response.res({ scores })
// })

//test matching given estate and
Route.get('/test/match/:estate_id/:id', async ({ request, response }) => {
  const { id, estate_id } = request.all()
  let query = MatchService.getEstateForScoringQuery()
  query.where('estates.id', estate_id)
  let estate = await query.first()
  estate = omit(estate.toJSON(), [
    'verified_address',
    'bath_options',
    'kitchen_options',
    'equipment',
  ])
  query = MatchService.getProspectForScoringQuery()
  query.where('tenants.user_id', id)
  let prospect = await query.first()
  const matchScore = MatchService.calculateMatchPercent(prospect, estate)
  return response.res({ estate, prospect, matchScore })
}).middleware(['valid:Id,EstateId'])
*/
