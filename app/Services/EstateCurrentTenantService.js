const User = use('App/Models/User')
const Match = use('App/Models/Match')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const AppException = use('App/Exceptions/AppException')
const MailService = use('App/Services/MailService')
const MemberService = use('App/Services/MemberService')
const Database = use('Database')
const crypto = require('crypto')
const { FirebaseDynamicLinks } = use('firebase-dynamic-links')
const uuid = require('uuid')
const moment = require('moment')
const yup = require('yup')
const SMSService = use('App/Services/SMSService')
const Promise = require('bluebird')
const InvitationLinkCode = use('App/Models/InvitationLinkCode')
const DataStorage = use('DataStorage')
const {
  ROLE_USER,
  STATUS_ACTIVE,
  STATUS_EXPIRE,
  DEFAULT_LANG,
  DAY_FORMAT,
  SALUTATION_SIR_OR_MADAM,
  STATUS_DELETE,
  LETTING_TYPE_LET,
  MATCH_STATUS_FINISH,
  SALUTATION_MR_LABEL,
  SALUTATION_MS_LABEL,
  SALUTATION_SIR_OR_MADAM_LABEL,
  TENANT_INVITATION_EXPIRATION_DATE,
  EMAIL_REG_EXP,
  PHONE_REG_EXP,
  MATCH_STATUS_NEW,
  ERROR_OUTSIDE_TENANT_INVITATION_INVALID,
  ERROR_OUTSIDE_TENANT_INVITATION_EXPIRED,
  ERROR_OUTSIDE_TENANT_INVITATION_ALREADY_USED,
  INVITATION_LINK_RETRIEVAL_TRIES_KEY,
  INVITATION_LINK_RETRIEVAL_TRIES_RESET_TIME,
} = require('../constants')

const HttpException = use('App/Exceptions/HttpException')
const UserService = use('App/Services/UserService')
const NoticeService = use('App/Services/NoticeService')

const l = use('Localize')
const { trim } = require('lodash')
const { phoneSchema } = require('../Libs/schemas')

class EstateCurrentTenantService {
  /**
   * Right now there is no way to determine if the email address is the right tenant's email address or not
   * So we can't prevent duplicated record for the same estate
   * @param {*} param0
   * @returns
   */
  static async addCurrentTenant({ data, estate_id, trx }) {
    const shouldCommitTrx = trx ? false : true

    if (shouldCommitTrx) {
      trx = await Database.beginTransaction()
    }

    data = await this.correctData(data)
    try {
      let currentTenant = new EstateCurrentTenant()
      currentTenant.fill({
        estate_id,
        salutation: data.txt_salutation || '',
        surname: data.surname || '',
        email: data.email,
        contract_end: data.contract_end,
        phone_number: data.phone_number,
        status: STATUS_ACTIVE,
        salutation_int: data.salutation_int,
      })

      await currentTenant.save(trx)

      if (shouldCommitTrx) {
        await trx.commit()
      }

      return currentTenant
    } catch (e) {
      if (shouldCommitTrx) {
        await trx.rollback()
      }
      throw new HttpException(e.message, 500)
    }
  }

  /**
   *
   * we can use this function later to prevent duplicated tenants in the same estate
   * but for now there are current active tenant though landlord is going to add another tenant
   * In other words, there will be some periods exchanging tenants
   * Probably we can decide with contract_end and status later
   * @param {*} param0
   * @returns
   */
  static async belongsToAnotherTenant({ user_id, estate_id, data }) {
    const currentTenants = await this.getAll({ user_id, estate_id, status: [STATUS_ACTIVE] })
    if (currentTenants && currentTenants.total) {
      const anotherTenant = currentTenants.data.find((ct) => ct.email !== data.email)
      if (anotherTenant) {
        return false
      }
    }
    return true
  }

