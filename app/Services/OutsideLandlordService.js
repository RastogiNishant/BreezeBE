'use strict'

const moment = require('moment')
const uuid = require('uuid')
const crypto = require('crypto')
const HttpException = require('../Exceptions/HttpException')
const {
  ROLE_LANDLORD,
  ERROR_OUTSIDE_LANDLORD_INVITATION_INVALID,
  DEFAULT_LANG,
  CHAT_TYPE_MESSAGE,
  CHAT_EDIT_STATUS_UNEDITED,
  WEBSOCKET_EVENT_LANDLORD_INVITED_FROM_TENANT,
} = require('../constants')
const {
  exceptions: { NOT_FOUND_OUTSIDE_INVITAION },
  exceptionCodes: { NOT_FOUND_OUTSIDE_INVITAION_ERROR_CODE },
} = require('../exceptions')
const MailService = use('App/Services/MailService')
const Task = use('App/Models/Task')
const { createDynamicLink } = require('../Libs/utils')
const Chat = use('App/Models/Chat')
const TaskService = require('./TaskService')
const UserService = require('./UserService')
const l = use('Localize')
const Database = use('Database')
const Ws = use('Ws')

class OutsideLandlordService {
  static async handleTaskWithoutEstate(task, trx) {
    if (!task) {
      throw new HttpException('No task exists', 500)
    }
    if (!task.email || !task.property_address) {
      return
    }

    const code = uuid.v4()
    await Task.query().where('id', task.id).update({ landlord_identify_key: code }).transacting(trx)
  }

  static async noticeInvitationToLandlord({ user, task_id }) {
    try {
      const task = await require('./TaskService').getUnassignedTask(task_id)
      if (
        !task ||
        !task.activeTasks ||
        !task.activeTasks.length ||
        !task?.activeTasks?.[0]?.email ||
        !task?.activeTasks?.[0]?.property_address
      ) {
        return
      }
      const { shortLink, lang, user_id } = await this.createDynamicLink(task.activeTasks[0])

      //send websocket if invited landlord is an existing user
      if (user_id) {
        this.emitLandlordInvitationFromTenant({ user_id, data: { ...task } })
      }

      MailService.inviteLandlordFromTenant({
        prospect_email: user.email,
        task: task.activeTasks[0],
        link: shortLink,
        lang,
      })
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  static async isExistLandlord(task) {
    const landlords = (
      await require('./UserService').getByEmailWithRole([task.email], ROLE_LANDLORD)
    ).rows
    return landlords && landlords.length
  }

  static async createDynamicLink(task) {
    const iv = crypto.randomBytes(16)
    const password = process.env.CRYPTO_KEY
    if (!password) {
      throw new HttpException('Server configuration error')
    }
    const key = Buffer.from(password)
    const cipher = crypto.createCipheriv('aes-256-ctr', key, iv)

    const time = moment().utc().format('YYYY-MM-DD HH:mm:ss')

    const txtSrc = JSON.stringify({
      id: task.id,
      code: task.code,
      email: task.email,
      expired_time: time,
    })

    let encDst = cipher.update(txtSrc, 'utf8', 'base64')
    encDst += cipher.final('base64')

    let uri =
      `&data1=${encodeURIComponent(encDst)}` +
      `&data2=${encodeURIComponent(iv.toString('base64'))}&landlord_invite=true` +
      `&email=${task.email}`

    const landlords = (
      await require('./UserService').getByEmailWithRole([task.email], ROLE_LANDLORD)
    ).rows

    if (landlords && landlords.length) {
      uri += `&user_id=${landlords[0].id}`
    }

    const lang = landlords?.[0]?.lang || DEFAULT_LANG
    uri += `&lang=${lang}`

    const shortLink = await createDynamicLink(
      `${process.env.DEEP_LINK}?type=outsideinvitation${uri}`,
      `${process.env.SITE_URL}/connect?type=outsideinvitation&tab=1${uri}`
    )
    return {
      id: task.id,
      email: task.email,
      shortLink,
      lang,
      user_id: landlords?.[0]?.id,
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

  static async updateOutsideLandlordInfo({ new_email, data1, data2 }, trx) {
    const { id, code, email } = await this.decryptDynamicLink({ data1, data2 })
    await Task.query()
      .where('id', id)
      .where('email', email)
      .where('landlord_identify_key', code)
      .update({ email: new_email })
      .transacting(trx)
  }

  static async updateTaskLandlord({ landlord_id, email }, trx) {
    await Task.query().where('email', email).update({ landlord_id }).transacting(trx)
  }

  static async cancelInvitation({ landlord_id, email, task_id }) {
    const task = await TaskService.get(task_id)
    const trx = await Database.beginTransaction()
    try {
      if (task.email !== email) {
        throw new HttpException(
          NOT_FOUND_OUTSIDE_INVITAION,
          400,
          NOT_FOUND_OUTSIDE_INVITAION_ERROR_CODE
        )
      }
      await Task.query()
        .where('id', task_id)
        .update({ email: null, landlord_identify_key: null })
        .transacting(trx)

      let lang = DEFAULT_LANG
      if (task.tenant_id) {
        lang = await require('./UserService').getUserLang([task.tenant_id])
      }

      await Chat.createItem(
        {
          sender_id: landlord_id,
          receiver_id: task.tenant_id,
          task_id,
          type: CHAT_TYPE_MESSAGE,
          text: l.get('prospect.notification.event.declined_invitation', lang),
          edit_status: CHAT_EDIT_STATUS_UNEDITED,
        },
        trx
      )
      await trx.commit()
      return true
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400, e.code || 0)
    }
  }

  static async acceptTenantInvitation({ task_id, user_id, email, estate_id }) {
    await require('./EstateService').hasPermission({ id: estate_id, user_id })
    const trx = await Database.beginTransaction()
    try {
      const task = await TaskService.get(task_id)
      if (task.email !== email) {
        throw new HttpException(
          NOT_FOUND_OUTSIDE_INVITAION,
          400,
          NOT_FOUND_OUTSIDE_INVITAION_ERROR_CODE
        )
      }

      let lang = DEFAULT_LANG
      if (task.tenant_id) {
        lang = await require('./UserService').getUserLang([task.tenant_id])
      }

      const prospect = (await UserService.getById(task.tenant_id)).toJSON()
      await require('./EstateCurrentTenantService').updateOutsideTenantInfo(
        { user: prospect, estate_id },
        trx
      )

      await Task.query()
        .where('email', email)
        .update({
          email: null,
          landlord_identify_key: null,
          property_address: null,
          address_detail: null,
          landlord_id: user_id,
          estate_id,
        })
        .transacting(trx)

      await Chat.createItem(
        {
          sender_id: user_id,
          receiver_id: task.tenant_id,
          task_id,
          type: CHAT_TYPE_MESSAGE,
          text: l.get('prospect.notification.next.successful_invitation', lang),
          edit_status: CHAT_EDIT_STATUS_UNEDITED,
        },
        trx
      )
      await trx.commit()
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400, e.code || 0)
    }
  }

  static async emitLandlordInvitationFromTenant({ user_id, data }) {
    const channel = `landlord:*`
    const topicName = `landlord:${user_id}`
    const topic = Ws.getChannel(channel).topic(topicName)

    if (topic) {
      topic.broadcast(WEBSOCKET_EVENT_LANDLORD_INVITED_FROM_TENANT, data)
    }
  }
}

module.exports = OutsideLandlordService
