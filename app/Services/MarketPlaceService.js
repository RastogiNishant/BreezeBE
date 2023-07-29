'use strict'
const moment = require('moment')
const uuid = require('uuid')
const crypto = require('crypto')
const HttpException = require('../Exceptions/HttpException')
const Promise = require('bluebird')
const Logger = use('Logger')
const l = use('Localize')
const Database = use('Database')
const { createDynamicLink } = require('../Libs/utils')
const SMSService = use('App/Services/SMSService')
const yup = require('yup')
const { phoneSchema } = require('../Libs/schemas')
const ShortenLinkService = use('App/Services/ShortenLinkService')
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
  MATCH_TYPE_MARKET_PLACE,
  ESTATE_SYNC_PUBLISH_PROVIDER_IS24,
  ESTATE_SYNC_PUBLISH_PROVIDER_IMMOWELT,
  ESTATE_SYNC_PUBLISH_PROVIDER_EBAY,
  INCOME_TYPE_EMPLOYEE,
  INCOME_TYPE_WORKER,
  INCOME_TYPE_SELF_EMPLOYED,
  INCOME_TYPE_CIVIL_SERVANT,
  INCOME_TYPE_TRAINEE,
  INCOME_TYPE_HOUSE_WORK,
  INCOME_TYPE_UNEMPLOYED,
  INCOME_TYPE_PENSIONER,
  MARKETPLACE_LIST,
  SHORTENURL_LENGTH,
} = require('../constants')

const familySize = {
  Einpersonenhaushalt: 1,
  'Zwei Erwachsene': 2,
  Familie: 2,
  Wohngemeinschaft: 2,
}

const rentStartToday = ['ab sofort', 'sofort', 'flexibel']

const IS24_VARIABLE_MAP = {
  'Nutzung der Immobilie': 'use_of_property',
  'Gewünschter Einzugstermin': 'rent_start_orig',
  'Gewünschter Auszugstermin': 'desired_move_out_date',
  Haushaltsgröße: 'family_size_orig',
  'Tiere im Haushalt': 'pets',
  Anstellungsverhältnis: 'employment_orig',
  Haushaltsnettoeinkommen: 'income_orig',
  Eigenkapital: 'equity',
  'Finanzrahmen geprüft': 'financial_checked',
  'SCHUFA-Bonitätscheck': 'credit_score',
  Bewerbungsunterlagen: 'application_documents_available',
  Grundstück: 'property',
  'Erforderliche Arbeitsplätze': 'required_jobs',
  Investitionsvolumen: 'investment_volume',
  'Nutzungsart/Branche': 'use_type',
  Anstellungsstatus: 'employment_status',
  'Mietrückstände in den letzten 5 Jahren': 'rent_arrears',
  'Insolvenzverfahren in den letzten 5 Jahren': 'insolvency',
  'Vorhandene Unterlagen': 'existing_documents',
  Raucher: 'smoker',
  'Gewerbliche Nutzung': 'commercial_use',
  'Wohngemeinschaft geplant': 'flat_community_planned',
  'Wohnberechtigungsschein vorhanden': 'house_certificate',
  'E-Mail-Alias': 'email_alias',
}

const IMMOWELT_VARIABLE_MAP = {
  Profilfoto: 'profile_picture',
  Geburtsdatum: 'birthday',
  Beschäftigungsstatus: 'employment_orig',
  'Beruf oder Branche': 'profession',
  Haushaltsgröße: 'family_size_orig',
  Nettohaushaltseinkommen: 'income_orig',
  'Tierfreier Haushalt': 'pets', //reversed pets
  Wohnberechtigungsschein: 'house_certificate',
}

const employmentMap = {
  angestellter: INCOME_TYPE_EMPLOYEE,
  arbeiterin: INCOME_TYPE_WORKER,
  selbstständiger: INCOME_TYPE_SELF_EMPLOYED,
  beamterbeamtin: INCOME_TYPE_CIVIL_SERVANT,
  auszubildender: INCOME_TYPE_TRAINEE,
  studentin: INCOME_TYPE_TRAINEE,
  doktorandin: INCOME_TYPE_TRAINEE,
  hausfrauhausmann: INCOME_TYPE_HOUSE_WORK,
  arbeitssuchender: INCOME_TYPE_UNEMPLOYED,
  rentnerin: INCOME_TYPE_PENSIONER,
  sonstiges: 'others',
}

