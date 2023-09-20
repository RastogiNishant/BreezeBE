'use strict'
const fs = require('fs')
const { PDFDocument, rgb } = require('pdf-lib');

class PdfRentalController {
  async generatePdf({ response }) {

    const formPDFBytes = await fetch(process.env.RENT_URL).then(res => res.arrayBuffer())
    const pdfDoc= await PDFDocument.load(formPDFBytes );

    const pdfFileName = 'Rental.pdf'
    // Write the PDF bytes to a file

    const pdfFilePath = __dirname + '/' + pdfFileName
    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save()

   // Write the PDF bytes to a file
    fs.writeFileSync(pdfFilePath, pdfBytes);
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

module.exports = PdfRentalController
