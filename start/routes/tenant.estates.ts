import { HTTP_METHODS, Routes } from './_helper'

export const tenantEstateRoutes: Routes = {
  '/': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getTenantEstates',
      middleware: ['auth:jwt', 'valid:Pagination']
    }
  },
  '/build/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getTenantBuildingEstate',
      middleware: ['auth:jwt', 'valid:Id,TenantBuildFilter']
    }
  },
  '/invite': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateController.acceptEstateInvite',
      middleware: ['auth:jwt', 'valid:Code']
    }
  },
  '/third-party-offers/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getThirdPartyOfferEstate',
      middleware: ['auth:jwt', 'valid:Id']
    }
  },
  '/third-party-offers/action': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.postThirdPartyOfferAction',
      middleware: ['auth:jwt', 'valid:ThirdPartyOffersAction']
    }
  },
  '/:id/like': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateController.likeEstate',
      middleware: ['auth:jwt', 'valid:Id']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'EstateController.unlikeEstate',
      middleware: ['auth:jwt', 'valid:Id']
    }
  },
  '/:id/dislike': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateController.dislikeEstate',
      middleware: ['auth:jwt', 'valid:Id']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'EstateController.removeEstateDislike',
      middleware: ['auth:jwt', 'valid:Id']
    }
  },
  '/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getTenantEstate',
      middleware: ['auth:jwt', 'valid:Id']
    }
  }
}
