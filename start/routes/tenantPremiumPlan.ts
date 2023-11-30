import { HTTP_METHODS, Routes } from './_helper'

export const tenantPremiumPlanRoutes: Routes = {
  '/': {
    [HTTP_METHODS.POST]: {
      controller: 'AccountController.updateTenantPremiumPlan',
      middleware: ['auth:jwt', 'valid:TenantPremiumPlan,AppType']
    },
    [HTTP_METHODS.GET]: {
      controller: 'AccountController.getTenantPremiumPlans',
      middleware: ['auth:jwt', 'valid:AppType']
    }
  }
}
