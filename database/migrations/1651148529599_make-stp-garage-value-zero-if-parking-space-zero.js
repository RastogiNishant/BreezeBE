'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MakeStpGarageValueZeroIfParkingSpaceZero extends Schema {
  up() {
    // Garage price should be zero if no parking space
    this.raw('update estates set stp_garage = 0 where parking_space = 0 and stp_garage > 0')
  }
}

module.exports = MakeStpGarageValueZeroIfParkingSpaceZero
