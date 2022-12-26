'use strict'

const moment = require('moment')
const uuid = require('uuid')
const crypto = require('crypto')
const { FirebaseDynamicLinks } = require('firebase-dynamic-links')
const HttpException = use('HttpException')
const { ROLE_LANDLORD, ERROR_OUTSIDE_LANDLORD_INVITATION_INVALID } = require('../constants')
const MailService = use('App/Services/MailService')
const Task = use('App/Models/Task')
class OutsideLandlordService {
  static async handleTaskWithoutEstate(task, trx) {
    if (!task) {
      throw new HttpException('No task exists', 500)
    }
    if (!task.email || !task.address) {
      return
    }
    if (await this.isExistLandlord(task)) {
      //if property is 100% accurate
      const estates = await require('./EstateService').getEstateByAddress(task.email)
      if (!estates || !estates.length) {
        await this.inviteLandlordFromTenant(task, trx)
      }
    }
  }

  static async inviteLandlordFromTenant(task, trx) {
    const { code, shortLink } = await this.createDynamicLink(task)
    await Task.query().where('id', task.id).update({ landlord_identify_key: code }.transacting(trx))
    await MailService.inviteLandlordFromTenant({
      task: task.toJSON(),
      link: shortLink,
    })
    return true
  }

  static async isExistLandlord(task) {
    if (task.email) {
      const landlords = (
        await require('./UserService').getByEmailWithRole([task.email], ROLE_LANDLORD)
      ).rows
      if (landlords && landlords.length) {
        return true
      }
      return false
    }
    return true
  }

  static async createDynamicLink(task, trx) {
    const iv = crypto.randomBytes(16)
    const password = process.env.CRYPTO_KEY
    if (!password) {
      throw new HttpException('Server configuration error')
    }
    const key = Buffer.from(password)
    const cipher = crypto.createCipheriv('aes-256-ctr', key, iv)

    const time = moment().utc().format('YYYY-MM-DD HH:mm:ss')
    const code = uuid.v4()

    const txtSrc = JSON.stringify({
      id: task.id,
      code: code,
      email: task.email,
      expired_time: time,
    })

    let encDst = cipher.update(txtSrc, 'utf8', 'base64')
    encDst += cipher.final('base64')

    let uri =
      `&data1=${encodeURIComponent(encDst)}` +
      `&data2=${encodeURIComponent(iv.toString('base64'))}&landord_invite=1`

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
          iosAppStoreId: process.env.IOS_APPSTORE_ID,
        },
      },
    })
    return {
      id: task.id,
      email: task.email,
      shortLink,
    }
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

      const { id, code, email, expired_time } = JSON.parse(decDst)

      return { id, code, email, expired_time }
    } catch (e) {
      console.log(e)
      throw new HttpException('Params are wrong', 400, ERROR_OUTSIDE_LANDLORD_INVITATION_INVALID)
    }
  }

  static async updateOutsideLandlordInfo({ new_email, data1, data2 }) {
    const { id, code, email } = await this.decryptDynamicLink({ data1, data1 })
    const taskUpdated = await Task.query()
      .where('id', id)
      .where('email', email)
      .where('landlord_identify_key', code)
      .update({ email: new_email })
  }
}

module.exports = OutsideLandlordService
