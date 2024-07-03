const xml2js = require('xml2js')
const AppException = use('App/Exceptions/AppException')
const fsPromises = require('fs/promises')
const extract = require('extract-zip')
const { has, includes, isArray, forOwn, get, unset } = require('lodash')
const OPENIMMO_EXTRACT_FOLDER = process.env.PDF_TEMP_DIR || '/tmp'
const moment = require('moment')
const Logger = use('Logger')
const {
  FILE_TYPE_UNASSIGNED,
  PETS_SMALL,
  PETS_NO,
  DAY_FORMAT,
  STATUS_ACTIVE,
  STATUS_EXPIRE,
  DATE_FORMAT,
  PROPERTY_TYPE_APARTMENT,
  PROPERTY_TYPE_HOUSE,
  PROPERTY_TYPE_ROOM,
  PROPERTY_TYPE_SITE,
  STATUS_DELETE,
  STATUS_DRAFT
} = require('../constants')

const energyPassVariables = {
  wertklasse: 'energy_efficiency_category',
  ausstelldatum: 'created_on',
  gueltig_bis: 'expires_on',
  epart: 'type_of_certificate',
  energieverbrauchkennwert: 'total_consumption_value',
  stromwert: 'electricity',
  waermewert: 'heating',
  mitwarmwasser: 'consumption_including_hot_water',
  endenergiebedarf: 'total_demand_value'
}