  static async createOnFinalMatch(user, estate_id, trx) {
    await Database.table('estate_current_tenants')
      .where('estate_id', estate_id)
      .update({ status: STATUS_EXPIRE })
      .transacting(trx)

    const member = await MemberService.getMember(null, user.id, user.owner_id)

    const currentTenant = new EstateCurrentTenant()
    currentTenant.fill({
      estate_id,
      user_id: user.id,
      surname: user.secondname || '',
      email: user.email,
      contract_end: moment().utc().add(1, 'years').format(DAY_FORMAT),
      phone_number:
        //TODO: add user's phone verification logic here when we have phone verification flow for user
        member?.phone && member?.phone_verified ? member.phone : user.phone_number || '',
      status: STATUS_ACTIVE,
      salutation:
        user.sex === 1
          ? SALUTATION_MR_LABEL
          : user.sex === 2
          ? SALUTATION_MS_LABEL
          : SALUTATION_SIR_OR_MADAM_LABEL,
      salutation_int: user.sex || SALUTATION_SIR_OR_MADAM,
    })

    await currentTenant.save(trx)
    return currentTenant
  }

  static async correctData(data) {
    if (!data.email) {
      data.email = null
    } else {
      try {
        await yup
          .object()
          .shape({
            email: yup.string().email().lowercase().max(255),
          })
          .validate({ email: data.email })
      } catch (e) {
        data.email = null
      }
    }

    data.phone_number = data.phone_number || data.phone
    if (!data.phone_number) {
      data.phone_number = null
    } else {
      if (trim(data.phone_number[0]) !== '+') {
        data.phone_number = `+${trim(data.phone_number)}`
      }
      try {
        await yup
          .object()
          .shape({
            phone_number: phoneSchema,
          })
          .validate({ phone_number: data.phone_number })
      } catch (e) {
        data.phone_number = null
      }
    }
    return data
  }

  static async updateCurrentTenant({ id, data, estate_id, user_id }) {
    if (id) {
      await this.hasPermission(id, user_id)
    }

    let currentTenant = await EstateCurrentTenant.query()
      .where('estate_id', estate_id)
      .where('status', STATUS_ACTIVE)
      .first()

    if (!currentTenant) {
      //Current Tenant is EMPTY OR NOT the same, so we make current tenants expired and add active tenant

      const newCurrentTenant = await EstateCurrentTenantService.addCurrentTenant({
        data,
        estate_id,
      })

      return newCurrentTenant
    } else {
      data = await this.correctData(data)
      //update values except email if no registered user...
      if (!currentTenant.user_id) {
        currentTenant.fill({
          id: currentTenant.id,
          salutation: data.txt_salutation,
          surname: data.surname,
          contract_end: data.contract_end,
          phone_number: data.phone_number,
          salutation_int: data.salutation_int,
          email: data.email,
        })
        await currentTenant.save()
      }
      return currentTenant
    }
  }

  static async get(id) {
    return await EstateCurrentTenant.query()
      .where('id', id)
      .whereNot('status', STATUS_DELETE)
      .firstOrFail()
  }

  static async getCurrentTenantByEstateId(estate_id) {
    return await EstateCurrentTenant.query()
      .where('estate_id', estate_id)
      .whereNotIn('status', [STATUS_DELETE, STATUS_EXPIRE])
      .first()
  }

  static async getAllInsideCurrentTenant(estate_ids) {
    return (
      await EstateCurrentTenant.query()
        .whereIn('estate_id', Array.isArray(estate_ids) ? estate_ids : [estate_ids])
        .whereNotIn('status', [STATUS_DELETE, STATUS_EXPIRE])
        .fetch()
    ).rows
  }

  static async getAll({ user_id, estate_id, status, tenant_id, page = -1, limit = -1 }) {
    const query = EstateCurrentTenant.query()
      .select(
        'estate_current_tenants.id as estate_current_tenant_id',
        'estate_current_tenants.status as estate_current_tenant_status',
        'estate_current_tenants.*'
      )
      .select('_e.*')
      .whereNot('estate_current_tenants.status', STATUS_DELETE)
      .innerJoin({ _e: 'estates' }, function () {
        this.on('_e.id', 'estate_current_tenants.estate_id').on('_e.user_id', user_id)
      })

    if (status) {
      query.where('estate_current_tenants.status', status)
    }

    if (estate_id) {
      query.where('estate_current_tenants.estate_id', estate_id)
    }
    if (tenant_id) {
      query.where('estate_current_tenants.user_id', tenant_id)
    }

    if (limit === -1 || page === -1) {
      return (await query.fetch()).rows
    }

    return await query.paginate(page, limit)
  }

