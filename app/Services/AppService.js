'use strict'
const { response } = require('express')
const { createDynamicLink } = require('../Libs/utils')
class AppService {
  static async createTenantDynamicLink() {
    const link = `${process.env.DEEP_LINK}?type=new_tenant`
    return await createDynamicLink(link)
  }
}

module.exports = AppService
