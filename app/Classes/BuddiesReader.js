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
        console.log("Row " + rowNumber + " = " + JSON.stringify(row.values));
        if(rowNumber != 1){
          let name = row.values[2]
          let tel = JSON.stringify(row.values[3])
          let email = row.values[4]
          if (name === 'Name' || email === 'Email' || tel === 'Tel.'){
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