  static async delete(id, user_id) {
    await this.hasPermission(id, user_id)
    return await EstateCurrentTenant.query().where('id', id).update({ status: STATUS_DELETE })
  }

  static async hasPermission(id, user_id) {
    const estateCurrentTeant = await this.get(id)
    await require('./EstateService')
      .getActiveEstateQuery()
      .where('user_id', user_id)
      .where('id', estateCurrentTeant.estate_id)
      .where('letting_type', LETTING_TYPE_LET)
      .firstOrFail()
  }

  static async expire(id, user_id) {
    await this.hasPermission(id, user_id)
    return await EstateCurrentTenant.query().where('id', id).update({ status: STATUS_EXPIRE })
  }

  static async inviteTenantToAppByEmail({ ids, user_id }) {
    let { failureCount, links } = await this.getDynamicLinks({
      ids,
      user_id,
    })

    const validLinks = links.filter(
      (link) => link.email && trim(link.email) !== '' && EMAIL_REG_EXP.test(link.email)
    )

    failureCount += (links.length || 0) - (validLinks.length || 0)
    const successCount = (ids.length || 0) - failureCount

    MailService.sendInvitationToOusideTenant(validLinks)

    return { successCount, failureCount }
  }

  static async inviteTenantToAppBySMS({ ids, user_id }) {
    let { failureCount, links } = await this.getDynamicLinks({
      ids,
      user_id,
    })

    const validLinks = links.filter(
      (link) =>
        link.phone_number && trim(link.phone_number) !== '' && PHONE_REG_EXP.test(link.phone_number)
    )
    failureCount += (links.length || 0) - (validLinks.length || 0)

    await Promise.all(
      validLinks.map(async (link) => {
        try {
          const txt = l.get('sms.tenant.invitation', DEFAULT_LANG) + ` ${link.shortLink}`
          await SMSService.send({ to: link.phone_number, txt })
        } catch (e) {
          failureCount++
        }
      })
    )

    const successCount = (ids.length || 0) - failureCount

    return { successCount, failureCount }
  }

  static async getOutsideTenantsByEstateId({ id, estate_id }) {
    return await EstateCurrentTenant.query()
      .where('id', id)
      .where('estate_id', estate_id)
      .whereNotIn('status', [STATUS_DELETE, STATUS_EXPIRE])
      .first()
  }

  static async getOutsideTenantByIds(ids) {
    return (
      await EstateCurrentTenant.query()
        .whereIn('id', ids)
        .whereNot('status', STATUS_DELETE)
        .whereNull('user_id')
        .fetch()
    ).rows
  }

  static async getDynamicLinks({ ids, user_id }) {
    let estateCurrentTenants = await this.getOutsideTenantByIds(ids)

    const EstateService = require('./EstateService')
    let failureCount = (ids.length || 0) - (estateCurrentTenants.length || 0)

    estateCurrentTenants = await Promise.all(
      (estateCurrentTenants || []).map(async (ect) => {
        const estate = await EstateService.getEstateHasTenant({
          condition: { id: ect.estate_id, user_id: user_id },
        })
        if (!estate) {
          failureCount++
          return null
        } else {
          return ect.toJSON()
        }
      })
    )

    estateCurrentTenants = estateCurrentTenants.filter((ect) => ect)
    const trx = await Database.beginTransaction()
    try {
      let links = await Promise.all(
        estateCurrentTenants.map(async (ect) => {
          return await EstateCurrentTenantService.createDynamicLink(ect, trx)
        })
      )
      links = await Promise.map(links, async (link) => {
        link.code = await InvitationLinkCode.create(link.id, link.shortLink, trx)
        return link
      })

      return { failureCount, links }
    } catch (err) {
      console.log(err.message)
      await trx.rollback()
      throw new AppException('Error found while creating links.')
    }
  }

