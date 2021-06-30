'use strict'

const { get, range } = require('lodash')
const { props, map } = require('bluebird')
const fs = require('fs')
const CsvReadableStream = require('csv-reader')

const Factory = use('Factory')
const Database = use('Database')
const File = use('App/Classes/File')
const GeoService = use('App/Services/GeoService')

const { ROLE_USER, ROLE_LANDLORD } = require('../../app/constants')

const geoData = require('./geo.json')

const uploadFile = async () => {
  const file = {
    tmpPath: `${__dirname}/simple.jpeg`,
    clientName: 'simple.jpeg',
    extname: 'simple.jpeg',
    headers: { 'content-type': 'image/jpeg' },
  }

  return File.saveToDisk(file, [], false)
}

class DatabaseSeeder {
  /**
   * Get DB data
   */
  async preloadData() {
    const getId = (table) => {
      return Database.table(table)
        .max('id')
        .first()
        .then((r) => {
          return get(r, 'id', null)
        })
    }
    const getOption = (name) => {
      return Database.table('options')
        .where('title', name)
        .first()
        .then((i) => i.id)
    }

    const options = await props({
      terms_id: getId('terms'),
      agreements_id: getId('agreements'),
      bath: getOption('bathtub'),
      furnished: getOption('furnished'),
      balcony: getOption('apt_balcony'),
      cellar: getOption('cellar'),
      kitchen: getOption('fitted_kitchen'),
      elevator: getOption('elevator'),
      doc: uploadFile(),
    })

    this.options = options
    this.doc = options.doc
  }

  /**
   * Get GeoApify boundary by zip
   */
  async getGeoZip() {
    // prettier-ignore
    const data = [10781,12685,10115,10707,12435,13187,10555,10777,13629,10117,12687,10963,10119,10409,10999,13403,10715,10439,10247,12051,12524,13355,10435,13439,10245,12047,10315,12163,12157,12623,10783,10829,13353,12627,12357,10969,10243,12277,13409,10365,10967,10437,12059,12099,10178,12247,12043,12355,13051,13599,13086,13581,13055,12437,12045,12159,12459,10405,10557,14052,12555,12347,14167,13407,10317,14089,12209,12359,10629,12305,14199,13357,12587,13591,13156,14050,10825,10997,13465,10589,12103,12439,10965,10319,13347,13435,10585,12101,10627,12349,13583,12489,13597,10553,12557,12203,13503,13589,12169,10407,12679,13593,12621,13505,10551,12249,10318,12689,12351,14169,14059,14165,10961,10249,14057,13359,10559,14197,10827,14195,12049,12053,12487,10623,13059,14163,10779,13158,13437,13585,12107,14193,12353,10179,10711,13351,13189,13507,12161,12057,12167,13587,12527,12307,12205,10719,10787,12526,12683,13349,10789,12279,10625,12619,13053,12055,13469,13509,13125,13127,12105,10713,10823,12559,12309,12207,10367,13595,10709,13088,10369,10587,10717,12109,13627,14055,13057,10785,13467,12629,12165,13089,14129]
    const geo = await map(
      data,
      async (zip) => {
        const bbox = await GeoService.getGeoByAddress(`${zip} Berlin, Germany`)
        return { zip, bbox }
      },
      { concurrency: 2 }
    )

    await File.logFile(
      geo.reduce((n, { zip, bbox }) => ({ ...n, [zip]: bbox }), {}),
      'geo.json'
    )
  }

  /**
   *
   */
  async importUsers() {
    const readData = () => {
      let inputStream = fs.createReadStream(`${__dirname}/breeze_users.csv`, 'utf8')
      return new Promise((resolve) => {
        const res = []
        inputStream
          .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
          .on('data', function (row) {
            res.push(row)
          })
          .on('end', function () {
            resolve(res)
          })
      })
    }

    return readData()
  }

  /**
   *
   */
  async createIncomeProofs(income_id) {
    return map(range(1, 4), async (i) => {
      const proof = await Factory.model('App/Models/IncomeProof').make({
        income_id,
        offset: i,
        doc: this.doc,
      })

      return proof.save()
    })
  }

  /**
   *
   */
  async createIncome(member_id, income) {
    const incomeObj = await Factory.model('App/Models/Income').make({
      member_id,
      income,
    })
    await incomeObj.save()
    // Create doc proofs
    await this.createIncomeProofs(incomeObj.id)
  }

  /**
   *
   */
  async createAdult(user_id, income) {
    const member = await Factory.model('App/Models/Member').make({
      user_id,
      child: false,
      doc: this.doc,
    })
    await member.save()

    await this.createIncome(member.id, income)
  }

  /**
   *
   */
  async createChild(user_id) {
    const member = await Factory.model('App/Models/Member').make({
      user_id,
      child: true,
    })
    await member.save()

    return member
  }

  /**
   *
   */
  async createMembers(user_id, budget, type) {
    if (parseInt(type) === 1) {
      let income = Math.ceil(budget * 3.34)
      return Promise.all([this.createAdult(user_id, income)])
    } else if (parseInt(type) === 2) {
      let income = Math.ceil((budget * 3.34) / 2)
      return Promise.all([this.createAdult(user_id, budget), this.createAdult(user_id, income)])
    } else {
      // Family with Kids
      let income = Math.ceil((budget * 3.34) / 2)
      return Promise.all([
        this.createAdult(user_id, income),
        this.createAdult(user_id, income),
        this.createChild(user_id, 0, true),
      ])
    }
  }

  /**
   *
   */
  async createUser(data) {
    const [
      zip,
      area,
      rooms,
      aptType,
      floor,
      houseType,
      budget,
      age,
      smoke,
      rentArrears,
      hhType,
      pets,
      rentStart,
      bath,
      furnished,
      balcony,
      cellar,
      kitchen,
      elevator,
    ] = data
    console.log('|')
    const { lon1, lat1, lon2, lat2 } = get(geoData, zip)
    const ids = this.options
    let options = []
    !!parseInt(bath) && options.push(ids.bath)
    !!parseInt(furnished) && options.push(ids.furnished)
    !!parseInt(balcony) && options.push(ids.balcony)
    !!parseInt(cellar) && options.push(ids.cellar)
    !!parseInt(kitchen) && options.push(ids.kitchen)
    !!parseInt(elevator) && options.push(ids.elevator)

    const user = await Factory.model('App/Models/User').make({
      role: ROLE_USER,
      terms_id: ids.terms_id,
      agreements_id: ids.agreements_id,
    })
    await user.save()
    const tenant = await Factory.model('App/Models/Tenant').make({
      user_id: user.id,
      pets,
      bbox: { lon1, lat1, lon2, lat2 },
      rooms,
      floor,
      space: area,
      options,
      hhType,
    })
    await tenant.save()
    await this.createMembers(user.id, budget, hhType)
  }

  /**
   *
   */
  async createLandlords() {
    const ids = this.options
    const user = await Factory.model('App/Models/User').make({
      role: ROLE_LANDLORD,
      email: 'landlord1@breeze.com',
      terms_id: ids.terms_id,
      agreements_id: ids.agreements_id,
    })

    await user.save()
  }

  /**
   *
   */
  async run() {
    await this.preloadData()
    await this.createLandlords()
    const users = await this.importUsers()
    // Create bunch users
    await map(users, (r) => this.createUser(r), { concurrency: 1 })
  }
}

module.exports = DatabaseSeeder
