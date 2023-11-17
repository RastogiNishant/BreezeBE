import { HTTP_METHODS, Routes } from './_helper'

export const stripeRoutes: Routes = {
  '/products': {
    [HTTP_METHODS.GET]: {
      controller: 'StripeController.getProducts',
      middleware: ['auth:jwt,jwtLandlord']
    }
  },
  '/subscription': {
    [HTTP_METHODS.POST]: {
      controller: 'StripeController.createSubscription',
      middleware: ['auth:jwtLandlord', 'valid:CreateSubscription']
    }
  }
}
