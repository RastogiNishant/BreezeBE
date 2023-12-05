import { HTTP_METHODS, Routes } from './_helper'

const landlordsPrivateRoutes: Routes = {
  '/myTenants': {
    [HTTP_METHODS.GET]: {
      controller: 'LandlordController.getAllTenants',
      middleware: ['auth:jwtLandlord']
    }
  },
  '/tenant_budget_count': {
    [HTTP_METHODS.GET]: {
      controller: 'TenantController.tenantCountByBudget',
      middleware: ['auth:jwtLandlord', 'valid:BudgetFilter']
    }
  },
  '/tenant_credit_score_count': {
    [HTTP_METHODS.GET]: {
      controller: 'TenantController.tenantCountByCreditScore',
      middleware: ['auth:jwtLandlord', 'valid:CreditScoreFilter']
    }
  },
  '/tenant_count': {
    [HTTP_METHODS.GET]: {
      controller: 'TenantController.tenantCount',
      middleware: ['auth:jwtLandlord']
    }
  }
}

export const landlordsRoutes: Routes = {
  '/': {
    [HTTP_METHODS.GET]: {
      controller: 'LandlordController.landlords',
      middleware: ['auth:jwtLandlord,jwt']
    }
  },
  '/getLandlords': {
    [HTTP_METHODS.GET]: {
      controller: 'LandlordController.landlords',
      middleware: ['auth:jwtLandlord,jwt']
    }
  },
  '/toggle': {
    [HTTP_METHODS.GET]: {
      controller: 'LandlordController.toggleStatus',
      middleware: ['auth:jwtLandlord,jwt']
    }
  },
  '/buddies/import': {
    [HTTP_METHODS.POST]: {
      controller: 'BuddyController.importBuddies',
      middleware: ['auth:jwtLandlord,jwt']
    }
  },
  '/buddies/get': {
    [HTTP_METHODS.GET]: {
      controller: 'BuddyController.getBuddies',
      middleware: ['auth:jwtLandlord,jwt']
    }
  },
  '/buddies': {
    [HTTP_METHODS.DELETE]: {
      controller: 'BuddyController.removeBuddies',
      middleware: ['auth:jwtLandlord,jwt']
    }
  },
  ...landlordsPrivateRoutes
}
