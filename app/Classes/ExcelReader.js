const xlsx = require('node-xlsx')
const { get, has, isEmpty, reduce, isString, isFunction } = require('lodash')
const schema = require('../Validators/ImportEstate').schema()
const _ = require('lodash')
const l = use('Localize')

const HttpException = use('App/Exceptions/HttpException')
const EstateAttributeTranslations = require('./EstateAttributeTranslations')
const EstateImportHeaderTranslations = require('./EstateImportHeaderTranslations')

escapeStr = (v) => {
  return (v || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-zà-ž\u0370-\u03FF\u0400-\u04FF]/g, '_')
}

class ExcelReader {
  warnings = []
  validHeaders = []
  dataMapping = {}
  //we need to limit number of columns
  columnLimit = 200
  dataRowStart = 4

  constructor({ rowKey, sheetName }) {
    this.rowForColumnKeys = rowKey ? rowKey : 0
    this.sheetName = sheetName ? sheetName : 'Import_Data'
  }

  /**
   *
   */
  async validateHeader(header) {
    await header.forEach((i) => {
      i = _.toLower(i)
      if (!this.columns.includes(i) && i !== '') {
        this.warnings.push(`Header: ${i} is NOT being tracked and saved to dB.`)
      } else if (i) {
        this.validHeaders.push(i)
      }
    })
    return header
  }

  mapToValues(row) {
    const mapValue = (k, v, result) => {
      if (isFunction(this.dataMapping[k])) {
        return this.dataMapping[k](v, result)
      } else if (isString(v)) {
        if (has(this.dataMapping, k)) {
          return get(this.dataMapping, `${k}.${escapeStr(v)}`)
        }
        return escapeStr(v)
      }

      return v
    }

    return reduce(
      row,
      (n, v, k) => {
        if (v === undefined) {
          // Address should process separately
          if (k === 'address') {
            return { ...n, [k]: mapValue(k, '', row) }
          } else if (k == 'property_id') {
            const r = Math.random().toString(36).substr(2, 8).toUpperCase()
            return { ...n, [k]: r }
          }
          return n
        } else if (Object.keys(this.dataMapping).includes(k)) {
          return { ...n, [k]: mapValue(k, v, row) }
        } else if (k == 'letting') {
          let matches
          let letting_status
          let letting_type
          if ((matches = v.match(/^(.*?) \- (.*?)$/))) {
            letting_status = get(this.dataMapping, `let_status.${escapeStr(matches[2])}`)
            letting_type = get(this.dataMapping, `let_type.${escapeStr(matches[1])}`)
          } else {
            letting_type = get(this.dataMapping, `let_type.${escapeStr(v)}`)
          }
          return { ...n, letting_status, letting_type }
        } else if (k.match(/room\d+_type/)) {
          v = isString(v) ? escapeStr(v) : v
          if (get(this.dataMapping, `room_type.${v}`)) {
            return {
              ...n,
              [k]: {
                type: get(this.dataMapping, `room_type.${v}`),
                name: get(this.dataMapping, `room_type_name.${v}`),
              },
            }
          } else {
            return {
              ...n,
            }
          }
        } else if (k == 'txt_salutation') {
          return {
            ...n,
            [k]: v,
            salutation_int: get(this.dataMapping, `salutation.${escapeStr(v)}`),
          }
        }
        return { ...n, [k]: v }
      },
      {}
    )
  }

  setValidColumns(keysFromImport) {
    this.validColumns = keysFromImport
  }
  /**
   *
   */
  async readFileEstateImport(filePath) {
    const data = xlsx.parse(filePath, { cellDates: true })
    const sheet = data.find((i) => i.name === this.sheetName)

    if (!sheet || !sheet.data) {
      throw new HttpException(
        `Cannot find sheet: ${this.sheetName}. Please use the correct template.`,
        422,
        101100
      )
    }
    this.setValidColumns(get(sheet, `data.${this.rowForColumnKeys}`) || [])
    console.log(this.validColumns)
    throw new HttpException('asdf')
    const AttributeTranslations = new EstateAttributeTranslations(lang)
    this.dataMapping = AttributeTranslations.getMap()
    const HeaderTranslations = new EstateImportHeaderTranslations(lang)
    //set possible columns that we can track...
    //we validate the header... this adds warnings when necessary
    await this.validateHeader(header)
    const errors = []
    const toImport = []
    let columnVars = HeaderTranslations.getColumnVars()
    const validHeaders = this.validHeaders
    //Loop through all rows and process

    for (let k = this.dataRowStart; k < sheet.data.length; k++) {
      //get this row...
      let row = columns.reduce(function (row, field, index) {
        if (_.indexOf(validHeaders, _.toLower(field)) > -1) {
          //this is a valid content
          row[columnVars[_.toLower(field)]] = sheet.data[k][index]
        }
        return row
      }, {})
      //test if this row are all undefined (The hidden columns messed this up)
      let processRow = false
      for (let key in row) {
        if (row[key] !== undefined) {
          processRow = true
        }
      }
      if (!processRow) {
        //this is unprocessable, it contains only undefined values
        continue
      }
      row.address = ''
      //we process what to do with the values
      let itemData = this.mapToValues(row)
      itemData = {
        ...itemData,
        credit_score: itemData.credit_score ? parseFloat(itemData.credit_score) * 100 : 0,
        floor: itemData.floor ? itemData.floor : 0,
      }
      try {
        toImport.push({
          line: k,
          data: await schema.validate(itemData),
          six_char_code: itemData.six_char_code,
        })
      } catch (e) {
        errors.push({
          line: k + 1,
          error: e.errors,
          breeze_id: itemData.six_char_code || null,
          property_id: itemData ? itemData.property_id : `no property id`,
          street: itemData ? itemData.street : `no street code`,
          postcode: itemData ? itemData.zip : `no zip code`,
        })
      }
    }
    return { errors, data: toImport, warnings: this.warnings }
  }

  async readFile(filePath) {
    const data = xlsx.parse(filePath, { cellDates: true })

    const sheet = data.find((i) => i.name === 'data')

    if (!sheet || !sheet.data) {
      throw new AppException('Invalid spreadsheet')
    }

    await this.validateHeader(sheet)

    const errors = []
    const toImport = []

    for (let k = this.headerCol + 1; k < sheet.data.length; k++) {
      if (k <= this.headerCol || isEmpty(sheet.data[k])) {
        continue
      }

      let itemData = this.mapDataToEntity(sheet.data[k])
      itemData = {
        ...itemData,
        credit_score: itemData.credit_score ? parseFloat(itemData.credit_score) * 100 : 0,
        floor: itemData.floor ? itemData.floor : 0,
      }

      try {
        toImport.push({ line: k, data: await schema.validate(itemData) })
      } catch (e) {
        errors.push({
          line: k,
          error: e.errors,
          street: itemData ? itemData.street : `no street code`,
          postcode: itemData ? itemData.zip : `no zip code`,
        })
      }
    }

    return { errors, data: toImport }
  }
}

module.exports = ExcelReader
