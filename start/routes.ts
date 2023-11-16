'use strict'

import * as fs from 'node:fs'

import { generateAdonisRoutes } from './routes/_helper'
import { apiIndexRoutes, indexRoutes } from './routes/index'
import { administrationRoutes } from './routes/administration'
import { buildingRoutes } from './routes/building'
import { estatesRoutes } from './routes/estates'
import { estateSyncRoutes } from './routes/estateSync'
import { galleryRoutes } from './routes/gallery'
import { landlordRoutes } from './routes/landlord'
import { onboardRoutes } from './routes/onboard'
import { onboardingRoutes } from './routes/onboarding'
import { userRoutes } from './routes/users'
import { visitRoutes } from './routes/visit'
import { adminRoutes } from './routes/admin'
import { tenantRoutes } from './routes/tenant'
import { connectRoutes } from './routes/connect'

const Route = use('Route')
const API_BASE = '/api/v1'

generateAdonisRoutes(indexRoutes)
generateAdonisRoutes(apiIndexRoutes, `${API_BASE}`)
generateAdonisRoutes(administrationRoutes, `${API_BASE}/administration`)
generateAdonisRoutes(adminRoutes, `${API_BASE}/admin`)
generateAdonisRoutes(buildingRoutes, `${API_BASE}/building`)
generateAdonisRoutes(connectRoutes, `${API_BASE}/connect`)
generateAdonisRoutes(estatesRoutes, `${API_BASE}/estates`)
generateAdonisRoutes(estateSyncRoutes, `${API_BASE}/estate-sync`)
generateAdonisRoutes(galleryRoutes, `${API_BASE}/gallery`)
generateAdonisRoutes(landlordRoutes, `${API_BASE}/landlord`)
generateAdonisRoutes(onboardRoutes, `${API_BASE}/onboard`)
generateAdonisRoutes(onboardingRoutes, `${API_BASE}/onboarding`)
generateAdonisRoutes(tenantRoutes, `${API_BASE}/tenant`)
generateAdonisRoutes(userRoutes, `${API_BASE}/users`)
generateAdonisRoutes(visitRoutes, `${API_BASE}/visit`)

/**
 * refactor progressed until here, this file should not contain route definitions, routes
 * are defined in parallel to their endpoint urls in the subfolder routes e.g. index
 * contains routes * for / and /api/v1.
 * Furthermore estates.ts for /api/v1/estates and so on if there is a bigger
 * subset of functions on a deeper nested route move them into a seperate file
 * e.g. estates.rooms.ts for all room related endpoints
 */

// Terms
Route.group(() => {
  Route.get('/', 'CommonController.getTermsAndConditions')
  Route.post('/', 'CommonController.acceptTermsAndConditions').middleware([
    'auth:jwtLandlord,jwt',
    'valid:AcceptTerms'
  ])
}).prefix('api/v1/terms')

Route.get('api/v1/url/', 'CommonController.getProtectedUrl').middleware([
  'auth:jwtLandlord,jwt',
  'valid:Uri'
])

// TENANT

Route.get('/api/v1/dashboard/count', 'DashboardController.getDashboardCount').middleware([
  'auth:jwtLandlord'
])
// Tenant members

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
  Route.get('/myTenants', 'LandlordController.getAllTenants')
  Route.get('/tenant_budget_count', 'TenantController.tenantCountByBudget').middleware([
    'valid:BudgetFilter'
  ])
  Route.get('/tenant_credit_score_count', 'TenantController.tenantCountByCreditScore').middleware([
    'valid:CreditScoreFilter'
  ])
  Route.get('/tenant_count', 'TenantController.tenantCount')
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
  'valid:MatchListTenant,Pagination'
])

Route.get(
  '/api/v1/match/tenant/check/commitedAlready',
  'MatchController.checkTenantMatchCommitedAlready'
).middleware(['auth:jwt'])

