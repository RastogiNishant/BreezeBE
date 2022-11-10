'use_strict'
const xlsx = require('node-xlsx')
const HttpException = use('App/Exceptions/HttpException')
const { get, has, isString, isFunction, trim } = require('lodash')
const EstateAttributeTranslations = use('App/Classes/EstateAttributeTranslations')

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
    'firing',
    'heating_type',
    'area',
    'rooms_number',
    'floor',
    'floor_direction',
    'apt_type',
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
    'available_date',
    'from_date',
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
  rowForColumnKeys = 0
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
    const sheet = data.find((i) => i.name === this.sheetName)
    //sheet where the estates to import are found...
    if (!sheet || !sheet.data) {
      throw new HttpException(
        `Cannot find sheet: ${this.sheetName}. Please use the correct template.`,
        422,
        101100
      )
    }
    this.reverseTranslator = new EstateAttributeTranslations()
    this.dataMapping = this.reverseTranslator.getMap()
    this.setValidColumns(get(sheet, `data.${this.rowForColumnKeys}`) || [])
    this.setData(get(sheet, 'data') || [])
    console.log(this.data)
    throw new HttpException('asdf')
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
        this.warnings.push(`Column ${current} is invalid and not included on import.`)
      }
      return columns
    }, [])
    this.validColumns = columns
    return columns
  }

  setData(data) {
    for (let k = this.dataStart; k < data.length; k++) {
      if (data[k].length > 0) {
        let row = {}
        //we only work with valid columns and disregard the rest
        this.validColumns.map((column) => {
          row[column.name] = this.mapValue(column.name, get(data[k], `${column.index}`))
        })
        row = this.processRow(row)
        this.data.push(row)
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
    
      if (isFunction(this.dataMapping[columnName])) {
        return this.dataMapping[columnName](value)
      } else if (isString(value)) {
        if (has(this.dataMapping, columnName)) {
          return get(this.dataMapping, `${columnName}.${this.escapeStr(value)}`)
        }
        return value
      }
    }
  }

  processRow(row) {
    //deposit
    row.deposit = (parseFloat(row.deposit) || 0) * (parseFloat(row.net_rent) || 0)
    //address
    row.address = trim(
      `${row.street || ''} ${row.house_number || ''}, ${row.zip || ''} ${row.city || ''}`,
      ', '
    ).replace(/\s,/g, ',')
    //letting
    if ((matches = row.letting.match(/^(.*?) \- (.*?)$/))) {
      row.letting_status = get(this.dataMapping, `let_status.${escapeStr(matches[2])}`)
      row.letting_type = get(this.dataMapping, `let_type.${escapeStr(matches[1])}`)
    } else {
      row.letting_type = get(this.dataMapping, `let_type.${escapeStr(v)}`)
    }
    //rooms
    for(let count = 1; count <= 6; count++) {
      let roomValue = get(row, `room${count}_type`)
      if(roomValue) {
        if(get(this.dataMapping, `room_type.${roomValue}`)) {
          row[`room${count}_type`] = {
            type: get(this.dataMapping, `room_type.${roomValue}`),
            name: get(this.dataMapping, `room_type_name.${roomValue}`),
          }
        }
      }
    }

    return row
  }

  process() {
    return {
      errors: this.errors,
      warnings: this.warnings,
      data: this.data,
    }
  }
}

module.exports = EstateImportReader
