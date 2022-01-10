'use strict'

const { isObject, difference, pick, get } = require('lodash')
const { ROLE_LANDLORD, ROLE_PROPERTY_MANAGER, PROPERTY_MANAGE_REQUEST } = require('../../constants')
const HttpException = require('../../Exceptions/HttpException')
const UserService = use('App/Services/UserService')
const EstatePermissionService = use('App/Services/EstatePermissionService')
const EstatePermission = use('App/Models/EstatePermission')

class EstatePermissionController {
  async userExists(auth, ids, role) {
    if (!auth || !auth.user) {
      throw new HttpException('Authorize please', 400)
    }
    try {
      if (!ids || !ids.length) {
        throw new HttpException('There is no property Ids provided', 400)
      }

      const landLordIds = await UserService.getByIdWithRole(ids, role)

      const exceptIds = difference(ids, landLordIds)
      if (exceptIds && exceptIds.length) {
        const data = {
          message: `These ids don't have ${
            role === ROLE_PROPERTY_MANAGER ? 'Property manager' : 'landlord'
          } roles`,
          ids: exceptIds,
        }
        throw new HttpException(data, 400)
      }
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
    return true
  }
  /**
   *
   * @param {*} param0
   * Ask for landlords to manage property By Ids
   */
  async requestPermissionToLandlordById({ request, auth, response }) {
    let { ids } = request.all()
    try {
      await this.userExists(auth, ids, ROLE_LANDLORD)
      const result = await EstatePermissionService.requestPermissionToLandlordById(
        auth.user.id,
        ids
      )
      response.res(result)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   * @param {*} param0
   * Ask for landlords to manage property By landlords'emails
   */

  async requestPermissionToLandlordByEmail({ request, auth, response }) {
    let { emails } = request.all()

    if (!auth || !auth.user) {
      throw new HttpException('Authorize please', 400)
    }

    try {
      if (!isObject(emails)) {
        emails = JSON.parse(emails)
      }
      if (!emails || !emails.length) {
        throw new HttpException('There is no landlord emails provided', 400)
      }

      const landLords = (await UserService.getByEmailWithRole(emails, ROLE_LANDLORD)).toJSON({
        isOwner: true,
        publicOnly: true,
      })

      const exceptIds = difference(
        emails,
        landLords.map((lr) => get(pick(lr, ['email']), 'email'))
      )

      if (exceptIds && exceptIds.length) {
        const data = {
          message: "These emails don't have landlord roles",
          ids: exceptIds,
        }
        throw new HttpException(data, 400)
      }

      const result = await EstatePermissionService.requestPermissionToLandlordById(
        auth.user.id,
        landLords.map((lr) => get(pick(lr, ['id']), 'id'))
      )
      response.res(result)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async givePermissionToPropertyManager({ request, auth, response }) {
    try {
      const { ids } = request.all()
      await this.userExists(auth, ids, ROLE_PROPERTY_MANAGER)
      const result = await EstatePermissionService.permissionToPropertyManager(auth.user.id, ids)

      response.res(result)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   * @param {*} param0
   * Allow permission to property managers to manage property By property manager Ids
   */

  async permissionToPropertyManager({ request, auth, response }) {
    let { ids, status } = request.all()

    if (!auth || !auth.user) {
      throw new HttpException('Authorize please', 400)
    }
    try {
      if (!isObject(ids)) {
        ids = JSON.parse(ids)
      }

      await this.userExists(auth, ids, ROLE_PROPERTY_MANAGER)

      const result = await EstatePermissionService.permissionToPropertyManager(
        auth.user.id,
        ids,
        status
      )
      response.res(result)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }

    response.res(auth.user.id, 200)
  }

  /**
   *
   * @param {*} param0
   * cancel permission not to let property manager manage his/her property
   */

  async deletePermissionByLandlord({ request, auth, response }) {
    let { ids } = request.all()
    if (!auth || !auth.user) {
      throw new HttpException('Authorize please', 400)
    }

    try {
      if (!isObject(ids)) {
        ids = JSON.parse(ids)
      }
      const result = await EstatePermissionService.deletePermissionByLandlord(auth.user.id, ids)
      response.res(result)
    } catch (e) {
      throw new HttpException('Authorize please', 400)
    }
  }

  /**
   *
   * @param {*} param0
   * delete permission to manager property by property manage himself
   */

  async deletePermissionByPM({ request, auth, response }) {
    let { ids } = request.all()
    if (!auth || !auth.user) {
      throw new HttpException('Authorize please', 400)
    }

    try {
      if (!isObject(ids)) {
        ids = JSON.parse(ids)
      }
      const result = await EstatePermissionService.deletePermissionByPropertyManager(
        auth.user.id,
        ids
      )
      response.res(result)
    } catch (e) {
      throw new HttpException('Authorize please', 400)
    }
  }

  async getLandlords({ request, auth, response }) {
    const { page, limit, ...params } = request.all()
    const filter = {
      property_manager_id: auth.user.id,
      ...params,
    }
    const result = await EstatePermission.query()
      .where(function () {
        if (filter['status']) {
          this.where('status', filter['status'])
        }
      })
      .with('landlord')
      .orderBy('id', 'desc')
      .paginate(page, limit)

    response.res(result)
  }

  async getPermittedPropertyManagers({ request, auth, response }) {
    const { page, limit, ...params } = request.all()
    const filter = {
      landlord_id: auth.user.id,
      ...params,
    }
    const result = await await EstatePermission.query()
      .where(function () {
        if (filter['status']) {
          this.where('status', filter['status'])
        }
      })
      .with('propertyManager')
      .orderBy('id', 'desc')
      .paginate(page, limit)
    response.res(result)
  }

  async deletePermissionLandlordByEmail({ request, auth, response }) {}
}

module.exports = EstatePermissionController