Route.get('/api/v1/match/tenant/upcoming', 'MatchController.getTenantUpcomingVisits').middleware([
  'auth:jwt'
])
Route.get('/api/v1/match/tenant/count', 'MatchController.getMatchesCountsTenant').middleware([
  'auth:jwt',
  'valid:MatchListTenant,Pagination'
])
Route.get(
  '/api/v1/match/tenant/stage/count',
  'MatchController.getMatchesStageCountsTenant'
).middleware(['auth:jwt'])

Route.get('/api/v1/match/tenant/search', 'MatchController.searchForTenant').middleware([
  'auth:jwt',
  'valid:Pagination,EstateFilter'
])
Route.get('/api/v1/match/landlord/search', 'MatchController.searchForLandlord').middleware([
  'auth:jwtLandlord',
  'valid:Pagination,EstateFilter'
])

Route.get('/api/v1/match/landlord', 'MatchController.getMatchesListLandlord').middleware([
  'auth:jwtLandlord',
  'valid:MatchListLandlord,Pagination'
])

/**
 * sent email to current tenant for a specific estate
 */
Route.group(() => {
  Route.post('', 'MatchController.inviteTenantToEstate').middleware([
    'valid:InviteInToVisit,InviteTo'
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
).middleware(['auth:jwtLandlord,jwtAdministrator', 'valid:MatchListLandlord,Pagination'])

/* Notify prospect match user on email to fillup profile */
Route.post(
  '/api/v1/match/landlord/estate/notifyprospect-fillupprofile',
  'MatchController.notifyProspectsToFillUpProfile'
).middleware(['auth:jwtLandlord', 'valid:NotifyProspectsToFillUpProfile'])

Route.get('/api/v1/match/landlord/summary', 'MatchController.getLandlordSummary').middleware([
  'auth:jwtLandlord'
])

Route.group(() => {
  Route.post('/', 'FeedbackController.create').middleware([
    'auth:jwt,jwtLandlord',
    'valid:CreateFeedback'
  ])
  Route.get('/', 'FeedbackController.getAll').middleware(['auth:jwtAdministrator'])
}).prefix('/api/v1/feedback')

// MATCH FLOW
Route.group(() => {
  Route.post('/knock', 'MatchController.knockEstate').middleware(['auth:jwt', 'valid:Knock'])
  Route.get('/knock', 'MatchController.getKnockPlacesNumber').middleware([
    'auth:jwt',
    'valid:EstateId'
  ])

  Route.delete('/knock', 'MatchController.removeKnock').middleware(['auth:jwt'])
  // invite
  Route.post('/invite', 'MatchController.matchToInvite').middleware([
    'auth:jwtLandlord',
    'valid:MatchInvite'
  ])
  Route.post('/move', 'MatchController.matchMoveToNewEstate').middleware([
    'auth:jwtLandlord',
    'valid:MatchMoveToNewEstate'
  ])
  Route.delete('/invite', 'MatchController.removeInvite').middleware([
    'auth:jwtLandlord',
    'valid:MatchInvite'
  ])
  Route.delete('/invite/:estate_id', 'MatchController.removeInviteByTenant').middleware([
    'auth:jwt',
    'valid:EstateId'
  ])
  // Choose timeslot
  Route.post('/visit', 'MatchController.chooseVisitTimeslot').middleware([
    'auth:jwt',
    'valid:ChooseTimeslot'
  ])
  Route.post('/profile/request', 'MatchController.requestTenantToShareProfile').middleware([
    'auth:jwtLandlord',
    'valid:RequestProspectProfile'
  ])
  Route.post(
    '/profile/response',
    'MatchController.prospectRespondToProfileSharingRequest'
  ).middleware(['auth:jwt', 'valid:ShareProfileStatus'])
  Route.post('/visit/inviteIn', 'MatchController.inviteTenantInToVisit').middleware([
    'auth:jwtLandlord',
    'valid:InviteInToVisit'
  ])
  Route.delete('/visit', 'MatchController.cancelVisit').middleware(['auth:jwt'])
  Route.delete('/landlordVisit', 'MatchController.cancelVisitByLandlord').middleware([
    'auth:jwtLandlord',
    'valid:LandlordVisitCancel'
  ])
  // Share tenant profile to landlord
  Route.post('/share', 'MatchController.shareTenantData').middleware([
    'auth:jwtLandlord',
    'valid:ShareProspectProfile'
  ])
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
    'valid:ConfirmRequest'
  ])
  Route.put('/order', 'MatchController.changeOrder').middleware([
    'auth:jwt,jwtLandlord',
    'valid:ChangeOrder'
  ])
}).prefix('api/v1/match')

Route.group(() => {
  Route.delete('/cancel/:action', 'MatchController.cancelAction').middleware(['valid:MatchAction'])
  // this should be cancel-category
  Route.delete('/cancel-building/:action', 'MatchController.cancelBuildingAction').middleware([
    'valid:MatchBuildingAction'
  ])
})
  .middleware(['auth:jwtAdministrator'])
  .prefix('api/v1/match')
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
  'valid:DebugNotification'
])

