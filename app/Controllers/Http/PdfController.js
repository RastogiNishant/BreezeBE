'use strict'
const fs = require('fs')
const { PDFDocument, rgb } = require('pdf-lib');

class PdfController {
  async generatePdf({ response }) {

    const pdfDoc = await PDFDocument.create();
    // Add a page to the document
    const page = pdfDoc.addPage([600, 400]);
    // Add some text to the page
    page.drawText('Sample PDF Text!', {
      x: 50,
      y: 350,
      size: 30,
      color: rgb(0, 0, 0), // Black color
    });

    const pdfFileName = 'sample.pdf'
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

module.exports = PdfController
