const Excel = require('exceljs')
const { get, has, trim, isEmpty, reduce, isString, isFunction } = require('lodash')
const AppException = use('App/Exceptions/AppException')
const { validationRegExp } = require('../helper')

class ExcelReader {
  constructor() {
    this.columns = ['No.', 'Name', 'Tel.', 'Email']
    this.dataMapping = {
      property_type: {
        No: 1,
        Name: 'waqs',
        phone: '+445666',
        Email: 'was@yopmail.com'
      }
    }
  }

  /**
   *
   */
  async validateHeader(sheet) {
    const header = get(sheet, `data.${this.headerCol}`) || []
    header.forEach((i) => {
      if (!this.columns.includes(i)) {
        throw new AppException('Invalid header data')
      }
    })
  }

  /**
   *
   */
  async readFile(filePath) {
    const workbook = new Excel.Workbook()
    const result = []
    await workbook.xlsx.readFile(filePath)

    const worksheet = workbook.getWorksheet(1)
    try {
      worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
        if (rowNumber !== 1) {
          const name = row.values[2]
          const phone = JSON.stringify(row.values[3])
          const email = row.values[4] || ''

          const dropRow =
            !validationRegExp.EMAIL_REG_EXP.test(email.toLowerCase()) ||
            name === 'Name' ||
            email === 'Email' ||
            phone === 'Tel.'

          if (!dropRow) {
            result.push({ name, phone, email })
          }
        }
      })
    } catch (err) {}

    const errors = []
    return { errors, data: result }
  }
}

module.exports = ExcelReader
