const Excel   = require('exceljs')
const { get, has, trim, isEmpty, reduce, isString, isFunction } = require('lodash')
const AppException = use('App/Exceptions/AppException')


class ExcelReader {
  constructor() {
    this.columns = [
      'No.',
      'Name',
      'Tel.',
      'Email',
    ]
    this.dataMapping = {
      property_type: {
        No: 1,
        Name: 'waqs',
        Tel: '+445666',
        Email: 'was@yopmail.com',
      },
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
  mapDataToEntity(row) {

    const [
      num, // 'No.',
      name, // 'Street',
      tel, // 'House Number',
      email, // 'Extra Address',
    
    ] = row

    const result = {
      no,
      name,
      tel,
      email,
    }


  }

  /**
   *
   */
  async readFile(filePath) {
    var workbook = new Excel.Workbook()
    const result = []
    const again = await workbook.xlsx.readFile(filePath)

    var worksheet = workbook.getWorksheet(1);
    try {
      worksheet.eachRow({ includeEmpty: false }, function(row, rowNumber) {
        if(rowNumber != 1){
          let name = row.values[2]
          let tel = JSON.stringify(row.values[3])
          let email = row.values[4]
          var pattern = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;

          if (!pattern.test(email.toLowerCase())
              || name === 'Name' 
              || email === 'Email' || tel === 'Tel.'){
          } else {
            result.push({'name': name, 'tel' : tel, email : email});
          }
        }
        
      });
    } catch (err){

    }
    
    const errors = []
    return { errors, data: result }
  }
}

module.exports = ExcelReader
