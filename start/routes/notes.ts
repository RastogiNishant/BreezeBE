import { HTTP_METHODS, Routes, addMiddlewareToRoutes } from './_helper'

const notesRoutesRaw: Routes = {
  '/': {
    [HTTP_METHODS.GET]: {
      controller: 'NoteController.getNotes',
      middleware: ['valid:TenantId']
    },
    [HTTP_METHODS.POST]: {
      controller: 'NoteController.createNote',
      middleware: ['valid:CreateNote']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'NoteController.updateNote',
      middleware: ['valid:CreateNote']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'NoteController.removeNote',
      middleware: ['valid:TenantId']
    }
  }
}

export const notesRoutes = addMiddlewareToRoutes(notesRoutesRaw, 'auth:jwtLandlord')
