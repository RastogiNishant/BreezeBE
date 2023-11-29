import { HTTP_METHODS, Routes } from './_helper'

const indexUsersRoutes: Routes = {
  '/': {
    [HTTP_METHODS.PUT]: {
      controller: 'AccountController.updateProfile',
      middleware: ['auth:jwt,jwtLandlord', 'valid:UpdateUser', 'userCanValidlyChangeEmail']
    }
  },
  '/avatar': {
    [HTTP_METHODS.PUT]: {
      controller: 'AccountController.updateAvatar',
      middleware: ['auth:jwt,jwtLandlord']
    }
  },
  '/password': {
    [HTTP_METHODS.PUT]: {
      controller: 'AccountController.changePassword',
      middleware: ['auth:jwt,jwtLandlord', 'valid:ChangePassword']
    }
  },
  '/reconfirm': {
    [HTTP_METHODS.POST]: {
      controller: 'AccountController.resendUserConfirm',
      middleware: ['valid:ConfirmEmail']
    }
  }
}

const usersTenantRoutes: Routes = {
  '/tenant': {
    [HTTP_METHODS.PUT]: {
      controller: 'TenantController.updateTenant',
      middleware: ['auth:jwt', 'valid:UpdateTenant']
    }
  },
  '/tenant/activate': {
    [HTTP_METHODS.POST]: {
      controller: 'TenantController.activateTenant',
      middleware: ['auth:jwt']
    }
  },
  '/tenant/all': {
    [HTTP_METHODS.GET]: {
      controller: 'TenantController.getAllTenants',
      middleware: ['auth:jwt']
    }
  },
  '/tenant/buddy/accept': {
    [HTTP_METHODS.POST]: {
      controller: 'TenantController.acceptBuddyInvite',
      middleware: ['auth:jwt']
    }
  },
  '/tenant/certificate': {
    [HTTP_METHODS.GET]: {
      controller: 'TenantCertificateController.getAll',
      middleware: ['auth:jwt']
    },
    [HTTP_METHODS.POST]: {
      controller: 'TenantCertificateController.addCertificate',
      middleware: ['auth:jwt', 'valid:CreateTenantCertificate']
    }
  },
  '/tenant/certificate/request': {
    [HTTP_METHODS.PUT]: {
      controller: 'TenantController.requestCertificate',
      middleware: ['auth:jwt', 'valid:RequestCertificate']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'TenantController.removeRequestCertificate',
      middleware: ['auth:jwt']
    }
  },
  '/tenant/certificate/:id': {
    [HTTP_METHODS.DELETE]: {
      controller: 'TenantCertificateController.deleteCertificate',
      middleware: ['auth:jwt', 'valid:Id']
    },
    [HTTP_METHODS.GET]: {
      controller: 'TenantCertificateController.get',
      middleware: ['auth:jwt', 'valid:Id']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'TenantCertificateController.updateCertificate',
      middleware: ['auth:jwt', 'valid:Id,CreateTenantCertificate']
    }
  },
  '/tenant/certificate/:id/image': {
    [HTTP_METHODS.PUT]: {
      controller: 'TenantCertificateController.updateImage',
      middleware: ['auth:jwt', 'valid:Id,CreateFile']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'TenantCertificateController.deleteImage',
      middleware: ['auth:jwt', 'valid:Id,Uri']
    }
  },
  '/tenant/deactive': {
    [HTTP_METHODS.POST]: {
      controller: 'TenantController.deactivateTenant',
      middleware: ['auth:jwt']
    }
  },
  '/tenant/detail': {
    [HTTP_METHODS.GET]: {
      controller: 'TenantController.detail',
      middleware: ['auth:jwt']
    }
  },
  '/tenant/map': {
    [HTTP_METHODS.GET]: {
      controller: 'TenantController.getTenantMap',
      middleware: ['auth:jwt']
    }
  }
}

export const userRoutes: Routes = {
  ...indexUsersRoutes,
  ...usersTenantRoutes
}
