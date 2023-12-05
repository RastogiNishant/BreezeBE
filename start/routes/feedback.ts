import { HTTP_METHODS, Routes } from './_helper'

export const feedbackRoutes: Routes = {
  '/': {
    [HTTP_METHODS.POST]: {
      controller: 'FeedbackController.create',
      middleware: ['auth:jwt,jwtLandlord', 'valid:CreateFeedback']
    },
    [HTTP_METHODS.GET]: {
      controller: 'FeedbackController.getAll',
      middleware: ['auth:jwtAdministrator']
    }
  }
}
