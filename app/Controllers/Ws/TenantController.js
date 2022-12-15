'use strict'
const BaseController = require('./BaseController')
const ChatService = use('App/Services/ChatService')

class TenantController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
  }
}

module.exports = TenantController
