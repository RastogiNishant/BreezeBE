'use strict'

const Database = use('Database')
const TenantService = use('App/Services/TenantService')
const TenantCertificateService = use('App/Services/TenantCertificateService')
const HttpException = use('App/Exceptions/HttpException')
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

  async deleteImage({ request, auth, response }) {
    const { id, uri } = request.all()
    response.res(await TenantCertificateService.deleteImage({ id, uri, user_id: auth.user.id }))
  }

  async deleteCertificate({ request, auth, response }) {
    const { id } = request.all()
    const trx = await Database.beginTransaction()
    try {
      await TenantService.requestCertificate(
        {
          user_id: auth.user.id,
          request_certificate_at: null,
          request_certificate_city_id: null
        },
        trx
      )
      const deleteCertificateResult = await TenantCertificateService.deleteCertificate(
        { id, user_id: auth.user.id },
        trx
      )
      await trx.commit()
      response.res(deleteCertificateResult)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400)
    }
  }
}

module.exports = TenantCertificateController
