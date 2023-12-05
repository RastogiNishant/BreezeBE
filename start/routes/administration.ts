import { HTTP_METHODS, Routes } from './_helper'

export const administrationRoutes: Routes = {
  '/activation': {
    [HTTP_METHODS.PUT]: {
      controller: 'Admin/UserController.updateActivationStatus',
      middleware: ['auth:jwtAdministrator', 'valid:UpdateUserValidationStatus']
    }
  },
  '/app/tenant': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/AppController.createTenantLink',
      middleware: ['auth:jwtAdministrator']
    }
  },
  '/buildings': {
    [HTTP_METHODS.POST]: {
      controller: 'Admin/PropertyController.publishBuilding',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    }
  },
  // estate sync
  '/estate-sync': {
    [HTTP_METHODS.POST]: {
      controller: 'Admin/EstateSyncController.initialize',
      middleware: ['auth:jwtAdministrator', 'valid:InitializeEstateSync']
    }
  },
  '/estate-sync/targets': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/EstateSyncController.getTargets',
      middleware: ['auth:jwtAdministrator']
    },
    [HTTP_METHODS.POST]: {
      controller: 'Admin/EstateSyncController.addTarget',
      middleware: ['auth:jwtAdministrator', 'valid:AddEstateSyncTarget']
    }
  },
  '/estate-sync/targets/:id': {
    [HTTP_METHODS.DELETE]: {
      controller: 'Admin/EstateSyncController.deleteTarget',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    }
  },
  // end estate-sync
  // estates
  '/estates': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/PropertyController.getProperties',
      middleware: ['auth:jwtAdministrator', 'pagination']
    }
  },
  '/estates/publish-status': {
    [HTTP_METHODS.PUT]: {
      controller: 'Admin/PropertyController.updatePublishStatus',
      middleware: ['auth:jwtAdministrator', 'valid:AdminUpdatePublishStatus']
    }
  },
  '/estates/:id/images': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/PropertyController.getAllPropertyImages',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    }
  },
  '/estates/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/PropertyController.getSingle',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    }
  },
  '/notifications': {
    [HTTP_METHODS.POST]: {
      controller: 'Admin/NotificationController.sendNotification',
      middleware: ['auth:jwtAdministrator']
    }
  },
  '/notifications/prospect-reactivated': {
    [HTTP_METHODS.POST]: {
      controller: 'Admin/NotificationController.sendReactivateNotification',
      middleware: ['auth:jwtAdministrator']
    }
  },
  '/verifyUsers': {
    [HTTP_METHODS.POST]: {
      controller: 'Admin/UserController.verifyUsers',
      middleware: ['auth:jwtAdministrator', 'valid:Ids,UserVerify']
    }
  },
  '/users': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/UserController.getUsers',
      middleware: ['auth:jwtAdministrator', 'pagination']
    },
    [HTTP_METHODS.POST]: {
      controller: 'Admin/UserController.addUser',
      middleware: ['auth:jwtAdministrator', 'valid:AdminAddUser']
    }
  },
  '/users/:user_id': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/UserController.getUser', // this is missing on Admin/UserController
      middleware: ['auth:jwtAdministrator']
    },
    [HTTP_METHODS.POST]: {
      controller: 'Admin/UserController.updateUser', // this is missing on Admin/UserController. Note: this should be **put**
      middleware: ['auth:jwtAdministrator']
    }
  },
  '/utilities/estates/:id/percent': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/AppController.calculateEstatePercent',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    }
  },
  // feature (Controllers should be moved to app/Controllers/Http/Admin)
  '/feature/': {
    [HTTP_METHODS.POST]: {
      controller: 'FeatureController.createFeature',
      middleware: ['auth:jwtAdministrator', 'valid:CreateFeature']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'FeatureController.updateFeature',
      middleware: ['auth:jwtAdministrator', 'valid:CreateFeature,Id']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'FeatureController.removeFeature',
      middleware: ['auth:jwtAdministrator', 'valid:Ids']
    }
  },
  '/image/compress': {
    [HTTP_METHODS.POST]: {
      controller: 'ImageController.compressImage',
      middleware: ['auth:jwtAdministrator']
    }
  },
  '/image/check': {
    [HTTP_METHODS.POST]: {
      controller: 'ImageController.checkFormat',
      middleware: ['auth:jwtAdministrator']
    }
  },
  '/image/compress_pdf': {
    [HTTP_METHODS.POST]: {
      controller: 'ImageController.testCompressPDF',
      middleware: ['auth:jwtAdministrator']
    }
  },
  // admin plan
  // Controllers should be moved to app/Controllers/Http/Admin
  '/plan/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'PlanController.getPlan',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'PlanController.updatePlan',
      middleware: ['auth:jwtAdministrator', 'valid:CreatePlan,Id']
    }
  },
  '/plan': {
    [HTTP_METHODS.GET]: {
      controller: 'PlanController.getPlanAll',
      middleware: ['auth:jwtAdministrator']
    },
    [HTTP_METHODS.POST]: {
      controller: 'PlanController.createPlan',
      middleware: ['auth:jwtAdministrator', 'valid:CreatePlan']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'PlanController.deletePlan',
      middleware: ['auth:jwtAdministrator', 'valid:Ids']
    }
  },
  // admin authentication
  '/auth/login': {
    [HTTP_METHODS.POST]: {
      controller: 'Admin/AuthController.login',
      middleware: ['guest', 'valid:AdminLogin']
    }
  },
  '/me': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/AuthController.me',
      middleware: ['auth:jwtAdministrator']
    }
  },
  '/landlords': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/UserController.getLandlords',
      middleware: ['auth:jwtAdministrator', 'valid:Pagination,AdminGetsLandlords']
    }
  },

  '/predefinedMessage': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/PredefinedMessageController.getAll',
      middleware: ['auth:jwtAdministrator']
    },
    [HTTP_METHODS.POST]: {
      controller: 'Admin/PredefinedMessageController.create',
      middleware: ['auth:jwtAdministrator', 'valid:CreatePredefinedMessage']
    }
  },
  '/predefinedMessage/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/PredefinedMessageController.get',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'Admin/PredefinedMessageController.update',
      middleware: ['auth:jwtAdministrator', 'valid:CreatePredefinedMessage,Id']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'Admin/PredefinedMessageController.delete',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    }
  },
  '/predefinedMessageChoice': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/PredefinedMessageChoiceController.getAll',
      middleware: ['auth:jwtAdministrator', 'valid:PredefinedMessageChoiceFilter']
    },
    [HTTP_METHODS.POST]: {
      controller: 'Admin/PredefinedMessageChoiceController.create',
      middleware: ['auth:jwtAdministrator', 'valid:CreatePredefinedMessageChoice']
    }
  },
  '/predefinedMessageChoice/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/PredefinedMessageChoiceController.get',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'Admin/PredefinedMessageChoiceController.delete',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'Admin/PredefinedMessageChoiceController.update',
      middleware: ['auth:jwtAdministrator', 'valid:CreatePredefinedMessageChoice,Id']
    }
  },
  '/prospects': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/UserController.getProspects',
      middleware: ['auth:jwtAdministrator']
    }
  },
  '/prospects/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/UserController.getProspect',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    }
  },
  '/utilities/matchscore/:id/:estate_id': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/AppController.calculateMatchScore',
      middleware: ['auth:jwtAdministrator', 'valid:Id,EstateId']
    }
  },
  '/utilities/match-ability/:id': {
    [HTTP_METHODS.POST]: {
      controller: 'Admin/UserController.testMatchability',
      middleware: ['auth:jwtAdministrator', 'valid:Id,AdminTestMatchability']
    }
  },
  '/utilities/prospect-activate/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/UserController.testProspectActivate',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    }
  },
  '/utilities/users/generate-token/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/UserController.getAccessTokenForUser',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    }
  },
  '/utilities/users/temporary-password': {
    [HTTP_METHODS.POST]: {
      controller: 'Admin/UserController.generateTemporaryPassword',
      middleware: ['auth:jwtAdministrator', 'valid:AdminGeneratePassword']
    }
  },
  '/utilities/matches/recalculate-match': {
    [HTTP_METHODS.PUT]: {
      controller: 'Admin/UserController.recalculateMatchByDate',
      middleware: ['auth:jwtAdministrator', 'valid:RecalculateMatchByDate']
    }
  },
  '/utilities/contact-requests': {
    [HTTP_METHODS.POST]: {
      controller: 'Admin/UtilityController.uploadContactRequest',
      middleware: ['auth:jwtAdministrator']
    }
  },
  '/utilities/estate-sync/property': {
    [HTTP_METHODS.PUT]: {
      controller: 'Admin/UtilityController.updateEstateSyncProperty',
      middleware: ['auth:jwtAdministrator', 'valid:UpdateEstateSyncProperty']
    }
  }
}
