import { HTTP_METHODS, Routes } from './_helper'

export const buildingRoutes: Routes = {
  '/': {
    [HTTP_METHODS.GET]: {
      controller: 'BuildingController.getAll',
      middleware: ['auth:jwtLandlord']
    },
    [HTTP_METHODS.POST]: {
      controller: 'BuildingController.create',
      middleware: ['auth:jwtLandlord', 'valid:CreateBuilding']
    }
  },
  '/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'BuildingController.get',
      middleware: ['auth:jwtLandlord', 'valid:Id']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'BuildingController.delete',
      middleware: ['auth:jwtLandlord', 'valid:Id']
    }
  }
}
