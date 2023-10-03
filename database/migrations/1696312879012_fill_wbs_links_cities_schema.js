'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Wbs = use('App/Classes/Wbs')
const City = use('App/Models/City')
const Promise = require('bluebird')
const fs = require('fs')
const Logger = use('Logger')

class FillWbsLinksCitiesSchema extends Schema {
  async up() {
    try {
      const path = `${process.cwd()}/resources/WBS.xlsx`
      if (!fs.existsSync(path)) {
        Logger.error('WBS File not exists')
        throw new Exception('WBS File not exists', 500, 0)
      }
      const wbsInfo = new Wbs(path).read()
      await Promise.map(
        wbsInfo || [],
        async (wbs) => {
          const city = await City.query().where('city', wbs.city.trim('')).first()
          if (city) {
            console.log(`City updating ${wbs.city}=`, wbs.wbs_link)
            await city.updateItem({ wbs_link: wbs.wbs_link })
          } else {
            console.log(`City creating ${wbs.city}=`, wbs.wbs_link)
            await City.createItem({
              country: 'Germany',
              alpha2: 'de',
              other_name: 'Deutschland',
              city: wbs.city,
              wbs_link: wbs.wbs_link,
            })
          }
        },
        { concurrency: 1 }
      )
      console.log('Done filling up WBS info!!!')
    } catch (e) {
      console.log('readWps exception', e.message)
    }
  }

  down() {
    this.table('fill_wbs_links_cities', (table) => {
      // reverse alternations
    })
  }
}

module.exports = FillWbsLinksCitiesSchema
