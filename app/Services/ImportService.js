const ExcelReader = use('App/Classes/ExcelReader')

class ImportService {
  /**
   *
   */
  static async parse(filePath) {
    const reader = new ExcelReader()
    await reader.readFile(filePath)
  }
}

module.exports = ImportService