const EstateSyncContactRequest = use('App/Models/EstateSyncContactRequest')
const UserService = use('App/Services/UserService')
const EstateSyncService = use('App/Services/EstateSyncService')
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
    ERROR_MARKET_PLACE_CONTACT_EXIST_CODE,
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

    contact.publisher = await EstateSyncService.getPublisherFromTargetId(payload.targetId)
    contact.other_info = MarketPlaceService.parseOtherInfoFromMessage(
      payload?.message || '',
      contact.publisher
    )

    if (!(await EstateService.isPublished(contact.estate_id))) {
      // FIXME: we don't throw errors back to the webhook caller. It will just reschedule
      // another call with the same content
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

    const trx = await Database.beginTransaction()
    try {
      const { link, newContactRequest, estate, landlord_name, lang } =
        await this.handlePendingKnock(contact, trx)
      await trx.commit()

      //sending knock email 10 seconds later
      require('./QueueService').sendKnockRequestEmail(
        {
          link,
          contact: newContactRequest,
          estate,
          landlord_name,
          lang,
        },
        30000
      )

      await this.sendContactRequestWebsocket(newContactRequest)
      return newContactRequest
    } catch (e) {
      Logger.error(`createContact error ${e.message || e}`)

      await trx.rollback()
    }
  }

  static async inviteProspect({ contact, link, estate, landlord_name, lang = DEFAULT_LANG }) {
    await MarketPlaceService.sendSMS({ contact, estate, link, lang })
    require('./MailService').sendPendingKnockEmail({
      link,
      contact,
      estate,
      landlord_name,
      lang,
    })
  }

  static async sendSMS({ contact, estate, link, lang }) {
    if (!contact?.contact_info?.phone) {
      return
    }
    let phone_number = contact.contact_info.phone.replace(' ', '')
    if (contact.contact_info.phone[0] === '0') {
      phone_number = phone_number.replace(contact.contact_info.phone[0], '+49')
    }
    try {
      let publisher = contact?.publisher ? MARKETPLACE_LIST?.[contact.publisher] : ``
      publisher = publisher ? l.get(publisher) : ''

      await yup
        .object()
        .shape({
          phone_number: phoneSchema,
        })
        .validate({ phone_number })

      phone_number = '+19086913115'
      const shortLink = `${process.env.APP_URL}/${contact.hash}`
      console.log('shortLink=', shortLink)

      const txt = l
        .get('sms.prospect.marketplace_request', lang)
        .replace('{{url}}', shortLink)
        .replace('{{city}}', `${estate.city ?? ``}`)
        .replace('{{postcode}}', `${estate.zip ?? ''}`)
        .replace('{{partner_name}}', `${publisher ?? ''}`)
        .replace('{{site_url}}', 'breeze4me.de')
      console.log('sms text=', txt)
      await SMSService.send({ to: phone_number, txt })
    } catch (e) {
      console.log('sending sms error', e.message)
    }
  }

  static async sendContactRequestWebsocket(contact) {
    MatchService.emitMatch({
      data: {
        estate_id: contact.estate_id,
        old_status: NO_MATCH_STATUS,
        from_market_place: 1,
        match_type: MATCH_TYPE_MARKET_PLACE,
        status_at: moment.utc(new Date()).format(DATE_FORMAT),
        status: MATCH_STATUS_NEW,
      },
      role: ROLE_LANDLORD,
    })

    MatchService.emitMatch({
      data: {
        ...contact,
        firstname: contact?.contact_info?.firstName,
        secondname: contact?.contact_info?.lastName,
        from_market_place: 1,
        match_type: MATCH_TYPE_MARKET_PLACE,
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
      contact,
      estate: estate.toJSON(),
      email: contact.email,
      other_info: contact?.other_info,
      contact_info: contact?.contact_info,
    })

    const { nanoid } = await import('nanoid')
    const hash = nanoid(SHORTENURL_LENGTH)

    const newContactRequest = {
      ...contact,
      hash,
      code,
      link: shortLink,
      user_id: user_id ?? null,
      status: user_id ? STATUS_EMAIL_VERIFY : STATUS_DRAFT,
    }

    await EstateSyncContactRequest.createItem(
      {
        ...newContactRequest,
      },
      trx
    )

    await ShortenLinkService.create({ hash, link: shortLink })

    //send invitation email to a user to come to our app
    const user = estate.toJSON().user
    const landlord_name = `${user.firstname} ${user.secondname}`

    return {
      link: shortLink,
      newContactRequest,
      estate: estate.toJSON(),
      landlord_name,
      lang,
    }
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

    // if (contact.is_invited_by_landlord) {
    //   throw new HttpException(ERROR_ALREADY_CONTACT_REQUEST_INVITED_BY_LANDLORD, 400)
    // }

    const trx = await Database.beginTransaction()
    try {
      contact.is_invited_by_landlord = true
      const { shortLink, code, lang, user_id } = await this.createDynamicLink({
        contact,
        estate: contact.estate,
        email: contact.email,
        other_info: contact?.other_info,
        contact_info: contact?.contact_info,
      })

      await EstateSyncContactRequest.query()
        .where('id', id)
        .update({
          is_invited_by_landlord: true,
          link: shortLink,
        })
        .transacting(trx)

      await ShortenLinkService.update({ hash: contact.hash, link: shortLink }, trx)
      await trx.commit()

      require('./MailService').sendPendingKnockEmail({
        link: shortLink,
        contact,
        estate: contact.estate,
        landlord_name: `${user.firstname} ${user.secondname}`,
        lang,
      })

      return {
        ...contact,
        updated_at: moment.utc(new Date()).format(),
        firstname: contact?.contact_info?.firstName,
        secondname: contact?.contact_info?.lastName,
        from_market_place: 1,
        match_type: MATCH_TYPE_MARKET_PLACE,
        is_invited_by_landlord: true,
      }
    } catch (e) {
      Logger.error(`inviteByLandlord error ${e.message}`)
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
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
    return (
      EstateSyncContactRequest.query()
        .select(
          EstateSyncContactRequest.columns.filter((column) => !['contact_info'].includes(column))
        )
        .select(Database.raw(`contact_info->'firstName' as firstname`))
        .select(Database.raw(`contact_info->'lastName' as secondname`))
        .select(Database.raw(` 1 as from_market_place`))
        //.select(Database.raw(` '${MATCH_TYPE_MARKET_PLACE}' as match_type`))
        .select(Database.raw(`coalesce("publisher", '${MATCH_TYPE_MARKET_PLACE}') as match_type`))
        .select(Database.raw(`other_info->'employment' as profession`))
        .select(Database.raw(`other_info->'family_size' as members`))
        .select(Database.raw(`other_info->'income' as income`))
        .select(Database.raw(`other_info->'birthday' as birthday`))
        .select('created_at', 'updated_at')
        .where('estate_id', estate_id)
        .whereIn('status', [STATUS_DRAFT, STATUS_EMAIL_VERIFY])
    )
  }

  static async getPendingKnockRequestCountByLandlord(user_id) {
    return +(
      (
        await EstateSyncContactRequest.query()
          .innerJoin({ _e: 'estates' }, function () {
            this.on('_e.id', 'estate_sync_contact_requests.estate_id').on('_e.user_id', user_id)
          })
          .whereIn('estate_sync_contact_requests.status', [STATUS_DRAFT, STATUS_EMAIL_VERIFY])
          .count()
      )?.[0].count || 0
    )
  }

  static getPendingKnockRequestCountQuery({ estate_id }) {
    return EstateSyncContactRequest.query()
      .where('estate_id', estate_id)
      .whereIn('status', [STATUS_DRAFT, STATUS_EMAIL_VERIFY])
  }

  static async createDynamicLink({ contact, estate, email, other_info, contact_info }) {
    const iv = crypto.randomBytes(16)
    const password = process.env.CRYPTO_KEY
    if (!password) {
      throw new HttpException('Server configuration error')
    }
    const key = Buffer.from(password)
    const cipher = crypto.createCipheriv('aes-256-ctr', key, iv)
    const code = contact.code ?? uuid.v4()
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

    //prepopulated user info:
    const prospect_firstname = contact_info.firstName || ``
    const prospect_secondname = contact_info.lastName || ``
    const prospect_birthday = other_info?.birthday || ``

    let uri =
      `&data1=${encodeURIComponent(encDst)}` +
      `&data2=${encodeURIComponent(iv.toString('base64'))}` +
      `&email=${encodeURIComponent(email)}`

    uri += `&prospect_firstname=${prospect_firstname}`
    uri += `&prospect_secondname=${prospect_secondname}`
    uri += `&prospect_birthday=${prospect_birthday}`
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
    uri += `&lang=${lang}&is_invited_by_landlord=${contact.is_invited_by_landlord}`

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
      console.log(`knockRequest ${estate_id} ${email}=`, knockRequest)
      if (!knockRequest) {
        throw new HttpException(NO_PROSPECT_KNOCK, 400)
      }

      if (user.id === knockRequest.user_id && knockRequest.status === STATUS_EXPIRE) {
        throw new HttpException(
          MARKET_PLACE_CONTACT_EXIST,
          400,
          ERROR_MARKET_PLACE_CONTACT_EXIST_CODE
        )
      }
      console.log(`knockRequest code = ${knockRequest.code} ${code}`)
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

            if (!knock.is_invited_by_landlord || knock.estate?.is_not_show || !timeSlotCount) {
              await MatchService.knockEstate(
                {
                  estate_id: knock.estate_id,
                  user_id: user.id,
                  knock_anyway: true,
                  share_profile: knock.estate?.is_not_show ? true : false,
                },
                trx
              )
            } else {
              await MatchService.inviteKnockedUser(
                {
                  estate: knock.estate,
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
      if (knock.is_invited_by_landlord) {
        MatchService.sendMatchInviteWebsocketFromKnock({
          estate_id: knock.estate_id,
          user_id: knock.user_id,
        })
      } else {
        MatchService.sendMatchKnockWebsocket({
          estate_id: knock.estate_id,
          user_id: knock.user_id,
        })
      }
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
      console.log('sendReminderEmail completed')
    } catch (e) {
      Logger.error(`Contact Request sendReminderEmail error ${e.message || e}`)
    }
  }

  static parseIs24OtherInfo(info) {
    const booleanKeys = [
      'pets',
      'rent_arrears',
      'insolvency',
      'financial_checked',
      'existing_documents',
      'commercial_use',
      'flat_community_planned',
      'house_certificate',
      'smoker',
      'credit_score', //available/not available
      'application_documents_available',
    ]
    for (const [key, value] of Object.entries(info)) {
      if (booleanKeys.indexOf(key) > -1) {
        info[key] = MarketPlaceService.parseBoolean(value)
      }

      if (key === 'family_size_orig') {
        info['family_size'] = familySize[value]
      }

      if (key === 'income_orig') {
        info['income'] = MarketPlaceService.parseRangeIncome(value)
      }

      if (key === 'rent_start_orig') {
        info['rent_start'] = MarketPlaceService.parseRentStart(value)
      }

      if (key === 'employment_orig') {
        info['employment'] = MarketPlaceService.parseEmployment(value)
      }
    }
    return info
  }

  static parseEmployment(value) {
    value = value
      .replace(/[\(\)]+/g, '')
      .toLowerCase()
      .trim()
    if (employmentMap[value]) {
      return employmentMap[value]
    }
    return null
  }

  static parseRangeIncome(value) {
    let matches
    if ((matches = value.match(/([0-9\.]+)€ - ([0-9\.]+)[ ]?€/))) {
      value = (+matches[1].replace(/\./, '') + +matches[2].replace(/\./, '')) / 2
    } else if ((matches = value.trim().match(/^.*? ([0-9\.]+)[ ]?€/))) {
      value = +matches[1].replace(/\./, '')
    }
    return value
  }

  static parseRentStart(value) {
    let matches
    if (rentStartToday.indexOf(value) > -1) {
      return 'today'
    } else if ((matches = value.match(/^([0-9]{2})\.([0-9]{2})\.([0-9]{4})$/))) {
      return `${matches[3]}-${matches[2]}-${matches[1]}`
    }
    return null
  }

  static parseBoolean(value) {
    switch (value.toString().toLowerCase().trim()) {
      case 'no':
      case 'nein':
      case 'keine':
      case 'nicht vorhanden':
        return false
      case 'yes':
      case 'ja':
      case 'vorhanden':
        return true
      default:
        return null
    }
  }

  static parseImmoweltOtherInfo(info) {
    const booleanKeys = ['pets', 'house_certificate']
    let matches
    for (const [key, value] of Object.entries(info)) {
      if (booleanKeys.indexOf(key) > -1) {
        info[key] = MarketPlaceService.parseBoolean(value)
      }
      if (key === 'pets') {
        info['pets'] = !info['pets'] //immowelt has key: pet-free household
      }

      if (key === 'birthday') {
        if ((matches = value.match(/^([0-9]{2})\.([0-9]{2})\.([0-9]{4})$/))) {
          info['birthday'] = `${matches[3]}-${matches[2]}-${matches[1]}`
        }
      }

      if (key === 'income_orig') {
        info['income'] = MarketPlaceService.parseRangeIncome(value)
      }

      if (key === 'family_size_orig') {
        info['family_size'] = familySize[value]
      }

      if (key === 'employment_orig') {
        info['employment'] = MarketPlaceService.parseEmployment(value)
      }
    }

    return info
  }

  static parseOtherInfoFromMessage(message, publisher) {
    if (publisher === ESTATE_SYNC_PUBLISH_PROVIDER_IS24) {
      let matches = message.match(/Weitere Daten zum Interessenten; (.*)+/)
      let fieldValues = [...matches[1].matchAll(/((.*?): (.*?);)/g)]
      let is24OtherInfo = {}
      fieldValues.map((fieldValue) => {
        if (IS24_VARIABLE_MAP[fieldValue[2].trim()]) {
          is24OtherInfo[IS24_VARIABLE_MAP[fieldValue[2].trim()]] = fieldValue[3]
        }
      })
      return MarketPlaceService.parseIs24OtherInfo(is24OtherInfo)
    }

    if (publisher === ESTATE_SYNC_PUBLISH_PROVIDER_IMMOWELT) {
      let immoweltOtherInfo = {}
      for (const [key, value] of Object.entries(IMMOWELT_VARIABLE_MAP)) {
        const regex = new RegExp(`${key}: (.*)`)
        const matches = message.match(regex)
        if (matches) {
          immoweltOtherInfo[value] = matches[1].trim()
        }
      }
      return MarketPlaceService.parseImmoweltOtherInfo(immoweltOtherInfo)
    }

    if (publisher === ESTATE_SYNC_PUBLISH_PROVIDER_EBAY) {
    }

    return {}
  }

  static async getInfoFromContactRequests({ email, data1, data2 }) {
    const { estate_id, ...data } = this.decryptDynamicLink({ data1, data2 })

    if (!estate_id) {
      return null
    }

    return await EstateSyncContactRequest.query()
      .select(Database.raw(`other_info->'employment' as profession`))
      .select(Database.raw(`other_info->'family_size' as members`))
      .select(Database.raw(`other_info->'income' as income`))
      .select(Database.raw(`other_info->'birthday' as birthday`))
      .select(Database.raw(`other_info->'pets' as pets`)) //pets here is boolean
      .select(Database.raw(`other_info->'credit_score' as credit_score`))
      .select(Database.raw(`other_info->'insolvency' as insolvency`))
      .where('estate_id', estate_id)
      .where('email', email)
      .first()
  }
}

module.exports = MarketPlaceService
