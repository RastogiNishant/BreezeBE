'use strict'

const moment = require('moment')
const Factory = use('Factory')
const Point = use('App/Models/Point')

const {
  GENDER_MALE,
  STATUS_ACTIVE,
  TRANSPORT_TYPE_CAR,
  TRANSPORT_TYPE_WALK,
  TRANSPORT_TYPE_SOCIAL,
  APARTMENT_TYPE_FLAT,
  HOUSE_TYPE_MULTIFAMILY_HOUSE,
  HOUSE_TYPE_HIGH_RISE,
  HOUSE_TYPE_SERIES,
  HOUSE_TYPE_SEMIDETACHED_HOUSE,
  HOUSE_TYPE_2FAMILY_HOUSE,
  HOUSE_TYPE_DETACHED_HOUSE,
  HOUSE_TYPE_COUNTRY,
  HOUSE_TYPE_BUNGALOW,
  HOUSE_TYPE_VILLA,
  HOUSE_TYPE_GARDENHOUSE,
  PETS_NO,
  PETS_SMALL,
  PETS_BIG,
  INCOME_TYPE_EMPLOYEE,
  HIRING_TYPE_FULL_TIME,
  HIRING_TYPE_PART_TIME,
  FAMILY_STATUS_SINGLE,
  FAMILY_STATUS_WITH_CHILD,
  FAMILY_STATUS_NO_CHILD,
} = require('../app/constants')

const houseTypes = [
  HOUSE_TYPE_MULTIFAMILY_HOUSE,
  HOUSE_TYPE_HIGH_RISE,
  HOUSE_TYPE_SERIES,
  HOUSE_TYPE_SEMIDETACHED_HOUSE,
  HOUSE_TYPE_2FAMILY_HOUSE,
  HOUSE_TYPE_DETACHED_HOUSE,
  HOUSE_TYPE_COUNTRY,
  HOUSE_TYPE_BUNGALOW,
  HOUSE_TYPE_VILLA,
  HOUSE_TYPE_GARDENHOUSE,
]

Factory.blueprint('App/Models/User', async (faker, i, { role, terms_id, agreements_id, email }) => {
  const [firstname, secondname] = faker.name().split(' ')

  return {
    email: email || faker.email(),
    firstname,
    secondname,
    password: 'qwerty',
    phone: faker.phone({ formatted: false }),
    birthday: faker.birthday(),
    sex: GENDER_MALE,
    status: STATUS_ACTIVE,
    avatar: faker.avatar({ protocol: 'https' }),
    coord: null, // TODO
    lang: 'de',
    role,
    terms_id,
    agreements_id,
  }
})

/**
 *
 */
const getCoordFromBoundary = (lat1, lon1, lat2, lon2) => {
  const original_lat = (lat1 + lat2) / 2
  const original_lng = (lon1 + lon2) / 2
  const r = 2000 / 111300, // ~2km
    y0 = original_lat,
    x0 = original_lng,
    u = Math.random(),
    v = Math.random(),
    w = r * Math.sqrt(u),
    t = 2 * Math.PI * v,
    x = w * Math.cos(t),
    y1 = w * Math.sin(t),
    x1 = x / Math.cos(y0)

  return [y0 + y1, x0 + x1]
}

Factory.blueprint(
  'App/Models/Tenant',
  async (
    faker,
    i,
    { user_id, pets, bbox: { lat1, lon1, lat2, lon2 }, rooms, floor, space, options, hhType }
  ) => {
    // Return floor min/max
    const [floor_min, floor_max] = ((f) => {
      switch (f) {
        case 'no matter':
          return [0, 21]
        case 'top':
          return [21, 21]
        case 0:
        case '0':
          return [0, 0]
        case '1':
        case 1:
          return [1, 2]
        default:
          return [parseInt(f), parseInt(f) + 1]
      }
    })(floor)
    const [space_min, space_max] = [
      Math.round(space - space * 0.1),
      Math.round(space + space * 0.1),
    ]
    const petsData = !!parseInt(pets) ? faker.pickone([PETS_SMALL, PETS_BIG]) : PETS_NO
    let [lat, lon] = getCoordFromBoundary(lat1, lon1, lat2, lon2)
    lat = Point.round(lat)
    lon = Point.round(lon)

    return {
      user_id,
      private_use: true,
      pets: petsData,
      pets_species: !!parseInt(pets) ? 'noname' : '',
      parking_space: faker.natural({ min: 0, max: 3 }),
      coord: `${lon},${lat}`,
      dist_type: faker.pickone([TRANSPORT_TYPE_CAR, TRANSPORT_TYPE_WALK, TRANSPORT_TYPE_SOCIAL]),
      dist_min: faker.pickone([15, 30, 45, 60]),
      budget_min: 0,
      budget_max: 30,
      include_utility: false,
      rooms_min: rooms,
      rooms_max: rooms,
      floor_min,
      floor_max,
      space_min,
      space_max,
      apt_type: [APARTMENT_TYPE_FLAT],
      house_type: houseTypes,
      garden: faker.pickone([false, true]),
      address: faker.address(),
      income: 0,
      non_smoker: faker.pickone([false, false, false, true]),
      options,
      status: STATUS_ACTIVE,
      credit_score: faker.integer({ min: 60, max: 98 }),
      members_count: parseInt(hhType) === 1 ? 1 : 2,
      minors_count: parseInt(hhType) === 3 ? 1 : 0,
      family_status:
        parseInt(hhType) === 1
          ? FAMILY_STATUS_SINGLE
          : parseInt(hhType) === 2
          ? FAMILY_STATUS_NO_CHILD
          : FAMILY_STATUS_WITH_CHILD,
    }
  }
)

/**
 *
 */
Factory.blueprint('App/Models/Member', async (faker, i, { user_id, child, doc }) => {
  const [firstname, secondname] = faker.name().split(' ')
  return {
    user_id,
    firstname,
    secondname,
    child,
    phone: faker.phone({ formatted: false }),
    email: faker.email(),
    birthday: child ? faker.birthday({ type: 'child' }) : faker.birthday(),
    sex: GENDER_MALE,
    avatar: faker.avatar({ protocol: 'https' }),
    landlord_name: faker.name(),
    landlord_phone: faker.phone({ formatted: false }),
    landlord_email: faker.email(),
    last_address: faker.address(),
    rent_arrears_doc: doc,
    credit_score: faker.integer({ min: 60, max: 98 }),
    debt_proof: doc,
    unpaid_rental: faker.pickone([false, false, true]),
    insolvency_proceed: faker.pickone([false, false, true]),
    arrest_warranty: faker.pickone([false, false, true]),
    clean_procedure: faker.pickone([false, false, true]),
    income_seizure: faker.pickone([false, false, true]),
    execution: faker.pickone([false, false, true]),
  }
})

Factory.blueprint('App/Models/Income', async (faker, i, { member_id, income }) => {
  return {
    employment_type: faker.pickone([HIRING_TYPE_FULL_TIME, HIRING_TYPE_PART_TIME]),
    member_id,
    profession: 'employee',
    position: 'employee',
    hiring_date: faker.date(),
    income,
    income_type: INCOME_TYPE_EMPLOYEE,
    company: faker.company(),
    work_exp: 10,
  }
})

Factory.blueprint('App/Models/IncomeProof', async (faker, i, { income_id, offset, doc }) => {
  return {
    income_id,
    file: doc,
    expire_date: moment().subtract(offset, 'months').startOf('month').toDate(),
  }
})
