import * as fs from 'node:fs'

import { Routes, generateAdonisRoutes, prefixAll } from './routes/_helper'
import { apiIndexRoutes, indexRoutes } from './routes/index'
import { administrationRoutes } from './routes/administration'
import { adminRoutes } from './routes/admin'
import { buildingRoutes } from './routes/building'
import { connectRoutes } from './routes/connect'
import { contactsRoutes } from './routes/contacts'
import { currentTenantRoutes } from './routes/current_tenant'
import { companyRoutes } from './routes/companies'
import { debugRoutes } from './routes/debug'
import { estatesRoutes } from './routes/estates'
import { estatePermissionRoutes } from './routes/estatePermission'
import { estateSyncRoutes } from './routes/estateSync'
import { featureRoutes } from './routes/feature'
import { feedbackRoutes } from './routes/feedback'
import { galleryRoutes } from './routes/gallery'
import { landlordRoutes } from './routes/landlord'
import { landlordsRoutes } from './routes/landlords'
import { letterTemplateRoutes } from './routes/letter_template'
import { marketPlaceRoutes } from './routes/marketplace'
import { matchRoutes } from './routes/match'
import { notesRoutes } from './routes/notes'
import { onboardRoutes } from './routes/onboard'
import { onboardingRoutes } from './routes/onboarding'
import { planRoutes } from './routes/plan'
import { userRoutes } from './routes/users'
import { stripeRoutes } from './routes/stripe'
import { tenantRoutes } from './routes/tenant'
import { tenantPremiumPlanRoutes } from './routes/tenantPremiumPlan'
import { termsRoutes } from './routes/terms'
import { testRoutes } from './routes/test'
import { visitRoutes } from './routes/visit'

const API_BASE = '/api/v1'

const routeList: Routes = {
  ...indexRoutes,
  ...prefixAll(`${API_BASE}`, apiIndexRoutes),
  ...prefixAll(`${API_BASE}/administration`, administrationRoutes),
  ...prefixAll(`${API_BASE}/admin`, adminRoutes),
  ...prefixAll(`${API_BASE}/building`, buildingRoutes),
  ...prefixAll(`${API_BASE}/connect`, connectRoutes),
  ...prefixAll(`${API_BASE}/contacts`, contactsRoutes),
  ...prefixAll(`${API_BASE}/current_tenant`, currentTenantRoutes),
  ...prefixAll(`${API_BASE}/companies`, companyRoutes),
  ...prefixAll(`${API_BASE}/debug`, debugRoutes),
  ...prefixAll(`${API_BASE}/estates`, estatesRoutes),
  ...prefixAll(`${API_BASE}/estatePermission`, estatePermissionRoutes),
  ...prefixAll(`${API_BASE}/estate-sync`, estateSyncRoutes),
  ...prefixAll(`${API_BASE}/feature`, featureRoutes),
  ...prefixAll(`${API_BASE}/feedback`, feedbackRoutes),
  ...prefixAll(`${API_BASE}/gallery`, galleryRoutes),
  ...prefixAll(`${API_BASE}/landlord`, landlordRoutes),
  ...prefixAll(`${API_BASE}/landlords`, landlordsRoutes),
  ...prefixAll(`${API_BASE}/letter_template`, letterTemplateRoutes),
  ...prefixAll(`${API_BASE}/marketplace`, marketPlaceRoutes),
  ...prefixAll(`${API_BASE}/match`, matchRoutes),
  ...prefixAll(`${API_BASE}/notes`, notesRoutes),
  ...prefixAll(`${API_BASE}/onboard`, onboardRoutes),
  ...prefixAll(`${API_BASE}/onboarding`, onboardingRoutes),
  ...prefixAll(`${API_BASE}/plan`, planRoutes),
  ...prefixAll(`${API_BASE}/stripe`, stripeRoutes),
  ...prefixAll(`${API_BASE}/tenant`, tenantRoutes),
  ...prefixAll(`${API_BASE}/tenantPremiumPlan`, tenantPremiumPlanRoutes),
  ...prefixAll(`${API_BASE}/terms`, termsRoutes),
  ...prefixAll(`${API_BASE}/users`, userRoutes),
  ...prefixAll(`${API_BASE}/test`, testRoutes),
  ...prefixAll(`${API_BASE}/visit`, visitRoutes)
}

// apply terms and plan validations to routes
function applyTermsMiddlewareToRoutes (routes: Routes): void {
  // check if terms are needed based on auth middleware
  // no auth or admin means no terms needed
  const needsTermsMiddleware = (middle: string[]): boolean => {
    return (
      middle.findIndex(
        (middle) => middle.startsWith('auth:jwt') && middle !== 'auth:jwtAdministrator'
      ) > -1
    )
  }
  // routes to ignore when applying terms validation
  const ignoreRoutes = [
    '/api/v1/terms',
    '/api/v1/me',
    '/api/v1/logout',
    /\/api\/v1\/stripe\/.*/,
    /\/api\/v1\/marketplace\/.*/,
    '/:key'
  ]

  const matchIgnoreRoutes = (route: string): boolean => {
    return ignoreRoutes.findIndex((ignoreRoute) => new RegExp(ignoreRoute).exec(route)) >= 0
  }

  // iterate all routes to check if they should have terms validation
  for (const [path, route] of Object.entries(routes)) {
    if (matchIgnoreRoutes(path)) {
      continue
    }

    for (const [, config] of Object.entries(route)) {
      if (Array.isArray(config.middleware) && needsTermsMiddleware(config.middleware)) {
        config.middleware = [...config.middleware, 'agreement', 'plan']
      }
    }
  }
}

// finilize routing config
applyTermsMiddlewareToRoutes(routeList)
generateAdonisRoutes(routeList)

// @TODO legacy to be reworked

const Route = use('Route')

/**
 * @TODO @FIXME need to cleanup this last route from here into a seperate controller
 */

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
  .middleware(['auth:jwt', 'agreement', 'plan'])

// generate route_index file, should be moved into a seperate command
const routeConfig = [...Route.list()]
  .sort((a, b) => (a._route > b._route ? 1 : b._route > a._route ? -1 : a.verbs > b.verbs ? 1 : -1))
  .map((r) => ({
    route: r._route,
    method: r.verbs,
    middle: r.middlewareList,
    handler: typeof r.handler === 'function' ? r.handler.name : r.handler
  }))

fs.writeFileSync('./start/route_index', JSON.stringify(routeConfig, null, 2))
