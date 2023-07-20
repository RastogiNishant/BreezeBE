'use_strict'

class FtpLiveSyncController {
  async get({ auth, response }) {
    response.res(true)
  }

  async add({ request, auth, response }) {
    response.res(true)
  }

  async delete({ auth, response }) {
    response.res(true)
  }
}

module.exports = FtpLiveSyncController
