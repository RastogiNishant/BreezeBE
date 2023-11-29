import { HTTP_METHODS, Routes, addMiddlewareToRoutes } from './_helper'

export const testRoutes: Routes = addMiddlewareToRoutes(
  {
    '/webhooks/stripe': {
      [HTTP_METHODS.POST]: {
        controller: 'StripeController.webhookTest'
      }
    },
    '/publish/pay': {
      [HTTP_METHODS.POST]: {
        controller: 'StripeController.testPublishPayment'
      }
    }
  },
  'auth:jwtLandlord'
)
