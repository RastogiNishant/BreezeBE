import { HTTP_METHODS, Routes } from './_helper'

export const estateRoomsRoutes: Routes = {
  '/rooms': {
    [HTTP_METHODS.GET]: {
      controller: 'RoomController.getEstateRooms',
      middleware: ['valid:EstateId']
    },
    [HTTP_METHODS.POST]: {
      controller: 'RoomController.createRoom',
      middleware: ['valid:CreateRoom,EstateId', 'EstateCanEdit']
    }
  },
  '/bulk_rooms': {
    [HTTP_METHODS.POST]: {
      controller: 'RoomController.createBulkRoom',
      middleware: ['valid:CreateBulkRoom,EstateId', 'EstateCanEdit']
    }
  },
  '/rooms/order': {
    [HTTP_METHODS.PUT]: {
      controller: 'RoomController.updateOrder',
      middleware: ['valid:Ids']
    }
  },
  '/rooms/:room_id': {
    [HTTP_METHODS.GET]: {
      controller: 'RoomController.getRoomById',
      middleware: ['valid:EstateId,RoomId', 'LandlordOwnsThisEstate', 'RoomBelongsToEstate']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'RoomController.updateRoom',
      middleware: ['valid:CreateRoom,EstateId,RoomId', 'EstateCanEdit']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'RoomController.removeRoom',
      middleware: ['valid:RoomId,EstateId', 'EstateCanEdit']
    }
  },
  '/rooms/:room_id/amenities': {
    [HTTP_METHODS.GET]: {
      controller: 'RoomAmenityController.getAll',
      middleware: ['valid:EstateId,RoomId', 'LandlordOwnsThisEstate', 'RoomBelongsToEstate']
    },
    [HTTP_METHODS.POST]: {
      controller: 'RoomAmenityController.add',
      middleware: [
        'valid:EstateId,RoomId,CreateRoomAmenity',
        'LandlordOwnsThisEstate',
        'RoomBelongsToEstate'
      ]
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'RoomAmenityController.delete',
      middleware: ['valid:EstateId,RoomId,Id', 'LandlordOwnsThisEstate', 'RoomBelongsToEstate']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'RoomAmenityController.update',
      middleware: [
        'valid:EstateId,RoomId,UpdateRoomAmenity',
        'LandlordOwnsThisEstate',
        'RoomBelongsToEstate'
      ]
    }
  },
  '/rooms/:room_id/images': {
    [HTTP_METHODS.POST]: {
      controller: 'RoomController.addRoomPhoto',
      middleware: ['valid:RoomId,EstateId', 'EstateCanEdit']
    }
  },
  '/rooms/:room_id/images/order': {
    [HTTP_METHODS.PUT]: {
      controller: 'RoomController.orderRoomPhoto',
      middleware: ['valid:RoomId,Ids,EstateId']
    }
  },
  '/rooms/:room_id/images/:id': {
    [HTTP_METHODS.DELETE]: {
      controller: 'RoomController.removeRoomPhoto',
      middleware: ['valid:RoomId,Id,EstateId', 'EstateCanEdit']
    }
  }
}