Route.get('/api/v1/feature', 'FeatureController.getFeatures')
  .middleware(['valid:CreateFeature'])
  .middleware(['auth:jwtLandlord,jwt'])

// MATCH FLOW
Route.group(() => {
  Route.post('/', 'EstateCurrentTenantController.create').middleware([
    'valid:CreateEstateCurrentTenant'
  ])
  Route.put('/:id', 'EstateCurrentTenantController.update').middleware([
    'valid:CreateEstateCurrentTenant,Id'
  ])
  Route.delete('/', 'EstateCurrentTenantController.delete').middleware(['valid:Ids'])
  Route.put('/expire/:id', 'EstateCurrentTenantController.expire').middleware(['valid:Id'])
  Route.get('/', 'EstateCurrentTenantController.getAll').middleware([
    'valid:EstateCurrentTenantFilter'
  ])
  Route.get('/:id', 'EstateCurrentTenantController.get').middleware(['valid:Id'])
  Route.put('/:id/lease_contract', 'EstateCurrentTenantController.addLeaseContract').middleware([
    'valid:Id'
  ])
  Route.delete(
    '/:id/lease_contract',
    'EstateCurrentTenantController.removeLeaseContract'
  ).middleware(['valid:Id,RemoveImage'])
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
  Route.post('/', 'AccountController.updateTenantPremiumPlan').middleware([
    'auth:jwt',
    'valid:TenantPremiumPlan,AppType'
  ])
  Route.get('/', 'AccountController.getTenantPremiumPlans').middleware([
    'auth:jwt',
    'valid:AppType'
  ])
}).prefix('api/v1/tenantPremiumPlan')

Route.group(() => {
  Route.post('/', 'EstateAbuseController.reportEstateAbuse').middleware([
    'auth:jwt',
    'valid:CreateEstateAbuse'
  ])
}).prefix('api/v1/estateReportAbuse')

Route.group(() => {
  Route.post('/', 'TenantReportAbuseController.reportTenantAbuse').middleware([
    'auth:jwtLandlord',
    'valid:CreateEstateAbuse,TenantId'
  ])

  Route.delete('/:id', 'TenantReportAbuseController.deleteAbuse').middleware([
    'auth:jwtAdministrator',
    'valid:Id'
  ])
}).prefix('api/v1/tenantReportAbuse')

