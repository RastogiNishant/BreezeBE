const User = use('App/Models/User')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const EstateSevice = use('App/Services/EstateService')
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
  STATUS_DELETE,
} = require('../constants')
const HttpException = use('App/Exceptions/HttpException')
const UserService = use('App/Services/UserService')
const MatchService = use('App/Services/MatchService')
const l = use('Localize')

class EstateCurrentTenantService {
  static async addCurrentTenant(data, estate_id) {
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

  static async updateCurrentTenant(data, estate_id) {
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

  static async inviteTenantToAppByEmail({ id, estate_id, user_id }) {
    const { estateCurrentTenant, shortLink } = await this.createDynamicLink({
      id,
      estate_id,
      user_id,
    })
    await MailService.sendInvitationToOusideTenant(estateCurrentTenant.email, shortLink)
  }

  static async inviteTenantToAppBySMS({ id, estate_id, user_id }) {
    const { estateCurrentTenant, shortLink } = await this.createDynamicLink({
      id,
      estate_id,
      user_id,
    })

    const txt = l.get('sms.tenant.invitation', DEFAULT_LANG) + ` ${shortLink}`

    if (estateCurrentTenant.phone_number) {
      await SMSService.send({ to: estateCurrentTenant.phone_number, txt })
    } else {
      throw new HttpException('phone number no exist', 500)
    }
  }

  static async getOutsideTenantByEstateId({ id, estate_id }) {
    return await EstateCurrentTenant.query()
      .where('id', id)
      .where('estate_id', estate_id)
      .whereNot('status', STATUS_DELETE)
      .whereNull('user_id')
      .first()
  }

  static async createDynamicLink({ id, estate_id, user_id }) {
    const estate = await EstateSevice.getEstateHasTenant({
      condition: { id: estate_id, user_id: user_id },
    })

    if (!estate) {
      throw new HttpException('No permission to invite')
    }

    const estateCurrentTenant = await this.getOutsideTenantByEstateId({ id, estate_id })
    if (!estateCurrentTenant) {
      throw new HttpException('No record exists')
    }

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

    const uri =
      `&data1=${encodeURIComponent(encDst)}` + `&data2=${encodeURIComponent(iv.toString('base64'))}`

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
      estateCurrentTenant,
      shortLink,
    }
  }

  static async acceptOutsideTenant({ data1, data2, password }) {
    const { id, estate_id, code, expired_time } = this.decryptDynamicLink({ data1, data2 })

    const estateCurrentTenant = await this.getOutsideTenantByEstateId({ id, estate_id })
    if (!estateCurrentTenant) {
      throw new HttpException('No record exists')
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
      const userData = {
        role: ROLE_USER,
        secondname: estateCurrentTenant.surname,
        phone: estateCurrentTenant.phone_number,
        password: password,
      }

      await UserService.signUp(
        { email: estateCurrentTenant.email, firstname: '', ...userData },
        trx
      )
      trx.commit()
      return true
    } catch (e) {
      trx.rollback()
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
    await currentTenant.save(trx)

    //if current tenant, he needs to save to match as a final match
    if (currentTenant.estate_id) {
      const matches = await MatchService.getMatches(user.id, currentTenant.estate_id)

      if (!matches) {
        await MatchService.addFinalTenant(
          { user_id: user.id, estate_id: currentTenant.estate_id },
          trx
        )
      }
    }
  }
}

module.exports = EstateCurrentTenantService
