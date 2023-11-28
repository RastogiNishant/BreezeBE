const url = require('url')
const { FirebaseDynamicLinks } = use('firebase-dynamic-links')

const { isString, get, isEmpty, capitalize, includes, trim } = require('lodash')
const {
  ROLE_USER,
  ROLE_LANDLORD,
  ROLE_ADMIN,
  ROLE_PROPERTY_MANAGER,
  GERMAN_HOLIDAYS,
  ENERGY_CLASS_USING_EFFICIENCY,
  ESTATE_FLOOR_DIRECTION_LEFT,
  ESTATE_FLOOR_DIRECTION_RIGHT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT_LEFT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT_RIGHT
} = require('../constants')

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
        validation: i.message
      }
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
    case ROLE_PROPERTY_MANAGER:
      return auth.authenticator('jwtPropertyManager')
    default:
      throw new Error('Invalid role')
  }
}

const capt = (str) => {
  return String(str).split(' ').map(capitalize).join(' ')
}

const localeTemplateToValue = (str, values) => {
  return str
    .split(/{{(.*?)}}/)
    .map((s) => {
      return values.map((k) => s.replace(Object.keys(k), Object.values(k)))
    })
    .join('')
}

/**
 * Checks if the given date is in the GERMAN_HOLIDAYS constant
 *
 * @param {*} date in the form yyyy-mm-dd
 * @returns boolean
 */
const isHoliday = (date) => {
  return includes(GERMAN_HOLIDAYS, date)
}

const generateAddress = ({ street, house_number, zip, city, country }) => {
  return trim(
    `${street || ''} ${house_number || ''}, ${zip || ''} ${city || ''}, ${country || ''}`,
    ', '
  )
    .replace(/\s,/g, ',')
    .toLowerCase()
}
const parseFloorDirection = (direction) => {
  switch (direction) {
    case ESTATE_FLOOR_DIRECTION_LEFT:
      return 'property.attribute.floor_direction.left.message'
    case ESTATE_FLOOR_DIRECTION_RIGHT:
      return 'property.attribute.floor_direction.right.message'
    case ESTATE_FLOOR_DIRECTION_STRAIGHT:
      return 'property.attribute.floor_direction.straight.message'
    case ESTATE_FLOOR_DIRECTION_STRAIGHT_LEFT:
      return 'property.attribute.floor_direction.straight.left.message'
    case ESTATE_FLOOR_DIRECTION_STRAIGHT_RIGHT:
      return 'property.attribute.floor_direction.straight.right.message'
    default:
      return null
  }
}

const encodeURL = (link) => {
  return link.replace(/\+/g, '%20')
}
const createDynamicLink = async (link, desktopLink = process.env.DYNAMIC_ONLY_WEB_LINK) => {
  const firebaseDynamicLinks = new FirebaseDynamicLinks(process.env.FIREBASE_WEB_KEY)
  try {
    const { shortLink } = await firebaseDynamicLinks.createLink({
      dynamicLinkInfo: {
        domainUriPrefix: process.env.DOMAIN_PREFIX,
        link,
        androidInfo: {
          androidPackageName: process.env.ANDROID_PACKAGE_NAME
        },
        iosInfo: {
          iosBundleId: process.env.IOS_BUNDLE_ID,
          iosAppStoreId: process.env.IOS_APPSTORE_ID
        },
        desktopInfo: {
          desktopFallbackLink: desktopLink || 'https://app.breeze4me.de/invalid-platform'
        }
      }
    })
    return shortLink
  } catch (e) {
    console.log('shortLink here error=', e.message || JSON.stringify(e))
    return null
  }
}

const calculateEnergyClassFromEfficiency = (efficiency) => {
  let idx
  if (efficiency >= ENERGY_CLASS_USING_EFFICIENCY.slice(-1)[0].value) {
    idx = ENERGY_CLASS_USING_EFFICIENCY.length - 1
  } else {
    idx = ENERGY_CLASS_USING_EFFICIENCY.slice(0, -1).findIndex((level) => efficiency < level.value)
  }
  return ENERGY_CLASS_USING_EFFICIENCY[idx].level
}

const checkIfIsValid = (object) => {
  let flag = true
  Object.keys(object).forEach((each) => {
    if (
      object[each] === null ||
      object[each] === undefined ||
      Array.isArray(object[each] && object[each].length === 0)
    )
      flag = false
  })
  return flag
}

module.exports = {
  getUrl,
  valueToJSON,
  wrapValidationError,
  getHash,
  getGeoRange,
  getAuthByRole,
  capitalize: capt,
  rc: localeTemplateToValue,
  isHoliday,
  generateAddress,
  parseFloorDirection,
  createDynamicLink,
  encodeURL,
  calculateEnergyClassFromEfficiency,
  checkIfIsValid
}
