import { HTTP_METHODS, Routes } from './_helper'

const servicesRoutes: Routes = {
  '/calc_price': {
    [HTTP_METHODS.GET]: {
      controller: 'CommonController.calcRentPrice',
      middleware: ['valid:CalcRentPrice']
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
  '/zendesk/notify': {
    [HTTP_METHODS.POST]: {
      controller: 'NoticeController.acceptZendeskNotification'
    }
  }
}

export const apiIndexRoutes: Routes = {
  ...servicesRoutes
}

export const indexRoutes: Routes = {
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
