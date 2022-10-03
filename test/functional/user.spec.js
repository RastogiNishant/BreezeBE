const { omit, pick } = require('lodash')
const {
  ROLE_USER,
  STATUS_ACTIVE,
  STATUS_EMAIL_VERIFY,
  ROLE_LANDLORD,
} = require('../../app/constants')

const { test, trait, before, beforeEach, after, afterEach } = use('Test/Suite')('User Functional')
const User = use('App/Models/User')
const UserService = use('App/Services/UserService')
const AgreementService = use('App/Services/AgreementService')

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

test('weak password signup failed', async ({ assert, client }) => {
  const response = await client
    .post('/api/v1/signup')
    .send({
      ...prospectData,
      password: '1234',
    })
    .end()
  response.assertStatus(422)
})

test('wrong email format failed', async ({ assert, client }) => {
  const response = await client
    .post('/api/v1/signup')
    .send({
      ...prospectData,
      email: '1234567',
    })
    .end()
  response.assertStatus(422)
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

  assert.isNotNull(testProspect.id)
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

test('Not existing email failed', async ({ assert, client }) => {
  const response = await client
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
})

test('wrong password failed', async ({ assert, client }) => {
  const response = await client
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
