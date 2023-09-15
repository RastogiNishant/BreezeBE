'use strict'

class PdfController {
  async generatePdf({ request, auth, response }){
    console.log("inside the PDF Controller");
    response.res("Test PDF Download Dummy service")
  }
}

module.exports = PdfController
