import { HTTP_METHODS, Routes } from './_helper'

export const debugRoutes: Routes = {
  '/notifications': {
    [HTTP_METHODS.POST]: {
      controller: 'NoticeController.sendTestNotification',
      middleware: ['auth:jwtLandlord,jwt', 'valid:DebugNotification']
    }
  }
}
