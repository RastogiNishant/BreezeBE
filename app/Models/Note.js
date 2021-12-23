'use strict'

const Model = require('./BaseModel')

class Note extends Model {
  
  static get columns() {
    return ['id', 'note', 'writer_id', 'about_id']
  }

}

module.exports = Note
