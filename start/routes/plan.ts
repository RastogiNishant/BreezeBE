import { HTTP_METHODS, Routes, addMiddlewareToRoutes } from './_helper'

const planRoutesRaw: Routes = {
  '/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'PlanController.getPlan',
      middleware: ['valid:Id']
    }
  },
  '/': {
    [HTTP_METHODS.GET]: {
      controller: 'PlanController.getPlanAll'
    }
  }
}

export const planRoutes: Routes = addMiddlewareToRoutes(planRoutesRaw, 'auth:jwt,jwtLandlord')
