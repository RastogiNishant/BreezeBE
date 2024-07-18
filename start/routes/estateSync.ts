import { EstateSyncTestController } from '@App/Controllers/Http/EstateSyncTestController'
import { HTTP_METHODS, Routes } from './_helper'

export const estateSyncRoutes: Routes = {
  '/': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateSyncController.getPublishers',
      middleware: ['auth:jwtLandlord']
    }
  },
  '/api-key': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateSyncController.createApiKey',
      middleware: ['auth:jwtLandlord', 'valid:AddEstateSyncApiKey']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'EstateSyncController.updateApiKey',
      middleware: ['auth:jwtLandlord', 'valid:AddEstateSyncApiKey']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'EstateSyncController.deleteApiKey',
      middleware: ['auth:jwtLandlord']
    }
  },
  '/test/estate': {
    [HTTP_METHODS.GET]: {
      controller: EstateSyncTestController.generateEstateData,
      middleware: ['auth:jwtLandlord']
    }
  },
  '/test/publishProperty': {
    [HTTP_METHODS.GET]: {
      controller: EstateSyncTestController.publishProperty,
      middleware: ['auth:jwtLandlord']
    }
  },
  '/test/updateProperty': {
    [HTTP_METHODS.GET]: {
      controller: EstateSyncTestController.updateProperty,
      middleware: ['auth:jwtLandlord']
    }
  },
  '/test/removeProperty': {
    [HTTP_METHODS.GET]: {
      controller: EstateSyncTestController.removeProperty,
      middleware: ['auth:jwtLandlord']
    }
  },
  '/test/postEstate': {
    [HTTP_METHODS.GET]: {
      controller: EstateSyncTestController.postEstate,
      // middleware: ['auth:jwtLandlord']
    }
  },
  // '/test/creds': {
  //   [HTTP_METHODS.GET]: {
  //     controller: EstateSyncTestController.testCredentials,
  //     middleware: ['auth:jwtLandlord']
  //   }
  // },
  '/:type': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateSyncController.createPublisher',
      middleware: ['auth:jwtLandlord', 'valid:AddEstateSyncTarget']
    }
  },
  '/:publisher': {
    [HTTP_METHODS.DELETE]: {
      controller: 'EstateSyncController.removePublisher',
      middleware: ['auth:jwtLandlord', 'valid:EstateSyncPublisher']
    }
  }
}
