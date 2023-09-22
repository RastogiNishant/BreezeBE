'use strict'
const axios = require("axios").default;
const fs = require("fs");

class PdfRentalController {
  async generatePdf({ request,auth,response }) {

   const { data } = await axios.get(process.env.RENT_URL, { responseType: "stream" });

   response.implicitEnd = false
   response.header('Content-type', 'application/pdf')

   data.pipe(response.response);

  }
}

module.exports = PdfRentalController
