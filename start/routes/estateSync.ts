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