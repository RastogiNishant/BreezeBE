import { HTTP_METHODS, Routes } from './_helper'

export const marketPlaceRoutes: Routes = {
  '/contact': {
    [HTTP_METHODS.POST]: {
      controller: 'MarketPlaceController.createContact',
      middleware: ['auth:jwtAdministrator', 'valid:MarketPlaceContact']
    }
  },
  '/invite/:id': {
    [HTTP_METHODS.POST]: {
      controller: 'MarketPlaceController.inviteByLandlord',
      middleware: ['auth:jwtLandlord', 'valid:Id']
    }
  },
  '/knock': {
    [HTTP_METHODS.POST]: {
      controller: 'MarketPlaceController.createKnock',
      middleware: ['auth:jwt', 'valid:AlreadyRegisteredOutsideTenantInvite']
    }
  }
}