  static async createDynamicLink(estateCurrentTenant, trx) {
    const iv = crypto.randomBytes(16)
    const password = process.env.CRYPTO_KEY
    if (!password) {
      throw new HttpException('Server configuration error')
    }

    const key = Buffer.from(password)
    const cipher = crypto.createCipheriv('aes-256-ctr', key, iv)

    const time = moment().utc().format('YYYY-MM-DD HH:mm:ss')
    const code = uuid.v4()
    await EstateCurrentTenant.query()
      .where('id', estateCurrentTenant.id)
      .update({ code: code, invite_sent_at: time }, trx)

    const txtSrc = JSON.stringify({
      id: estateCurrentTenant.id,
      estate_id: estateCurrentTenant.estate_id,
      code: code,
      expired_time: time,
    })

    let encDst = cipher.update(txtSrc, 'utf8', 'base64')
    encDst += cipher.final('base64')

    let uri =
      `&data1=${encodeURIComponent(encDst)}` + `&data2=${encodeURIComponent(iv.toString('base64'))}`

    if (estateCurrentTenant.email) {
      uri += `&email=${estateCurrentTenant.email}`
    }

    const existingUser = await User.query().where('email', estateCurrentTenant.email).first()

    if (existingUser) {
      uri += `&user_id=${existingUser.id}`
    }

    const firebaseDynamicLinks = new FirebaseDynamicLinks(process.env.FIREBASE_WEB_KEY)

    const { shortLink } = await firebaseDynamicLinks.createLink({
      dynamicLinkInfo: {
        domainUriPrefix: process.env.DOMAIN_PREFIX,
        link: `${process.env.DEEP_LINK}?type=outsideinvitation${uri}`,
        androidInfo: {
          androidPackageName: process.env.ANDROID_PACKAGE_NAME,
        },
        iosInfo: {
          iosBundleId: process.env.IOS_BUNDLE_ID,
        },
      },
    })
    return {
      id: estateCurrentTenant.id,
      estate_id: estateCurrentTenant.estate_id,
      email: estateCurrentTenant.email,
      phone_number: estateCurrentTenant.phone_number,
      shortLink,
    }
  }

