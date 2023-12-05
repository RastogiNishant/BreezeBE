import { HTTP_METHODS, Routes, addMiddlewareToRoutes } from './_helper'

const contactsRoutesRaw: Routes = {
  '/': {
    [HTTP_METHODS.GET]: {
      controller: 'CompanyController.getContacts'
    },
    [HTTP_METHODS.POST]: {
      controller: 'CompanyController.createContact',
      middleware: ['valid:CreateContact']
    }
  },
  '/:id': {
    [HTTP_METHODS.PUT]: {
      controller: 'CompanyController.updateContact',
      middleware: ['valid:Id,UpdateContact']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'CompanyController.removeContact',
      middleware: ['valid:Id']
    }
  }
}

export const contactsRoutes: Routes = addMiddlewareToRoutes(contactsRoutesRaw, 'auth:jwtLandlord')
