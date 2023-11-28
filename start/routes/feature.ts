import { HTTP_METHODS, Routes } from './_helper'

export const featureRoutes: Routes = {
  '/': {
    [HTTP_METHODS.GET]: {
      controller: 'FeatureController.getFeatures',
      middleware: ['auth:jwtLandlord,jwt', 'valid:CreateFeature']
    }
  }
}
