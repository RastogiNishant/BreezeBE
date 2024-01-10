import { HTTP_METHODS, Routes } from './_helper'

const matchFlow: Routes = {
  '/knock': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.knockEstate',
      middleware: ['auth:jwt', 'valid:Knock']
    },
    [HTTP_METHODS.GET]: {
      controller: 'MatchController.getKnockPlacesNumber',
      middleware: ['auth:jwt', 'valid:EstateId']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'MatchController.removeKnock',
      middleware: ['auth:jwt']
    }
  },
  '/invite': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.matchToInvite',
      middleware: ['auth:jwtLandlord', 'valid:MatchInvite']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'MatchController.removeInvite',
      middleware: ['auth:jwtLandlord', 'valid:MatchInvite']
    }
  },
  '/invite/:estate_id': {
    [HTTP_METHODS.DELETE]: {
      controller: 'MatchController.removeInviteByTenant',
      middleware: ['auth:jwt', 'valid:EstateId']
    }
  },
  '/move': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.matchMoveToNewEstate',
      middleware: ['auth:jwtLandlord', 'valid:MatchMoveToNewEstate']
    }
  },
  '/visit': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.chooseVisitTimeslot',
      middleware: ['auth:jwt', 'valid:ChooseTimeslot']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'MatchController.cancelVisit',
      middleware: ['auth:jwt']
    }
  },
  '/profile/request': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.requestTenantToShareProfile',
      middleware: ['auth:jwtLandlord', 'valid:RequestProspectProfile']
    }
  },
  '/profile/response': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.prospectRespondToProfileSharingRequest',
      middleware: ['auth:jwt', 'valid:ShareProfileStatus']
    }
  },
  '/visit/inviteIn': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.inviteTenantInToVisit',
      middleware: ['auth:jwtLandlord', 'valid:InviteInToVisit']
    }
  },
  '/landlordVisit': {
    [HTTP_METHODS.DELETE]: {
      controller: 'MatchController.cancelVisitByLandlord',
      middleware: ['auth:jwtLandlord', 'valid:LandlordVisitCancel']
    }
  },
  '/share': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.shareTenantData',
      middleware: ['auth:jwtLandlord', 'valid:ShareProspectProfile']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'MatchController.cancelShare',
      middleware: ['auth:jwt']
    }
  },
  '/top': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.moveUserToTop',
      middleware: ['auth:jwtLandlord']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'MatchController.discardUserToTop',
      middleware: ['auth:jwtLandlord']
    }
  },
  '/top/tenant': {
    [HTTP_METHODS.DELETE]: {
      controller: 'MatchController.cancelTopByTenant',
      middleware: ['auth:jwt']
    }
  },
  '/request': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.requestUserCommit',
      middleware: ['auth:jwtLandlord']
    }
  },
  '/commit': {
    [HTTP_METHODS.DELETE]: {
      controller: 'MatchController.tenantCancelCommit',
      middleware: ['auth:jwt']
    }
  },
  '/confirm': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.commitEstateRent',
      middleware: ['auth:jwt', 'valid:ConfirmRequest']
    }
  },
  '/order': {
    [HTTP_METHODS.PUT]: {
      controller: 'MatchController.changeOrder',
      middleware: ['auth:jwt,jwtLandlord', 'valid:ChangeOrder']
    }
  },
  '/cancel/:action': {
    [HTTP_METHODS.DELETE]: {
      controller: 'MatchController.cancelAction',
      middleware: ['auth:jwtAdministrator', 'valid:MatchAction']
    }
  },
  '/cancel-building/:action': {
    [HTTP_METHODS.DELETE]: {
      controller: 'MatchController.cancelBuildingAction',
      middleware: ['auth:jwtAdministrator', 'valid:MatchBuildingAction']
    }
  },
  '/search-prospects': {
    [HTTP_METHODS.GET]: {
      controller: 'MatchController.searchProspects',
      middleware: ['auth:jwtLandlord', 'valid:MatchSearchProspects']
    }
  }
}

export const matchRoutes: Routes = {
  '/landlord/estate': {
    [HTTP_METHODS.GET]: {
      controller: 'MatchController.getMatchesSummaryLandlordEstate',
      middleware: ['auth:jwtLandlord,jwtAdministrator', 'valid:MatchListLandlord,Pagination']
    }
  },
  '/landlord/estate/notifyprospect-fillupprofile': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.notifyProspectsToFillUpProfile',
      middleware: ['auth:jwtLandlord', 'valid:NotifyProspectsToFillUpProfile']
    }
  },
  '/landlord/inviteTenantTo': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.inviteTenantToEstate',
      middleware: ['auth:jwtLandlord', 'valid:InviteInToVisit,InviteTo']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'MatchController.removeTenantEdit',
      middleware: ['auth:jwtLandlord', 'valid:InviteInToVisit']
    }
  },
  '/landlord/search': {
    [HTTP_METHODS.GET]: {
      controller: 'MatchController.searchForLandlord',
      middleware: ['auth:jwtLandlord', 'valid:Pagination,EstateFilter']
    }
  },
  '/landlord/summary': {
    [HTTP_METHODS.GET]: {
      controller: 'MatchController.getLandlordSummary',
      middleware: ['auth:jwtLandlord']
    }
  },
  '/landlord': {
    [HTTP_METHODS.GET]: {
      controller: 'MatchController.getMatchesListLandlord',
      middleware: ['auth:jwtLandlord', 'valid:MatchListLandlord,Pagination']
    }
  },
  '/tenant/check/commitedAlready': {
    [HTTP_METHODS.GET]: {
      controller: 'MatchController.checkTenantMatchCommitedAlready',
      middleware: ['auth:jwt']
    }
  },
  '/tenant/count': {
    [HTTP_METHODS.GET]: {
      controller: 'MatchController.getMatchesCountsTenant',
      middleware: ['auth:jwt', 'valid:MatchListTenant,Pagination']
    }
  },
  '/tenant/property': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.updateProperty',
      middleware: ['auth:jwt', 'valid:EstateId,TenantProperty']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'MatchController.updateProperty',
      middleware: ['auth:jwt', 'valid:EstateId,TenantProperty']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'MatchController.deleteProperty',
      middleware: ['auth:jwt', 'valid:EstateId']
    }
  },
  '/tenant/search': {
    [HTTP_METHODS.GET]: {
      controller: 'MatchController.searchForTenant',
      middleware: ['auth:jwt', 'valid:Pagination,EstateFilter']
    }
  },
  '/tenant/stage/count': {
    [HTTP_METHODS.GET]: {
      controller: 'MatchController.getMatchesStageCountsTenant',
      middleware: ['auth:jwt']
    }
  },
  '/tenant/upcoming': {
    [HTTP_METHODS.GET]: {
      controller: 'MatchController.getTenantUpcomingVisits',
      middleware: ['auth:jwt']
    }
  },
  '/tenant': {
    [HTTP_METHODS.GET]: {
      controller: 'MatchController.getMatchesListTenant',
      middleware: ['auth:jwt', 'valid:MatchListTenant,Pagination']
    }
  },
  ...matchFlow
}
