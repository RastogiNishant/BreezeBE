import { HTTP_METHODS } from './_helper'

const connectLandlordRoutes = {
  '/task/estate/:id/counts': {
    [HTTP_METHODS.GET]: {
      controller: 'TaskController.getTaskCountsByEstate',
      middleware: ['auth:jwtLandlord', 'valid:Id']
    }
  },
  '/task/estate/:id/with-filters': {
    [HTTP_METHODS.POST]: {
      controller: 'TaskController.getEstateTasks',
      middleware: ['auth:jwtLandlord', 'valid:Pagination,Id,TaskFilter']
    }
  },
  '/task/topic': {
    [HTTP_METHODS.GET]: {
      controller: 'TaskController.getTopicList',
      middleware: ['auth:jwtLandlord']
    }
  },
  '/task/with-filters': {
    [HTTP_METHODS.POST]: {
      controller: 'TaskController.getLandlordTasks',
      middleware: ['auth:jwtLandlord', 'valid:Pagination,TaskFilter']
    }
  },
  '/task/accept/:id': {
    [HTTP_METHODS.POST]: {
      controller: 'TaskController.acceptTenantInvitation',
      middleware: ['auth:jwtLandlord', 'valid:Id,EstateId']
    }
  },
  '/task/cancel/:id': {
    [HTTP_METHODS.POST]: {
      controller: 'TaskController.cancelTenantInvitation',
      middleware: ['auth:jwtLandlord', 'valid:Id']
    }
  }
}

const connectAllRoutes = {
  '/chat': {
    [HTTP_METHODS.GET]: {
      controller: 'ChatController.getByTaskId',
      middleware: ['auth:jwt,jwtLandlord', 'valid:TaskId,Pagination,LastId']
    }
  },
  '/predefinedMessage/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/PredefinedMessageController.get',
      middleware: ['auth:jwt,jwtLandlord', 'valid:Id']
    }
  },
  '/predefinedMessage': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/PredefinedMessageController.getAll',
      middleware: ['auth:jwt,jwtLandlord', 'valid:PredefinedMessageFilter']
    }
  },
  '/predefinedMessageChoice': {
    [HTTP_METHODS.GET]: {
      controller: 'Admin/PredefinedMessageChoiceController.getAll',
      middleware: ['auth:jwt,jwtLandlord', 'valid:PredefinedMessageChoiceFilter']
    }
  },
  '/task/init': {
    [HTTP_METHODS.POST]: {
      controller: 'TaskController.init',
      middleware: ['auth:jwt,jwtLandlord', 'valid:InitTask']
    }
  },
  '/task/quick_actions_count': {
    [HTTP_METHODS.GET]: {
      controller: 'TaskController.getQuickActionsCount',
      middleware: ['auth:jwt,jwtLandlord']
    }
  },
  '/task/unassigned': {
    [HTTP_METHODS.GET]: {
      controller: 'TaskController.getUnassignedTasks',
      middleware: ['auth:jwt,jwtLandlord', 'valid:Pagination']
    }
  },
  '/task/unread_messages': {
    [HTTP_METHODS.GET]: {
      controller: 'ChatController.getUnreadMessages',
      middleware: ['auth:jwt,jwtLandlord']
    }
  },
  '/task/:id/addImage': {
    [HTTP_METHODS.PUT]: {
      controller: 'TaskController.addImage',
      middleware: ['auth:jwt,jwtLandlord', 'valid:Id']
    }
  },
  '/task/:id/removeImage': {
    [HTTP_METHODS.DELETE]: {
      controller: 'TaskController.removeImage',
      middleware: ['auth:jwt,jwtLandlord', 'valid:Id,RemoveImage']
    }
  },
  '/task/:id': {
    [HTTP_METHODS.GET]: {
      controller: 'TaskController.getTaskById',
      middleware: ['auth:jwt,jwtLandlord', 'valid:Id']
    },
    [HTTP_METHODS.PUT]: {
      controller: 'TaskController.updateTask',
      middleware: ['auth:jwt,jwtLandlord', 'valid:CreateTask,Id']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'TaskController.deleteTask',
      middleware: ['auth:jwt,jwtLandlord', 'valid:Id']
    }
  },
  '/task': {
    [HTTP_METHODS.GET]: {
      controller: 'TaskController.getAllTasks',
      middleware: ['auth:jwt,jwtLandlord', 'valid:TenantTaskFilter,Pagination']
    },
    [HTTP_METHODS.POST]: {
      controller: 'TaskController.createTask',
      middleware: ['auth:jwt,jwtLandlord', 'valid:CreateTask']
    }
  }
}

const connectUserRoutes = {
  '/predefinedAnswer': {
    [HTTP_METHODS.POST]: {
      controller: 'PredefinedAnswerController.createPredefinedAnswer',
      middleware: ['auth:jwt', 'valid:createPredefinedAnswer']
    }
  },
  '/predefinedAnswer/:id': {
    [HTTP_METHODS.PUT]: {
      controller: 'PredefinedAnswerController.updatePredefinedAnswer',
      middleware: ['auth:jwt', 'valid:createPredefinedAnswer,Id']
    },
    [HTTP_METHODS.DELETE]: {
      controller: 'PredefinedAnswerController.deletePredefinedAnswer',
      middleware: ['auth:jwt', 'valid:Id']
    }
  }
}

export const connectRoutes = {
  ...connectLandlordRoutes,
  ...connectAllRoutes,
  ...connectUserRoutes
}
