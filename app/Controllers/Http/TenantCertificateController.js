'use strict'

const TenantCertificateService = use('App/Services/TenantCertificateService')
class TenantCertificateController {
  async addCertificate({ request, auth, response }) {
    response.res(await TenantCertificateService.addCertificate(request, auth.user.id))
  }

  async deleteCertificate({ request, auth, response }) {}
}

module.exports = TenantCertificateController
