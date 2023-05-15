const axios = require('axios')
const moment = require('moment')
const OhneMakler = require('../Classes/OhneMakler')
const crypto = require('crypto')
const ThirdPartyOffer = use('App/Models/ThirdPartyOffer')
const DataStorage = use('DataStorage')
const Database = use('Database')
const File = use('App/Classes/File')
const OpenImmoReader = use('App/Classes/OpenImmoReader')
const Promise = require('bluebird')
const uuid = require('uuid')
const AWS = require('aws-sdk')
const Env = use('Env')
const {
  STATUS_ACTIVE,
  STATUS_EXPIRE,
  THIRD_PARTY_OFFER_SOURCE_OHNE_MAKLER,
  OHNE_MAKLER_DEFAULT_PREFERENCES_FOR_MATCH_SCORING,
  SEND_EMAIL_TO_OHNEMAKLER_CONTENT,
  MATCH_STATUS_KNOCK,
  MATCH_STATUS_NEW,
  THIRD_PARTY_OFFER_PROVIDER_INFORMATION,
  THIRD_PARTY_OFFER_SOURCE_GEWOBAG,
  PETS_NO,
  GEWOBAG_PROPERTIES_TO_PROCESS_PER_PULL,
} = require('../constants')
const QueueService = use('App/Services/QueueService')
const EstateService = use('App/Services/EstateService')
const ThirdPartyOfferInteraction = use('App/Models/ThirdPartyOfferInteraction')
const {
  exceptions: { ALREADY_KNOCKED_ON_THIRD_PARTY, CANNOT_KNOCK_ON_DISLIKED_ESTATE },
} = require('../exceptions')
const HttpException = require('../Exceptions/HttpException')

class ThirdPartyOfferService {
  static generateChecksum(data) {
    return crypto.createHash('md5').update(data, 'utf8').digest('hex')
  }

  static async getOhneMaklerChecksum() {
    return await DataStorage.getItem('ohne-makler-checksum')
  }

  static async setOhneMaklerChecksum(checksum) {
    return await DataStorage.setItem('ohne-makler-checksum', checksum, '', {
      expire: 7 * 24 * 60 * 60,
    })
  }

  static async pullOhneMakler(forced = false) {
    if (!forced) {
      if (
        process.env.PULL_OHNE_MAKLER === undefined ||
        (process.env.PULL_OHNE_MAKLER !== undefined && !+process.env.PULL_OHNE_MAKLER)
      ) {
        console.log('not pulling ohne makler...')
        return
      }
    }
    console.log('pullOnheMaker start!!!!')
    let ohneMaklerData
    try {
      const { data } = await axios.get(process.env.OHNE_MAKLER_API_URL, { timeout: 5000 })
      if (!data) {
        console.log('Error found on pulling ohne makler')
        throw new Error('Error found on pulling ohne makler')
      }
      ohneMaklerData = data
    } catch (e) {
      console.log('Failed to fetch data!!!!')
    }

    try {
      const ohneMaklerChecksum = await ThirdPartyOfferService.getOhneMaklerChecksum()
      const checksum = ThirdPartyOfferService.generateChecksum(JSON.stringify(ohneMaklerData))
      if (checksum !== ohneMaklerChecksum || forced) {
        console.log('updating start !!!!')
        //mark all as expired...
        //1. to expire all estates that are not anymore in the new data including also those
        //that are past expiration date
        //2. to allow for changes on type see OhneMakler.estateCanBeProcessed()
        //there must be some difference between the data... so we can process
        const ohneMakler = new OhneMakler(ohneMaklerData)
        const estates = ohneMakler.process()

        const retainIds = estates.map((estate) => estate.source_id)
        await ThirdPartyOfferService.expireWhenNotOnSourceIds(retainIds)

        let i = 0
        while (i < estates.length) {
          let estate = estates[i]
          try {
            const found = await ThirdPartyOffer.query()
              .where('source', THIRD_PARTY_OFFER_SOURCE_OHNE_MAKLER)
              .where('source_id', estate.source_id)
              .first()
            if (!found) {
              await ThirdPartyOffer.createItem(estate)
            } else {
              await found.updateItem(estate)
            }
          } catch (e) {
            console.log(`validation: ${estate.source_id} ${e.message}`)
          }
          i++
        }
        console.log('End of updating!!!!')
        await ThirdPartyOfferService.setOhneMaklerChecksum(checksum)
        require('./QueueService').createThirdPartyMatchesByEstate()
      }
    } catch (e) {
      console.log('pullOhneMakler error', e.message)
    }
  }

