'use strict'
const BaseController = require('./BaseController')
const ChatService = use('App/Services/ChatService')
const Ws = use('Ws')
const Redis = use('Redis')
class TenantController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
  }
}

module.exports = TenantController
