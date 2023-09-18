'use strict'

const { Command } = require('@adonisjs/ace')
const fs = require('fs')
const { LogicalException } = require('@adonisjs/generic-exceptions')
const Logger = use('Logger')
const CitizenXls = use('App/Classes/CitizenXls')
const Citizen = use('App/Models/Citizen')
const Promise = require('bluebird')

class FillCitizen extends Command {
  static get signature() {
    //npx adonis app:fillwbs
    return 'app:fillcitizen'
  }

  static get description() {
    return 'Run filling up the wbs link to cities'
  }

  async readCitizen() {
    try {
      const path = `${process.cwd()}/resources/Citizenships.xlsx`
      if (!fs.existsSync(path)) {
        Logger.error('Citizenships File not exists')
        throw new LogicalException('Citizenships File not exists', 500, 0)
      }

      console.log('read Citizen !!!')

      const citizenInfo = new CitizenXls(path).read()
      await Promise.map(
        citizenInfo || [],
        async (citizen) => {
          const citizenModel = await Citizen.query()
            .where('citizen_key', citizen.citizen_key.trim(''))
            .first()
          if (citizenModel) {
            console.log(`Citizen updating ${citizenModel.citizen_key}=`, citizen.en_name)
            await citizenModel.updateItem({ en_name: citizen.en_name, de_name: citizen.de_name })
          } else {
            console.log(`City creating ${citizen.citizen_key}=`, citizen.en_name)
            await Citizen.createItem({
              citizen_key: citizen.citizen_key,
              en_name: citizen.en_name,
              de_name: citizen.de_name,
            })
          }
        },
        { concurrency: 1 }
      )
      console.log('Done filling up Citizens info!!!')
    } catch (e) {
      console.log('readCitzen exception', e.message)
    }
  }
  async handle(args, options) {
    console.log('Citizens now....')
    await this.readCitizen()
  }
}

module.exports = FillCitizen