  static async acceptOutsideTenant({ data1, data2, password, email, user }) {
    const { estateCurrentTenant, estate_id } = await this.handleInvitationLink({
      data1,
      data2,
      email,
      user,
    })

    const trx = await Database.beginTransaction()
    try {
      if (user) {
        await EstateCurrentTenantService.updateOutsideTenantInfo(user, estate_id, trx)
      } else {
        const userData = {
          role: ROLE_USER,
          secondname: estateCurrentTenant.surname,
          phone: estateCurrentTenant.phone_number,
          password: password,
        }
        user = await UserService.signUp(
          {
            email: email || estateCurrentTenant.email, // one of them must be not null, validated in handleInvitationLink
            firstname: '',
            source_estate_id: estate_id,
            ...userData,
          },
          trx
        )
      }
      await trx.commit()
      return user.id
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 500)
    }
  }

  static async handleInvitationLink({ data1, data2, email, user }) {
    const { estate_id, ...rest } = this.decryptDynamicLink({ data1, data2 })
    const estateCurrentTenant = await EstateCurrentTenantService.validateOutsideTenantInvitation({
      estate_id,
      ...rest,
      email,
      user,
    })
    return { estate_id, estateCurrentTenant }
  }

  static async validateInvitationQRCode({ data1, data2 }) {
    const { estate_id, id, code, expired_time } = this.decryptDynamicLink({ data1, data2 })

    const estateCurrentTenant = await EstateCurrentTenantService.validateInvitedTenant({
      id,
      estate_id,
    })
    EstateCurrentTenantService.validateInvitationCode({ code, estateCurrentTenant })
    EstateCurrentTenantService.validateInvitationExpirationDate({ expired_time })

    return true
  }

  static async validateOutsideTenantInvitation({ id, estate_id, code, expired_time, email, user }) {
    const estateCurrentTenant = await EstateCurrentTenantService.validateInvitedTenant({
      id,
      estate_id,
    })

    EstateCurrentTenantService.validateInvitationEmail({ email, estateCurrentTenant, user })
    EstateCurrentTenantService.validateInvitationCode({ code, estateCurrentTenant })
    EstateCurrentTenantService.validateInvitationExpirationDate({ expired_time })

    return estateCurrentTenant
  }

  static async validateInvitedTenant({ id, estate_id }) {
    const estateCurrentTenant = await this.getOutsideTenantsByEstateId({ id, estate_id })
    if (!estateCurrentTenant) {
      throw new HttpException('No record exists', 400, ERROR_OUTSIDE_TENANT_INVITATION_INVALID)
    } else if (estateCurrentTenant.user_id) {
      throw new HttpException(
        'Invitation already used',
        400,
        ERROR_OUTSIDE_TENANT_INVITATION_ALREADY_USED
      )
    }
    return estateCurrentTenant
  }

  static validateInvitationEmail({ user, estateCurrentTenant, email }) {
    if (!user) {
      if (!estateCurrentTenant.email && !email) {
        throw new HttpException('Email must be provided!', 400)
      }
    }
    return true
  }

  static validateInvitationCode({ estateCurrentTenant, code }) {
    const preserved_code = estateCurrentTenant.code
    if (code !== preserved_code) {
      throw new HttpException('code is wrong', 400, ERROR_OUTSIDE_TENANT_INVITATION_INVALID)
    }
    return true
  }

  static validateInvitationExpirationDate({ expired_time }) {
    const time = moment().utc()
    const old_time = moment()
      .utc(expired_time, 'YYYY-MM-DD HH:mm:ss')
      .add(TENANT_INVITATION_EXPIRATION_DATE, 'days')
    if (old_time.isBefore(time)) {
      throw new HttpException('Link has been expired', 400, ERROR_OUTSIDE_TENANT_INVITATION_EXPIRED)
    }
    return true
  }

  static decryptDynamicLink({ data1, data2 }) {
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

      const { id, estate_id, code, expired_time } = JSON.parse(decDst)

      return { id, estate_id, code, expired_time }
    } catch (e) {
      console.log(e)
      throw new HttpException('Params are wrong', 400, ERROR_OUTSIDE_TENANT_INVITATION_INVALID)
    }
  }

  static async getByUserId(user_id) {
    await EstateCurrentTenant.query().where('user_id', user_id).whereNot('status', STATUS_DELETE)
  }

  static async updateOutsideTenantInfo(user, estate_id = null, trx = null) {
    if (!user || !estate_id) {
      throw new HttpException('User or estate id is not provided', 400)
    }

    const query = EstateCurrentTenant.query()
      .where('estate_id', estate_id)
      .whereNull('user_id')
      .whereNotIn('status', [STATUS_DELETE, STATUS_EXPIRE])

    const currentTenant = await query.first()

    if (!currentTenant) {
      throw new HttpException('Invalid data provided, cannot find tenant', 400)
    }

    //TODO: add user's phone verification logic here when we have phone verification flow for user
    const member = await MemberService.getMember(null, user.id, user.owner_id)
    if (member?.phone && member?.phone_verified) {
      currentTenant.phone_number = member.phone
    }

    currentTenant.user_id = user.id
    currentTenant.email = user.email

    currentTenant.surname = user.secondname || currentTenant.surname
    currentTenant.salutation_int = user.sex || currentTenant.salutation_int
    currentTenant.salutation =
      user.sex === 1
        ? SALUTATION_MR_LABEL
        : user.sex === 2
        ? SALUTATION_MS_LABEL
        : SALUTATION_SIR_OR_MADAM_LABEL

    await currentTenant.save(trx)

    //if current tenant, he needs to save to match as a final match
    if (currentTenant.estate_id) {
      await require('./MatchService').handleFinalMatch(currentTenant.estate_id, user, true, trx)
    }
  }

  static async getAllTenant(id) {
    const today = moment.utc(new Date(), DAY_FORMAT)
    return (
      (
        await EstateCurrentTenant.query()
          .select('estate_current_tenants.*')
          .innerJoin({ _e: 'estates' }, function () {
            this.on('_e.id', 'estate_current_tenants.estate_id')
            this.on('_e.user_id', id)
          })
          .where('estate_current_tenants.status', STATUS_ACTIVE)
          // .where('estate_current_tenants.contract_end', '>=', today)
          .fetch()
      ).rows
    )
  }

  static async revokeInvitation(user_id, ids) {
    ids = Array.isArray(ids) ? ids : [ids]
    const trx = await Database.beginTransaction()
    try {
      let estateCurrentTenants = await EstateCurrentTenant.query()
        .select(
          'estate_current_tenants.id',
          'estate_current_tenants.estate_id',
          'estate_current_tenants.user_id'
        )
        .whereIn('estate_current_tenants.id', ids)
        .whereNull('estate_current_tenants.user_id')
        .whereNotNull('estate_current_tenants.code')
        .whereNotNull('estate_current_tenants.invite_sent_at')
        .whereNotIn('estate_current_tenants.status', [STATUS_DELETE, STATUS_EXPIRE])
        .innerJoin({ _e: 'estates' }, function () {
          this.on('_e.id', 'estate_current_tenants.estate_id').on('_e.user_id', user_id)
        })
        .fetch()

      estateCurrentTenants = estateCurrentTenants?.toJSON() || []
      if (estateCurrentTenants.length > 0) {
        await EstateCurrentTenant.query()
          .whereIn(
            'id',
            estateCurrentTenants.map((e) => e.id)
          )
          .update({ code: null, invite_sent_at: null })
          .transacting(trx)
        await InvitationLinkCode.query()
          .whereIn(
            'current_tenant_id',
            estateCurrentTenants.map((e) => e.id)
          )
          .delete(trx)
        await trx.commit()
      } else {
        await trx.rollback()
      }

      return {
        successCount: estateCurrentTenants.length || 0,
        failureCount: ids.length - (estateCurrentTenants.length || 0),
      }
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 500)
    }
  }

  static async disconnect(user_id, ids) {
    ids = Array.isArray(ids) ? ids : [ids]
    const trx = await Database.beginTransaction()

    try {
      let estateCurrentTenants = await EstateCurrentTenant.query()
        .select(
          'estate_current_tenants.id',
          'estate_current_tenants.estate_id',
          'estate_current_tenants.user_id'
        )
        .whereIn('estate_current_tenants.id', ids)
        .whereNotIn('estate_current_tenants.status', [STATUS_DELETE, STATUS_EXPIRE])
        .innerJoin({ _e: 'estates' }, function () {
          this.on('_e.id', 'estate_current_tenants.estate_id').on('_e.user_id', user_id)
        })
        .fetch()

      estateCurrentTenants = estateCurrentTenants?.toJSON() || []
      const valid_ids = estateCurrentTenants.map((tenant) => tenant.id)
      if (valid_ids && valid_ids.length) {
        const estate_ids = estateCurrentTenants.map((tenant) => tenant.estate_id)

        /**
         * though it's disconnected, rent status has not been change. it's like connected wrongly.
         * //await require('./EstateService').unrented(estate_ids, trx)
         */

        await Promise.all(
          estateCurrentTenants.map(async (tenant) => {
            if (tenant.user_id) {
              // need to revert final status to new, because it's not final status any more
              await Match.query()
                .where('user_id', tenant.user_id)
                .where('estate_id', tenant.estate_id)
                .where('status', MATCH_STATUS_FINISH)
                .update({ status: MATCH_STATUS_NEW })
                .transacting(trx)
            }
          })
        )

        await EstateCurrentTenant.query()
          .whereIn('id', valid_ids)
          .update({ user_id: null, code: null, invite_sent_at: null })
          .transacting(trx)

        await trx.commit()
      }
      NoticeService.notifyTenantDisconnected(estateCurrentTenants)

      return {
        successCount: estateCurrentTenants.length || 0,
        failureCount: ids.length - (estateCurrentTenants.length || 0),
      }
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  static async updateEstateTenant(data, user, trx) {
    if (data.email || data.sex || data.secondname) {
      let ect = {}

      if (data.email) ect.email = data.email
      if (data.sex) {
        ect.salutation = data.sex === 1 ? 'Mr.' : data.sex === 2 ? 'Ms.' : 'Mx.'
        ect.salutation_int = data.sex
      }
      if (data.secondname) ect.surname = data.secondname
      await EstateCurrentTenant.query().where('user_id', user.id).update(ect).transacting(trx)
    }
  }

  static async retrieveLinkByCode(code, ip) {
    try {
      const link = await InvitationLinkCode.getByCode(code)
      return { shortLink: link }
    } catch (err) {
      console.log(err.message)
      await DataStorage.increment(ip, INVITATION_LINK_RETRIEVAL_TRIES_KEY, {
        expire: INVITATION_LINK_RETRIEVAL_TRIES_RESET_TIME * 60,
      })
      throw new AppException('Code did not match.')
    }
  }
}

module.exports = EstateCurrentTenantService
