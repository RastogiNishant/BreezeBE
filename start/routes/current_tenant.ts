import { HTTP_METHODS, Routes } from './_helper'

export const currentTenantRoutes: Routes = {
  '/': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateCurrentTenantController.getAll',
      middleware: ['auth:jwtLandlord', 'valid:EstateCurrentTenantFilter']
    },
    [HTTP_METHODS.POST]: {
      controller: 'EstateCurrentTenantController.create',
      middleware: ['auth:jwtLandlord', 'valid:CreateEstateCurrentTenant']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'EstateCurrentTenantController.delete',
      middleware: ['auth:jwtLandlord', 'valid:Ids']
    }
  },
  '/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateCurrentTenantController.get',
      middleware: ['auth:jwtLandlord', 'valid:Id']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'EstateCurrentTenantController.update',
      middleware: ['auth:jwtLandlord', 'valid:CreateEstateCurrentTenant,Id']
    }
  },
  '/:id/lease_contract': {
    [HTTP_METHODS.PUT]: {
      controller: 'EstateCurrentTenantController.addLeaseContract',
      middleware: ['auth:jwtLandlord', 'valid:Id']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'EstateCurrentTenantController.removeLeaseContract',
      middleware: ['auth:jwtLandlord', 'valid:Id,RemoveImage']
    }
  },
  '/expire/:id': {
    [HTTP_METHODS.PUT]: {
      controller: 'EstateCurrentTenantController.expire',
      middleware: ['auth:jwtLandlord', 'valid:Id']
    }
  }
}
