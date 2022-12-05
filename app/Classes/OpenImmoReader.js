const xmlParser = require('xml2js').Parser()
const AppException = use('App/Exceptions/AppException')
const fs = require('fs')
const { isArray, forOwn } = require('lodash')

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

  processChoice(choice) {
    choice['xsd:']
  }

  processAnnotation(annotationJson) {
    return annotationJson[0]['xsd:documentation'][0]
  }

  parseComplexType(complexType, resultObj) {
    complexType.map((innerObj) => {
      if (innerObj['xsd:attribute']) {
        resultObj.attributes = this.processAttributes(innerObj['xsd:attribute'])
      }
      if (innerObj['xsd:sequence']) {
        resultObj.elements = this.processElements(innerObj['xsd:sequence'])
      }
      if (innerObj['xsd:choice']) {
        resultObj.choice = this.processChoice(innerObj['xsd:choice'])
      }
      if (innerObj['xsd:simpleContent']) {
      }
      if (innerObj['$']) {
        forOwn(innerObj['$'], (value, key) => {
          resultObj[key] = value
        })
      }
    })
    return resultObj
  }

  processElement(element) {
    let returnObj = {}
    forOwn(element['$'], (value, key) => {
      returnObj = { ...returnObj, [key]: value }
    })
    return returnObj
  }

  parseType(type) {
    return type.replace(/^xsd\:/, '')
  }

  processRestriction(restrictions) {
    const enumerations = restrictions.map((restriction) => {
      return restriction['$'].value
    })
    return enumerations
  }

  processAttributes(attributes) {
    const result = attributes.map((attribute) => {
      let ret = { name: attribute['$']['name'] }
      if (attribute['$']) {
        forOwn(attribute['$'], (value, key) => {
          ret = { ...ret, [key]: this.parseType(value) }
        })
      }
      if (attribute['xsd:simpleType']) {
        ret = {
          ...ret,
          ['base']: this.parseType(
            attribute['xsd:simpleType'][0]['xsd:restriction'][0]['$']['base']
          ),
          ['restriction']: this.processRestriction(
            attribute['xsd:simpleType'][0]['xsd:restriction'][0]['xsd:enumeration']
          ),
        }
      }
      return ret
    })
    return result
  }

  processElements(sequence) {
    if (isArray(sequence[0]['xsd:element'])) {
      const elements = sequence[0]['xsd:element'].map((element) => {
        return this.processElement(element)
      })
      return elements
    } else {
      return 'not array'
    }
  }

  process() {
    //console.log(this.json['xsd:schema']['xsd:element'][1])
    //return this.json['xsd:schema']['xsd:element']
    const result = this.json['xsd:schema']['xsd:element'].map((obj) => {
      let resultObj = {}
      if (obj['xsd:annotation']) {
        resultObj.description = this.processAnnotation(obj['xsd:annotation'])
      }
      if (obj['xsd:complexType']) {
        resultObj = this.parseComplexType(obj['xsd:complexType'], resultObj)
      }
      if (obj['$']) {
        forOwn(obj['$'], (value, key) => {
          if (key === 'type') {
            resultObj[key] = this.parseType(value)
          } else if (key !== 'name') {
            resultObj[key] = value
          }
        })
      }
      return { [obj['$']['name']]: { ...resultObj } }
    })
    return result
  }
}

module.exports = OpenImmoReader
