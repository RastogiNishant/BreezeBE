import { HTTP_METHODS, Routes } from './_helper'

export const visitRoutes: Routes = {
  '/landlord': {
    [HTTP_METHODS.PUT]: {
      controller: 'MatchController.updateVisitTimeslotLandlord',
      middleware: ['auth:jwtLandlord', 'valid:UpdateVisitStatusLord']
    }
  },
  '/landlord/come': {
    [HTTP_METHODS.PUT]: {
      controller: 'MatchController.inviteToCome',
      middleware: ['auth:jwtLandlord', 'valid:InviteUserToCome']
    }
  },
  '/tenant': {
    [HTTP_METHODS.PUT]: {
      controller: 'MatchController.updateVisitTimeslotTenant',
      middleware: ['auth:jwt', 'valid:UpdateVisitStatusTenant']
    }
  },
  '/notifications/followup': {
    [HTTP_METHODS.POST]: {
      controller: 'MatchController.followupVisit',
      middleware: ['auth:jwtLandlord', 'valid:FollowupVisit']
    }
  },
  '/notifications/followup/:estate_id/:user_id': {
    [HTTP_METHODS.GET]: {
      controller: 'MatchController.getFollowups',
      middleware: ['auth:jwtLandlord', 'valid:FollowupVisit']
    }
  }
}
