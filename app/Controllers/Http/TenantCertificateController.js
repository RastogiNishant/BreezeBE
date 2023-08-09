'use strict'

const TenantCertificateService = use('App/Services/TenantCertificateService')
class TenantCertificateController {
  async get({ request, auth, response }) {
    const { id } = request.all()
    response.res(await TenantCertificateService.get(id))
  }

  async getAll({ request, auth, response }) {
    response.res(await TenantCertificateService.getAll(auth.user.id))
  }

  async addCertificate({ request, auth, response }) {
    response.res(await TenantCertificateService.addCertificate(request, auth.user.id))
  }

  async updateCertificate({ request, auth, response }) {
    const { id, ...data } = request.all()
    response.res(
      await TenantCertificateService.updateCertificate({ ...data, id, user_id: auth.user.id })
    )
  }

  async updateImage({ request, auth, response }) {
    response.res(await TenantCertificateService.updateImage(request, auth.user.id))
  }

  async deleteCertificate({ request, auth, response }) {
    const { id } = request.all()
    response.res(await TenantCertificateService.deleteCertificate({ id, user_id: auth.user.id }))
  }
}

module.exports = TenantCertificateController
