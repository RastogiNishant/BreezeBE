'use_strict'
const xlsx = require('node-xlsx')
const HttpException = use('App/Exceptions/HttpException')
const { get, has, isString, isFunction, unset } = require('lodash')
const {
  exceptions: { IMPORT_ESTATE_INVALID_SHEET },
  exceptionKeys: { IMPORT_ESTATE_INVALID_VARIABLE_WARNING },
  getExceptionMessage,
} = require('../exceptions')
const { MAX_ROOM_TYPES_TO_IMPORT } = require('../constants')
const { generateAddress } = use('App/Libs/utils')
const EstateAttributeTranslations = use('App/Classes/EstateAttributeTranslations')
const schema = require('../Validators/ImportEstate').schema()

class EstateImportReader {
  validHeaderVars = [
    'six_char_code',
    'property_id',
    'street',
    'house_number',
    'extra_address',
    'zip',
    'city',
    'country',
    'property_type',
    'letting',
    'use_type',
    'occupancy',
    'ownership_type',
    'marketing_type',
    'house_type',
    'construction_year',
    'last_modernization',
    'building_status',
    'number_floors',
    'energy_efficiency',
    'firing', // Energy Carrier
    'heating_type',
    'area',
    'rooms_number',
    'floor',
    'floor_direction',
    'apt_type', // Apartment Type
    'apartment_status',
    'equipment_standard',
    'furnished',
    'parking_space_type',
    'room1_type',
    'room2_type',
    'room3_type',
    'room4_type',
    'room5_type',
    'room6_type',
    'net_rent',
    'additional_costs',
    'heating_costs',
    'stp_garage',
    'deposit',
    'currency',
    'vacant_date',
    'txt_salutation',
    'surname',
    'contract_end',
    'phone_number',
    'email',
    'budget',
    'rent_arrears',
    'credit_score',
    'min_age',
    'max_age',
    'family_size_max',
    'minors',
    'pets_allowed',
  ]
  sheetName = 'Import_Data'
  rowForColumnKeys = 4
  dataStart = 5
  errors = []
  warnings = []
  data = []

  constructor(filePath, overrides = {}) {
    const data = xlsx.parse(filePath, { cellDates: true })
    if (overrides?.sheetName) {
      this.sheetName = overrides.sheetName
    }
    if (overrides?.rowForColumnKeys) {
      this.rowForColumnKeys = overrides?.rowForColumnKeys
    }
    if (overrides?.dataStart) {
      this.dataStart = overrides.dataStart
    }
    if (overrides?.validHeaderVars) {
      this.validHeaderVars = overrides.validHeaderVars
    }
    const sheet = data.find((i) => i.name === this.sheetName)
    this.sheet = sheet
    //sheet where the estates to import are found...
    if (!sheet || !sheet.data) {
      throw new HttpException(IMPORT_ESTATE_INVALID_SHEET, 422)
    }
    this.reverseTranslator = new EstateAttributeTranslations()
    this.dataMapping = this.reverseTranslator.getMap()
    this.setValidColumns(get(sheet, `data.${this.rowForColumnKeys}`) || [])
    if (!this.validateColumns(this.validColumns)) {
      throw new HttpException(IMPORT_ESTATE_INVALID_SHEET, 422)
    }
    return this
  }

  setValidColumns(columns) {
    columns = columns.reduce((columns, current, index) => {
      if (this.validHeaderVars.includes(current)) {
        columns = [
          ...columns,
          {
            name: current,
            index,
          },
        ]
      } else {
        this.warnings.push(getExceptionMessage('', IMPORT_ESTATE_INVALID_VARIABLE_WARNING, current))
      }
      return columns
    }, [])
    this.validColumns = columns
    return columns
  }

  validateColumns(columns) {
    if (columns.length !== this.validHeaderVars.length) {
      //probably one or more hidden keys are altered or sheet is not updated.
      return false
    }
    return true
  }

