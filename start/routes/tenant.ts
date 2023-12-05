import { HTTP_METHODS, Routes, mergeRoutes, prefixAll } from './_helper'
import { tenantEstateRoutes } from './tenant.estates'

const tenantOwnRoutes: Routes = {
  '/members/email': {
    [HTTP_METHODS.POST]: {
      controller: 'MemberController.addMember',
      middleware: ['auth:jwt', 'valid:CreateMember,ProfileVisibilityToOther']
    }
  },
  '/members/pdfdownload': {
    [HTTP_METHODS.GET]: {
      controller: 'PdfRentalController.generatePdf',
      middleware: ['auth:jwt']
    }
  },
  '/members/invitation': {
    [HTTP_METHODS.GET]: {
      controller: 'MemberController.prepareHouseholdInvitationDetails',
      middleware: ['auth:jwt']
    }
  },
  '/members/invitation/refuse': {
    [HTTP_METHODS.PUT]: {
      controller: 'MemberController.refuseInvitation',
      middleware: ['auth:jwt']
    }
  },
  '/members/invitation/accept': {
    [HTTP_METHODS.PUT]: {
      controller: 'MemberController.acceptInvitation',
      middleware: ['auth:jwt', 'valid:ProfileVisibilityToOther']
    }
  },
  '/members/visible': {
    [HTTP_METHODS.GET]: {
      controller: 'MemberController.checkVisibilitySetting',
      middleware: ['auth:jwt', 'valid:MemberId']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'MemberController.showMe',
      middleware: ['auth:jwt', 'valid:MemberId,ProfileVisibilityToOther']
    }
  },
  '/members/:id': {
    [HTTP_METHODS.DELETE]: {
      controller: 'MemberController.removeMember',
      middleware: ['auth:jwt', 'valid:Id']
    }
  },
  '/paymentplan/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'TenantPaymentPlanController.getTenantPaymentPlanById',
      middleware: ['auth:jwt', 'valid:Id']
    }
  },
  '/paymentplan': {
    [HTTP_METHODS.GET]: {
      controller: 'TenantPaymentPlanController.getTenantPaymentPlan',
      middleware: ['auth:jwt', 'valid:PlanId']
    }
  }
}

const tenantHousekeeperRoutes: Routes = {
  '/members': {
    [HTTP_METHODS.GET]: {
      controller: 'MemberController.getMembers',
      middleware: ['auth:jwt,jwtHousekeeper']
    }
  },

  '/members/:id/income': {
    [HTTP_METHODS.POST]: {
      controller: 'MemberController.addMemberIncome',
      middleware: ['auth:jwt,jwtHousekeeper', 'valid:Id,CreateIncome']
    }
  },
  '/members/:id/income/:income_id': {
    [HTTP_METHODS.PUT]: {
      controller: 'MemberController.editIncome',
      middleware: ['auth:jwt,jwtHousekeeper', 'valid:Id,IncomeId,CreateIncome']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'MemberController.removeMemberIncome',
      middleware: ['auth:jwt,jwtHousekeeper', 'valid:Id,IncomeId']
    }
  },
  '/members/:id/passport/:member_file_id': {
    [HTTP_METHODS.DELETE]: {
      controller: 'MemberController.deleteExtraImage',
      middleware: ['auth:jwt,jwtHousekeeper', 'valid:Id,MemberFileId']
    }
  },
  '/members/:id/extraproof/:member_file_id': {
    [HTTP_METHODS.DELETE]: {
      controller: 'MemberController.deleteExtraImage',
      middleware: ['auth:jwt,jwtHousekeeper', 'valid:Id,MemberFileId']
    }
  },
  '/members/:id/passport': {
    [HTTP_METHODS.POST]: {
      controller: 'MemberController.addPassportImage',
      middleware: ['auth:jwt,jwtHousekeeper', 'valid:Id']
    }
  },
  '/members/:id/extraproof': {
    [HTTP_METHODS.POST]: {
      controller: 'MemberController.addPassportImage',
      middleware: ['auth:jwt,jwtHousekeeper', 'valid:Id,ExtraFileType']
    }
  },
  '/members/invite/:id': {
    [HTTP_METHODS.POST]: {
      controller: 'MemberController.sendInviteCode',
      middleware: ['auth:jwt,jwtHousekeeper', 'valid:Id']
    }
  },
  '/members/sendsms': {
    [HTTP_METHODS.POST]: {
      controller: 'MemberController.sendUserConfirmBySMS',
      middleware: ['auth:jwt,jwtHousekeeper', 'valid:MemberId,Phone']
    }
  },
  '/members/confirmsms': {
    [HTTP_METHODS.POST]: {
      controller: 'MemberController.confirmBySMS',
      middleware: ['auth:jwt,jwtHousekeeper', 'valid:MemberId,Code,Phone']
    }
  },
  '/members/:id': {
    [HTTP_METHODS.PUT]: {
      controller: 'MemberController.updateMember',
      middleware: ['auth:jwt,jwtHousekeeper', 'valid:CreateMember,Id']
    }
    //   // [HTTP_METHODS.DELETE]: {
    //   //   controller: 'MemberController.removeMemberDocs',
    //   //   middleware: ['auth:jwt,jwtHousekeeper', 'valid:RemoveMemberDocs']
    //   // },
    //   [HTTP_METHODS.POST]: {
    //     controller: 'MemberController.addPassportImage',
    //     middleware: ['auth:jwt,jwtHousekeeper', 'valid:Id']
    //   }
  },
  '/members/:id/:field': {
    [HTTP_METHODS.DELETE]: {
      controller: 'MemberController.removeMemberDocs',
      middleware: ['auth:jwt,jwtHousekeeper', 'valid:RemoveMemberDocs']
    }
  }
}

export const tenantRoutes: Routes = {
  '/file': {
    [HTTP_METHODS.GET]: {
      controller: 'TenantController.getProtectedFile',
      middleware: ['auth:jwt,jwtLandlord', 'valid:ProtectedFile']
    }
  },
  '/income/:income_id/proof': {
    [HTTP_METHODS.POST]: {
      controller: 'MemberController.addMemberIncomeProof',
      middleware: ['auth:jwt,jwtHousekeeper', 'valid:IncomeId,AddIncomeProof']
    }
  },
  '/income/:income_id/proof/:id': {
    [HTTP_METHODS.DELETE]: {
      controller: 'MemberController.removeMemberIncomeProof',
      middleware: ['auth:jwt,jwtHousekeeper', 'valid:Id,IncomeId']
    }
  },
  ...mergeRoutes(tenantOwnRoutes, tenantHousekeeperRoutes),
  ...prefixAll('/estates', tenantEstateRoutes)
}
