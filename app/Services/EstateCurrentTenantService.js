const User = use('App/Models/User')
const Match = use('App/Models/Match')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const MailService = use('App/Services/MailService')
const MemberService = use('App/Services/MemberService')
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
  SALUTATION_MR_LABEL,
  SALUTATION_MS_LABEL,
  SALUTATION_SIR_OR_MADAM_LABEL,
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
  static async addCurrentTenant({ data, estate_id, trx }) {
    const shouldCommitTrx = trx ? false : true

    if (shouldCommitTrx) {
      trx = await Database.beginTransaction()
    }

    try {
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

  static async updateCurrentTenant({ id, data, estate_id, user_id }) {
    if (id) {
      await this.hasPermission(id, user_id)
    }

    let currentTenant = await EstateCurrentTenant.query()
      .where('estate_id', estate_id)
      .where('status', STATUS_ACTIVE)
      .where('email', data.tenant_email)
      .first()

    if (!currentTenant) {
      //Current Tenant is EMPTY OR NOT the same, so we make current tenants expired and add active tenant

      const trx = await Database.beginTransaction()

      await Database.table('estate_current_tenants')
        .where('estate_id', estate_id)
        .update({ status: STATUS_EXPIRE })
        .transacting(trx)

      const newCurrentTenant = await EstateCurrentTenantService.addCurrentTenant({
        data,
        estate_id,
        trx,
      })

      return newCurrentTenant
    } else {
      //update values except email if no registered user...
      if (!currentTenant.user_id) {
        currentTenant.fill({
          id: currentTenant.id,
          salutation: data.txt_salutation,
          surname: data.surname,
          contract_end: data.contract_end,
          phone_number: data.tenant_tel,
          salutation_int: data.salutation_int,
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
    await EstateCurrentTenant.query().where('id', estateCurrentTenant.id).update({ code: code })

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
    const { estate_id, ...rest } = this.decryptDynamicLink({ data1, data2 })
    const estateCurrentTenant = await EstateCurrentTenantService.validateOutsideTenantInvitation({
      ...rest,
      estate_id,
      email,
      user,
    })

    const trx = await Database.beginTransaction()
    try {
      if (user) {
        await EstateCurrentTenantService.updateOutsideTenantInfo(user, trx, estate_id)
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

  static async validateOutsideTenantInvitation({ id, estate_id, code, expired_time, email, user }) {
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

    return estateCurrentTenant
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

  static async updateOutsideTenantInfo(user, trx = null, estate_id = null) {
    const query = EstateCurrentTenant.query()
      .where('email', user.email)
      .whereNot('status', STATUS_DELETE)

    if (estate_id) {
      query.where('estate_id', estate_id)
    }

    const currentTenant = await query.first()

    if (!currentTenant) {
      return
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
}

module.exports = EstateCurrentTenantService
