'use strict'
const axios = require("axios").default;
const fs = require("fs");

class PdfRentalController {
  async generatePdf({ request,auth,response }) {
  
   const pdfServerPort = (parseInt(process.env.PORT) || 3000) + 1;
   const url = `http:\\\\localhost:${pdfServerPort}\\pdf`;
   
   const { data } = await axios.get(url, { responseType: "stream" });

   response.implicitEnd = false
   response.header('Content-type', 'application/pdf')

   data.pipe(response.response);

  }
}

module.exports = PdfRentalController
