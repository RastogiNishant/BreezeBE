const url = require('url')
const { isString, get, isEmpty, capitalize } = require('lodash')
const { ROLE_USER, ROLE_LANDLORD, ROLE_ADMIN } = require('../constants')

const getUrl = (pathname, query = {}) => {
  const base = url.parse(use('Env').get('APP_URL'))
  return url.format({ ...base, pathname, query })
}

const valueToJSON = (value) => {
  if (!isString(value)) {
    return value
  }

  try {
    return JSON.parse(value)
  } catch (e) {
    return null
  }
}

const wrapValidationError = (e) => {
  const { ValidationException } = use('Validator')
  const errors = isEmpty(e.inner) ? [e] : get(e, 'inner', [])

  const messages = errors.reduce((n, i) => {
    return [
      ...n,
      {
        field: i.path,
        validation: i.message,
      },
    ]
  }, [])

  return ValidationException.validationFailed(messages)
}

const getHash = (h) => {
  const string = Math.random().toString(36).substring(h)
  return string.toUpperCase()
}

/**
 * Get City nearest to user
 *
 * @param x
 * @param y
 * @param dist (search radius)
 */
const getGeoRange = (x, y, dist = 50) => {
  const yRate = 0.008993648751445883 * dist
  const xRate = dist / (Math.cos((y / 180) * Math.PI) * 111.189577)

  return { lat1: x - xRate, long1: y - yRate, lat2: x + xRate, long2: y + yRate }
}

const getAuthByRole = (auth, role) => {
  switch (+role) {
    case ROLE_USER:
      return auth.authenticator('jwt')
    case ROLE_LANDLORD:
      return auth.authenticator('jwtLandlord')
    case ROLE_ADMIN:
      return auth.authenticator('jwtAdmin')
    default:
      throw new Error('Invalid role')
  }
}

const capt = (str) => {
  return String(str).split(' ').map(capitalize).join(' ')
}

const localeTemplateToValue = ( str, values ) => {
  return str.split(/{(.*?)}/).map(s => {
    return values.map(k=> s.replace(Object.keys(k),Object.values(k)));
  }).join('');
}

module.exports = {
  getUrl,
  valueToJSON,
  wrapValidationError,
  getHash,
  getGeoRange,
  getAuthByRole,
  capitalize: capt,
  rc:localeTemplateToValue,
}
