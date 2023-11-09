'use strict'
const CityService = require('../../Services/CityService')
const constants = require('../../constants')
const fetch = require('node-fetch')
const { get, map } = require('lodash')

// const GeoAPI = use('GeoAPI')
// const User = use('App/Models/User')
const File = use('App/Classes/File')
const OptionService = use('App/Services/OptionService')
const GeoService = use('App/Services/GeoService')
const CommonService = use('App/Services/CommonService')
const EstateService = use('App/Services/EstateService')
const HttpException = use('App/Exceptions/HttpException')
const ShortenLinkService = use('App/Services/ShortenLinkService')
const Static = use('Static')

class CommonController {
  async getVersionInfo() {
    let pdfServiceResp

    try {
      pdfServiceResp = await (
        await fetch(`http://localhost:${(parseInt(process.env.PORT) || 3000) + 1}/status`)
      ).json()
    } catch (error) {
      pdfServiceResp = { status: 'error', error: 'UNREACHABLE' }
    }

    return {
      app: process.env.APP_NAME,
      main: process.env.APP_URL,
      node: process.version,
      services: [
        {
          pdf: pdfServiceResp
        }
      ]
    }
  }

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
      ROOM_TYPE: OptionService.getRoomTypes(),
      cities: await CityService.getAll()
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
    const { min_rate: minRate, max_rate: maxRate } = range[0]

    response.res({ minRate, maxRate, min_price: sqr * minRate, max_price: maxRate * sqr })
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
        auth.user.terms_acceptance_date = new Date()
        auth.user.terms_acceptance_lang = auth.user.lang
        await auth.user.save()
      }
    } else if (type === 'agreement') {
      if (get(agreement, 'id') === id) {
        auth.user.agreements_id = id
        auth.user.agreements_acceptance_date = new Date()
        auth.user.agreements_acceptance_lang = auth.user.lang
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

  async getExcelTemplate({ request, response }) {
    let { lang } = request.all()
    lang = lang || constants.DEFAULT_LANG
    const templateDir = process.env.EXCEL_TEMPLATE_DIR || 'excel-template'
    const relativePath = `${templateDir}/${lang}_template.xlsx`
    response.res(File.getPublicUrl(relativePath))
  }

  async searchCities({ request, response }) {
    const { country_code: countryCode, city } = request.all()
    const result = await CommonService.searchCities(city, countryCode)
    response.res(result)
  }

  async getAvailableCountries({ response }) {
    return response.res(constants.COUNTRIES)
  }

  async getOffers({ request, response }) {
    const { country_code: countryCode, city, rent_max: rentMax, duration } = request.all()
    let { page, limit = 20 } = request.all()
    if (!page || page < 1) {
      page = 1
    }
    const result = await CommonService.getOffers(
      { rent_max: rentMax, country_code: countryCode, city, duration },
      page,
      limit
    )
    return response.res(result)
  }

  async getOriginalUrl({ request, response }) {
    const { key } = request.all()

    if (key?.length !== parseInt(process.env.SHORTENURL_LENGTH ?? constants.SHORTENURL_LENGTH)) {
      return response.redirect(`https://www.breeze4me.de/404`)
    }

    const shortenLinkData = await ShortenLinkService.get(key)
    if (!shortenLinkData?.link) {
      return response.redirect(`https://www.breeze4me.de/404`)
    }

    response.redirect(shortenLinkData.link)
  }

  async getProtectedUrl({ request, auth, response }) {
    const { uri } = request.all()
    response.res(await File.getProtectedUrl(uri))
  }
}

module.exports = CommonController
