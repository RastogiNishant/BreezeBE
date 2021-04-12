const xlsx = require('node-xlsx')

class ExcelReader {
  constructor() {}

  /**
   *
   */
  async readFile(filePath) {
    const data = xlsx.parse(filePath)
    console.log(data[0])
  }
}

module.exports = ExcelReader
