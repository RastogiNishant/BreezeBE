'use strict'

const constants = require('../../constants')
const { get, map } = require('lodash')
const P = require('bluebird')

// const GeoAPI = use('GeoAPI')
// const User = use('App/Models/User')
const OptionService = use('App/Services/OptionService')
const GeoService = use('App/Services/GeoService')
const CommonService = use('App/Services/CommonService')
const EstateService = use('App/Services/EstateService')
const UserService = use('App/Services/UserService')
const TenantService = use('App/Services/TenantService')
const HttpException = use('App/Exceptions/HttpException')

const Estate = use('App/Models/Estate')

const Static = use('Static')

class CommonController {
  /**
   * Just for test some api
   */
  async ping() {
    // FETCH USER ZONE POINTS
    // await UserService.calcUserZones()
    // PUBLISH ESTATES
    // const estates = await Estate.all()
    // await P.map(estates.rows, (e) => EstateService.publishEstate(e), { concurrency: 1 })

    return 'pong'
  }

  /**
   *
   */
  async getReferences({ response }) {
    const result = {
      constants,
      options: await OptionService.getOptions(),
    }
    response.res(result)
  }

  /**
   * Get available street
   */
  async searchStreet({ request, response }) {
    const { query } = request.all()
    const result = await GeoService.getBuildQualityAutosuggest(query)
    response.res(result)
  }

  /**
   *
   */
  async calcRentPrice({ request, response }) {
    const { year, sqr, address } = request.all()
    let range
    try {
      const quality = await GeoService.getQualityByAddress({ year, sqr, address })
      range = await EstateService.getSqrRange({ year, sqr, quality })
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
    if (!range.length) {
      throw new HttpException('Not found', 404)
    }
    const { min_rate, max_rate } = range[0]

    response.res({ min_rate, max_rate, min_price: sqr * min_rate, max_price: max_rate * sqr })
  }

  /**
   *
   */
  async getTermsAndConditions({ request, response }) {
    const { terms, agreement } = await Static.getData()
    response.res({ terms, agreement })
  }

  /**
   *
   */
  async acceptTermsAndConditions({ request, auth, response }) {
    const { type, id } = request.all()
    const { terms, agreement } = await Static.getData()
    if (type === 'terms') {
      if (get(terms, 'id') === id) {
        auth.user.terms_id = id
        await auth.user.save()
      }
    } else if (type === 'agreement') {
      if (get(agreement, 'id') === id) {
        auth.user.agreements_id = id
        await auth.user.save()
      }
    }

    response.res(true)
  }

  /**
   *
   */
  async searchProfession({ request, response }) {
    const { query } = request.all()
    const result = await CommonService.searchProfession(query)
    response.res(map(result, (i) => i.value))
  }
}

module.exports = CommonController
