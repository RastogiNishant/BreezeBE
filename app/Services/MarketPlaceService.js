'use strict'
const moment = require('moment')
const uuid = require('uuid')
const crypto = require('crypto')
const HttpException = require('../Exceptions/HttpException')
const Promise = require('bluebird')
const Logger = use('Logger')
const Database = use('Database')
const { createDynamicLink } = require('../Libs/utils')
const {
  DEFAULT_LANG,
  ROLE_USER,
  OUTSIDE_PROSPECT_KNOCK_INVITE_TYPE,
  STATUS_EMAIL_VERIFY,
  STATUS_ACTIVE,
  STATUS_EXPIRE,
  STATUS_DRAFT,
} = require('../constants')

const EstateSyncContactRequest = use('App/Models/EstateSyncContactRequest')
const UserService = use('App/Services/UserService')
const MailService = use('App/Services/MailService')
const MatchService = use('App/Services/MatchService')
const EstateService = use('App/Services/EstateService')
const EstateSyncListing = use('App/Models/EstateSyncListing')

const {
  exceptions: {
    ERROR_OUTSIDE_PROSPECT_KNOCK_INVALID,
    WRONG_PARAMS,
    NO_USER_PASSED,
    NO_PROSPECT_KNOCK,
    NO_ESTATE_EXIST,
    MARKET_PLACE_CONTACT_EXIST,
    NO_ACTIVE_ESTATE_EXIST,
    ERROR_CONTACT_REQUEST_EXIST,
  },
} = require('../exceptions')
const TenantService = require('./TenantService')
class MarketPlaceService {
  static async createContact(payload) {
    if (!payload?.propertyId) {
      return
    }

    const propertyId = payload.propertyId
    const listing = await EstateSyncListing.query()
      .where('estate_sync_property_id', propertyId)
      .first()

    if (!listing) {
      return
    }

    if (!payload?.prospect?.email) {
      return
    }

    const contact = {
      estate_id: listing.estate_id,
      email: payload.prospect.email,
      contact_info: payload?.prospect || ``,
      message: payload?.message || ``,
    }

    if (!(await EstateService.isPublished(contact.estate_id))) {
      throw new HttpException(NO_ACTIVE_ESTATE_EXIST, 400)
    }

    const contactRequest = await EstateSyncContactRequest.query()
      .where({
        email: contact.email,
        estate_id: contact.estate_id,
      })
      .first()

    if (contactRequest) {
      return true
    }

    let newContactRequest
    const trx = await Database.beginTransaction()
    try {
      newContactRequest = (await EstateSyncContactRequest.createItem(contact, trx)).toJSON()
      await this.handlePendingKnock(contact, trx)

      await trx.commit()
      return newContactRequest
    } catch (e) {
      Logger.error(e.message || e, 400)
      await trx.rollback()
    }
  }

  static async handlePendingKnock(contact, trx) {
    if (!contact.estate_id || !contact.email) {
      throw new HttpException('Params are wrong', 500)
    }

    const estate = await EstateService.getEstateWithUser(contact.estate_id)
    if (!estate) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }

    const { shortLink, code, lang, user_id } = await this.createDynamicLink({
      estate: estate.toJSON(),
      email: contact.email,
    })

    await EstateSyncContactRequest.query()
      .where('email', contact.email)
      .where('estate_id', contact.estate_id)
      .update({
        code,
        user_id: user_id || null,
        status: user_id ? STATUS_EMAIL_VERIFY : STATUS_DRAFT,
      })
      .transacting(trx)

