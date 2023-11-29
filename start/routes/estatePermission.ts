import { HTTP_METHODS, Routes } from './_helper'

export const estatePermissionRoutes: Routes = {
  '/id': {
    [HTTP_METHODS.POST]: {
      controller: 'EstatePermissionController.requestPermissionToLandlordById',
      middleware: ['auth:jwtPropertyManager', 'valid:Ids']
    }
  },
  '/email': {
    [HTTP_METHODS.POST]: {
      controller: 'EstatePermissionController.requestPermissionToLandlordByEmail',
      middleware: ['auth:jwtPropertyManager', 'valid:Emails']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'EstatePermissionController.deletePermissionLandlordByEmail',
      middleware: ['auth:jwtPropertyManager', 'valid:Emails']
    }
  },
  '/pm': {
    [HTTP_METHODS.DELETE]: {
      controller: 'EstatePermissionController.deletePermissionByPM',
      middleware: ['auth:jwtPropertyManager', 'valid:Ids']
    }
  },
  '/landlord': {
    [HTTP_METHODS.DELETE]: {
      controller: 'EstatePermissionController.deletePermissionByLandlord',
      middleware: ['auth:jwtLandlord', 'valid:Ids']
    }
  },
  '/': {
    [HTTP_METHODS.POST]: {
      controller: 'EstatePermissionController.givePermissionToPropertyManager',
      middleware: ['auth:jwtLandlord', 'valid:EstatePermission']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'EstatePermissionController.permissionToPropertyManager',
      middleware: ['auth:jwtLandlord', 'valid:EstatePermission']
    }
  },
  '/propertyManagers': {
    [HTTP_METHODS.GET]: {
      controller: 'EstatePermissionController.getPermittedPropertyManagers',
      middleware: ['auth:jwtLandlord', 'valid:EstatePermissionFilter,Pagination']
    }
  },
  '/landlords': {
    [HTTP_METHODS.GET]: {
      controller: 'EstatePermissionController.getLandlords',
      middleware: ['auth:jwtPropertyManager', 'valid:EstatePermissionFilter,Pagination']
    }
  }
}
