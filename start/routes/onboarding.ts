import { HTTP_METHODS, Routes } from './_helper'

export const onboardingRoutes: Routes = {
  '/': {
    [HTTP_METHODS.GET]: {
      controller: 'AccountController.onboard',
      middleware: ['auth:jwt,jwtLandlord']
    }
  },
  '/profile': {
    [HTTP_METHODS.GET]: {
      controller: 'AccountController.onboardProfile',
      middleware: ['auth:jwt,jwtLandlord']
    }
  },
  '/dashboard': {
    [HTTP_METHODS.GET]: {
      controller: 'AccountController.onboardDashboard',
      middleware: ['auth:jwt,jwtLandlord']
    }
  },
  '/selection': {
    [HTTP_METHODS.GET]: {
      controller: 'AccountController.onboardSelection',
      middleware: ['auth:jwt,jwtLandlord']
    }
  },
  '/verification': {
    [HTTP_METHODS.GET]: {
      controller: 'AccountController.onboardLandlordVerification',
      middleware: ['auth:jwt,jwtLandlord']
    }
  }
}
