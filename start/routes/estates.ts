import { EstateTestController } from '@App/Controllers/Http/EstateTestController'
import { HTTP_METHODS, Routes, addMiddlewareToRoutes, prefixAll } from './_helper'
import { estateAmenitiesRoutes } from './estates.amenities'
import { estateBuildingRoutes } from './estates.building'
import { estateFilesRoutes } from './estates.files'
import { estateRoomsRoutes } from './estates.rooms'
import { estateSlotsRoutes } from './estates.slots'

const indexTenantRoutes: Routes = {
  '/tenant/invite': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateCurrentTenantController.inviteTenantToApp',
      middleware: ['valid:TenantInvitation']
    }
  },
  '/tenant/invite/email': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateCurrentTenantController.inviteTenantToAppByEmail',
      middleware: ['valid:InvitationIds']
    }
  },
  '/tenant/invite/letter': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateCurrentTenantController.inviteTenantToAppByLetter',
      middleware: ['valid:InvitationIds']
    }
  },
  '/tenant/invite/sms': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateCurrentTenantController.inviteTenantToAppBySMS',
      middleware: ['valid:InvitationIds']
    }
  },
  '/tenant/revoke': {
    [HTTP_METHODS.PUT]: {
      controller: 'EstateCurrentTenantController.revokeInvitation',
      middleware: ['valid:InvitationIds']
    }
  },
  '/tenant/disconnect': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateCurrentTenantController.disconnect',
      middleware: ['valid:InvitationIds']
    }
  }
}

const indexRoutes: Routes = {
  '/': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getEstates',
      middleware: ['valid:Pagination,EstateFilter']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'EstateController.deleteMultiple',
      middleware: ['valid:EstateMultipleDelete']
    },
    [HTTP_METHODS.POST]: {
      controller: 'EstateController.createEstate',
      middleware: ['valid:CreateEstate']
    }
  },
  '/candidate': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.searchEstates',
      middleware: ['valid:EstateFilter']
    }
  },
  '/cities': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getCityList'
    }
  },
  '/duplicate/:id': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateController.duplicateEstate',
      middleware: ['valid:Id']
    }
  },
  '/export/:lang': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.export',
      middleware: ['valid:ExportExcel']
    }
  },
  '/export': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.export'
    }
  },
  '/extend': {
    [HTTP_METHODS.PUT]: {
      controller: 'EstateController.extendEstate',
      middleware: ['valid:ExtendEstate,EstateId']
    }
  },
  '/import/last-activity': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.importLastActivity'
    },
    [HTTP_METHODS.POST]: {
      controller: 'EstateController.postImportLastActivity',
      middleware: ['valid:PostImportLastActivity']
    }
  },
  '/import/openimmo': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateController.importOpenimmo',
      middleware: ['ValidOpenImmoImport']
    }
  },
  '/import': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateController.importEstate'
    }
  },
  '/latest': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getLatestEstates',
      middleware: ['valid:Pagination']
    }
  },
  '/match': {
    [HTTP_METHODS.GET]: {
      controller: 'MatchController.getMatchList',
      middleware: ['valid:EstateFilter,Pagination']
    }
  },
  '/match/invite': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.getMatchStageList',
      middleware: ['valid:MatchFilter,Pagination']
    }
  },
  '/match/contact-multiple': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.contactMultiple',
      middleware: ['valid:MatchContactMultiple']
    }
  },
  '/quickLinks': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getEstatesQuickLinks'
    }
  },
  '/quick_search': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.shortSearchEstates',
      middleware: ['valid:EstateFilter']
    }
  },
  '/search/property_id': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.searchByPropertyId'
    }
  },
  ...indexTenantRoutes,
  '/upcomingShows': {
    [HTTP_METHODS.GET]: {
      controller: 'MatchController.getLandlordUpcomingVisits'
    }
  },
  '/verifyPropertyId': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.verifyPropertyId',
      middleware: ['valid:PropertyId']
    }
  },
  '/with-filters': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateController.getEstates',
      middleware: ['valid:Pagination,EstateFilter']
    }
  },
  '/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getEstate',
      middleware: ['valid:Id']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'EstateController.updateEstate',
      middleware: ['valid:UpdateEstate', 'EstateCanEdit']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'EstateController.removeEstate',
      middleware: ['valid:Id']
    }
  },
  '/:id/let': {
    [HTTP_METHODS.PUT]: {
      controller: 'EstateController.changeLettingType',
      middleware: ['valid:UpdateEstate', 'EstateCanEdit']
    }
  },
  '/:id/link': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.createShareLink',
      middleware: ['valid:Id']
    }
  },
  '/:id/offline': {
    [HTTP_METHODS.PUT]: {
      controller: 'EstateController.makeEstateOffline',
      middleware: ['valid:Id']
    }
  },
  '/:id/publish': {
    [HTTP_METHODS.PUT]: {
      controller: 'EstateController.publishEstate',
      middleware: ['valid:Id,PublishEstate']
    }
  }
}

const estateIdIndexRoutes: Routes = {
  '/invite-to-view': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateController.inviteToView',
      middleware: ['valid:LandlordInviteToView', 'LandlordOwnsThisEstate']
    }
  },
  '/me_tenant_detail': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.landlordTenantDetailInfo',
      middleware: ['valid:EstateId,TenantId']
    }
  }
}

// tenant callable routes
const estateIndexRoute: Routes = {
  '/search/onboard': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.searchPreOnboard',
      middleware: ['valid:UpdateTenant']
    }
  },
  '/tenant/invite/letter/retrieve-link/:code': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateCurrentTenantController.retrieveLinkByCode',
      middleware: ['valid:InvitationLinkRetrieveCode', 'UserCanGetInvitationLink']
    }
  },
  '/test/expiring': {
    [HTTP_METHODS.GET]: {
      controller: EstateTestController.getEstatesToExpire
      // middleware: ['valid:InvitationLinkRetrieveCode', 'UserCanGetInvitationLink']
    }
  },
  '/:estate_id/slots/free': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getEstateFreeTimeslots',
      middleware: ['auth:jwt', 'valid:EstateId']
    }
  },
  '/:estate_id/match': {
    [HTTP_METHODS.GET]: {
      controller: 'MatchController.getMatchByEstate',
      middleware: ['auth:jwt', 'valid:EstateId']
    }
  }
}

export const estatesRoutes: Routes = {
  ...addMiddlewareToRoutes(
    {
      ...prefixAll('/:estate_id', {
        ...estateAmenitiesRoutes,
        ...estateFilesRoutes,
        ...estateRoomsRoutes,
        ...estateSlotsRoutes,
        ...estateIdIndexRoutes
      }),
      ...estateBuildingRoutes,
      ...indexRoutes
    },
    'auth:jwtLandlord,jwtAdministrator'
  ),

  ...estateIndexRoute
}