    //send invitation email to a user to come to our app
    const user = estate.toJSON().user
    const landlord_name = `${user.firstname} ${user.secondname}`
    //sending knock email 10 seconds later
    require('./QueueService').sendKnockRequestEmail(
      {
        link: shortLink,
        email: contact.email,
        estate: estate.toJSON(),
        landlord_name,
        lang,
      },
      10000
    )
  }

  static async getKnockRequest({ estate_id, email }) {
    return await EstateSyncContactRequest.query()
      .where('estate_id', estate_id)
      .where('email', email)
      .first()
  }

  static async createDynamicLink({ estate, email }) {
    const iv = crypto.randomBytes(16)
    const password = process.env.CRYPTO_KEY
    if (!password) {
      throw new HttpException('Server configuration error')
    }
    const key = Buffer.from(password)
    const cipher = crypto.createCipheriv('aes-256-ctr', key, iv)
    const code = uuid.v4()
    const time = moment().utc().format('YYYY-MM-DD HH:mm:ss')

    const txtSrc = JSON.stringify({
      estate_id: estate.id,
      code,
      email,
      expired_time: time,
    })

    let encDst = cipher.update(txtSrc, 'utf8', 'base64')
    encDst += cipher.final('base64')

    const house_number = estate.house_number || ``
    const street = estate.street || ``
    const city = estate.city || ``
    const postcode = estate.zip || ``
    const country = estate.country || ``
    const coord = estate.coord || ``
    const area = estate.area || 0
    const floor = estate.floor || 0
    const rooms_number = estate.rooms_number || 0
    const number_floors = estate.number_floors || 0
    const cover = estate.cover_thumb || estate.cover

    let uri =
      `&data1=${encodeURIComponent(encDst)}` +
      `&data2=${encodeURIComponent(iv.toString('base64'))}` +
      `&email=${encodeURIComponent(email)}`

    uri += `&house_number=${house_number}`
    uri += `&street=${encodeURIComponent(street)}`
    uri += `&city=${encodeURIComponent(city)}`
    uri += `&postcode=${postcode}`
    uri += `&country=${country}`
    uri += `&coord=${coord}`
    uri += `&area=${area}`
    uri += `&floor=${floor}`
    uri += `&rooms_number=${rooms_number}`
    uri += `&number_floors=${number_floors}`
    uri += `&cover=${cover}`

    const prospects = (await UserService.getByEmailWithRole([email], ROLE_USER)).toJSON()

    if (prospects?.length) {
      uri += `&user_id=${prospects[0].id}`
    }
    const lang = prospects?.[0]?.lang || DEFAULT_LANG
    uri += `&lang=${lang}`

    const shortLink = await createDynamicLink(
      `${process.env.DEEP_LINK}?type=${OUTSIDE_PROSPECT_KNOCK_INVITE_TYPE}${uri}`
    )
    return {
      code,
      shortLink,
      lang,
      user_id: prospects?.[0]?.id,
    }
  }

  static async createPendingKnock({ user, data1, data2 }, trx = null) {
    try {
      if (!user || user.role !== ROLE_USER) {
        throw new HttpException(NO_USER_PASSED, 500)
      }

      if (!data1 || !data2) {
        throw new HttpException(WRONG_PARAMS, 500)
      }
      const { estate_id, email, code, expired_time } = await this.decryptDynamicLink({
        data1,
        data2,
      })

      const knockRequest = await this.getKnockRequest({ estate_id, email })
      if (!knockRequest) {
        throw new HttpException(NO_PROSPECT_KNOCK, 400)
      }

      if (user?.id === knockRequest.user_id && knockRequest.status === STATUS_EXPIRE) {
        throw new HttpException(MARKET_PLACE_CONTACT_EXIST, 400)
      }

      if (knockRequest.code && code != knockRequest.code) {
        throw new HttpException(NO_PROSPECT_KNOCK, 400)
      }

      /*
       * if a user is going to knock with different email from market places, but he has a knock using his email already for this knock
       * because that is the same account using different emails
       */

      if (email !== user.email && (await this.isExistRequest({ email: user.email, estate_id }))) {
        throw new HttpException(ERROR_CONTACT_REQUEST_EXIST, 400)
      }

      let query = EstateSyncContactRequest.query()
        .where('email', email)
        .where('estate_id', estate_id)
        .update({ email: user.email, status: STATUS_EMAIL_VERIFY, user_id: user.id })

      if (trx) {
        await query.transacting(trx)
      } else {
        await query
      }
    } catch (e) {
      throw new HttpException(e.message, e.status, e.code || 0)
    }
  }

  static async isExistRequest({ email, estate_id }) {
    let query = EstateSyncContactRequest.query()
    if (email) {
      query.where('email', email)
    }
    if (estate_id) {
      query.where('estate_id', estate_id)
    }
    return !!(await query.first())
  }

  static async createKnock({ user }, trx) {
    try {
      const pendingKnocks = (
        await EstateSyncContactRequest.query()
          .where('user_id', user.id)
          .whereIn('status', [STATUS_EMAIL_VERIFY])
          .fetch()
      ).toJSON()

      await Promise.map(
        pendingKnocks || [],
        async (knock) => {
          const hasMatch = await MatchService.hasInteracted({
            userId: user.id,
            estateId: knock.estate_id,
          })
          if (!hasMatch) {
            await MatchService.knockEstate(
              { estate_id: knock.estate_id, user_id: user.id, knock_anyway: true },
              trx
            )
          }
        },
        { concurrency: 1 }
      )

      //fill up tenant coord info if he doesn't add it yet.
      if (pendingKnocks?.length) {
        const tenant = await TenantService.getTenant(user.id)
        if (!tenant.address || !tenant.coord) {
          const estate = await EstateService.getById(pendingKnocks[0].estate_id)
          await TenantService.updateTenantAddress({ user, address: estate.address }, trx)
        }
      }
      await EstateSyncContactRequest.query()
        .where('user_id', user.id)
        .update({ code: null, status: STATUS_ACTIVE })
        .transacting(trx)

      return true
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  static async sendBulkKnockWebsocket(user_id) {
    const pendingKnocks = (
      await EstateSyncContactRequest.query()
        .where('user_id', user_id)
        .whereIn('status', [STATUS_ACTIVE])
        .fetch()
    ).toJSON()

    await EstateSyncContactRequest.query()
      .where('user_id', user_id)
      .update({ code: null, status: STATUS_EXPIRE })

    Promise.map(pendingKnocks, async (knock) => {
      MatchService.sendMatchKnockWebsocket({
        estate_id: knock.estate_id,
        user_id: knock.user_id,
      })
    })
  }

  static async decryptDynamicLink({ data1, data2 }) {
    try {
      const iv = Buffer.from(decodeURIComponent(data2), 'base64')

      const password = process.env.CRYPTO_KEY
      if (!password) {
        throw new HttpException('Server configuration error')
      }

      const key = Buffer.from(password)

      const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv)

      let decDst = decipher.update(decodeURIComponent(data1), 'base64', 'utf8')
      decDst += decipher.final('utf8')

      const { estate_id, code, email, expired_time } = JSON.parse(decDst)

      return { estate_id, code, email, expired_time }
    } catch (e) {
      console.log('outside knock dynamic link error', e.message)
      throw new HttpException('Params are wrong', 400, ERROR_OUTSIDE_PROSPECT_KNOCK_INVALID)
    }
  }
}

module.exports = MarketPlaceService