Route.group(() => {
  Route.post('/id', 'EstatePermissionController.requestPermissionToLandlordById').middleware([
    'auth:jwtPropertyManager',
    'valid:Ids'
  ])
  Route.post('/email', 'EstatePermissionController.requestPermissionToLandlordByEmail').middleware([
    'auth:jwtPropertyManager',
    'valid:Emails'
  ])
  Route.delete('/pm', 'EstatePermissionController.deletePermissionByPM').middleware([
    'auth:jwtPropertyManager',
    'valid:Ids'
  ])
  Route.delete('/landlord', 'EstatePermissionController.deletePermissionByLandlord').middleware([
    'auth:jwtLandlord',
    'valid:Ids'
  ])
  Route.delete('/email', 'EstatePermissionController.deletePermissionLandlordByEmail').middleware([
    'auth:jwtPropertyManager',
    'valid:Emails'
  ])
  Route.post('/', 'EstatePermissionController.givePermissionToPropertyManager').middleware([
    'auth:jwtLandlord',
    'valid:EstatePermission'
  ])
  Route.put('/', 'EstatePermissionController.permissionToPropertyManager').middleware([
    'auth:jwtLandlord',
    'valid:EstatePermission'
  ])

  Route.get(
    '/propertyManagers',
    'EstatePermissionController.getPermittedPropertyManagers'
  ).middleware(['auth:jwtLandlord', 'valid:EstatePermissionFilter,Pagination'])
  Route.get('/landlords', 'EstatePermissionController.getLandlords').middleware([
    'auth:jwtPropertyManager',
    'valid:EstatePermissionFilter,Pagination'
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

Route.post('/api/v1/image/createthumbnail', 'ImageController.tryCreateThumbnail').middleware([
  'auth:jwtLandlord'
])

Route.get('/populate_mautic_db/:secure_key', 'MauticController.populateMauticDB')
// Force add named middleware to all requests
const excludeRoutes = ['/api/v1/terms', '/api/v1/me', '/api/v1/logout', '/:key']
Route.list().forEach((r: { middlewareList: any[], _route: string }) => {
  if (
    Array.isArray(r.middlewareList) &&
    !excludeRoutes.includes(r._route) &&
    !r._route.includes('/administration')
  ) {
    if (r.middlewareList.length > 0) {
      r.middlewareList = [...r.middlewareList, 'agreement', 'plan']
    }
  }
})

Route.post('/webhooks/estate-sync', 'WebhookController.estateSync')

// Test to create contact from 3rd market places
Route.group(() => {
  Route.post('/contact', 'MarketPlaceController.createContact').middleware([
    'valid:MarketPlaceContact'
  ])
})
  .prefix('api/v1/marketplace')
  .middleware(['auth:jwtAdministrator'])

Route.group(() => {
  Route.post('/knock', 'MarketPlaceController.createKnock').middleware([
    'valid:AlreadyRegisteredOutsideTenantInvite'
  ])
})
  .prefix('api/v1/marketplace')
  .middleware(['auth:jwt'])

Route.group(() => {
  Route.post('/invite/:id', 'MarketPlaceController.inviteByLandlord').middleware(['valid:Id'])
})
  .prefix('api/v1/marketplace')
  .middleware(['auth:jwtLandlord'])

Route.group(() => {
  Route.post('/subscription', 'StripeController.createSubscription').middleware([
    'valid:CreateSubscription'
  ])
})
  .prefix('api/v1/stripe')
  .middleware(['auth:jwtLandlord'])

Route.group(() => {
  Route.get('/products', 'StripeController.getProducts')
})
  .prefix('api/v1/stripe')
  .middleware(['auth:jwt,jwtLandlord'])

Route.post('/api/webhooks/stripe', 'StripeController.webhook')
Route.group(() => {
  Route.post('/webhooks/stripe', 'StripeController.webhookTest')
  Route.post('/publish/pay', 'StripeController.testPublishPayment')
})
  .prefix('api/v1/test')
  .middleware(['auth:jwtLandlord'])

Route.get('/api/v1/cities', 'CommonController.searchCities').middleware(['valid:SearchCity'])
Route.get('/api/v1/countries', 'CommonController.getAvailableCountries')
Route.get('/api/v1/offers', 'CommonController.getOffers').middleware(['valid:GetOffers'])

const routeConfig = [...Route.list()]
  .sort((a, b) => (a._route > b._route ? 1 : b._route > a._route ? -1 : a.verbs > b.verbs ? 1 : -1))
  .map((r) => ({
    route: r._route,
    method: r.verbs,
    middle: r.middlewareList,
    handler: typeof r.handler === 'function' ? r.handler.name : r.handler
  }))

fs.writeFileSync('./start/route_index', JSON.stringify(routeConfig, null, 2))
