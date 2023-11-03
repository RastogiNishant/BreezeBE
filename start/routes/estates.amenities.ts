import { HTTP_METHODS, Routes } from './_helper'

export const estateAmenitiesRoutes: Routes = {
  '/amenities': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateAmenityController.get',
      middleware: ['valid:EstateId', 'LandlordOwnsThisEstate']
    },
    [HTTP_METHODS.POST]: {
      controller: 'EstateAmenityController.add',
      middleware: ['valid:EstateId,CreateEstateAmenity', 'LandlordOwnsThisEstate', 'EstateCanEdit']
    }
  },
  '/amenities/:location': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateAmenityController.get',
      middleware: ['valid:EstateId,EstateAmenitiesLocation', 'LandlordOwnsThisEstate']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'EstateAmenityController.update',
      middleware: [
        'valid:EstateId,EstateAmenitiesLocation,UpdateEstateAmenity',
        'LandlordOwnsThisEstate',
        'EstateCanEdit'
      ]
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'EstateAmenityController.delete',
      middleware: [
        'valid:EstateId,EstateAmenitiesLocation,Id',
        'LandlordOwnsThisEstate',
        'EstateCanEdit'
      ]
    }
  },
  '/bulk/amenities': {
    [HTTP_METHODS.POST]: {
      controller: 'EstateAmenityController.addBulk',
      middleware: [
        'valid:EstateId,CreateBulkEstateAmenities',
        'LandlordOwnsThisEstate',
        'EstateCanEdit'
      ]
    }
  }
}
