'use strict'

const Schema = use('Schema')
const Database = use('Database')
const fs = require('fs')
const path = require('path')

class ImportSchema extends Schema {
  up() {
    this.schedule(async (trx) => {
      const sql = fs.readFileSync(path.resolve(__dirname, '../building_quality_data.sql')).toString()
      console.log(sql)
      await Database.raw(sql)
    })
  }

  down() {}
}

module.exports = ImportSchema
