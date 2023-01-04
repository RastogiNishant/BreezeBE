'use strict'

const yup = require('yup')
const Base = require('./Base')

class FollowupVisit extends Base {
  static schema = () => yup.object().shape({
    
  })
}

module.exports = FollowupVisit
