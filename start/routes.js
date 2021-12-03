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

Route.post('/api/v1/signup', 'AccountController.signup').middleware(['guest', 'valid:SignUp'])
Route.post('/api/v1/login', 'AccountController.login').middleware(['guest', 'valid:SignIn'])
Route.post('/api/v1/logout', 'AccountController.logout').middleware(['auth:jwt,jwtLandlord'])
Route.get("/api/v1/closeAccount", "AccountController.closeAccount").middleware(["auth:jwt,jwtLandlord"]);
Route.group(() => {

  Route.post("/","AccountController.sendCodeForgotPassword" ).middleware(["guest", "valid:ResetEmailRequest"]);
  Route.post("/setPassword", "AccountController.setPasswordForgotPassword").middleware(["guest","valid:SetPassword"]);
}).prefix("/api/v1/forgotPassword");

Route.get('/api/v1/me', 'AccountController.me').middleware(['auth:jwtLandlord,jwt'])
Route.get('/api/v1/confirm_email', 'AccountController.confirmEmail').middleware([
	'valid:ConfirmEmail',
])
Route.put('/api/v1/users', 'AccountController.updateProfile').middleware([
	'auth:jwt,jwtLandlord',
	'valid:UpdateUser',
])
Route.post('/api/v1/users/reconfirm', 'AccountController.resendUserConfirm')

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

Route.group(() => {
	Route.get('/tenant/:id', 'AccountController.getTenantProfile').middleware([
		'auth:jwtLandlord',
		'valid:Id',
	])
	Route.get('/landlord/:id', 'AccountController.getLandlordProfile').middleware([
		'auth:jwt',
		'valid:Id',
	])
}).prefix('/api/v1/profile')

// Tenant params and preferences

Route.group(() => {
	Route.put('/', 'TenantController.updateTenant').middleware(['valid:UpdateTenant'])
	Route.post('/activate', 'TenantController.activateTenant')
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

// Estate management
Route.group(() => {
	Route.get('/', 'EstateController.getEstates').middleware(['valid:Pagination,EstateFilter'])
	Route.post('/', 'EstateController.createEstate').middleware(['valid:CreateEstate'])
	Route.post('/import', 'EstateController.importEstate')
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
}).prefix('/api/v1/visit')

Route.group(() => {
	Route.get('/', 'NoticeController.getNotices').middleware([
		'valid:GetNotifications',
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
])
// Tenant members
Route.group(() => {
	Route.get('/', 'MemberController.getMembers')
	Route.post('/', 'MemberController.addMember').middleware(['valid:CreateMember'])
	Route.put('/:id', 'MemberController.updateMember').middleware(['valid:CreateMember,Id'])
	Route.delete('/:id', 'MemberController.removeMember').middleware(['valid:Id'])
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
})
	.prefix('api/v1/tenant/members')
	.middleware(['auth:jwt'])

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
	.middleware(['auth:jwt'])

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
	Route.get('/', 'LandlordController.getLandlords')
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
Route.get('/api/v1/match/landlord', 'MatchController.getMatchesListLandlord').middleware([
	'auth:jwtLandlord',
	'valid:MatchListLandlord,Pagination',
])

// Landlord specific routes
Route.group(() => {
	Route.get('/visit', 'LandlordController.getLordVisits')
	Route.post('/activate', 'LandlordController.activate')
})
	.prefix('/api/v1/landlord')
	.middleware(['auth:jwtLandlord'])

// MATCH FLOW
Route.group(() => {
	Route.post('/knock', 'MatchController.knockEstate').middleware(['auth:jwt', 'valid:Knock'])
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
	// Share tenant profile to landlord
	Route.post('/share', 'MatchController.shareTenantData').middleware(['auth:jwtLandlord'])
	// Move/remove top tenant
	Route.post('/top', 'MatchController.moveUserToTop').middleware(['auth:jwtLandlord'])
	Route.delete('/top', 'MatchController.discardUserToTop').middleware(['auth:jwtLandlord'])
	// Request confirmation
	Route.post('/request', 'MatchController.requestUserCommit').middleware(['auth:jwtLandlord'])
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

// Force add named middleware to all requests
const excludeRoutes = ['/api/v1/terms', '/api/v1/me']
Route.list().forEach((r) => {
	if (Array.isArray(r.middlewareList) && !excludeRoutes.includes(r._route)) {
		if (r.middlewareList.length > 0) {
			r.middlewareList = [...r.middlewareList, 'agreement']
		}
	}
})
