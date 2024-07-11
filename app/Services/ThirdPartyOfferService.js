const moment = require('moment')
const OhneMakler = require('../Classes/OhneMakler')
const crypto = require('crypto')
const ThirdPartyOffer = use('App/Models/ThirdPartyOffer')
const DataStorage = use('DataStorage')
const Database = use('Database')
const File = use('App/Classes/File')
const Logger = use('Logger')
const OpenImmoReader = use('App/Classes/OpenImmoReader')
const Promise = require('bluebird')
const uuid = require('uuid')
const AWS = require('aws-sdk')
const Env = use('Env')
const l = use('Localize')
const Drive = use('Drive')
const axios = require('axios')
const {
  DATE_FORMAT,
  GEWOBAG_ACCOUNT_USER_ID,
  GEWOBAG_FTP_BUCKET,
  GEWOBAG_PROPERTIES_TO_PROCESS_PER_PULL,
  LETTING_STATUS_STANDARD,
  LETTING_TYPE_LET,
  MATCH_STATUS_KNOCK,
  MATCH_STATUS_NEW,
  OHNE_MAKLER_DEFAULT_PREFERENCES_FOR_MATCH_SCORING,
  PETS_NO,
  PUBLISH_STATUS_APPROVED_BY_ADMIN,
  PUBLISH_STATUS_INIT,
  SEND_EMAIL_TO_OHNEMAKLER_CONTENT,
  STATUS_ACTIVE,
  STATUS_EXPIRE,
  STATUS_DELETE,
  THIRD_PARTY_OFFER_PROVIDER_INFORMATION,
  THIRD_PARTY_OFFER_SOURCE_GEWOBAG,
  THIRD_PARTY_OFFER_SOURCE_OHNE_MAKLER,
  FILE_TYPE
} = require('../constants')
const QueueService = use('App/Services/QueueService')
const EstateService = use('App/Services/EstateService')
const ThirdPartyOfferInteraction = use('App/Models/ThirdPartyOfferInteraction')
const Estate = use('App/Models/Estate')
const Amenity = use('App/Models/Amenity')
const {
  exceptions: { MARKET_PLACE_CONTACT_EXIST, CANNOT_KNOCK_ON_DISLIKED_ESTATE }
} = require('../exceptions')
const HttpException = require('../Exceptions/HttpException')
const { groupBy } = require('lodash')

class ThirdPartyOfferService {
  static generateChecksum(data) {
    return crypto.createHash('md5').update(data, 'utf8').digest('hex')
  }

  static async getOhneMaklerChecksum() {
    return await DataStorage.getItem('ohne-makler-checksum')
  }

