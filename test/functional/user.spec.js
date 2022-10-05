const { omit, pick } = require('lodash')
const { faker } = require('@faker-js/faker')
const {
  ROLE_USER,
  STATUS_ACTIVE,
  STATUS_EMAIL_VERIFY,
  ROLE_LANDLORD,

  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_ANY,
  LANDLORD_SIZE_LARGE,
  LANDLORD_SIZE_MID,
  LANDLORD_SIZE_SMALL,
  TRANSPORT_TYPE_CAR,
  TRANSPORT_TYPE_WALK,
  TRANSPORT_TYPE_SOCIAL,
  ROLE_PROPERTY_MANAGER,
} = require('../../app/constants')

const { test, trait, before, beforeEach, after, afterEach } = use('Test/Suite')('User Functional')
const User = use('App/Models/User')
const UserService = use('App/Services/UserService')
const AgreementService = use('App/Services/AgreementService')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, MINLENGTH, MAXLENGTH, OPTION, DATE, BOOLEAN, EMAIL, MATCH },
} = require('../../app/excepions')

trait('Test/ApiClient')
trait('Auth/Client')

let prospect, testProspect, landlord, testLandlord
let prospectData = {
  email: `prospect_test_${new Date().getTime().toString()}@gmail.com`,
  role: ROLE_USER,
  firstname: `firstname_${new Date().getTime().toString()}`,
  secondname: `secondname_${new Date().getTime().toString()}`,
  password: '12345678',
  sex: 1,
  birthday: '1990-01-01',
  lang: 'en',
}

let landlordData = {
  email: `landlord_test_${new Date().getTime().toString()}@gmail.com`,
  role: ROLE_LANDLORD,
  firstname: `firstname_${new Date().getTime().toString()}`,
  secondname: `secondname_${new Date().getTime().toString()}`,
  password: '12345678',
  sex: 1,
  birthday: '1990-01-01',
  lang: 'en',
}

before(async () => {
  prospect = await User.query()
    .where('role', ROLE_USER)
    .where('email', 'it@bits.ventures')
    .firstOrFail()

  landlord = await User.query()
    .where('role', ROLE_LANDLORD)
    .where('email', 'it@bits.ventures')
    .firstOrFail()
})

after(async () => {
  if (testProspect) {
    await UserService.removeUser(testProspect.id)
  }
  if (testLandlord) {
    await UserService.removeUser(testLandlord.id)
  }
})

