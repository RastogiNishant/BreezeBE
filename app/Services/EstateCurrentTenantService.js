const User = use('App/Models/User')
const Match = use('App/Models/Match')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const MailService = use('App/Services/MailService')
const Database = use('Database')
const crypto = require('crypto')
const { FirebaseDynamicLinks } = use('firebase-dynamic-links')
const uuid = require('uuid')
const moment = require('moment')
const SMSService = use('App/Services/SMSService')
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
} = require('../constants')

const HttpException = use('App/Exceptions/HttpException')
const UserService = use('App/Services/UserService')

const l = use('Localize')

class EstateCurrentTenantService {
  /**
   * Right now there is no way to determine if the email address is the right tenant's email address or not
   * So we can't prevent duplicated record for the same estate
   * @param {*} param0
   * @returns
   */
  static async addCurrentTenant({ data, estate_id, user_id }) {
    const estate = require('./EstateService')
      .getActiveEstateQuery()
      .where('user_id', user_id)
      .where('id', estate_id)
      .where('letting_status', LETTING_TYPE_LET)
      .first()

    if (!estate) {
      throw new HttpException('No permission to add current tenant')
    }

    let user = await User.query().where('email', data.tenant_email).where('role', ROLE_USER).first()

    let currentTenant = new EstateCurrentTenant()
    currentTenant.fill({
      estate_id,
      salutation: data.txt_salutation || '',
      surname: data.surname || '',
      email: data.tenant_email,
      contract_end: data.contract_end,
      phone_number: data.tenant_tel,
      status: STATUS_ACTIVE,
      salutation_int: data.salutation_int,
    })

    if (user) {
      currentTenant.user_id = user.id
    }
    await currentTenant.save()
    return currentTenant
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

  static async createOnFinalMatch(tenant_id, estate_id, trx) {
    const tenantUser = await User.query().where('id', tenant_id).firstOrFail()

    const currentTenant = new EstateCurrentTenant()
    currentTenant.fill({
      estate_id,
      user_id: tenant_id,
      surname: tenantUser.secondname || '',
      email: tenantUser.email,
      contract_end: moment().utc().add(1, 'years').format(DAY_FORMAT),
      phone_number: tenantUser.phone_number || '',
      status: STATUS_ACTIVE,
      salutation_int: SALUTATION_SIR_OR_MADAM,
    })

    await currentTenant.save(trx)
    return currentTenant
  }

  static async updateCurrentTenant({ id, data, estate_id, user_id }) {
    if (id) {
      await this.hasPermission(id, user_id)
    }

    let user = await User.query().where('email', data.tenant_email).where('role', ROLE_USER).first()

    let currentTenant = await EstateCurrentTenant.query()
      .where('estate_id', estate_id)
      .where('email', data.tenant_email)
      .first()

    if (!currentTenant) {
      //Current Tenant is EMPTY OR NOT the same, so we make current tenants expired and add active tenant
      await Database.table('estate_current_tenants')
        .where('estate_id', estate_id)
        .update({ status: STATUS_EXPIRE })

      let newCurrentTenant = new EstateCurrentTenant()
      newCurrentTenant.fill({
        estate_id,
        salutation: data.txt_salutation || '',
        surname: data.surname || '',
        email: data.tenant_email,
        contract_end: data.contract_end,
        phone_number: data.tenant_tel,
        status: STATUS_ACTIVE,
        salutation_int: data.salutation_int,
      })
      if (user) {
        newCurrentTenant.user_id = user.id
      }
      await newCurrentTenant.save()
      return newCurrentTenant
    } else {
      //update values except email...
      currentTenant.fill({
        id: currentTenant.id,
        salutation: data.txt_salutation,
        surname: data.surname,
        contract_end: data.contract_end,
        phone_number: data.tenant_tel,
        salutation_int: data.salutation_int,
      })
      if (user) {
        currentTenant.user_id = user.id
      }
      await currentTenant.save()
      return currentTenant
    }
  }

  static async get(id) {
    return await EstateCurrentTenant.query()
      .where('id', id)
      .whereNot('status', STATUS_DELETE)
      .firstOrFail()
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
      .where('letting_status', LETTING_TYPE_LET)
      .firstOrFail()
  }

  static async expire(id, user_id) {
    await this.hasPermission(id, user_id)
    return await EstateCurrentTenant.query().where('id', id).update({ status: STATUS_EXPIRE })
  }

  static async inviteTenantToAppByEmail({ ids, user_id }) {
    const links = await this.getDynamicLinks({
      ids,
      user_id,
    })
    await MailService.sendInvitationToOusideTenant(links)
  }

  static async inviteTenantToAppBySMS({ ids, user_id }) {
    const links = await this.getDynamicLinks({
      ids,
      user_id,
    })

    const errorPhoneNumbers = []
    await Promise.all(
      links.map(async (link) => {
        const txt = l.get('sms.tenant.invitation', DEFAULT_LANG) + ` ${link.shortLink}`

        if (link.phone_number) {
          await SMSService.send({ to: link.phone_number, txt })
        } else {
          errorPhoneNumbers.push(link.phone_number)
        }
      })
    )
    return errorPhoneNumbers
  }

  static async getOutsideTenantsByEstateId({ id, estate_id }) {
    return await EstateCurrentTenant.query()
      .where('id', id)
      .where('estate_id', estate_id)
      .whereNot('status', STATUS_DELETE)
      .whereNull('user_id')
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
    const estateCurrentTenants = await this.getOutsideTenantByIds(ids)

    const EstateService = require('./EstateService')
    await Promise.all(
      estateCurrentTenants.map(async (ect) => {
        const estate = await EstateService.getEstateHasTenant({
          condition: { id: ect.estate_id, user_id: user_id },
        })

        if (!estate) {
          throw new HttpException('No permission to invite')
        }
      })
    )

    const links = await Promise.all(
      estateCurrentTenants.map(async (ect) => {
        return await EstateCurrentTenantService.createDynamicLink(ect)
      })
    )

    return links
  }
  static async createDynamicLink(estateCurrentTenant) {
    const iv = crypto.randomBytes(16)
    const password = process.env.CRYPTO_KEY
    if (!password) {
      throw new HttpException('Server configuration error')
    }

    const key = Buffer.from(password)
    const cipher = crypto.createCipheriv('aes-256-ctr', key, iv)

    const time = moment().utc().format('YYYY-MM-DD HH:mm:ss')
    const code = uuid.v4()
    await EstateCurrentTenant.query().where('id', estateCurrentTenant.id).update({ code: code, invite_sent_at: time })

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
    console.log({ existingUser })
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
      email: estateCurrentTenant.email,
      phone_number: estateCurrentTenant.phone_number,
      shortLink,
    }
  }