  static async moveFileFromFTPtoS3Public(imageInfo, s3) {
    const bucketName = 'breeze-ftp-files'
    const ext = imageInfo.file_name.split('.').pop()
    const filename = `${uuid.v4()}.${ext}`
    const dir = moment().format('YYYYMM')
    const filePathName = `${dir}/${filename}`
    const params = {
      Bucket: process.env.S3_PUBLIC_BUCKET,
      CopySource: bucketName + '/' + imageInfo.file_name,
      Key: filePathName,
      ACL: 'public-read',
    }
    try {
      await s3.copyObject(params).promise()
      return File.getPublicUrl(filePathName)
    } catch (err) {
      console.log('err', err)
      return false
    }
  }

  static async getFilesAndLastModified() {
    let gewobagFiles = await ThirdPartyOffer.query()
      .select(Database.raw(`CONCAT("source_id", '.xml') as key`))
      .select('ftp_last_update')
      .where('source', THIRD_PARTY_OFFER_SOURCE_GEWOBAG)
      .fetch()
    return await gewobagFiles.toJSON().reduce(
      (files, file) => ({
        ...files,
        [file.key]: moment(new Date(file.ftp_last_update)).utc().format(),
      }),
      {}
    )
  }

  static async pullGewobag() {
    console.log('pulling gewobag...')
    const filesWorked = await ThirdPartyOfferService.getFilesAndLastModified()
    const { xml, filesLastModified } = await File.getGewobagUploadedContent(filesWorked)
    const reader = new OpenImmoReader()
    const properties = await reader.processXml(xml)

    AWS.config.update({
      accessKeyId: Env.get('S3_KEY'),
      secretAccessKey: Env.get('S3_SECRET'),
      region: Env.get('S3_REGION'),
    })
    const s3 = new AWS.S3()

    await Promise.map(
      properties.slice(0, GEWOBAG_PROPERTIES_TO_PROCESS_PER_PULL),
      async (estate) => {
        let sourceInformation = THIRD_PARTY_OFFER_PROVIDER_INFORMATION['gewobag']
        sourceInformation.logo = sourceInformation.logo.replace(/APP_URL/, process.env.APP_URL)
        //FIXME: create a map for this:
        let newEstate = {
          source: THIRD_PARTY_OFFER_SOURCE_GEWOBAG,
          source_information: JSON.stringify(sourceInformation),
          source_id: estate.source_id,
          country: estate.country,
          house_number: estate.house_number,
          street: estate.street,
          city: estate.city,
          address: `${estate.street} ${estate.house_number}, ${estate.zip} ${estate.city}, ${estate.country}`,
          contact: JSON.stringify({ email: estate.contact }),
          floor: Number(estate.floor),
          number_floors: Number(estate.number_floors),
          bathrooms: estate.bathrooms_number,
          rooms_number: Number(estate.rooms_number),
          area: Math.round(estate.area),
          construction_year: Number(moment(new Date(estate.construction_year)).format('YYYY')),
          energy_efficiency_class: estate.energy_pass.energy_efficiency_category,
          vacant_date: moment(new Date(estate.vacant_date)).format(),
          additional_costs: Number(estate.additional_costs),
          net_rent: Number(estate.net_rent),
          property_type: estate.property_type,
          heating_costs: Number(estate.heating_costs),
          extra_costs: +estate.heating_costs + +estate.additional_costs,
          building_status: estate.building_status,
          house_type: estate.house_type,
          apt_type: estate.apt_type,
          heating_type: estate.heating_type,
          firing: estate.firing,
          zip: estate.zip,
          status: estate.status,
          full_address: estate.full_address,
          wbs: estate.wbs,
          property_id: estate.property_id,
          ftp_last_update: filesLastModified[`${estate.source_id}.xml`],
        }
        //amenities:
        //parse this to boolean... openimmo standard for pets is boolean
        estate.pets_allowed = estate.pets_allowed !== PETS_NO
        const amenityKeys = {
          balconies_number: {
            type: 'numeric',
            value: 'Balkon',
          },
          barrier_free: {
            type: 'boolean',
            value: 'Barrierefrei',
          },
          basement: {
            type: 'boolean',
            value: 'Keller',
          },
          chimney: {
            type: 'boolean',
            value: 'Kamin',
          },
          garden: {
            type: 'boolean',
            value: 'Garten',
          },
          guest_toilet: {
            type: 'boolean',
            value: 'Gäste-WC',
          },
          pets_allowed: {
            type: 'boolean',
            value: 'Haustiere',
          },
          sauna: {
            type: 'boolean',
            value: 'Sauna',
          },
          swimmingpool: {
            type: 'boolean',
            value: 'Pool / Schwimmbad',
          },
          terraces_number: {
            type: 'numeric',
            value: 'Terrasse',
          },
          wintergarten: {
            type: 'boolean',
            value: 'Wintergarten',
          },
        }
        let amenities = []
        for (const [key, value] of Object.entries(amenityKeys)) {
          if (value.type === 'numeric' && estate[key] > 0) {
            amenities = [...amenities, value.value]
          } else if (value.type === 'boolean' && estate[key] === true) {
            amenities = [...amenities, value.value]
          }
        }
        newEstate.amenities = amenities
        let images = []
        for (let i = 0; i < estate.images.length; i++) {
          const imageUrl = await ThirdPartyOfferService.moveFileFromFTPtoS3Public(
            estate.images[i],
            s3
          )
          if (imageUrl) {
            images = [
              ...images,
              {
                picture: {
                  picture_url: imageUrl,
                  picture_title: '',
                },
              },
            ]
          }
        }
        newEstate.images = JSON.stringify(images)
        const estateFound = await ThirdPartyOffer.query()
          .where('source', THIRD_PARTY_OFFER_SOURCE_GEWOBAG)
          .where('source_id', estate.source_id)
          .first()
        try {
          let result
          if (estateFound) {
            await estateFound.updateItem(newEstate)
            if (estateFound.address !== newEstate.address) {
              require('./QueueService').getThirdPartyCoords(estateFound.id)
            }
          } else {
            result = await ThirdPartyOffer.createItem(newEstate)
            require('./QueueService').getThirdPartyCoords(result.id)
          }
        } catch (e) {
          console.log(e)
          console.log('error', newEstate)
        }
      }
    )
    console.log('finished pulling gewobag...')
    return true
  }

