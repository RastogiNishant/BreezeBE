import { HTTP_METHODS, Routes, addMiddlewareToRoutes } from './_helper'

const companyRoutesRaw: Routes = {
  '/': {
    [HTTP_METHODS.GET]: {
      controller: 'CompanyController.getCompany'
    },
    [HTTP_METHODS.POST]: {
      controller: 'CompanyController.createCompany',
      middleware: ['valid:CreateCompany']
    }
  },
  '/:id': {
    [HTTP_METHODS.PUT]: {
      controller: 'CompanyController.updateCompany',
      middleware: ['valid:Id,UpdateCompany']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'CompanyController.removeCompany',
      middleware: ['valid:Id']
    }
  }
}

export const companyRoutes = addMiddlewareToRoutes(companyRoutesRaw, 'auth:jwtLandlord')