  static async acceptOutsideTenant({ data1, data2, password, email, user }) {
    const { id, estate_id, code, expired_time } = this.decryptDynamicLink({ data1, data2 })
    const estateCurrentTenant = await this.getOutsideTenantsByEstateId({ id, estate_id })
    if (!estateCurrentTenant) {
      throw new HttpException('No record exists')
    }
    if (estateCurrentTenant.user_id) {
      throw new HttpException('Invitation already accepted')
    }

    if (user) {
      if (user.email !== estateCurrentTenant.email) {
        throw new HttpException('Emails do not match! Please contact to customer service', 400)
      }
    } else {
      if (!estateCurrentTenant.email && !email) {
        throw new HttpException('Email must be provided!', 400)
      }

      if (estateCurrentTenant.email && estateCurrentTenant.email !== email) {
        throw new HttpException('Emails do not match! Please contact to customer service', 400)
      }
    }

    const preserved_code = estateCurrentTenant.code
    if (code !== preserved_code) {
      throw new HttpException('code is wrong', 500)
    }

    const time = moment().utc()
    const old_time = moment().utc(expired_time, 'YYYY-MM-DD HH:mm:ss').add(2, 'days')

    if (old_time < time) {
      throw new HttpException('Link has been expired', 500)
    }

    const trx = await Database.beginTransaction()
    try {
      if (user) {
        await EstateCurrentTenantService.updateOutsideTenantInfo(user, trx)
      } else {
        const userData = {
          role: ROLE_USER,
          secondname: estateCurrentTenant.surname,
          phone: estateCurrentTenant.phone_number,
          password: password,
        }
        user = await UserService.signUp(
          { email: estateCurrentTenant.email || email, firstname: '', ...userData },
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
      throw new HttpException('Params are wrong', 500)
    }
  }

  static async getByUserId(user_id) {
    await EstateCurrentTenant.query().where('user_id', user_id).whereNot('status', STATUS_DELETE)
  }

  static async updateOutsideTenantInfo(user, trx = null) {
    const currentTenant = await EstateCurrentTenant.query()
      .where('email', user.email)
      .whereNot('status', STATUS_DELETE)
      .first()
    if (!currentTenant) {
      return
    }
    currentTenant.user_id = user.id
    if (!currentTenant.email) {
      currentTenant.email = user.email
    }
    await currentTenant.save(trx)

    //if current tenant, he needs to save to match as a final match
    if (currentTenant.estate_id) {
      const match = await require('./MatchService').getMatches(user.id, currentTenant.estate_id)
      if (!match) {
        await require('./MatchService').addFinalTenant(
          { user_id: user.id, estate_id: currentTenant.estate_id },
          trx
        )
      } else {
        await Match.query()
          .where({ user_id: match.user_id, estate_id: match.estate_id, status: match.status })
          .update({ status: MATCH_STATUS_FINISH })
          .transacting(trx)
      }
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
}

module.exports = EstateCurrentTenantService
