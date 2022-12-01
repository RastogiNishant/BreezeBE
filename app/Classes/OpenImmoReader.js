const xmlParser = require('xml2js').Parser()
const AppException = use('App/Exceptions/AppException')
const fs = require('fs')

class OpenImmoReader {
  json = {}
  constructor(filePath, field) {
    const data = fs.readFileSync(filePath)
    const that = this
    xmlParser.parseString(data, function (err, result) {
      if (err) {
        throw new AppException(`Error parsing xml: ${err}`)
      }
      that.json = result
    })
    this.field = field
  }

  process() {
    const result = this.json['xsd:schema']['xsd:element'].filter((obj) => {
      if (obj['$'].name === this.field) {
        return obj
      }
    })
    //const ret = this.json['xsd:schema']['xsd:element'][2]
    return result
  }
}

module.exports = OpenImmoReader
