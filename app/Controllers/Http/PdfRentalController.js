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

    const { data: pdfStream } = await axios.post(url, { data: tenantData }, { responseType: 'stream' })

    response.implicitEnd = false
    response.header('Content-type', 'application/pdf')

    pdfStream.pipe(response.response)
  }
}

module.exports = PdfRentalController
