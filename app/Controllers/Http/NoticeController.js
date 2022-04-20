'use strict'

const HttpException = require('../../Exceptions/HttpException')
const Promise = require('bluebird')

const NoticeService = use('App/Services/NoticeService')
const UserService = use('App/Services/UserService')
const {
  NOTICE_TYPE_ZENDESK_NOTIFY_ID,
  NOTICE_TYPE_LANDLORD_FILL_PROFILE,
  NOTICE_TYPE_LANDLORD_NEW_PROPERTY,
  NOTICE_TYPE_LANDLORD_TIME_FINISHED,
  NOTICE_TYPE_LANDLORD_CONFIRM_VISIT,
  NOTICE_TYPE_LANDLORD_VISIT30M,
  NOTICE_TYPE_LANDLORD_MATCH,
  NOTICE_TYPE_LANDLORD_DECISION,
  NOTICE_TYPE_PROSPECT_NEW_MATCH,
  NOTICE_TYPE_PROSPECT_MATCH_LEFT,
  NOTICE_TYPE_PROSPECT_INVITE,
  NOTICE_TYPE_PROSPECT_VISIT3H,
  NOTICE_TYPE_PROSPECT_VISIT90M,
  NOTICE_TYPE_LANDLORD_VISIT90M,
  NOTICE_TYPE_PROSPECT_VISIT30M,
  NOTICE_TYPE_PROSPECT_COMMIT,
  NOTICE_TYPE_PROSPECT_REJECT,
  NOTICE_TYPE_PROSPECT_NO_ACTIVITY,
  NOTICE_TYPE_PROSPECT_PROFILE_EXPIRE,
  NOTICE_TYPE_PROSPECT_COME,
  NOTICE_TYPE_PROSPECT_KNOCK,
  NOTICE_TYPE_CANCEL_VISIT,
  NOTICE_TYPE_VISIT_DELAY,
  NOTICE_TYPE_PROSPECT_INVITE_IN,
} = require('../../constants')

class NoticeController {
  /**
   *
   */
  async getNotices({ request, auth, response }) {
    const userId = auth.user.id
    const { estate_id, date_to, date_from } = request.all()

    let notices = await NoticeService.getUserNoticesList(userId, date_to, date_from)
    if (estate_id) {
      notices = notices.filter(
        (notice) => notice.data && notice.data.estate_id && notice.data.estate_id == estate_id
      )
    }
    response.res(notices)
  }

  /**
   *
   */
  async sendTestNotification({ request, auth, response }) {
    const userId = auth.user.id
    const { estate_id, data, type } = request.all()

    const notification_types = [
      NOTICE_TYPE_LANDLORD_FILL_PROFILE,
      NOTICE_TYPE_LANDLORD_NEW_PROPERTY,
      NOTICE_TYPE_LANDLORD_TIME_FINISHED,
      NOTICE_TYPE_LANDLORD_CONFIRM_VISIT,
      NOTICE_TYPE_LANDLORD_VISIT30M,
      NOTICE_TYPE_LANDLORD_MATCH,
      NOTICE_TYPE_LANDLORD_DECISION,
      NOTICE_TYPE_PROSPECT_NEW_MATCH,
      NOTICE_TYPE_PROSPECT_MATCH_LEFT,
      NOTICE_TYPE_PROSPECT_INVITE,
      NOTICE_TYPE_PROSPECT_VISIT3H,
      NOTICE_TYPE_PROSPECT_VISIT90M,
      NOTICE_TYPE_LANDLORD_VISIT90M,
      NOTICE_TYPE_PROSPECT_VISIT30M,
      NOTICE_TYPE_PROSPECT_COMMIT,
      NOTICE_TYPE_PROSPECT_REJECT,
      NOTICE_TYPE_PROSPECT_NO_ACTIVITY,
      NOTICE_TYPE_PROSPECT_PROFILE_EXPIRE,
      NOTICE_TYPE_PROSPECT_COME,
      NOTICE_TYPE_PROSPECT_KNOCK,
      NOTICE_TYPE_CANCEL_VISIT,
      NOTICE_TYPE_LANDLORD_CONFIRM_VISIT,
      NOTICE_TYPE_VISIT_DELAY,
      NOTICE_TYPE_PROSPECT_INVITE_IN,
    ]
    await Promise.map(notification_types, async (type) => {
      await NoticeService.sendTestNotification(userId, type, estate_id, data)
    })
    //const result = await NoticeService.sendTestNotification(userId, type, estate_id, data)
    response.res(true)
    //response.res(result)
  }
  async acceptZendeskNotification({ request, response }) {
    // const express = require("express");
    // const crypto = require("crypto");
    // require("body-parser-xml")(express);
    // const signature = req.headers["x-zendesk-webhook-signature"];
    // const timestamp = req.headers["x-zendesk-webhook-signature-timestamp"];
    //const body = request.rawBody;
    // const {ticket} = request.all()
    // response.res(ticket?ticket:true)

    const { devices, notification } = request.all()
    request.header('x-header-name', 'default value')
    if (!devices || !notification) {
      throw new HttpException('Bad request', 400)
    }
    const users = await UserService.getUserIdsByToken(devices)
    const userIds = users.map((u) => u.id)

    NoticeService.zendeskNotice(userIds, notification)

    response.res(userIds)
  }
}

module.exports = NoticeController
