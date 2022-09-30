const { ROLE_USER, STATUS_ACTIVE } = require('../../app/constants')

const { test, trait, before, beforeEach, after, afterEach } = use('Test/Suite')('User Functional')
const User = use('App/Models/User')
const UserService = use('App/Services/UserService')

trait('Test/ApiClient')
trait('Auth/Client')

let prospect, testProspect
let prospectData = {
  email: `test_${new Date().getTime().toString()}@gmail.com`,
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
})

after(async () => {
  if (testProspect) {
    await UserService.removeUser(testProspect.id)
  }
})

// test('sign up', async ({ assert, client }) => {
//   const response = await client.post('/api/v1/signup').send(prospectData).end()
//   response.assertStatus(200)

//   await User.query().where('email', prospectData.email).update({ status: STATUS_ACTIVE })
//   testProspect = await User.query().where('email', prospectData.email)
// }).timeout(0)

test('log in', async ({ assert, client }) => {
  const response = await client
    .post('/api/v1/login')
    .field('email', 'it@bits.ventures')
    .field('password', 'W1llk0mm3n')
    .field('role', ROLE_USER)
    .end()
  response.assertStatus(200)
}).timeout(0)

// test('update profile', async ({ assert, client }) => {
//   const response = await client
//     .put('/api/v1/users')
//     .loginVia(testProspect, 'jwt')
//     .field('firstname', prospectData.firstname)
//     .field('secondname', prospectData.secondname)
//     .end()

//   response.assertStatus(200)
// })
