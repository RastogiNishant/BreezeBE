'use strict'

const HttpException = require("../../Exceptions/HttpException")

const NoticeService = use('App/Services/NoticeService')
const UserService = use('App/Services/UserService')
const {NOTICE_TYPE_ZENDESK_NOTIFY_ID} = require('../../constants')

class NoticeController {
  /**
   *
   */
  async getNotices({ request, auth, response }) {
    const userId = auth.user.id
    const { estate_id, date_to, date_from } = request.all()

    let notices = await NoticeService.getUserNoticesList(userId, date_to, date_from)
    if( estate_id ) {
      notices = notices.filter( notice => notice.data && notice.data.estate_id && notice.data.estate_id == estate_id )
    }
    response.res(notices)
  }

  /**
   *
   */
  async sendTestNotification({ request, auth, response }) {
    const userId = auth.user.id
    const { estate_id, data, type } = request.all()

    const result = await NoticeService.sendTestNotification(userId, type, estate_id, data)

    response.res(result)
  }
  async acceptZendeskNotification( {request, response} ) {
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
    if( !devices || !notification ){
      throw new HttpException( 'Bad request', 400 )
    }
    const users = await UserService.getUserIdsByToken(devices)
    const userIds = users.map(u=>u.id);

    NoticeService.zendeskNotice(userIds, notification)

    response.res(userIds)
  }
}

module.exports = NoticeController