  static async setOhneMaklerChecksum(checksum) {
    return await DataStorage.setItem('ohne-makler-checksum', checksum, '', {
      expire: 7 * 24 * 60 * 60
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
        // mark all as expired...
        // 1. to expire all estates that are not anymore in the new data including also those
        // that are past expiration date
        // 2. to allow for changes on type see OhneMakler.estateCanBeProcessed()
        // there must be some difference between the data... so we can process
        const ohneMakler = new OhneMakler(ohneMaklerData)
        const estates = ohneMakler.process()

        const retainIds = estates.map((estate) => estate.source_id)
        await ThirdPartyOfferService.expireWhenNotOnSourceIds(retainIds)

        let i = 0
        while (i < estates.length) {
          const estate = estates[i]
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
      ACL: 'public-read'
    }
    try {
      await s3.copyObject(params).promise()
      return {
        url: File.getPublicUrl(filePathName),
        filePathName
      }
    } catch (err) {
      console.log('err', err)
      return false
    }
  }

  static async getFilesAndLastModified() {
    const gewobagFiles = await ThirdPartyOffer.query()
      .select(Database.raw(`CONCAT("source_id", '.xml') as key`))
      .select('ftp_last_update')
      .where('source', THIRD_PARTY_OFFER_SOURCE_GEWOBAG)
      .fetch()
    return await gewobagFiles.toJSON().reduce(
      (files, file) => ({
        ...files,
        [file.key]: moment(new Date(file.ftp_last_update)).utc().format()
      }),
      {}
    )
  }

  static async getAllObjectsInBucket(bucketName, s3) {
    const params = {
      Bucket: bucketName
    }
    let objects = []
    try {
      let isTruncated = true
      let marker
      while (isTruncated) {
        if (marker) params.ContinuationToken = marker

        const response = await s3.listObjectsV2(params).promise()
        response.Contents.forEach((item) => {
          objects = [...objects, item]
        })
        isTruncated = response.IsTruncated
        marker = response.NextContinuationToken
      }
      return objects
    } catch (err) {
      console.error('Error listing objects:', err)
    }
  }

  static async pruneGewobag() {
    try {
      AWS.config.update({
        accessKeyId: Env.get('S3_KEY'),
        secretAccessKey: Env.get('S3_SECRET'),
        region: Env.get('S3_REGION')
      })
      const s3 = new AWS.S3()
      const objects = await ThirdPartyOfferService.getAllObjectsInBucket(GEWOBAG_FTP_BUCKET, s3)
      const d = new Date(new Date().setMonth(new Date().getMonth() - 2))
      const keys = objects
        .map((content) => {
          if (content.LastModified < d && content.Key.match(/\.xml$/)) {
            return content.Key
          }
          return null
        })
        .filter((key) => key)

      await Promise.map(keys, async (key) => {
        const params = {
          Bucket: GEWOBAG_FTP_BUCKET,
          Key: key
        }
        const data = await s3.deleteObject(params).promise()
        console.log(`deleted ${key}`, data)
      })
      process.exit()
    } catch (err) {
      console.log(err)
    }
  }

  static async pullGewobagNew() {
    try {
      AWS.config.update({
        accessKeyId: Env.get('S3_KEY'),
        secretAccessKey: Env.get('S3_SECRET'),
        region: Env.get('S3_REGION')
      })
      const s3 = new AWS.S3()
      const objects = await ThirdPartyOfferService.getAllObjectsInBucket(GEWOBAG_FTP_BUCKET, s3)
      if (objects.length < 1) {
        process.exit()
      }
      const twoMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 2))
      const keys = objects
        .map((content) => {
          if (content.LastModified > new Date(twoMonthsAgo) && content.Key.match(/\.xml$/)) {
            return content.Key
          }
          return null
        })
        .filter((key) => key)
      let xmls = []
      await Promise.map(keys, async (key) => {
        const xml = await Drive.disk('breeze-ftp-files').get(key)
        xmls = [...xmls, xml]
      })
      const reader = new OpenImmoReader()
      const properties = await reader.processXml(xmls)

      await Promise.map(properties, async (estate) => {
        if (estate.action === 'DELETE') {
          console.log(`Deleting: ${estate.property_id}`)
          await Estate.query()
            .where('user_id', GEWOBAG_ACCOUNT_USER_ID)
            .where('property_id', estate.property_id)
            .update({ status: STATUS_DELETE })
        } else {
          const newEstate = {
            additional_costs: Number(estate.additional_costs) || 0,
            address: `${estate.street} ${estate.house_number}, ${estate.zip} ${estate.city}, ${estate.country}`,
            apt_type: estate.apt_type,
            area: Number(estate.area) || 0,
            bathrooms: Number(estate.bathrooms_number) || 0,
            building_status: estate.building_status,
            city: estate.city,
            construction_year: Number(moment(new Date(estate.construction_year)).format('YYYY')),
            // contact: JSON.stringify({ email: estate.contact }),
            country: estate.country,
            energy_efficiency_class: estate.energy_pass.energy_efficiency_category,
            extra_costs: Number(+estate.heating_costs + +estate.additional_costs) || 0,
            firing: estate.firing,
            floor: Number(estate.floor) || 0,
            full_address: estate.full_address,
            heating_costs: Number(estate.heating_costs) || 0,
            heating_type: estate.heating_type,
            house_number: estate.house_number,
            house_type: estate.house_type,
            letting_status: LETTING_STATUS_STANDARD,
            letting_type: LETTING_TYPE_LET,
            net_rent: Number(estate.net_rent) || 0,
            number_floors: Number(estate.number_floors) || 0,
            property_id: estate.property_id,
            property_type: estate.property_type,
            publish_status:
              estate.status === STATUS_ACTIVE
                ? PUBLISH_STATUS_APPROVED_BY_ADMIN
                : PUBLISH_STATUS_INIT,
            rooms_number: Number(estate.rooms_number) || 0,
            source: THIRD_PARTY_OFFER_SOURCE_GEWOBAG,
            status: estate.status,
            street: estate.street,
            vacant_date: estate.vacant_date
              ? moment(new Date(estate.vacant_date)).format(DATE_FORMAT)
              : null,
            wbs: estate.wbs,
            zip: estate.zip
          }
          newEstate.user_id = GEWOBAG_ACCOUNT_USER_ID

          // amenities
          const amenityKeys = {
            balconies_number: {
              type: 'numeric',
              value: 'Balkon'
            },
            barrier_free: {
              type: 'boolean',
              value: 'Barrierefrei'
            },
            basement: {
              type: 'boolean',
              value: 'Keller'
            },
            chimney: {
              type: 'boolean',
              value: 'Kamin'
            },
            garden: {
              type: 'boolean',
              value: 'Garten'
            },
            guest_toilet: {
              type: 'boolean',
              value: 'Gäste-WC'
            },
            pets_allowed: {
              type: 'boolean',
              value: l.get('web.letting.property.import.Pets_Allowed.message', 'de')
            },
            sauna: {
              type: 'boolean',
              value: 'Sauna'
            },
            swimmingpool: {
              type: 'boolean',
              value: 'Pool / Schwimmbad'
            },
            terraces_number: {
              type: 'numeric',
              value: 'Terrasse'
            },
            wintergarten: {
              type: 'boolean',
              value: 'Wintergarten'
            }
          }
          let amenities = []
          for (const [key, value] of Object.entries(amenityKeys)) {
            if (value.type === 'numeric' && estate[key] > 0) {
              amenities = [...amenities, value.value]
            } else if (value.type === 'boolean' && estate[key] === true) {
              amenities = [...amenities, value.value]
            }
          }
          let files = []
          const estateImages = estate?.images || []
          for (let i = 0; i < estateImages.length; i++) {
            const fileUploaded = await ThirdPartyOfferService.isGewobagFileUploaded(
              newEstate.property_id,
              estateImages[i].file_name
            )
            if (!fileUploaded) {
              const imageUrl = await ThirdPartyOfferService.moveFileFromFTPtoS3Public(
                estateImages[i],
                s3
              )
              if (estateImages[i].type === FILE_TYPE.COVER) {
                newEstate.cover = imageUrl.url
              } else {
                files = [
                  ...files,
                  {
                    url: imageUrl.filePathName,
                    filename: estateImages[i].file_name,
                    type: estateImages[i].type,
                    order: i
                  }
                ]
              }
            }
          }

          const existingEstate = await Estate.query()
            .where('user_id', GEWOBAG_ACCOUNT_USER_ID)
            .where('property_id', newEstate.property_id)
            .first()
          const percent = EstateService.calculatePercent(newEstate)
          // fix construction year. It is date in the db
          newEstate.construction_year = `${newEstate.construction_year}-01-01`
          newEstate.percent = percent
          if (existingEstate) {
            console.log('Estate already existed...')
            await existingEstate.updateItem(newEstate)
            const { amenitiesToBeAdded, amenitiesInDbToBeDeleted, length } =
              await this.getDifferenceOnAmenities(
                amenities,
                GEWOBAG_ACCOUNT_USER_ID,
                existingEstate.property_id
              )
            if (amenitiesInDbToBeDeleted.length) {
              await Amenity.query()
                .update({ status: STATUS_DELETE })
                .where('estate_id', existingEstate.id)
                .whereIn('amenity', amenitiesInDbToBeDeleted)
            }
            if (amenitiesToBeAdded.length) {
              await Promise.map(amenitiesToBeAdded, async (amenity, index) => {
                await Amenity.createItem({
                  status: STATUS_ACTIVE,
                  amenity,
                  type: 'custom_amenity',
                  sequence_order: index + length,
                  added_by: GEWOBAG_ACCOUNT_USER_ID,
                  estate_id: existingEstate.id,
                  location: 'apt'
                })
              })
            }
            // update estate
          } else {
            newEstate.percent = percent
            const estateData = await Estate.createItem(newEstate)
            console.log('creating estate', { estateData })
            process.exit()
          }
        }
      })
    } catch (err) {
      console.log(err)
    }
    process.exit()
  }

