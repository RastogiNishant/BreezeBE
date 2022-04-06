const xlsx = require('node-xlsx')
const { get, has, isEmpty, reduce, isString, isFunction } = require('lodash')
const schema = require('../Validators/CreateEstate').schema()
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

  constructor() {
    this.headerCol = 4
    this.sheetName = 'data'
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
        } else if (k.match(/room\d+_type/)) {
          console.log('roomtype', v, get(this.dataMapping, `room_type.${v}`))
          v = isString(v) ? escapeStr(v) : v
          return { ...n, [k]: get(this.dataMapping, `room_type.${v}`) }
        }
        return { ...n, [k]: v }
      },
      {}
    )
  }
  /**
   *
   */
  async readFile(filePath) {
    const data = xlsx.parse(filePath, { cellDates: true })
    const sheet = data.find((i) => i.name === this.sheetName)
    if (!sheet || !sheet.data) {
      throw new HttpException(
        `Cannot find sheet: ${this.sheetName}. Please use the correct template.`
      )
    }

    //determine language
    const deTest = ['Deine ID', 'Straße (*)', 'Hausnummer (*)', 'Zusatzadresse', 'PLZ (*)']
    const columns = sheet.data[this.headerCol].slice(0, this.columnLimit)
    let probableLang = columns
      .slice(1, 6)
      .map((column) => (_.indexOf(deTest, column) > -1 ? 'de' : 'en'))
    let lang = 'en'

    if (_.uniq(probableLang).length <= 1) {
      lang = probableLang[0]
    } else {
      throw new HttpException('Cannot determine Excel language.')
    }
    this.dataMapping = new EstateAttributeTranslations(lang)
    const HeaderTranslations = new EstateImportHeaderTranslations(lang)

    //set possible columns that we can track...
    this.columns = HeaderTranslations.getHeaderVars()
    const header = get(sheet, `data.${this.headerCol}`) || []
    await this.validateHeader(header)
    const errors = []
    const toImport = []
    let columnVars = HeaderTranslations.getColumnVars()
    const validHeaders = this.validHeaders

    //Loop through all rows and process
    for (let k = this.headerCol + 1; k < sheet.data.length; k++) {
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
        continue
      }
      let itemData = this.mapToValues(row)
      itemData = {
        ...itemData,
        credit_score: itemData.credit_score ? parseFloat(itemData.credit_score) * 100 : 0,
        floor: itemData.floor ? itemData.floor : 0,
      }
      console.log('itemData', itemData)
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
    return { errors, data: toImport, warnings: this.warnings }
  }
}

module.exports = ExcelReader
