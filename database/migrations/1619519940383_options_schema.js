'use strict'

const Schema = use('Schema')
const {
  OPTIONS_TYPE_BUILD,
  OPTIONS_TYPE_APT,
  OPTIONS_TYPE_OUT,
  OPTIONS_TYPE_BAD,
  OPTIONS_TYPE_KITCHEN,
  OPTIONS_TYPE_ROOM,
} = require('../../app/constants')


class OptionsSchema extends Schema {
  up() {
    this.alter('options', (table) => {
      table.renameColumn('type', 'type_bak')
    })

    this.alter('options', (table) => {
      table
        .enu('type', [
          OPTIONS_TYPE_BUILD,
          OPTIONS_TYPE_APT,
          OPTIONS_TYPE_OUT,
          OPTIONS_TYPE_BAD,
          OPTIONS_TYPE_KITCHEN,
          OPTIONS_TYPE_ROOM,
        ])
        .defaultTo(OPTIONS_TYPE_BUILD)
        .notNullable()
    })

    this.raw(`UPDATE options set type = type_bak`)

    this.alter('options', (table) => {
      table.dropColumn('type_bak')
    })
  }

  down() {}
}

module.exports = OptionsSchema
