import { HTTP_METHODS, Routes } from './_helper'

export const estateFilesRoutes: Routes = {
  '/files': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getFiles',
      middleware: ['LandlordOwnsThisEstate']
    },
    [HTTP_METHODS.POST]: {
      controller: 'EstateController.addFile',
      middleware: ['valid:EstateAddFile,EstateId', 'EstateCanEdit']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'EstateController.removeMultipleFiles',
      middleware: ['valid:EstateId,Ids', 'EstateCanEdit']
    }
  },
  '/files/order': {
    [HTTP_METHODS.PUT]: {
      controller: 'EstateController.updateOrder',
      middleware: ['valid:EstateAddFile,Ids']
    }
  },
  '/files/:id': {
    [HTTP_METHODS.DELETE]: {
      controller: 'EstateController.removeFile',
      middleware: ['valid:EstateId,Id', 'EstateCanEdit']
    }
  }
}