  static async expireWhenNotOnSourceIds(sourceIds) {
    await ThirdPartyOffer.query()
      .whereNotIn('source_id', sourceIds)
      .where('source', THIRD_PARTY_OFFER_SOURCE_OHNE_MAKLER)
      .update({ status: STATUS_EXPIRE })
  }

  static async getEstates(userId, limit = 10, exclude) {
    const MatchService = require('./MatchService')
    const tenant = await MatchService.getProspectForScoringQuery()
      .where({ 'tenants.user_id': userId })
      .first()
    let estates = await ThirdPartyOfferService.searchEstatesQuery(userId, null, exclude).fetch()
    estates = estates.toJSON()
    estates = await Promise.all(
      estates.map(async (estate) => {
        estate = { ...estate, ...OHNE_MAKLER_DEFAULT_PREFERENCES_FOR_MATCH_SCORING }
        const score = await MatchService.calculateMatchPercent(tenant, estate)
        estate.match = score
        estate.isoline = await EstateService.getIsolines(estate)
        estate['__meta__'] = {
          knocked_count: estate.knocked_count,
          like_count: estate.like_count,
          dislike_count: estate.dislike_count,
        }
        estate.rooms = null
        return estate
      })
    )
    estates.sort((a, b) => (+a.match > +b.match ? -1 : 1))
    estates = estates.slice(0, limit)
    return estates
  }