  async setData(data) {
    for (let k = this.dataStart; k < data.length; k++) {
      if (data[k].length > 0) {
        let row = {}
        //we only work with valid columns and disregard the rest
        this.validColumns.map((column) => {
          const value = get(data[k], `${column.index}`)
          if (value) {
            row[column.name] = this.mapValue(column.name, get(data[k], `${column.index}`))
          }
        })
        if (Object.keys(row) && Object.keys(row).length) {
          row = await this.processRow(row, k)
          if (row) {
            this.data.push(row)
          }
        }
      }
    }

    return this.data
  }

  escapeStr(v) {
    return (v || '')
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-zà-ž\u0370-\u03FF\u0400-\u04FF]/g, '_')
  }

  mapValue(columnName, value) {
    try {
      if (!value) {
        return null
      }
      if (isFunction(this.dataMapping[columnName])) {
        return this.dataMapping[columnName](value)
      } else if (isString(value)) {
        if (has(this.dataMapping, columnName)) {
          return get(this.dataMapping, `${columnName}.${this.escapeStr(value)}`)
        }
      }
      return value
    } catch (e) {
      console.log('mapValue error', `${e.message} occurred for ${columnName} ${value}`)
      return null
    }
  }

  async processRow(row, rowCount, validateRow = true) {
    try {
      //deposit
      row.deposit = (parseFloat(row.deposit) || 0) * (parseFloat(row.net_rent) || 0)
      //address
      row.address = generateAddress({
        street: row.street || '',
        house_number: row.house_number || '',
        zip: row.zip || '',
        city: row.city || '',
        country: row.country || '',
      })
      //letting
      if (row.letting) {
        let matches
        if ((matches = row.letting?.match(/^(.*?) \- (.*?)$/))) {
          row.letting_status = get(this.dataMapping, `let_status.${this.escapeStr(matches[2])}`)
          row.letting_type = get(this.dataMapping, `let_type.${this.escapeStr(matches[1])}`)
        } else {
          row.letting_type = get(this.dataMapping, `let_type.${this.escapeStr(row.letting)}`)
        }
      }
      unset(row, 'letting') //remove letting
      //rooms
      for (let count = 1; count <= MAX_ROOM_TYPES_TO_IMPORT; count++) {
        let roomValue = get(row, `room${count}_type`)
        if (roomValue && roomValue != '') {
          roomValue = this.escapeStr(roomValue)
          if (get(this.dataMapping, `room_type.${roomValue}`)) {
            row[`room${count}_type`] = {
              type: get(this.dataMapping, `room_type.${roomValue}`),
              name: get(this.dataMapping, `room_type_name.${roomValue}`),
            }
          }
        }
      }
      //txt_salutation
      const salutation = get(row, `txt_salutation`)
      if (get(this.dataMapping, `salutation.${this.escapeStr(salutation)}`)) {
        row.salutation_int = get(this.dataMapping, `salutation.${this.escapeStr(salutation)}`)
      }
      if (validateRow) {
        row = await this.validateRow(row, rowCount)
      }
      return row
    } catch (e) {
      console.log('processRow error', e.message)
      return null
    }
  }

  async validateRow(row, rowCount) {
    try {
      const data = await schema.validate(row)
      return {
        line: rowCount,
        data: data,
        six_char_code: row.six_char_code,
      }
    } catch (e) {
      const ret = {
        line: rowCount + 1,
        error: e.errors,
        breeze_id: row.six_char_code || null,
        property_id: row ? row.property_id : `no property id`,
        street: row ? row.street : `no street code`,
        postcode: row ? row.zip : `no zip code`,
      }
      this.errors.push(ret)
    }
  }

  async process() {
    await this.setData(get(this.sheet, 'data') || [])
    return {
      errors: this.errors,
      warnings: this.warnings,
      data: this.data,
    }
  }
}

module.exports = EstateImportReader
