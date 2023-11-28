import { HTTP_METHODS, Routes } from './_helper'

export const termsRoutes: Routes = {
  '/': {
    [HTTP_METHODS.GET]: {
      controller: 'CommonController.getTermsAndConditions'
    },
    [HTTP_METHODS.POST]: {
      controller: 'CommonController.acceptTermsAndConditions',
      middleware: ['auth:jwtLandlord,jwt', 'valid:AcceptTerms']
    }
  }
}
