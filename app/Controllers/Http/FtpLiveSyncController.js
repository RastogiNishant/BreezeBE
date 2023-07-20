'use strict'

const FtpLiveSyncService = use('App/Services/FtpLiveSyncService')

class FtpLiveSyncController {
  async get({ auth, response }) {
    const ftpAccount = await FtpLiveSyncService.get(auth.user.id)
    response.res(ftpAccount)
  }

  async add({ request, auth, response }) {
    const { company, email } = request.all()
    const user_id = auth.user.id
    await FtpLiveSyncService.create({ company, email, user_id })
    response.res(true)
  }

  async delete({ auth, response }) {
    const user_id = auth.user.id
    await FtpLiveSyncService.delete(user_id)
    response.res(true)
  }

  async update({ request, auth, response }) {
    const { company, email } = request.all()
    const user_id = auth.user.id
    const ftpAccount = await FtpLiveSyncService.update(user_id, { company, email })
    response.res(ftpAccount)
  }
}

module.exports = FtpLiveSyncController
