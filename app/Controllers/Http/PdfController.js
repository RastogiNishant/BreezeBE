'use strict'
const fs = require('fs')

class PdfController {
  async generatePdf({ response }) {
    const pdfFileName = 'sample.pdf'
    const pdfFilePath = __dirname + '/' + pdfFileName

    response.implicitEnd = false

    // PDF Stream headers
    response.header('Content-type', 'application/pdf')
    response.header('Content-Disposition', 'inline; filename=' + pdfFileName)

    // create a read stream from pdf file
    const stream = fs.createReadStream(pdfFilePath)

    // pipe the stream to the response object
    stream.pipe(response.response)

    // optional: log when the stream is finished
    stream.on('end', () => {
      console.log('PDF stream finished')
    })
  }
}

module.exports = PdfController
