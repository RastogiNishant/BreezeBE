import { HTTP_METHODS, Routes } from './_helper'

export const adminRoutes: Routes = {
  '/activation': {
    [HTTP_METHODS.PUT]: {
      controller: 'Admin/UserController.updateActivationStatus',
      middleware: ['auth:jwtLandlord', 'valid:UpdateUserValidationStatus']
    }
  },
  '/agreements': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/AgreementController.getAgreements',
      middleware: ['auth:jwtAdministrator']
    },
    [HTTP_METHODS.POST]: {
      controller: 'Admin/AgreementController.createAgreement',
      middleware: ['auth:jwtAdministrator', 'valid:CreateAgreement']
    }
  },
  '/agreements/:id': {
    [HTTP_METHODS.PUT]: {
      controller: 'Admin/AgreementController.updateAgreement',
      middleware: ['auth:jwtAdministrator', 'valid:CreateAgreement,Id']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'Admin/AgreementController.deleteAgreement',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    }
  },
  '/auth/login': {
    [HTTP_METHODS.POST]: {
      controller: 'Admin/AuthController.login',
      middleware: ['valid:AdminLogin']
    }
  },
  '/feature': {
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
  '/login': {
    [HTTP_METHODS.POST]: {
      controller: 'Admin/UserController.login',
      middleware: ['guest', 'valid:SignIn']
    }
  },
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
  '/tenant/paymentplan/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'TenantPaymentPlanController.getTenantPaymentPlanById',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'TenantPaymentPlanController.updateTenantPaymentPlan',
      middleware: ['auth:jwtAdministrator', 'valid:TenantPaymentPlan,Id']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'TenantPaymentPlanController.deleteTenantPaymentPlan',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    }
  },
  '/tenant/paymentplan': {
    [HTTP_METHODS.GET]: {
      controller: 'TenantPaymentPlanController.getTenantPaymentPlan',
      middleware: ['auth:jwtAdministrator', 'valid:PlanId']
    },
    [HTTP_METHODS.POST]: {
      controller: 'TenantPaymentPlanController.createTenantPaymentPlan',
      middleware: ['auth:jwtAdministrator', 'valid:TenantPaymentPlan']
    }
  },
  '/terms': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/AgreementController.getTerms',
      middleware: ['auth:jwtAdministrator']
    },
    [HTTP_METHODS.POST]: {
      controller: 'Admin/AgreementController.createTerm',
      middleware: ['auth:jwtAdministrator', 'valid:CreateAgreement']
    }
  },
  '/terms/:id': {
    [HTTP_METHODS.PUT]: {
      controller: 'Admin/AgreementController.updateTerm',
      middleware: ['auth:jwtAdministrator', 'valid:CreateAgreement,Id']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'Admin/AgreementController.deleteTerm',
      middleware: ['auth:jwtAdministrator', 'valid:Id']
    }
  },
  '/users': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/UserController.getUsers',
      middleware: ['auth:jwtAdministrator', 'pagination']
    }
  },
  '/users/:user_id': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/UserController.getUser',
      middleware: ['auth:jwtAdministrator']
    },
    [HTTP_METHODS.POST]: {
      controller: 'Admin/UserController.updateUser',
      middleware: ['auth:jwtAdministrator']
    }
  },
  '/verifyUsers': {
    [HTTP_METHODS.POST]: {
      controller: 'Admin/UserController.verifyUsers',
      middleware: ['auth:jwtAdministrator', 'valid:Ids,UserVerify']
    }
  }
}
