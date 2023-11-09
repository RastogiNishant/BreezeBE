import { HTTP_METHODS, Routes } from './_helper'

export const estateSlotsRoutes: Routes = {
  '/slots': {
    [HTTP_METHODS.GET]: {
      controller: 'EstateController.getSlots',
      middleware: ['valid:EstateId']
    },
    [HTTP_METHODS.POST]: {
      controller: 'EstateController.createSlot',
      middleware: ['valid:EstateId,CreateSlot']
    }
  },
  '/slots/:slot_id': {
    [HTTP_METHODS.PUT]: {
      controller: 'EstateController.updateSlot',
      middleware: ['valid:EstateId,SlotId,UpdateSlot']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'EstateController.removeSlot',
      middleware: ['valid:EstateId,SlotId']
    }
  }
}
