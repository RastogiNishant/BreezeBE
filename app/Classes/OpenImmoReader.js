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
    /*
    for (let count = 0; count < this.json['xsd:schema']['xsd:element'].length; count++) {
      console.log(this.json['xsd:schema']['xsd:element'][count]['$'])
    }*/
    console.log(this.json['xsd:schema']['xsd:element'][3]['xsd:annotation'])
    return this.json
  }
}

module.exports = OpenImmoReader
