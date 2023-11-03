import { HTTP_METHODS, Routes } from './_helper'

export const onboardRoutes: Routes = {
  '/tenant/estates/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getTenantEstate',
      middleware: ['valid:Id']
    }
  },
  '/tenant/estates/third_party/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getThirdPartyOfferEstate',
      middleware: ['valid:Id']
    }
  }
}
