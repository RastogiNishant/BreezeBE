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
      middleware: ['guest', 'valid:ResetEmailRequest', 'UserWithEmailExists']
    }
  },
  '/forgotPassword/setPassword': {
    [HTTP_METHODS.POST]: {
      controller: 'AccountController.setPasswordForgotPassword',
      middleware: ['guest', 'valid:SetPassword']
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
  '/zendesk/notify': {
    [HTTP_METHODS.POST]: {
      controller: 'NoticeController.acceptZendeskNotification'
    }
  }
}

const onboardingRoutes = {
  '/onboarding/': {
    [HTTP_METHODS.GET]: {
      controller: 'AccountController.onboard',
      middleware: ['auth:jwt,jwtLandlord']
    }
  },
  '/onboarding/profile': {
    [HTTP_METHODS.GET]: {
      controller: 'AccountController.onboardProfile',
      middleware: ['auth:jwt,jwtLandlord']
    }
  },
  '/onboarding/dashboard': {
    [HTTP_METHODS.GET]: {
      controller: 'AccountController.onboardDashboard',
      middleware: ['auth:jwt,jwtLandlord']
    }
  },
  '/onboarding/selection': {
    [HTTP_METHODS.GET]: {
      controller: 'AccountController.onboardSelection',
      middleware: ['auth:jwt,jwtLandlord']
    }
  },
  '/onboarding/verification': {
    [HTTP_METHODS.GET]: {
      controller: 'AccountController.onboardLandlordVerification',
      middleware: ['auth:jwt,jwtLandlord']
    }
  }
}

export const apiIndexRoutes: Routes = {
  ...authRoutes,
  ...onboardingRoutes,
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
