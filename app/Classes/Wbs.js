'use strict'
const xlsx = require('node-xlsx')

const HttpException = require('../Exceptions/HttpException')

class Wbs {
  path
  constructor(filePath) {
    this.path = filePath
  }

  read() {
    const data = xlsx.parse(this.path, { cellDates: true })
    const sheet = data.find((i) => i.name === 'Tabelle1')
    if (!sheet) {
      throw new HttpException('Sheet not found', 500, 0)
    }

    sheet.data.splice(0, 1)
    return sheet.data.map((cell) => ({ city: cell?.[0] || '', wbs_link: cell?.[1] || '' }))
  }
}

module.exports = Wbs
