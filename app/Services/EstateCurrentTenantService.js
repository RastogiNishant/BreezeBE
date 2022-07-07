const User = use('App/Models/User')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const EstateSevice = use('App/Services/EstateService')
const Estate = use('App/Models/Estate')
const MailService = use('App/Services/MailService')
const Database = use('Database')
const crypto = require('crypto')
const { FirebaseDynamicLinks } = use('firebase-dynamic-links')
const uuid = require('uuid')
const moment = require('moment')
const DataStorage = use('DataStorage')

const { ROLE_USER, STATUS_ACTIVE, STATUS_EXPIRE } = require('../constants')
const HttpException = require('../Exceptions/HttpException')

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

  static async inviteTenantToAppByEmail({id, estate_id, user_id}){

  }
  
  static async inviteTenantToApp({ id, estate_id, user_id }) {
    const estate = await EstateSevice.getActiveById(estate_id, { user_id: user_id })
    if (!estate) {
      throw new HttpException('No permission to invite')
    }

    const estateCurrentTenant = await EstateCurrentTenant.query()
      .where('id', id)
      .where('estate_id', estate_id)
      .first()
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
    await DataStorage.setItem(
      code,
      { estate_id: estateCurrentTenant.estate_id },
      'invite_outside_breeze',
      { ttl: 3600 }
    )
    console.log('EstateCurrentTenantServiceCode', code)
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

    //MailService.sendInvitationToOusideTenant(currentTenant.email, shortLink)

    return shortLink
  }
}

module.exports = EstateCurrentTenantService