test('signup failed', async ({ assert, client }) => {
  //required check
  let response = await client.post('/api/v1/signup').send({}).end()
  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      email: getExceptionMessage('email', REQUIRED),
      role: getExceptionMessage('role', REQUIRED),
      password: getExceptionMessage('password', REQUIRED),
      sex: getExceptionMessage('sex', REQUIRED),
      birthday: getExceptionMessage('birthday', REQUIRED),
    },
  })

  //wrong date type and min value check
  response = await client
    .post('/api/v1/signup')
    .send({
      email: faker.random.numeric(5),
      role: faker.random.numeric(5),
      signupData: {
        address: {
          coord: faker.random.numeric(5),
        },
        transport: faker.random.numeric(5),
        time: faker.random.numeric(5),
      },
      password: faker.random.numeric(3),
      sex: faker.random.numeric(5),
      phone: faker.random.numeric(5),
      firstname: faker.random.alphaNumeric(1),
      secondname: faker.random.alphaNumeric(1),
      birthday: faker.random.alphaNumeric(10),
      lang: faker.random.numeric(10),
      lord_size: faker.random.numeric(10),
      request_full_profile: faker.random.numeric(10),
      landlord_email: faker.random.numeric(10),
      landlord_confirm_email: faker.random.numeric(10),
      from_web: faker.random.numeric(2),
    })
    .end()
  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      email: getExceptionMessage('email', EMAIL),
      role: getExceptionMessage(
        'lang',
        OPTION,
        `[${ROLE_USER},${ROLE_LANDLORD},${ROLE_PROPERTY_MANAGER}]`
      ),
      'signupData.address.coord': getExceptionMessage('address', MATCH),
      'signupData.transport': getExceptionMessage(
        'transport',
        OPTION,
        `[${TRANSPORT_TYPE_CAR},${TRANSPORT_TYPE_WALK},${TRANSPORT_TYPE_SOCIAL}]`
      ),
      'signupData.time': getExceptionMessage('time', OPTION, `[15, 30, 45, 60]`),
      password: getExceptionMessage('password', MINLENGTH, 6),
      sex: getExceptionMessage('sex', OPTION, `[${GENDER_MALE},${GENDER_FEMALE},${GENDER_ANY}]`),
      phone: getExceptionMessage(undefined, MATCH),
      firstname: getExceptionMessage('firstname', MINLENGTH, 2),
      secondname: getExceptionMessage('secondname', MINLENGTH, 2),
      birthday: getExceptionMessage('birthday', DATE),
      lang: getExceptionMessage('lang', OPTION, '[en,de]'),
      lord_size: getExceptionMessage(
        'lord_size',
        OPTION,
        `[${LANDLORD_SIZE_LARGE},${LANDLORD_SIZE_MID},${LANDLORD_SIZE_SMALL}]`
      ),
      request_full_profile: getExceptionMessage('request_full_profile', BOOLEAN),
      landlord_email: getExceptionMessage('landlord_email', EMAIL),
      landlord_confirm_email: getExceptionMessage('landlord_confirm_email', EMAIL),
      from_web: getExceptionMessage('from_web', BOOLEAN),
    },
  })

  //max check
  response = await client
    .post('/api/v1/signup')
    .send({
      firstname: faker.random.alphaNumeric(255),
      secondname: faker.random.alphaNumeric(255),
    })
    .end()
  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      firstname: getExceptionMessage('firstname', MAXLENGTH, 254),
      secondname: getExceptionMessage('secondname', MAXLENGTH, 254),
    },
  })
})

test('prospect sign up', async ({ assert, client }) => {
  const response = await client.post('/api/v1/signup').send(prospectData).end()
  testProspect = response.body.data

  response.assertStatus(200)
  response.assertJSONSubset({
    data: {
      ...pick(prospectData, ['firstname', 'lastname', 'role']),
      status: STATUS_EMAIL_VERIFY,
    },
  })
}).timeout(0)

test('landlord sign up', async ({ assert, client }) => {
  const response = await client.post('/api/v1/signup').send(landlordData).end()
  testLandlord = response.body.data

  response.assertStatus(200)
  response.assertJSONSubset({
    data: {
      ...pick(landlordData, ['firstname', 'lastname', 'role']),
      status: STATUS_EMAIL_VERIFY,
    },
  })
}).timeout(0)

test('prospect log in', async ({ assert, client }) => {
  const agreement = await AgreementService.getLatestActive()
  const term = await AgreementService.getActiveTerms()

  assert.isNotNull(agreement)
  assert.isNotNull(term)

  await User.query()
    .where('email', prospectData.email)
    .update({ status: STATUS_ACTIVE, agreements_id: agreement.id, terms_id: term.id })

  testProspect = await User.query()
    .where('email', prospectData.email)
    .where('role', ROLE_USER)
    .first()
  assert.isNotNull(testProspect)

  const response = await client
    .post('/api/v1/login')
    .send({
      email: prospectData.email,
      password: prospectData.password,
      role: ROLE_USER,
    })
    .end()

  response.assertStatus(200)
  response.assertJSONSubset({
    status: 'success',
    data: {
      type: 'bearer',
    },
  })

  const loginTestProspect = response.body.data
  assert.isNotNull(loginTestProspect.token)
}).timeout(0)