  static async getDifferenceOnAmenities(newAmenities, userId, propertyId) {
    const amenities = await Amenity.query()
      .leftJoin('estates', 'amenities.estate_id', 'estates.id')
      .where('estates.property_id', propertyId)
      .where('estates.user_id', userId)
      .whereNot('amenities.status', STATUS_DELETE)
      .fetch()
    const amenityNames = (amenities.toJSON() || []).map((amenity) => amenity.amenity)
    const length = (amenities.toJSON() || []).length
    const amenitiesToBeAdded = newAmenities.filter((x) => !amenityNames.includes(x))
    //
    const amenitiesInDbToBeDeleted = amenityNames.filter((x) => !newAmenities.includes(x))
    return { amenitiesToBeAdded, amenitiesInDbToBeDeleted, length }
  }

  static async isGewobagFileUploaded(propertyId, filename) {
    const fileUploaded = await Estate.query()
      .innerJoin('files', 'files.estate_id', 'estates.id')
      .where('estates.user_id', GEWOBAG_ACCOUNT_USER_ID)
      .where('estates.property_id', propertyId)
      .where('files.file_name', filename)
      .first()
    if (fileUploaded) {
      return fileUploaded
    }
    return false
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
      region: Env.get('S3_REGION')
    })
    const s3 = new AWS.S3()
    await Promise.map(
      properties.slice(0, GEWOBAG_PROPERTIES_TO_PROCESS_PER_PULL),
      async (estate) => {
        const sourceInformation = THIRD_PARTY_OFFER_PROVIDER_INFORMATION.gewobag
        sourceInformation.logo = sourceInformation.logo.replace(/APP_URL/, process.env.APP_URL)
        // FIXME: create a map for this:
        const newEstate = {
          additional_costs: Number(estate.additional_costs) || 0,
          address: `${estate.street} ${estate.house_number}, ${estate.zip} ${estate.city}, ${estate.country}`,
          apt_type: estate.apt_type,
          area: Number(estate.area) || 0,
          bathrooms: Number(estate.bathrooms_number) || 0,
          building_status: estate.building_status,
          city: estate.city,
          construction_year: Number(moment(new Date(estate.construction_year)).format('YYYY')),
          contact: JSON.stringify({ email: estate.contact }),
          country: estate.country,
          energy_efficiency_class: estate.energy_pass.energy_efficiency_category,
          extra_costs: Number(+estate.heating_costs + +estate.additional_costs) || 0,
          firing: estate.firing,
          floor: Number(estate.floor) || 0,
          ftp_last_update: estate.source_id ? filesLastModified?.[`${estate.source_id}.xml`] : '',
          full_address: estate.full_address,
          heating_costs: Number(estate.heating_costs) || 0,
          heating_type: estate.heating_type,
          house_number: estate.house_number,
          house_type: estate.house_type,
          net_rent: Number(estate.net_rent) || 0,
          number_floors: Number(estate.number_floors) || 0,
          property_id: estate.property_id,
          property_type: estate.property_type,
          rooms_number: Number(estate.rooms_number) || 0,
          source_id: estate.source_id,
          source_information: JSON.stringify(sourceInformation),
          source: THIRD_PARTY_OFFER_SOURCE_GEWOBAG,
          status: estate.status,
          street: estate.street,
          vacant_date: estate.vacant_date
            ? moment(new Date(estate.vacant_date)).format(DATE_FORMAT)
            : null,
          wbs: estate.wbs,
          zip: estate.zip
        }
        // amenities:
        // parse this to boolean... openimmo standard for pets is boolean
        if (estate.pets_allowed !== undefined) {
          estate.pets_allowed = estate.pets_allowed !== PETS_NO
        }

        const amenityKeys = {
          balconies_number: {
            type: 'numeric',
            value: 'Balkon'
          },
          barrier_free: {
            type: 'boolean',
            value: 'Barrierefrei'
          },
          basement: {
            type: 'boolean',
            value: 'Keller'
          },
          chimney: {
            type: 'boolean',
            value: 'Kamin'
          },
          garden: {
            type: 'boolean',
            value: 'Garten'
          },
          guest_toilet: {
            type: 'boolean',
            value: 'Gäste-WC'
          },
          pets_allowed: {
            type: 'boolean',
            value: l.get('web.letting.property.import.Pets_Allowed.message', 'de')
          },
          sauna: {
            type: 'boolean',
            value: 'Sauna'
          },
          swimmingpool: {
            type: 'boolean',
            value: 'Pool / Schwimmbad'
          },
          terraces_number: {
            type: 'numeric',
            value: 'Terrasse'
          },
          wintergarten: {
            type: 'boolean',
            value: 'Wintergarten'
          }
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
        const estateImages = estate?.images || []
        for (let i = 0; i < estateImages.length; i++) {
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
                  picture_title: ''
                }
              }
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
    const options = await require('../Services/OptionService').getOptions()
    const hashOptions = groupBy(options, 'title')
    const OhneMakler = require('../Classes/OhneMakler')
    tenant.incomes = await require('./MemberService').getIncomes(userId)
    estates = await Promise.all(
      estates.map(async (estate) => {
        const amenities = OhneMakler.getOptionIds(estate.amenities, hashOptions)
        estate = {
          ...estate,
          options: amenities,
          ...OHNE_MAKLER_DEFAULT_PREFERENCES_FOR_MATCH_SCORING
        }
        const { prospect_score } = await MatchService.calculateMatchPercent(tenant, estate)
        estate.match = prospect_score
        estate.isoline = await EstateService.getIsolines(estate)
        estate.__meta__ = {
          knocked_count: estate.knocked_count,
          like_count: estate.like_count,
          dislike_count: estate.dislike_count
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
        '_e.zip',
        '_e.address',
        '_e.floor',
        '_e.rooms_number',
        '_e.number_floors',
        '_e.property_id',
        '_e.area',
        '_e.net_rent',
        '_e.extra_costs',
        '_e.available_end_at',
        Database.raw(`images->0->'picture'->'picture_url' as cover`)
      )
      .from({ _e: 'third_party_offers' })
      .innerJoin({ _p: 'points' }, function () {
        this.on('_p.id', point_id)
      })
      .where('_e.status', STATUS_ACTIVE)
      .where('_e.status', STATUS_ACTIVE)
      .whereRaw(Database.raw(`_ST_Intersects(_p.zone::geometry, _e.coord::geometry)`))
  }

  static async searchTenantEstatesQuery(tenant) {
    Logger.info(`\n----start ThirdPartyOfferService--- ${tenant.user_id}`)
    const estates = await Database.select(Database.raw(`FALSE as inside`))
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

    const filteredEstates = await EstateService.filterEstates({
      tenant,
      estates,
      inside_property: false
    })

    const categoryCounts = EstateService.calculateCategoryCounts(filteredEstates, tenant)

    return {
      estates: filteredEstates,
      categoryCounts
    }
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
        .select(Database.raw(`_m.prospect_score AS match`))
        .select(Database.raw(`NULL as rooms`))
        .withCount('likes')
        .withCount('dislikes')
        .withCount('knocks')
        .orderBy('_m.prospect_score', 'DESC')
        .offset(from)
        .limit(limit)
        .fetch()
    ).toJSON()
  }

  static async getEstate({ userId, id }) {
    console.log('getEstate here=', userId)
    /* estate coord intersects with polygon of tenant */
    const query = ThirdPartyOffer.query()
      .select('third_party_offers.*')
      .select('third_party_offers.status as estate_status')
      .select(Database.raw(`NULL as rooms`))
      .with('point')

    if (userId) {
      query
        .select(Database.raw(`COALESCE(_m.prospect_score, 0) as match`))
        .withCount('likes')
        .withCount('dislikes')
        .withCount('knocks')
        .leftJoin({ _m: 'third_party_matches' }, function () {
          this.on('_m.estate_id', 'third_party_offers.id').onIn('_m.user_id', [userId])
        })
        .leftJoin(Database.raw(`third_party_offer_interactions tpoi`), function () {
          this.on('tpoi.third_party_offer_id', 'third_party_offers.id').on('tpoi.user_id', userId)
        })
      // remove the check on intersecting with polygon because user may have changed
      // his location and he won't be intersected here...
    }

    return await query.where('third_party_offers.id', id).first()
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
          throw new HttpException(MARKET_PLACE_CONTACT_EXIST, 400)
        }
        if (found?.like === false) {
          throw new HttpException(CANNOT_KNOCK_ON_DISLIKED_ESTATE, 400)
        }
        value = {
          third_party_offer_id: id,
          user_id: userId,
          knocked: true,
          liked: null,
          knocked_at: moment().utc().format()
        }
        const estate = await ThirdPartyOffer.query().where('id', id).first()
        if (estate.source === THIRD_PARTY_OFFER_SOURCE_OHNE_MAKLER) {
          QueueService.contactOhneMakler({
            third_party_offer_id: id,
            userId,
            message: SEND_EMAIL_TO_OHNEMAKLER_CONTENT
          })
        } else if (estate.source === THIRD_PARTY_OFFER_SOURCE_GEWOBAG) {
          QueueService.contactGewobag({
            third_party_offer_id: id,
            userId
          })
        }
        break
      case 'cancel knock':
        value = {
          third_party_offer_id: id,
          user_id: userId,
          knocked: false,
          liked: false
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

    const query = ThirdPartyOffer.query()
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

      tenant.incomes = await require('./MemberService').getIncomes(userId)
      let estates = ret.toJSON()
      const options = await require('../Services/OptionService').getOptions()
      const hashOptions = groupBy(options, 'title')
      const OhneMakler = require('../Classes/OhneMakler')
      estates = await Promise.all(
        estates.map(async (estate) => {
          const amenities = OhneMakler.getOptionIds(estate.amenities, hashOptions)
          estate = {
            ...estate,
            options: amenities,
            ...OHNE_MAKLER_DEFAULT_PREFERENCES_FOR_MATCH_SCORING
          }
          const { prospect_score } = await MatchService.calculateMatchPercent(tenant, estate)
          estate.match = prospect_score
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
