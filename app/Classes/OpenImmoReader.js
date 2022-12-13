const xml2js = require('xml2js')
const AppException = use('App/Exceptions/AppException')
const fs = require('fs')
const extract = require('extract-zip')
const { has, includes, isArray, isNumber, forOwn, get } = require('lodash')
const { OPENIMMO_EXTRACT_FOLDER } = use('App/constants')
const moment = require('moment')

class OpenImmoReader {
  json = {}
  contentType
  filePath

  constructor(filePath, contentType) {
    this.contentType = contentType
    this.filePath = filePath
    this.openImmoDefinition = require('../../resources/openimmo/openimmo-127b.json')
  }

  generateRandomString(length = 6) {
    let randomString = ''
    var characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
    for (var i = 0; i < length; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return randomString
  }

  extractJson(xml) {
    const that = this
    const xmlParser = xml2js.Parser()
    xmlParser.parseString(xml, function (err, result) {
      if (err) {
        throw new AppException(`Error parsing xml: ${err}`)
      }
      that.json = result
    })
    return this.json
  }

  async extractZip(filePath) {
    const dir = `${OPENIMMO_EXTRACT_FOLDER}/${this.generateRandomString(12)}`
    try {
      await extract(filePath, { dir })
      this.dir = dir
    } catch (err) {
      // handle any errors
    }
  }

  getDefinition(element) {
    const definition = this.openImmoDefinition.find((elementDefinition) => {
      return elementDefinition.name === element
    })
    return definition
  }

  validateElement(value, definition) {
    if (definition.attributes) {
      /* Attributes */
      definition.attributes.map((attribute) => {
        if (
          attribute.name === 'wert' ||
          attribute.name === 'erschl_attr' ||
          attribute.name === 'stand' ||
          definition.name === 'user_defined_simplefield'
        ) {
          //user_defined_extend problem
        } else {
          if (
            has(attribute, 'use') &&
            attribute.use === 'required' &&
            !has(value[0]['$'], attribute.name)
          ) {
            throw new Error(`Validation Error: Attribute ${attribute.name} missing`)
          }
          if (
            has(attribute, 'restriction') &&
            !includes(attribute['restriction'], value[0]['$'][attribute.name])
          ) {
            throw new Error(
              `Validation Error: Illegal value ${value[0]['$'][attribute.name]} for ${
                attribute.name
              }`
            )
          }
        }
      })
    }

    if (definition.sequence && isArray(definition.sequence)) {
      /** sequence */
      definition.sequence.map((sequence, index) => {
        //FIXME sequence should have the same order as defined
        if (!sequence.minOccurs && sequence.ref && !has(value[0], sequence.ref)) {
          throw new Error(`Validation Error: Missing ${sequence.ref}`)
        }
        //recursion:
        if (value[0][sequence.ref]) {
          //we need to test because user_defined_anyfield will fail here
          this.validateElement(value[0][sequence.ref], this.getDefinition(sequence.ref))
        }
      })
    } else if (definition.simple) {
      //this will have a value and attributes ie.
      //<email_sonstige emailart="EM_DIREKT" bemerkung="1">foo@bar.de</email_sonstige>
      //console.log('simple', definition, value)
    } else if (definition.type) {
      //console.log('type', definition.name, value, definition.type)
      //FIXME: stellplatz type
      if (definition.type === 'boolean' && !this.isBoolean(value[0])) {
        throw new Error(`Validation Error: ${definition.name} must be boolean`)
      } else if (definition.type === 'date' && !this.isDate(value[0])) {
        throw new Error(`Validation Error: ${definition.name} must be a date`)
      } else if (definition.type === 'string' && !this.isString(value[0])) {
        throw new Error(`Validation Error: ${definition.name} must be a string`)
      } else if (definition.type === 'decimal' && !this.isNumber(value[0])) {
        throw new Error(`Validation Error: ${definition.name} must be a number`)
      } else if (definition.type === 'positiveInteger' && !this.isPositiveInteger(value[0])) {
        throw new Error(`Validation Error: ${definition.name} must be a positive integer`)
      } else if (definition.type === 'dateTime' && !this.isDateTime(value[0])) {
        throw new Error(`Validation Error: ${definition.name} must be a valid dateTime`)
      } else if (definition.type === 'stellplatz' && !this.isParkingSpaceInfo(value[0])) {
        throw new Error(`Validation Error: ${definition.name} must be a valid parking space info`)
      }
    }
  }
  isPositiveInteger(test) {
    return test.match(/^[0-9]+$/)
  }

  isDateTime(test) {
    //2001-01-01T11:00:00
    return test.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}$/)
  }

  isDate(test) {
    return test.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
  }

  isNumber(test) {
    return !isNaN(+test)
  }

  isParkingSpaceInfo(test) {
    //FIXME: stellplatz must have: '$': { stellplatzmiete: '1', stellplatzkaufpreis: '1', anzahl: '1' }
    return true
  }

  isString(test) {
    return typeof test === 'string'
  }

  isBoolean(test) {
    return includes(['0', '1', 'false', 'true'], test)
  }

  validateRoot(json) {
    if (!json['openimmo']) {
      throw new Error(`Invalid Openimmo xml.`)
    }
    const rootDefinition = this.getDefinition('openimmo')
    rootDefinition.sequence.map((sequence) => {
      if (!sequence.minOccurs && !json['openimmo'][sequence.ref]) {
        throw new Error(`Validation Error: Missing ${sequence.ref}`)
      }
    })
  }

  validate(json) {
    this.validateRoot(json)
    const rootDefinition = this.getDefinition('openimmo')
    const valid = rootDefinition.sequence.map((sequence) => {
      this.validateElement(json['openimmo'][sequence.ref], this.getDefinition(sequence.ref))
    })
    return json
  }

  processProperties(json) {
    const estates = json['openimmo']['anbieter'][0]['immobilie']
    const map = require('../../resources/openimmo/openimmo-map.json')
    const properties = estates.map((property) => {
      let obj = {}
      forOwn(map, (value, key) => {
        obj = { ...obj, [key]: get(property, value) }
      })
      return obj
    })
    return properties
  }

  parseMultipleValuesWithOptions(properties) {
    const options = require('../../resources/openimmo/openimmo-to-breeze-constants.json')
    const fields = [
      'bath_options',
      'energy_type',
      'firing',
      'ground',
      'heating_type',
      'marketing_type',
      'parking_space_type',
      'use_type',
    ]
    properties.map((property) => {
      fields.map((field) => {
        let dproperty = property[field]
        let propertyOptions = []
        if (dproperty) {
          forOwn(options[field], (value, key) => {
            if (dproperty[key] && (dproperty[key] === 'true' || dproperty[key] === '1')) {
              propertyOptions = [...propertyOptions, value]
            }
          })
        }
        property[field] = propertyOptions
      })
    })
    return properties
  }

  parseSingleValues(properties) {
    const options = require('../../resources/openimmo/openimmo-to-breeze-constants.json')
    const fields = ['apt_type', 'building_age', 'building_status', 'gender']
    properties.map((property) => {
      fields.map((field) => {
        let dproperty = property[field]
        let propertyValue
        if (dproperty) {
          propertyValue = options[field][dproperty]
        }
        property[field] = propertyValue
      })
      //parse lat long
      if (property.coord_raw) {
        property.coord_raw = `${property.coord_raw.breitengrad},${property.coord_raw.laengengrad}`
        property.coord = `POINT(${property.coord_raw})`
      }
      //force dates to be of the format YYYY-MM-DD
      property.available_date = moment(new Date(property.available_date)).format('YYYY-MM-DD')
      property.from_date = moment(new Date(property.from_date)).format('YYYY-MM-DD')
    })
    return properties
  }

  async process() {
    let data
    if (this.contentType === 'application/zip') {
      await this.extractZip(this.filePath)
      const files = fs.readdirSync(this.dir)
      const file = files.find((file) => file.match(/\.xml$/))
      data = fs.readFileSync(`${this.dir}/${file}`)
    } else if (this.contentType === 'application/xml') {
      data = fs.readFileSync(this.filePath)
    }
    let json = this.extractJson(data)
    try {
      if ((json = this.validate(json))) {
        //return json
        let properties = this.processProperties(json)
        properties = this.parseMultipleValuesWithOptions(properties)
        properties = this.parseSingleValues(properties)
        //console.log(properties)
        return properties
        return json['openimmo']['anbieter'][0]
      }
    } catch (err) {
      console.log(err.message)
      return false
    }
  }
}

module.exports = OpenImmoReader
