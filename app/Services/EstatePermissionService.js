'use strict'

const EstatePermission = use('App/Models/EstatePermission')
const UserPremiumPlan = use('App/Models/UserPremiumPlan')
const HttpException = use('App/Exceptions/HttpException')
const UserService = use('App/Services/UserService')

const Logger = use('Logger')
const Database = use('Database')
const { isObject, pick, get } = require('lodash')
const { PROPERTY_MANAGE_REQUEST, PROPERTY_MANAGE_ALLOWED, ROLE_LANDLORD } = require('../constants')

class EstatePermissionService {
  /**
   *
   * @param {*}
   * userId: property manager's user_id
   *  landlordIds: [1,3,5]
   */
  static async requestPermissionToLandlordById(userId, landlordIds) {
    if (!landlordIds || !landlordIds.length) {
      new HttpException('There is no landlord Ids provided', 400)
    }
    try {
      const data = await Promise.all(
        landlordIds.map(async (lId) => {
          const record = {
            property_manager_id: userId,
            landlord_id: lId,
            status: PROPERTY_MANAGE_REQUEST,
          }

          return await EstatePermission.findOrCreate(
            pick(record, ['property_manager_id', 'landlord_id']),
            record
          )
        })
      )

      return data
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  /**
   *
   * @param {*}
   * userId: property manager's user_id
   *  landlordIds: [1,3,5]
   */

  /**
   *
   * @param {*} data
   *  landlordEmails: ['landlord@gmail.com','landlord@gmail.com','landlord@gmail.com']
   */
  static async requestPermissionToLandlordByEmail(userId, landlordEmails) {
    if (!landlordEmails || !isObject(landlordEmails) || !landlordEmails.length) {
      new HttpException('There is no landlord emails provided', 400)
    }
    try {
      const landlordIds = await UserService.getByEmail(landlordEmails, ROLE_LANDLORD)
      return await EstatePermissionService.requestPermissionToLandlordById(userId, landlordIds)
    } catch (e) {
      new HttpException(e.message, 400)
    }
  }

  /**
   * @param
   *
   * userId: Landlord's user_id
   * pmIds: Propery Managers' user_id
   * permission: Interger : PROPERTY_MANAGE_ALLOWED|PROPERTY_MANAGE_REQUEST
   */
  static async permissionToPropertyManager(userId, pmIds, permission ) {
    try {
      if (!pmIds || !pmIds.length) {
        new HttpException('There is no landlord Ids provided', 400)
      }

      try {
        const data = await Promise.all(
          pmIds.map(async (pmId) => {
            const estatePermission = await EstatePermission.query()
            .where('property_manager_id', pmId )
            .where({ 'landlord_id': userId })
            .first()
            if( estatePermission ){
              return await EstatePermission.query()
              .where('property_manager_id', pmId)
              .where('landlord_id', userId)
              .update({ status: permission })
            }else {
              return await EstatePermission.createItem({
                  property_manager_id: pmId,
                  landlord_id: userId,
                  status: permission,
                })
            }
          })
        )

        return data
      } catch (e) {
        throw new HttpException(e.message, 400)
      }
    } catch (e) {
      new HttpException(e.message, 400)
    }
  }

  static async deletePermissionByLandlord(userId, pmIds ) {
    const data = await Promise.all(
      pmIds.map(async (pmId) => {
        return await EstatePermission.query()
          .delete()
          .where('property_manager_id', pmId)
          .where('landlord_id', userId)
      })
    )
    return data
  }

  static async deletePermissionByPropertyManager(userId, landlordIds) {
    const data = await Promise.all(
      landlordIds.map(async (lId) => {

        return await EstatePermission.query()
          .where('property_manager_id', userId)
          .where('landlord_id', lId)
          .delete()
      })
    )
    return data
  }

  static async getLandlordIds( userId, status ) {
    const landlords = await EstatePermission.query()
      .where('property_manager_id', userId)
      .where('status', status )
      .select('landlord_id')
      .fetch()
    
    const lds = landlords.toJSON().map( lr => get(lr,'landlord_id') )      
    return lds
  }

  static async getLandlordHasPermissionByEmail( propertyManagerId, landlord_email ) {
    const estatePermission = await EstatePermission.query('landlord_id')
      .innerJoin({ _u: 'users' }, '_u.id', 'estate_permissions.landlord_id')
      .where('property_manager_id', propertyManagerId)
      .where('_u.email', landlord_email)
      .where('estate_permissions.status', PROPERTY_MANAGE_ALLOWED)
      .first()
    
    return estatePermission      
    return []
  }
}
module.exports = EstatePermissionService