const certificateType = {
  BEDARF: 'By Demand',
  VERBRAUCH: 'By Consumption'
}

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
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
    for (let i = 0; i < length; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return randomString
  }

  extractJson(xml) {
    const that = this
    const xmlParser = xml2js.Parser()
    xmlParser.parseString(xml, function (err, result) {
      if (err) {
        console.log(err)
        that.json = false
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
          // user_defined_extend problem
        } else {
          if (
            has(attribute, 'use') &&
            attribute.use === 'required' &&
            !has(value[0].$, attribute.name)
          ) {
            throw new Error(`Validation Error: Attribute ${attribute.name} missing`)
          }
          if (
            has(attribute, 'restriction') &&
            !includes(attribute.restriction, value[0].$[attribute.name])
          ) {
            throw new Error(
              `Validation Error: Illegal value ${value[0].$[attribute.name]} for ${attribute.name}`
            )
          }
        }
      })
    }

    if (definition.sequence && isArray(definition.sequence)) {
      /** sequence */
      definition.sequence.map((sequence, index) => {
        // FIXME sequence should have the same order as defined
        if (!sequence.minOccurs && sequence.ref && !has(value[0], sequence.ref)) {
          throw new Error(`Validation Error: Missing ${sequence.ref}`)
        }
        // recursion:
        if (value[0][sequence.ref]) {
          // we need to test because user_defined_anyfield will fail here
          this.validateElement(value[0][sequence.ref], this.getDefinition(sequence.ref))
        }
      })
    } else if (definition.simple) {
      // this will have a value and attributes ie.
      // <email_sonstige emailart="EM_DIREKT" bemerkung="1">foo@bar.de</email_sonstige>
      // console.log('simple', definition, value)
    } else if (definition.type) {
      // FIXME: stellplatz type
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
    // 2001-01-01T11:00:00
    return test.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}$/)
  }

  isDate(test) {
    return test.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
  }

  isNumber(test) {
    return !isNaN(+test)
  }

  isParkingSpaceInfo(test) {
    // FIXME: stellplatz must have: '$': { stellplatzmiete: '1', stellplatzkaufpreis: '1', anzahl: '1' }
    return true
  }

  isString(test) {
    return typeof test === 'string'
  }

  isBoolean(test) {
    return includes(['0', '1', 'false', 'true'], test)
  }

  validateRoot(json) {
    if (!json.openimmo) {
      throw new Error(`Invalid Openimmo xml.`)
    }
    const rootDefinition = this.getDefinition('openimmo')
    rootDefinition.sequence.map((sequence) => {
      if (!sequence.minOccurs && !json.openimmo[sequence.ref]) {
        throw new Error(`Validation Error: Missing ${sequence.ref}`)
      }
    })
  }

  validate(json) {
    this.validateRoot(json)
    const rootDefinition = this.getDefinition('openimmo')
    rootDefinition.sequence.map((sequence) => {
      this.validateElement(json.openimmo[sequence.ref], this.getDefinition(sequence.ref))
    })
    return json
  }

  processProperties(json) {
    try {
      const transmittal = json.openimmo.uebertragung[0].$
      const estates = json.openimmo.anbieter[0].immobilie
      const map = require('../../resources/openimmo/openimmo-map.json')
      const properties = estates.map((property) => {
        let obj = {}
        forOwn(map, (value, key) => {
          obj = { ...obj, [key]: get(property, value) }
        })
        obj.status = transmittal.art
        obj.action = transmittal.modus
        return obj
      })
      return properties
    } catch (e) {
      Logger.error('process properties error ', e.message)
      return []
    }
  }

  async processImages(properties) {
    properties.map((property, index) => {
      ;(property?.images || []).map(async (image, k) => {
        properties[index].images[k] = {
          tmpPath: `${this.dir}/${image.daten[0].pfad[0]}`,
          headers: {
            'content-type': image.format[0]
          },
          file_name: `${image.daten[0].pfad[0]}`,
          type: FILE_TYPE_UNASSIGNED,
          format: image.format[0]
        }
      })
    })
    return properties
  }

  processEnergyPass(properties) {
    properties.map((property) => {
      let pass = {}
      if (property.energy_pass) {
        forOwn(property.energy_pass, (value, key) => {
          let dval = value[0]
          if (key === 'epart') {
            dval = certificateType[value[0]]
          }
          if (energyPassVariables[key]) {
            pass = { ...pass, [energyPassVariables[key]]: dval }
          }
        })
      }
      property.energy_pass = pass
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
      'use_type'
    ]
    properties.map((property) => {
      fields.map((field) => {
        const dproperty = property[field]
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
    const fields = [
      'apt_type',
      'building_age',
      'building_status',
      'country',
      'furnished',
      'gender',
      'property_type'
    ]
    properties.map((property) => {
      fields.map((field) => {
        let propertyValue
        const dproperty = property[field]
        if (dproperty) {
          propertyValue = options[field][dproperty]
        }
        property[field] = propertyValue
      })
      // parse lat long
      if (property.coord) {
        property.coord = `${property.coord.breitengrad},${property.coord.laengengrad}`
      }
      // force dates to be of the format YYYY-MM-DD
      if (property.vacant_date) {
        // vacant_date in openimmo (verfuegbar_ab) is string
        const matches = property.vacant_date.match(/([0-9]{2})\.([0-9]{2})\.([0-9]{4})/)
        if (matches) {
          property.vacant_date = `${matches[3]}-${matches[2]}-${matches[1]}`
          moment(new Date(property.vacant_date), 'YYYY/MM/DD', true)
            .utcOffset(2)
            .format(DATE_FORMAT)
        } else {
          unset(property, 'vacant_date')
        }
      } else {
        unset(property, 'vacant_date')
      }

      property.construction_year = property.construction_year
        ? `${property.construction_year}-01-01`
        : null

      // last_modernization according to openimmo is a string ie. Bad 1997, K�che 2010
      if (property.last_modernization) {
        property.last_modernization = property.last_modernization.match(/(19|20)[0-9]{2}/)
          ? `${property.construction_year}-01-01`
          : null
      }

      if (property.pets_allowed === 'true') {
        property.pets_allowed = PETS_SMALL
      } else {
        property.pets_allowed = PETS_NO
      }

      property.barrier_free = property.barrier_free === 'true'
      property.chimney = property.chimney === 'true'
      property.elevator = property?.elevator?.length > 0
      property.garden = property.garden === 'true'
      property.sauna = property.sauna === 'true'
      property.swimmingpool = property.swimmingpool === 'true'
      property.wintergarten = property.wintergarten === 'true'
      property.guest_toilet = property.guest_toilet === 'true'
      property.wbs = property.wbs === 'true'
      property.full_address = property.full_address === 'true'

      if (property.action === 'DELETE') {
        property.status = STATUS_DELETE
      } else if (property.status === 'ONLINE') {
        if (+property.net_rent) {
          property.status = STATUS_ACTIVE
        } else {
          property.status = STATUS_DRAFT
        }
      } else if (property.status === 'OFFLINE') {
        property.status = STATUS_EXPIRE
      }

      if (property.basement === 'JA') {
        property.basement = true
      }

      if (property?.apt_type) {
        property.property_type = PROPERTY_TYPE_APARTMENT
      } else if (property?.house_type) {
        property.property_type = PROPERTY_TYPE_HOUSE
      } else if (property?.room_type) {
        property.property_type = PROPERTY_TYPE_ROOM
      } else if (property?.site_type) {
        property.property_type = PROPERTY_TYPE_SITE
      }
    })
    return properties
  }

  async process() {
    try {
      let dfile
      if (
        this.contentType === 'application/zip' ||
        this.contentType === 'application/x-zip-compressed'
      ) {
        await this.extractZip(this.filePath)
        const files = await fsPromises.readdir(this.dir)
        const file = files.find((file) => file.match(/\.xml$/))
        if (!file) {
          throw new Error('No valid xml file found.')
        }
        dfile = `${this.dir}/${file}`
      } else if (this.contentType === 'application/xml') {
        dfile = this.filePath
      }
      let data
      data = await fsPromises.readFile(dfile)
      const json = this.extractJson(data)
      let properties = []
      if (json && this.validate(json)) {
        properties = this.processProperties(json)
        properties = this.parseMultipleValuesWithOptions(properties)
        properties = this.parseSingleValues(properties)
        properties = this.processEnergyPass(properties)
        properties = await this.processImages(properties)
      }
      await fsPromises.unlink(dfile)
      return properties
    } catch (err) {
      throw new Error(err.message)
    }
  }

  async processXml(xmls) {
    try {
      let properties = []
      for (let i = 0; i < xmls.length; i++) {
        let property
        const json = this.extractJson(xmls[i])
        if (json && this.validate(json)) {
          property = this.processProperties(json)
          property = this.parseMultipleValuesWithOptions(property)
          property = this.parseSingleValues(property)
          property = this.processEnergyPass(property)
          property = await this.processImages(property)
          properties = [...properties, property[0]]
        }
      }
      return properties
    } catch (err) {
      throw new Error(err.message)
    }
  }
}

module.exports = OpenImmoReader
