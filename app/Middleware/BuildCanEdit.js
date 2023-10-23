'use strict'

const HttpException = require('../Exceptions/HttpException')
const { ROLE_LANDLORD, PUBLISH_STATUS_APPROVED_BY_ADMIN } = require('../constants')
const EstateService = use('App/Services/EstateService')
const {
  exceptions: {
    ERROR_WRONG_ROLE,
    ERROR_NO_AUTHENTICATE,
    WRONG_PARAMS,
    NO_ESTATE_EXIST,
    ERROR_PROPERTY_PUBLISHED_CAN_BE_EDITABLE
  }
} = require('../exceptions')
const BuildingService = use('App/Services/BuildingService')
class BuildCanEdit {
  async handle({ auth, request }, next) {
    // Skip anonymous routes and admin routes check
    if (!auth?.user) {
      throw new HttpException(ERROR_NO_AUTHENTICATE, 400)
    }

    const { role } = auth.user
    if (role !== ROLE_LANDLORD) {
      throw new HttpException(ERROR_WRONG_ROLE, 400)
    }

    const { id } = request.all()

    if (!id && !estate_id) {
      throw new HttpException(WRONG_PARAMS, 400)
    }

    const estates = await EstateService.getEstatesByBuilding({
      user_id: auth.user.id,
      build_id: id
    })

    if (!estates?.length) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }

    if (estates[0].publish_status === PUBLISH_STATUS_APPROVED_BY_ADMIN) {
      throw new HttpException(ERROR_PROPERTY_PUBLISHED_CAN_BE_EDITABLE, 400)
    }

    await next()
  }
}

module.exports = BuildCanEdit
