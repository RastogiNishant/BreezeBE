import { HTTP_METHODS, Routes } from './_helper'

export const galleryRoutes: Routes = {
  '/': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateController.addFile',
      middleware: ['auth:jwtLandlord,jwtAdministrator', 'valid:EstateAddFile']
    }
  },
  '/assign': {
    [HTTP_METHODS.POST]: {
      controller: 'GalleryController.assign',
      middleware: ['auth:jwtLandlord,jwtAdministrator', 'valid:GalleryAssign']
    }
  },
  '/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'GalleryController.getAll',
      middleware: ['auth:jwtLandlord,jwtAdministrator', 'valid:Pagination,Id']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'GalleryController.removeFile',
      middleware: ['auth:jwtLandlord,jwtAdministrator', 'valid:Id,EstateId']
    }
  }
}