test('landlord log in', async ({ assert, client }) => {
  const agreement = await AgreementService.getLatestActive()
  const term = await AgreementService.getActiveTerms()

  assert.isNotNull(agreement)
  assert.isNotNull(term)

  await User.query()
    .where('email', landlordData.email)
    .update({ status: STATUS_ACTIVE, agreements_id: agreement.id, terms_id: term.id })

  testProspect = await User.query()
    .where('email', landlordData.email)
    .where('role', ROLE_LANDLORD)
    .first()
  assert.isNotNull(testProspect)

  const response = await client
    .post('/api/v1/login')
    .send({
      email: landlordData.email,
      password: landlordData.password,
      role: ROLE_LANDLORD,
    })
    .end()

  response.assertStatus(200)
  response.assertJSONSubset({
    status: 'success',
    data: {
      type: 'bearer',
    },
  })

  const loginTestLandlord = response.body.data
  assert.isNotNull(loginTestLandlord.token)
}).timeout(0)

test('Login failed', async ({ assert, client }) => {
  //wrong email
  let response = await client
    .post('/api/v1/login')
    .send({
      email: `123${prospectData.email}`,
      password: prospectData.password,
      role: ROLE_USER,
    })
    .end()
  response.assertStatus(400)
  response.assertJSONSubset({
    status: 'error',
  })

  //wrong password
  response = await client
    .post('/api/v1/login')
    .send({
      email: prospectData.email,
      password: `${prospectData.password}123`,
      role: ROLE_USER,
    })
    .end()
  response.assertStatus(400)
  response.assertJSONSubset({
    status: 'error',
    data: 'E_PASSWORD_MISMATCH',
  })

  //No role
  response = await client
    .post('/api/v1/login')
    .send({
      email: prospectData.email,
      password: `${prospectData.password}123`,
    })
    .end()
  response.assertStatus(422)
  response.assertJSONSubset({
    status: 'error',
  })

  //wrong role
  response = await client
    .post('/api/v1/login')
    .send({
      email: prospectData.email,
      password: `${prospectData.password}123`,
      role: 0,
    })
    .end()
  response.assertStatus(422)
  response.assertJSONSubset({
    status: 'error',
  })

  //wrong role
  response = await client
    .post('/api/v1/login')
    .send({
      email: prospectData.email,
      password: `${prospectData.password}123`,
      role: 5,
    })
    .end()
  response.assertStatus(422)
  response.assertJSONSubset({
    status: 'error',
  })

  //if device_token is not bigger than 30 letter long. there must be an error
  response = await client
    .post('/api/v1/login')
    .send({
      email: prospectData.email,
      password: prospectData.password,
      role: ROLE_USER,
      device_token: faker.random.alphaNumeric(29),
    })
    .end()

  response.assertStatus(422)
})

test('update profile', async ({ assert, client }) => {
  const updateInfo = {
    email: `prospect_test_${new Date().getTime().toString()}@gmail.com`,
    firstname: `firstname_${new Date().getTime().toString()}`,
    secondname: `secondname_${new Date().getTime().toString()}`,
    password: prospectData.password,
  }
  const response = await client
    .put('/api/v1/users')
    .loginVia(testProspect, 'jwt')
    .send(updateInfo)
    .end()

  response.assertStatus(200)
  response.assertJSONSubset({
    data: {
      ...omit(updateInfo, ['password']),
      status: STATUS_EMAIL_VERIFY,
    },
  })
}).timeout(0)

test('Get Landlord', async ({ client }) => {
  const response = await client
    .get(`/api/v1/profile/tenant/${prospect.id}`)
    .loginVia(landlord, 'jwtLandlord')
    .end()

  response.assertStatus(200)
})

test('resetUnreadNotificationCount', async ({ client }) => {
  const response = await client
    .get('/api/v1/notices/resetCount')
    .loginVia(landlord, 'jwtLandlord')
    .end()

  response.assertStatus(200)
})
