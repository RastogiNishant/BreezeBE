'use strict'
const axios = require('axios')
const TenantService = require('../../Services/TenantService')
const MemberService = require('../../Services/MemberService')

class PdfRentalController {
  async generatePdf({ request, auth, response }) {
    const tenantData = {
      tenant: await TenantService.getTenantWithCertificates(auth.user.id),
      members: await MemberService.getMembers(auth.user.id, true)
    }

    const pdfServerPort = (parseInt(process.env.PORT) || 3000) + 1
    const url = `http:\\\\localhost:${pdfServerPort}\\pdf`

    const axiosResponse = await axios.post(
      url,
      { data: tenantData },
      {
        headers: {
          'Accept-Language': auth.user.lang
        },
        responseType: 'stream'
      }
    )

    response.implicitEnd = false
    response.header('Content-type', 'application/pdf')

    const contentDisposition = axiosResponse.headers['content-disposition']
    if (contentDisposition) {
      const match = /filename="(.+)"/.exec(contentDisposition)
      if (match && match[1]) {
        const filename = match[1]
        response.header('Content-Disposition', `attachment; filename="${filename}"`)
      }
    }

    axiosResponse.data.pipe(response.response)
  }
}

module.exports = PdfRentalController