  static async searchTenantEstatesByPoint(point_id) {
    return await Database.select(Database.raw(`FALSE as inside`))
      .select(
        '_e.id',
        '_e.source_id',
        '_e.source',
        '_e.coord_raw as coord',
        '_e.house_number',
        '_e.street',
        '_e.city',
        '_e.country',
        '_e.address'
      )
      .from({ _e: 'third_party_offers' })
      .innerJoin({ _p: 'points' }, function () {
        this.on('_p.id', point_id)
      })
      .where('_e.status', STATUS_ACTIVE)
      .where('_e.status', STATUS_ACTIVE)
      .whereRaw(Database.raw(`_ST_Intersects(_p.zone::geometry, _e.coord::geometry)`))
  }

  static searchTenantEstatesQuery(tenant) {
    return Database.select(Database.raw(`FALSE as inside`))
      .select('_e.*')
      .select(Database.raw(`NULL as rooms`))
      .from({ _t: 'tenants' })
      .innerJoin({ _p: 'points' }, '_p.id', '_t.point_id')
      .crossJoin({ _e: 'third_party_offers' })
      .leftJoin(Database.raw(`third_party_offer_interactions tpoi`), function () {
        this.on('tpoi.third_party_offer_id', '_e.id').on('tpoi.user_id', tenant.user_id)
      })
      .where('_e.status', STATUS_ACTIVE)
      .whereNull('tpoi.id')
      .where('_t.user_id', tenant.user_id)
      .whereRaw(Database.raw(`_ST_Intersects(_p.zone::geometry, _e.coord::geometry)`))
  }

  static getActiveMatchesQuery(userId) {
    return ThirdPartyOffer.query()
      .innerJoin({ _m: 'third_party_matches' }, function () {
        this.on('_m.estate_id', 'third_party_offers.id')
          .onIn('_m.user_id', [userId])
          .onIn('_m.status', MATCH_STATUS_NEW)
      })
      .leftJoin(Database.raw(`third_party_offer_interactions tpoi`), function () {
        this.on('tpoi.third_party_offer_id', 'third_party_offers.id').on('tpoi.user_id', userId)
      })
      .where('third_party_offers.status', STATUS_ACTIVE)
      .whereNull('tpoi.id')
  }

  static async getNewMatchCount(userId) {
    return (await this.getActiveMatchesQuery(userId).count('*'))?.[0]?.count || 0
  }

  static async getMatches(userId, from = 0, limit = 20) {
    return (
      await this.getActiveMatchesQuery(userId)
        .select('third_party_offers.*')
        .select('third_party_offers.status as estate_status')
        .select(Database.raw(`_m.percent AS match`))
        .select(Database.raw(`NULL as rooms`))
        .withCount('likes')
        .withCount('dislikes')
        .withCount('knocks')
        .orderBy('_m.percent', 'DESC')
        .offset(from)
        .limit(limit)
        .fetch()
    ).toJSON()
  }

  static async getEstate(userId, id) {
    /* estate coord intersects with polygon of tenant */
    return await ThirdPartyOffer.query()
      .select('third_party_offers.*')
      .select('third_party_offers.status as estate_status')
      .select(Database.raw(`COALESCE(_m.percent, 0) as match`))
      .select(Database.raw(`NULL as rooms`))
      .withCount('likes')
      .withCount('dislikes')
      .withCount('knocks')
      .with('point')
      .leftJoin({ _m: 'third_party_matches' }, function () {
        this.on('_m.estate_id', 'third_party_offers.id').onIn('_m.user_id', [userId])
      })
      .leftJoin(Database.raw(`third_party_offer_interactions tpoi`), function () {
        this.on('tpoi.third_party_offer_id', 'third_party_offers.id').on('tpoi.user_id', userId)
      })
      //remove the check on intersecting with polygon because user may have changed
      //his location and he won't be intersected here...
      .where('third_party_offers.id', id)
      .first()
  }

