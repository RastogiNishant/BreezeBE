import { HTTP_METHODS, Routes } from './_helper'

export const estateBuildingRoutes: Routes = {
  '/building/match': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getMatchEstates',
      middleware: ['valid:Pagination,EstateFilter']
    }
  },
  '/building/publish/:id': {
    [HTTP_METHODS.PUT]: {
      controller: 'EstateController.updateBuilding',
      middleware: ['valid:PublishInfo,Id']
    }
  },
  '/building/:id/publish': {
    [HTTP_METHODS.PUT]: {
      controller: 'EstateController.publishBuild',
      middleware: ['valid:Id,PublishEstate']
    }
  },
  '/building/:id/can_publish': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.canBuildPublish',
      middleware: ['valid:Id']
    }
  },
  '/building/:id/extend': {
    [HTTP_METHODS.PUT]: {
      controller: 'EstateController.extendBuilding',
      middleware: ['valid:ExtendEstate,Id']
    }
  },
  '/building/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getBuildingEstates',
      middleware: ['valid:Id,EstateFilter,Pagination']
    }
  }
}
