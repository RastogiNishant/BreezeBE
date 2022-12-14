/**
 * This file is used to generate the JSON file for openimmo.
 */
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

  processChoice(choices) {
    if (choices) {
      const ret = choices[0]['xsd:element'].map((value) => {
        return this.parseElement(value)
      })
      return ret
    }
  }

  processAnnotation(annotationJson) {
    if (!annotationJson) {
      return {}
    }
    const resultObj = { description: annotationJson[0]['xsd:documentation'][0] }
    return resultObj
  }

  processSimpleContent(simpleContent) {
    console.log(simpleContent[0]['xsd:extension'])
    let resultObj = { base: this.parseType(simpleContent[0]['xsd:extension'][0]['$']['base']) }
    resultObj = {
      ...resultObj,
      ['attribute']: this.processAttributes(simpleContent[0]['xsd:extension'][0]['xsd:attribute']),
    }
    return resultObj
  }

  parseComplexType(complexType) {
    let resultObj = {}
    //console.log(complexType)
    if (complexType) {
      complexType.map((innerObj) => {
        if (innerObj['xsd:attribute']) {
          resultObj = {
            ...resultObj,
            ['attributes']: this.processAttributes(innerObj['xsd:attribute']),
          }
        }
        if (innerObj['xsd:sequence']) {
          resultObj = {
            ...resultObj,
            ['sequence']: this.processSequence(innerObj['xsd:sequence']),
          }
        }
        if (innerObj['xsd:choice']) {
          resultObj = {
            ...resultObj,
            ['choice']: this.processChoice(innerObj['xsd:choice']),
          }
        }
        if (innerObj['xsd:simpleContent']) {
          resultObj = {
            ...resultObj,
            ['simple']: this.processSimpleContent(innerObj['xsd:simpleContent']),
          }
        }
        if (innerObj['$']) {
          forOwn(innerObj['$'], (value, key) => {
            resultObj[key] = value
          })
        }
      })
    }
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

  processSequence(sequence) {
    if (isArray(sequence[0]['xsd:element'])) {
      const elements = sequence[0]['xsd:element'].map((element) => {
        return this.parseElement(element)
      })
      return elements
    } else if (sequence[0]['xsd:any']) {
      let ret = {}
      forOwn(sequence[0]['xsd:any'][0]['$'], (value, key) => {
        ret = { [key]: value }
      })
      return ret
    }
  }

  parse$(obj) {
    let returnObj = {}
    forOwn(obj, (value, key) => {
      returnObj = { ...returnObj, [key]: this.parseType(value) }
    })
    return returnObj
  }

  parseElement(obj) {
    let resultObj = {}
    resultObj = { ...resultObj, ...this.parse$(obj['$']) }
    resultObj = { ...resultObj, ...this.processAnnotation(obj['xsd:annotation']) }
    resultObj = { ...resultObj, ...this.parseComplexType(obj['xsd:complexType']) }
    return resultObj
  }

  process() {
    const result = this.json['xsd:schema']['xsd:element'].map((obj) => {
      let resultObj = {}
      resultObj = this.parseElement(obj)
      return { ...resultObj }
    })
    return result
  }
}

module.exports = OpenImmoReader
