import { HTTP_METHODS } from './_helper'

const paymentRoutes = {
  '/payment': {
    [HTTP_METHODS.GET]: {
      controller: 'PaymentController.getUserPayments',
      middleware: ['auth:jwtLandlord']
    },
    [HTTP_METHODS.POST]: {
      controller: 'PaymentController.processPayment',
      middleware: ['auth:jwtLandlord']
    }
  },
  '/payment/paypal': {
    [HTTP_METHODS.POST]: {
      controller: 'PaymentController.processPaypal',
      middleware: ['auth:jwtLandlord']
    }
  },
  '/paymentMethod': {
    [HTTP_METHODS.GET]: {
      controller: 'PaymentMethodController.get',
      middleware: ['auth:jwtLandlord']
    },
    [HTTP_METHODS.POST]: {
      controller: 'PaymentMethodController.post',
      middleware: ['auth:jwtLandlord']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'PaymentMethodController.update',
      middleware: ['auth:jwtLandlord']
    }
  }
}

const indexRoutes = {
  '/activate': {
    [HTTP_METHODS.POST]: {
      controller: 'LandlordController.activate',
      middleware: ['auth:jwtLandlord']
    }
  },
  '/billingAddress': {
    [HTTP_METHODS.GET]: {
      controller: 'BillingAddressController.getUserBillingAddress',
      middleware: ['auth:jwtLandlord']
    },
    [HTTP_METHODS.POST]: {
      controller: 'BillingAddressController.addBillingAddress',
      middleware: ['auth:jwtLandlord']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'BillingAddressController.updateBillingAddress',
      middleware: ['auth:jwtLandlord']
    }
  },
  '/invite-to-view-estate': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getInviteToView',
      middleware: ['auth:jwtLandlord', 'LandlordOwnsThisEstate']
    },
    [HTTP_METHODS.POST]: {
      controller: 'EstateController.createInviteToViewCode',
      middleware: ['auth:jwtLandlord', 'valid:LandlordInviteToView', 'LandlordOwnsThisEstate']
    }
  },
  '/visit': {
    [HTTP_METHODS.GET]: {
      controller: 'LandlordController.getLordVisits',
      middleware: ['auth:jwtLandlord']
    }
  },
  // always last with key in path
  '/:id/company': {
    [HTTP_METHODS.GET]: {
      controller: 'CompanyController.getCompanyByLandlord',
      middleware: ['auth:jwt', 'valid:Id']
    }
  }
}

export const landlordRoutes = {
  ...paymentRoutes,
  // index last, due to keys in path
  ...indexRoutes
}
