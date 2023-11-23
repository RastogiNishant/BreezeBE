import { HTTP_METHODS, Routes } from './_helper'

const authRoutes: Routes = {
  '/me': {
    [HTTP_METHODS.GET]: {
      controller: 'AccountController.me',
      middleware: ['auth:jwtLandlord,jwtAdministrator,jwt,jwtHousekeeper']
    }
  },
  '/closeAccount': {
    [HTTP_METHODS.GET]: {
      controller: 'AccountController.closeAccount',
      middleware: ['auth:jwt,jwtLandlord,jwtHousekeeper,jwtPropertyManager']
    }
  },
  '/confirm_email': {
    [HTTP_METHODS.GET]: {
      controller: 'AccountController.confirmEmail',
      middleware: ['valid:ConfirmEmail,Code']
    }
  },
  '/confirmsms': {
    [HTTP_METHODS.POST]: {
      controller: 'AccountController.checkSignUpConfirmBySMS',
      middleware: ['guest', 'valid:ConfirmSMS']
    }
  },
  '/estate-by-hash/:hash': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateViewInvitationController.getEstateByHash',
      middleware: ['EstateFoundByHash']
    }
  },
  '/estate-view-invitation/:code': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateViewInvitationController.getByCode',
      middleware: ['ViewEstateInvitationCodeExist']
    }
  },
  '/forgotPassword': {
    [HTTP_METHODS.POST]: {
      controller: 'AccountController.sendCodeForgotPassword',
      middleware: ['guest', 'valid:ResetPasswordRequest', 'UserWithEmailExists']
    }
  },
  '/forgotPassword/setPassword': {
    [HTTP_METHODS.POST]: {
      controller: 'AccountController.setPasswordForgotPassword',
      middleware: ['guest', 'valid:ResetPasswordConfirm']
    }
  },
  '/login': {
    [HTTP_METHODS.POST]: {
      controller: 'AccountController.login',
      middleware: ['guest', 'valid:SignIn']
    }
  },
  '/logout': {
    [HTTP_METHODS.POST]: {
      controller: 'AccountController.logout',
      middleware: ['auth:jwt,jwtLandlord,jwtHousekeeper,jwtPropertyManager,jwtAdministrator']
    }
  },
  '/hash-invited-signup/:hash': {
    [HTTP_METHODS.POST]: {
      controller: 'AccountController.signupProspectWithHash',
      middleware: [
        'EstateFoundByHash',
        'valid:SignupAfterViewEstateInvitation',
        'ProspectHasNotRegisterYet'
      ]
    }
  },
  '/housekeeperSignup': {
    [HTTP_METHODS.POST]: {
      controller: 'AccountController.housekeeperSignup',
      middleware: ['guest', 'valid:HosekeeperSignUp']
    }
  },
  '/invited-signup/:code': {
    [HTTP_METHODS.POST]: {
      controller: 'AccountController.signupProspectWithViewEstateInvitation',
      middleware: [
        'ViewEstateInvitationCodeExist',
        'valid:SignupAfterViewEstateInvitation',
        'ProspectHasNotRegisterYet'
      ]
    }
  },
  '/signup': {
    [HTTP_METHODS.POST]: {
      controller: 'AccountController.signup',
      middleware: ['guest', 'valid:SignUp']
    }
  },
  '/updateDeviceToken': {
    [HTTP_METHODS.PUT]: {
      controller: 'AccountController.updateDeviceToken',
      middleware: ['auth:jwt,jwtLandlord,jwtHousekeeper,jwtPropertyManager', 'valid:DeviceToken']
    }
  }
}

const servicesRoutes: Routes = {
  '/accept/outside_tenant': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateCurrentTenantController.acceptOutsideTenant',
      middleware: ['valid:OutsideTenantInvite']
    }
  },
  '/accept/outside_tenant/already_registered': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateCurrentTenantController.acceptAlreadyRegisterdOutsideTenant',
      middleware: ['auth:jwt', 'valid:AlreadyRegisteredOutsideTenantInvite']
    }
  },
  '/calc_price': {
    [HTTP_METHODS.GET]: {
      controller: 'CommonController.calcRentPrice',
      middleware: ['valid:CalcRentPrice']
    }
  },
  '/estate-sync-is24': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateSyncController.redirectToWebApp'
    }
  },
  '/excel': {
    [HTTP_METHODS.GET]: {
      controller: 'CommonController.getExcelTemplate',
      middleware: ['auth:jwtLandlord,jwtAdministrator', 'valid:Lang']
    }
  },
  '/notices': {
    [HTTP_METHODS.GET]: {
      controller: 'NoticeController.getNotices',
      middleware: ['valid:GetNotifications', 'auth:jwt,jwtLandlord']
    }
  },
  '/notices/resetCount': {
    [HTTP_METHODS.GET]: {
      controller: 'AccountController.resetUnreadNotificationCount',
      middleware: ['auth:jwt,jwtLandlord']
    }
  },
  '/profile/tenant/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'AccountController.getTenantProfile',
      middleware: ['auth:jwtLandlord', 'valid:Id']
    }
  },
  '/search/street': {
    [HTTP_METHODS.GET]: {
      controller: 'CommonController.searchStreet',
      middleware: ['valid:SearchStreet']
    }
  },
  '/search/profession': {
    [HTTP_METHODS.GET]: {
      controller: 'CommonController.searchProfession',
      middleware: ['valid:ProfessionQuery']
    }
  },
  '/references': {
    [HTTP_METHODS.GET]: {
      controller: 'CommonController.getReferences'
    }
  },
  '/validate/outside_tenant/invitation': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateCurrentTenantController.validateInvitationQRCode',
      middleware: ['valid:AlreadyRegisteredOutsideTenantInvite']
    }
  },
  '/zendesk/notify': {
    [HTTP_METHODS.POST]: {
      controller: 'NoticeController.acceptZendeskNotification'
    }
  }
}

export const apiIndexRoutes: Routes = {
  ...authRoutes,
  ...servicesRoutes
}

export const indexRoutes: Routes = {
  '/auth/google': {
    [HTTP_METHODS.GET]: {
      controller: 'OAuthController.googleAuth'
    }
  },
  '/auth/google/mobile': {
    [HTTP_METHODS.GET]: {
      controller: 'OAuthController.tokenAuth',
      middleware: ['valid:OAuthSignIn']
    }
  },
  '/auth/apple/mobile': {
    [HTTP_METHODS.GET]: {
      controller: 'OAuthController.tokenAuthApple',
      middleware: ['valid:OAuthSignIn']
    }
  },
  '/ping': {
    [HTTP_METHODS.GET]: {
      controller: 'CommonController.ping'
    }
  },

  '/:key': {
    [HTTP_METHODS.GET]: {
      controller: 'CommonController.getOriginalUrl',
      middleware: ['valid:Key']
    }
  },
  '/': {
    [HTTP_METHODS.GET]: {
      controller: 'CommonController.getVersionInfo'
    }
  }
}
