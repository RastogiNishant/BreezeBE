const xmlParser = require('xml2js').Parser()
const AppException = use('App/Exceptions/AppException')
const fs = require('fs')

class OpenImmoReader {
  json = {}
  constructor(filePath) {
    const data = fs.readFileSync(filePath)
    const that = this
    xmlParser.parseString(data, function (err, result) {
      if (err) {
        throw new AppException(`Error parsing xml: ${err}`)
      }
      that.json = result
    })
  }

  process() {
    return this.json.openimmo.user_defined_simplefield
  }
}

module.exports = OpenImmoReader
