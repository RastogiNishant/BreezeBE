const Promise = require('bluebird')
const { get, isEmpty } = require('lodash')
const Request = require('../Libs/Request')

const ROUTING_DRIVE = 'drive'
const ROUTING_TRANSIT = 'transit'
const ROUTING_BICYCLE = 'bicycle'
const ROUTING_WALK = 'walk'

const BATCHED_ROUTING_INPUTS = [
  { id: ROUTING_DRIVE, params: { mode: ROUTING_DRIVE } },
  { id: ROUTING_TRANSIT, params: { mode: ROUTING_TRANSIT } },
  { id: ROUTING_BICYCLE, params: { mode: ROUTING_BICYCLE } },
  { id: ROUTING_WALK, params: { mode: ROUTING_WALK } },
]

const BATCHED_ISOLINE_INPUTS = [
  { id: ROUTING_DRIVE, params: { mode: ROUTING_DRIVE } },
  { id: ROUTING_TRANSIT, params: { mode: ROUTING_TRANSIT } },
  { id: ROUTING_BICYCLE, params: { mode: ROUTING_BICYCLE } },
  { id: ROUTING_WALK, params: { mode: ROUTING_WALK } },
]

const PLACE_SCHOOL = 'education.school'
const PLACE_HOSPITAL = 'healthcare.hospital'
const PLACE_MARKET = 'commercial.supermarket,commercial.marketplace'
const PLACE_BUSSTOP = 'public_transport.bus'
const PLACE_SUBWAY = 'public_transport.subway'
const PLACE_RAIL = 'public_transport.light_rail'
const PLACE_PARK = 'leisure.park,national_park'
const PLACE_KINDERGARTEN = 'childcare.kindergarten'
const BATCHED_PLACE_INPUTS = [
  { id: PLACE_SCHOOL, params: { categories: PLACE_SCHOOL } },
  { id: PLACE_HOSPITAL, params: { categories: PLACE_HOSPITAL } },
  { id: PLACE_MARKET, params: { categories: PLACE_MARKET } },
  { id: PLACE_BUSSTOP, params: { categories: PLACE_BUSSTOP } },
  { id: PLACE_SUBWAY, params: { categories: PLACE_SUBWAY } },
  { id: PLACE_RAIL, params: { categories: PLACE_RAIL } },
  { id: PLACE_PARK, params: { categories: PLACE_PARK } },
  { id: PLACE_KINDERGARTEN, params: { categories: PLACE_KINDERGARTEN } },
]

class GeoPify {
  constructor({ apiKey }) {
    this.settings = { apiKey }
    this.rootUrl = 'https://api.geoapify.com'
    this.request = new Request(this.rootUrl)
  }

  /**
   *
   */
  async promisedAnswer(id, delay = 2000, ticks = 10) {
    if (ticks < 1) {
      throw new Error('Request tries exceeded')
    }

    return Promise.delay(delay).then(() => {
      return this.getBatchedAnswer({ id }, delay, ticks - 1)
    })
  }

  /**
   *
   */
  getBatchedAnswer({ id }, delay = 2000, ticks = 3) {
    return this.request
      .send({
        url: '/v1/batch',
        data: { id, apiKey: this.settings.apiKey },
      })
      .then(async (response) => {
        if (response.status === 'pending') {
          return this.promisedAnswer(id, delay, ticks)
        }
        return response
      })
  }

  /**
   *
   */
  makeBatchedCall({ api, inputs, params }) {
    return this.request
      .send({
        url: `/v1/batch?apiKey=${this.settings.apiKey}`,
        data: { api, inputs, params },
        method: 'POST',
      })
      .then(({ id }) => {
        return this.promisedAnswer(id)
      })
      .catch((e) => {
        console.log('err', e)
      })
  }

  /**
   *
   */
  getBatchedPlaces({ lon, lat }) {
    const api = '/v2/places'
    const inputs = BATCHED_PLACE_INPUTS
    const params = {
      limit: '1',
      filter: `circle:${lon},${lat},5000`,
      bias: `proximity:${lon},${lat}`,
    }

    return this.makeBatchedCall({ api, params, inputs }).then((r) => {
      return get(r, 'results')
    })
  }

  /**
   *
   */
  getBatchedRouting({ from, to }) {
    const api = '/v1/routing'
    const inputs = BATCHED_ROUTING_INPUTS
    const params = {
      waypoints: `${from.lat},${from.lon}|${to.lat},${to.lon}`,
    }

    return this.makeBatchedCall({ api, params, inputs })
  }

  /**
   *
   */
  getBatchedIsoline({ lat, lon }) {
    const api = '/v1/isoline'
    const inputs = BATCHED_ISOLINE_INPUTS
    const params = {
      lat,
      lon,
      type: 'time',
      range: '1800',
    }

    return this.makeBatchedCall({ api, params, inputs })
  }

  /**
   *
   */
  getAddressSuggestions = (text) => {
    return this.request
      .send({
        url: '/v1/geocode/autocomplete',
        data: { text, apiKey: this.settings.apiKey },
        method: 'GET',
      })
      .then((response) => {
        const data = response.features || []
        if (isEmpty(data)) {
          return null
        }

        const item = response.features.find((i) => get(i, 'properties.result_type') === 'building')
        const [lon, lat] = get(item, 'geometry.coordinates') || []
        return { lon, lat }
      })
      .catch((e) => {
        console.log(e.message)
        return null
      })
  }

  /**
   *
   */
  async getIsoline(lat, lon, mode, range) {
    const data = {
      apiKey: this.settings.apiKey,
      type: 'time',
      lat,
      lon,
      mode,
      range,
    }

    return this.request.send({
      url: '/v1/isoline',
      data,
      method: 'GET',
    })
  }
}

module.exports = GeoPify