  static async postAction(userId, id, action, comment = '', message = '') {
    const found = await ThirdPartyOfferInteraction.query()
      .where('third_party_offer_id', id)
      .where('user_id', userId)
      .first()
    let value
    switch (action) {
      case 'like':
      case 'dislike':
        value = { third_party_offer_id: id, user_id: userId, liked: action === 'like' }
        break
      case 'comment':
        value = { third_party_offer_id: id, user_id: userId, comment }
        break
      case 'knock':
        if (found?.knocked) {
          throw new HttpException(ALREADY_KNOCKED_ON_THIRD_PARTY, 400)
        }
        if (found?.like === false) {
          throw new HttpException(CANNOT_KNOCK_ON_DISLIKED_ESTATE, 400)
        }
        value = {
          third_party_offer_id: id,
          user_id: userId,
          knocked: true,
          liked: null,
          knocked_at: moment().utc().format(),
        }
        const estate = await ThirdPartyOffer.query().where('id', id).first()
        if (estate.source === THIRD_PARTY_OFFER_SOURCE_OHNE_MAKLER) {
          QueueService.contactOhneMakler({
            third_party_offer_id: id,
            userId,
            message: SEND_EMAIL_TO_OHNEMAKLER_CONTENT,
          })
        } else if (estate.source === THIRD_PARTY_OFFER_SOURCE_GEWOBAG) {
          QueueService.contactGewobag({
            third_party_offer_id: id,
            userId,
          })
        }
        break
      case 'cancel knock':
        value = {
          third_party_offer_id: id,
          user_id: userId,
          knocked: false,
          liked: false,
        }
        break
    }
    if (!found) {
      await ThirdPartyOfferInteraction.createItem(value)
    } else {
      await found.updateItem(value)
    }
    return true
  }

  static async getKnockedCount(userId) {
    return await ThirdPartyOfferInteraction.query()
      .where('user_id', userId)
      .where('knocked', true)
      .count()
  }

  static async getLikesCount(userId) {
    return await ThirdPartyOfferInteraction.query()
      .where('user_id', userId)
      .where('liked', true)
      .where(Database.raw(`knocked is not true`))
      .count()
  }

  static async getDisLikesCount(userId) {
    return await ThirdPartyOfferInteraction.query()
      .where('user_id', userId)
      .where('liked', false)
      .where(Database.raw(`knocked is not true`))
      .count()
  }

  static async getTenantEstatesWithFilter(userId, filter) {
    const MatchService = require('./MatchService')
    const { like, dislike, knock } = filter
    console.log('getTenantEstatesWithFilter=', knock)
    let query = ThirdPartyOffer.query()
      .select('third_party_offers.*')
      .select(
        'third_party_offers.status as estate_status',
        'third_party_offers.*',
        'tpoi.knocked_at'
      )

    let field
    let value
    if (like) {
      field = 'liked'
      value = true
      query
        .select(Database.raw(`tpoi.updated_at as action_at`))
        .where(Database.raw(`knocked is not true`))
    } else if (dislike) {
      field = 'liked'
      value = false
      query
        .select(Database.raw(`tpoi.updated_at as action_at`))
        .where(Database.raw(`knocked is not true`))
    } else if (knock) {
      field = 'knocked'
      value = true
      query
        .select(Database.raw(`tpoi.knocked_at as action_at`))
        .select(Database.raw(`${MATCH_STATUS_KNOCK} as status`))
    } else {
      return []
    }
    query
      .innerJoin(Database.raw(`third_party_offer_interactions as tpoi`), function () {
        this.on('third_party_offers.id', 'tpoi.third_party_offer_id')
          .on(Database.raw(`"${field}" = ${value}`))
          .on(Database.raw(`"user_id" = ${userId}`))
      })
      .orderBy('tpoi.updated_at', 'desc')
    const ret = await query.fetch()
    if (ret) {
      const tenant = await MatchService.getProspectForScoringQuery()
        .where({ 'tenants.user_id': userId })
        .first()
      let estates = ret.toJSON()
      estates = await Promise.all(
        estates.map(async (estate) => {
          estate = { ...estate, ...OHNE_MAKLER_DEFAULT_PREFERENCES_FOR_MATCH_SCORING }
          const score = await MatchService.calculateMatchPercent(tenant, estate)
          estate.match = score
          estate.rooms = null
          return estate
        })
      )
      return estates
    }
    return []
  }
}

module.exports = ThirdPartyOfferService
