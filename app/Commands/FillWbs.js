'use strict'

const { Command } = require('@adonisjs/ace')
const fs = require('fs')
const { LogicalException } = require('@adonisjs/generic-exceptions')
const Logger = use('Logger')
const Wbs = use('App/Classes/Wbs')
const City = use('App/Models/City')
const Promise = require('bluebird')

class FillWbs extends Command {
  static get signature() {
    return 'app:fillwbs'
  }

  static get description() {
    return 'Run filling up the wbs link to cities'
  }

  async readWbs() {
    try {
      const path = `${process.cwd()}/resources/WBS.xlsx`
      if (!fs.existsSync(path)) {
        Logger.error('WBS File not exists')
        throw new LogicalException('WBS File not exists', 500, 0)
      }

      console.log('readWps !!! ')

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
  async handle(args, options) {
    console.log('FillWbs now....')
    await this.readWbs()
  }
}

module.exports = FillWbs
