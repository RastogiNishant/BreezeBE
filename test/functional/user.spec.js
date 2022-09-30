const { omit } = require('lodash')
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

let prospect, testProspect, landlord
let prospectData = {
  email: `prospect_test_${new Date().getTime().toString()}@gmail.com`,
  role: ROLE_USER,
  firstname: `firstname_${new Date().getTime().toString()}`,
  secondname: `secondname_${new Date().getTime().toString()}`,
  password: '12345678',
  sex: '1',
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
})

test('sign up', async ({ assert, client }) => {
  const response = await client.post('/api/v1/signup').send(prospectData).end()
  response.assertStatus(200)

  assert.isNotNull(testProspect)
}).timeout(0)

test('log in', async ({ assert, client }) => {
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
}).timeout(0)

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
