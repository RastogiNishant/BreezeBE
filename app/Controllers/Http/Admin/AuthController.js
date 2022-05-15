'use strict'

class AuthController {
  async login({ request, response }) {
    response.res({ token: 'asdfasdf' })
  }
}

module.exports = AuthController
