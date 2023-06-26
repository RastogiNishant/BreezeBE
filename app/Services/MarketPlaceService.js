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
  DATE_FORMAT,
  ROLE_LANDLORD,
  WEBSOCKET_EVENT_MATCH_STAGE,
  MATCH_STATUS_NEW,
  NO_MATCH_STATUS,
  MATCH_STATUS_KNOCK,
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
    ERROR_CONTACT_REQUEST_NO_EXIST,
    ERROR_ALREADY_KNOCKED,
    ERROR_ALREADY_CONTACT_REQUEST_INVITED_BY_LANDLORD,
  },
} = require('../exceptions')
const TenantService = require('./TenantService')
const { uniq, omit } = require('lodash')
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
      await this.sendContactRequestWebsocket(newContactRequest)
      return newContactRequest
    } catch (e) {
      Logger.error(`createContact error ${e.message || e}`)

      await trx.rollback()
    }
  }

  static async sendContactRequestWebsocket(contactRequest) {
    MatchService.emitMatch({
      data: {
        estate_id: contactRequest.estate_id,
        old_status: NO_MATCH_STATUS,
        from_market_place: 1,
        match_type: 'listing',
        status_at: moment.utc(new Date()).format(DATE_FORMAT),
        status: MATCH_STATUS_NEW,
      },
      role: ROLE_LANDLORD,
    })

    MatchService.emitMatch({
      data: {
        estate_id: contactRequest.estate_id,
        old_status: NO_MATCH_STATUS,
        from_market_place: 1,
        status_at: moment.utc(new Date()).format(DATE_FORMAT),
        status: MATCH_STATUS_NEW,
        estate: {
          firstname: contactRequest.contact_info?.firstName,
          secondname: contactRequest.contact_info?.lastName,
          email: contactRequest.contact_info?.email,
          match_type: 'listing',
          user_id: null,
          status: -1,
        },
      },
      role: ROLE_LANDLORD,
      event: WEBSOCKET_EVENT_MATCH_STAGE,
    })
  }

  static async handlePendingKnock(contact, trx) {
    if (!contact.estate_id || !contact.email) {
      throw new HttpException('Params are wrong', e.status || 500)
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
        link: shortLink,
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
      30000
    )
  }

  static async inviteByLandlord({ id, user }) {
    const contact = (
      await EstateSyncContactRequest.query().with('estate').where('id', id).first()
    ).toJSON()

    if (!contact?.estate || contact?.estate?.user_id !== user.id) {
      throw new HttpException(ERROR_CONTACT_REQUEST_NO_EXIST, 400)
    }

    if (contact.status === STATUS_EXPIRE) {
      throw new HttpException(ERROR_ALREADY_KNOCKED, 400)
    }

    if (contact.is_invited_by_landlord) {
      throw new HttpException(ERROR_ALREADY_CONTACT_REQUEST_INVITED_BY_LANDLORD, 400)
    }

    const prospects = (await UserService.getByEmailWithRole([contact.email], ROLE_USER)).toJSON()

    const lang = prospects?.[0]?.lang || DEFAULT_LANG

    await EstateSyncContactRequest.query().where('id', id).update({
      is_invited_by_landlord: true,
    })

    require('./MailService').sendPendingKnockEmail({
      link: contact.link,
      email: contact.email,
      estate: contact.estate,
      landlord_name: `${user.firstname} ${user.secondname}`,
      lang,
    })

    return true
  }

  static async getKnockById(id) {
    return await EstateSyncContactRequest.query().where('id', id).first()
  }

  static async getKnockRequest({ estate_id, email }) {
    return await EstateSyncContactRequest.query()
      .where('estate_id', estate_id)
      .where('email', email)
      .first()
  }

  static getPendingKnockRequestQuery({ estate_id }) {
    return EstateSyncContactRequest.query()
      .select(
        EstateSyncContactRequest.columns.filter(
          (column) => !['contact_info', 'message'].includes(column)
        )
      )
      .select(Database.raw(`contact_info->'firstName' as firstname`))
      .select(Database.raw(`contact_info->'lastName' as secondname`))
      .select(Database.raw(` 1 as from_market_place`))
      .where('estate_id', estate_id)
      .whereIn('status', [STATUS_DRAFT, STATUS_EMAIL_VERIFY])
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
        throw new HttpException(NO_USER_PASSED, e.status || 500)
      }

      if (!data1 || !data2) {
        throw new HttpException(WRONG_PARAMS, e.status || 500)
      }

      const { estate_id, email, code, expired_time, invited_by_landlord } =
        await this.decryptDynamicLink({
          data1,
          data2,
        })
      const knockRequest = await this.getKnockRequest({ estate_id, email })
      if (!knockRequest) {
        throw new HttpException(NO_PROSPECT_KNOCK, 400)
      }

      if (user.id === knockRequest.user_id && knockRequest.status === STATUS_EXPIRE) {
        throw new HttpException(MARKET_PLACE_CONTACT_EXIST, 400)
      }

      if (!knockRequest.code || code != knockRequest.code) {
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

  static async createKnock({ user, data1, data2, email_verified = true }, trx) {
    try {
      let contatRequestEmail = user.email
      if (data1 && data2) {
        const descryptedResult = await this.decryptDynamicLink({
          data1,
          data2,
        })
        contatRequestEmail = descryptedResult.email
      }

      const pendingKnocks = (
        await EstateSyncContactRequest.query()
          .with('estate')
          .where('email', contatRequestEmail)
          .whereIn(
            'status',
            email_verified ? [STATUS_EMAIL_VERIFY] : [STATUS_DRAFT, STATUS_EMAIL_VERIFY]
          )
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
            const freeTimeSlots = await require('./TimeSlotService').getFreeTimeslots(
              knock.estate_id
            )
            const timeSlotCount = Object.keys(freeTimeSlots || {}).length || 0

            if (
              !pendingKnocks[0].is_invited_by_landlord ||
              pendingKnocks[0].estate?.is_not_show ||
              !timeSlotCount
            ) {
              await MatchService.knockEstate(
                {
                  estate_id: knock.estate_id,
                  user_id: user.id,
                  knock_anyway: true,
                  share_profile: pendingKnocks[0].estate?.is_not_show ? true : false,
                },
                trx
              )
            } else {
              await MatchService.inviteKnockedUser(
                {
                  estate: pendingKnocks[0].estate,
                  userId: user.id,
                  is_from_market_place: true,
                },
                trx
              )
            }
          }
        },
        { concurrency: 1 }
      )

      //fill up tenant coord info if he doesn't add it yet.
      if (pendingKnocks?.length) {
        const tenant = await TenantService.getTenant(user.id)
        if (!tenant.address || !tenant.coord) {
          const estate = pendingKnocks[0].estate
          await TenantService.updateTenantAddress({ user, address: estate?.address }, trx)
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

      const { estate_id, code, email, expired_time, invited_by_landlord } = JSON.parse(decDst)

      return { estate_id, code, email, expired_time, invited_by_landlord }
    } catch (e) {
      console.log('outside knock dynamic link error', e.message)
      throw new HttpException('Params are wrong', 400, ERROR_OUTSIDE_PROSPECT_KNOCK_INVALID)
    }
  }

  static async sendReminderEmail() {
    try {
      const yesterday = moment.utc(new Date()).add(-1, 'days').format(DATE_FORMAT)
      const contacts = (
        await EstateSyncContactRequest.query()
          .where('created_at', '<=', yesterday)
          .whereNotNull('link')
          .where('status', STATUS_DRAFT)
          .where('email_sent', false)
          .fetch()
      ).rows

      if (!contacts?.length) {
        return
      }

      let estate_ids = contacts.map((contact) => contact.estate_id)
      estate_ids = uniq(estate_ids)

      const estates = await require('./EstateService').getAllPublishedEstatesByIds({
        ids: estate_ids,
      })

      await Promise.map(
        contacts,
        async (contact) => {
          const estate = estates.filter((estate) => estate.id === contact.estate_id)?.[0]
          console.log('estate.user?.lang=', estate.user?.lang)
          if (estate) {
            await MailService.reminderKnockSignUpEmail({
              link: contact.link,
              email: contact.email,
              estate,
              lang: estate.user?.lang || DEFAULT_LANG,
            })
          }
        },
        { concurrency: 1 }
      )

      const contactIds = contacts.map((contact) => contact.id)
      await EstateSyncContactRequest.query().update({ email_sent: true }).whereIn('id', contactIds)
    } catch (e) {
      Logger.error(`Contact Request sendReminderEmail error ${e.message || e}`)
    }
  }
}

module.exports = MarketPlaceService
