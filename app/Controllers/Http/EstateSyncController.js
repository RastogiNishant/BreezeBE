'use strict'

const { WEB_APP_URL } = require('../../constants')

const EstateSyncService = use('App/Services/EstateSyncService')

class EstateSyncController {
  async getPublishers({ auth, response }) {
    const targets = await EstateSyncService.getTargets(auth.user.id)
    response.res(targets)
  }

  async createApiKey({ request, auth, response }) {
    const { api_key } = request.all()
    const result = await EstateSyncService.createApiKey(auth.user.id, api_key)
    response.res(result)
  }

  async updateApiKey({ request, auth, response }) {
    const { api_key } = request.all()
    const result = await EstateSyncService.updateApiKey(auth.user.id, api_key)
    response.res(result)
  }

  async deleteApiKey({ auth, response }) {
    const result = await EstateSyncService.deleteApiKey(auth.user.id)
    response.res(result)
  }

  async createPublisher({ request, auth, response }) {
    const { type, credentials } = request.all()
    const result = await EstateSyncService.createTarget(type, auth.user.id, credentials)
    response.res(result)
  }

  async removePublisher({ request, auth, response }) {
    const { publisher } = request.all()
    const result = await EstateSyncService.removePublisher(auth.user.id, publisher)
    response.res(result)
  }

  async redirectToWebApp({ response }) {
    //we need to figure out what params are passed here on: error/success
    const redirect = WEB_APP_URL[process.env.NODE_ENV] || 'http://localhost:3002'
    response.send(`<script>window.location.href="${redirect}/integration"</script>`)
  }
}

module.exports = EstateSyncController
