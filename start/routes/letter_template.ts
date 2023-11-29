import { HTTP_METHODS, Routes, addMiddlewareToRoutes } from './_helper'

const letterTemplateRoutesRaw: Routes = {
  '/': {
    [HTTP_METHODS.GET]: {
      controller: 'LetterTemplateController.get'
    },
    [HTTP_METHODS.POST]: {
      controller: 'LetterTemplateController.update',
      middleware: ['valid:LetterTemplate']
    }
  },
  '/:id/delete_logo': {
    [HTTP_METHODS.PUT]: {
      controller: 'LetterTemplateController.deleteLogo',
      middleware: ['valid:Id']
    }
  },
  '/:id': {
    [HTTP_METHODS.DELETE]: {
      controller: 'LetterTemplateController.delete',
      middleware: ['valid:Id']
    }
  }
}

export const letterTemplateRoutes: Routes = addMiddlewareToRoutes(
  letterTemplateRoutesRaw,
  'auth:jwtLandlord'
)
