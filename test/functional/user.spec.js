const { omit } = require('lodash')
const { faker } = require('@faker-js/faker')
const Hash = use('Hash')
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

  IS_PUBLIC,
  IS_PRIVATE,
  CONNECT_SERVICE_INDEX,
  MATCH_SERVICE_INDEX,
  ERROR_USER_NOT_VERIFIED_LOGIN,
  LANG_DE,
  LANG_EN,
} = require('../../app/constants')
const fsPromise = require('fs/promises')
const { test, trait, before, after } = use('Test/Suite')('User Functional')
const User = use('App/Models/User')
const UserService = use('App/Services/UserService')
const AgreementService = use('App/Services/AgreementService')
const CompanyService = use('App/Services/CompanyService')
const ImageService = use('App/Services/ImageService')

const {
  getExceptionMessage,
  exceptionKeys: {
    REQUIRED,
    MINLENGTH,
    MAXLENGTH,
    OPTION,
    DATE,
    BOOLEAN,
    EMAIL,
    MATCH,
    USER_WRONG_PASSWORD,
    ARRAY,
    NUMBER,
    USER_UNIQUE,
    USER_NOT_EXIST,
    USER_NOT_VERIFIED,
    NOT_EXIST_WITH_EMAIL,
    INVALID_CONFIRM_CODE,
  },
} = require('../../app/excepions')

trait('Test/ApiClient')
trait('Auth/Client')

let prospect, testProspect, landlord, testLandlord, googleDummyUserData, googleSignupUser

const prospectDataEmail = `prospect_test_${new Date().getTime().toString()}@gmail.com`
const firstName = `firstname_${new Date().getTime().toString()}`
const secondName = `secondname_${new Date().getTime().toString()}`
const landlordDataEmail = `landlord_test_${new Date().getTime().toString()}@gmail.com`

let prospectData = {
  email: prospectDataEmail,
  role: ROLE_USER,
  firstname: firstName,
  secondname: secondName,
  password: '12345678',
  sex: 1,
  birthday: '1990-01-01',
  lang: 'en',
}

let landlordData = {
  email: landlordDataEmail,
  role: ROLE_LANDLORD,
  firstname: firstName,
  secondname: secondName,
  password: '12345678',
  sex: 1,
  birthday: '1990-01-01',
  lang: 'en',
}

let googlePayload = {
  iss: 'accounts.google.com',
  azp: '570764623413-375167v2uuib1ng6eih8gn3o6qrh7hfn.apps.googleusercontent.com',
  aud: '570764623413-375167v2uuib1ng6eih8gn3o6qrh7hfn.apps.googleusercontent.com',
  sub: '110809391763237142152',
  email: `gmail_test_${new Date().getTime().toString()}@gmail.com`,
  email_verified: true,
  at_hash: 'cxR9CbLOjajTiMIk7PUBmg',
  name: 'Unit Test google sign up user',
  picture: 'https://lh3.googleusercontent.com/a/AATXAJxngk8b3gFsyQuNCNsfDUSw0sFVqvDi9DkBmM8=s96-c',
  given_name: 'Unit Test',
  family_name: 'Google',
  locale: 'en-GB',
  iat: 1654581291,
  exp: 1654584891,
  jti: 'fa6ab8e8e90c39c2133dbed140786b6db32c3e86',
}

googleDummyUserData = {
  ...googlePayload,
  google_id: '110809391763237142152',
  device_token: null,
  email: `google_test_${new Date().getTime().toString()}@gmail.com`,
  role: ROLE_USER,
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
    CompanyService.permanentDelete(testProspect.id)
    await UserService.removeUser(testProspect.id)
  }
  if (testLandlord) {
    CompanyService.permanentDelete(testLandlord.id)
    await UserService.removeUser(testLandlord.id)
  }

  if (googleSignupUser) {
    await UserService.removeUser(googleSignupUser.id)
  }
})

test('signup failed due to empty data', async ({ assert, client }) => {
  const response = await client.post('/api/v1/signup').send({}).end()
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
})

test('signup failed due to wrong date type and min value check', async ({ assert, client }) => {
  //wrong date type and min value check
  const response = await client
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
        'role',
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
})

test('signup failed due to max char limits', async ({ client }) => {
  //max check
  const response = await client
    .post('/api/v1/signup')
    .send({
      firstname: faker.random.alphaNumeric(255),
      secondname: faker.random.alphaNumeric(255),
      password: faker.random.alphaNumeric(37),
    })
    .end()
  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      firstname: getExceptionMessage('firstname', MAXLENGTH, 254),
      secondname: getExceptionMessage('secondname', MAXLENGTH, 254),
      password: getExceptionMessage('password', MAXLENGTH, 36),
    },
  })
}).timeout(0)

test('prospect successful sign up', async ({ assert, client }) => {
  const agreement = await AgreementService.getLatestActive()
  const term = await AgreementService.getActiveTerms()
  assert.isNotNull(agreement.id)
  assert.isNotNull(term.id)

  const response = await client.post('/api/v1/signup').send(prospectData).end()
  testProspect = response.body.data

  response.assertStatus(200)

  //password, email, birthday must not be included in response data
  response.assertJSONSubset({
    data: {
      ...omit(prospectData, ['password', 'email', 'birthday']),
      agreements_id: agreement.id,
      terms_id: term.id,
      status: STATUS_EMAIL_VERIFY,
    },
  })
}).timeout(0)

test('Landlord successful sign up', async ({ assert, client }) => {
  let response = await client.post('/api/v1/signup').send(landlordData).end()
  testLandlord = response.body.data

  const agreement = await AgreementService.getLatestActive()
  const term = await AgreementService.getActiveTerms()
  assert.isNotNull(agreement.id)
  assert.isNotNull(term.id)

  response.assertStatus(200)
  response.assertJSONSubset({
    data: {
      ...omit(landlordData, ['password', 'email', 'birthday']),
      agreements_id: agreement.id,
      terms_id: term.id,
      status: STATUS_EMAIL_VERIFY,
    },
  })

  //duplicate signup failed
  response = await client.post('/api/v1/signup').send(landlordData).end()
  response.assertStatus(400)
  response.assertJSONSubset({
    data: getExceptionMessage(undefined, USER_UNIQUE),
  })
}).timeout(0)

test('Failed Confirm email due to empty data', async ({ assert, client }) => {
  const response = await client.get('/api/v1/confirm_email').send({}).end()
  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      user_id: getExceptionMessage('user_id', REQUIRED),
      code: getExceptionMessage('code', REQUIRED),
    },
  })
})

test('Failed Confirm email due to wrong format', async ({ assert, client }) => {
  const response = await client
    .get('/api/v1/confirm_email')
    .send({
      user_id: faker.random.alphaNumeric(5),
      from_web: faker.random.alphaNumeric(5),
    })
    .end()
  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      user_id: getExceptionMessage('user_id', NUMBER),
      from_web: getExceptionMessage('from_web', NUMBER),
      code: getExceptionMessage('code', REQUIRED),
    },
  })
})

test('Failed Confirm email due to not existing user', async ({ assert, client }) => {
  const response = await client
    .get('/api/v1/confirm_email')
    .send({
      user_id: faker.random.numeric(8),
      from_web: faker.random.numeric(5),
      code: faker.random.numeric(4),
    })
    .end()
  response.assertStatus(400)
  response.assertJSONSubset({
    data: getExceptionMessage(undefined, USER_NOT_EXIST),
  })
})

test('Failed Confirm email due to wrong confirmation code', async ({ assert, client }) => {
  assert.isNotNull(testLandlord.id)
  const response = await client
    .get('/api/v1/confirm_email')
    .send({
      user_id: testLandlord.id,
      from_web: faker.random.numeric(5),
      code: faker.random.numeric(5),
    })
    .end()
  response.assertStatus(400)
  response.assertJSONSubset({
    data: response.body.data,
  })
})

test('Confirm email successfully', async ({ assert, client }) => {
  assert.isNotNull(testLandlord)
  assert.isNotNull(testLandlord.id)
  code = await UserService.sendConfirmEmail(testLandlord)
  assert.isNotNull(code)
  const response = await client
    .get('/api/v1/confirm_email')
    .send({
      user_id: testLandlord.id,
      code,
    })
    .end()

  response.assertStatus(200)
  response.assertJSONSubset({ status: 'success', data: true })
}).timeout(0)

test('Failed Sign up with Google oAuth', async ({ client }) => {
  //required check
  let response = await client.get('/auth/google/mobile').send({}).end()
  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      token: getExceptionMessage('token', REQUIRED),
      role: getExceptionMessage('role', REQUIRED),
    },
  })

  //min check
  response = await client
    .get('/auth/google/mobile')
    .send({
      token: faker.random.alphaNumeric(29),
      role: faker.random.numeric(2),
    })
    .end()
  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      token: getExceptionMessage('token', MINLENGTH, 30),
      role: getExceptionMessage(
        'role',
        OPTION,
        `[${ROLE_USER}, ${ROLE_LANDLORD}, ${ROLE_PROPERTY_MANAGER}]`
      ),
    },
  })

  //max check
  response = await client
    .get('/auth/google/mobile')
    .send({
      token: faker.random.alphaNumeric(1601),
      role: ROLE_USER,
    })
    .end()

  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      token: getExceptionMessage('token', MAXLENGTH, 1600),
    },
  })

  const token =
    'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijc0ODNhMDg4ZDRmZmMwMDYwOWYwZTIyZjNjMjJkYTVmZTM5MDZjY2MiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiNTcwNzY0NjIzNDEzLTM3NTE2N3YydXVpYjFuZzZlaWg4Z24zbzZxcmg3aGZuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiNTcwNzY0NjIzNDEzLTM3NTE2N3YydXVpYjFuZzZlaWg4Z24zbzZxcmg3aGZuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTEwODA5MzkxNzYzMjM3MTQyMTUyIiwiZW1haWwiOiJyYXN0b2dpbmlzaGFudGZsQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiY3hSOUNiTE9qYWpUaU1JazdQVUJtZyIsIm5hbWUiOiJOaXNoYW50IFJhc3RvZ2kiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKeG5nazhiM2dGc3lRdU5DTnNmRFVTdzBzRlZxdkRpOURrQm1NOD1zOTYtYyIsImdpdmVuX25hbWUiOiJOaXNoYW50IiwiZmFtaWx5X25hbWUiOiJSYXN0b2dpIiwibG9jYWxlIjoiZW4tR0IiLCJpYXQiOjE2NTQ1ODEyOTEsImV4cCI6MTY1NDU4NDg5MSwianRpIjoiZmE2YWI4ZThlOTBjMzljMjEzM2RiZWQxNDA3ODZiNmRiMzJjM2U4NiJ9.BUjqRHnlPAUllfFbMlerIsldM4xgn0Oafj8fuhAWly7kOOZgGszUVRLvR1aEzEkTmrEHE8uyyubkAfU3OGtegj02Ath3w0IyUc7eHSDjkBCBYwS6TgqEaiIuIGmeACvgUQwKwpyHQyYWQ6y3VhVQLOaXSeptyGPt7gfQLOleu7KDoLtx3KDNB6ke_47gO2u9M46H0BaU4MN8PrCKquoUeeH0EQ_sbkqHnnV0YgKj88paNpeR3GTYKYNAWhukzRPtys9R9w0J8y_8Oia1T_kOcNL4JfKLsaxiUQZOAcefvaaDAvpb3_-0tfypKDEJkF-v2YfeM0MRdFKCe55_Nn-ORA'

  googleDummyUserData = {
    ...googleDummyUserData,
    token,
    device_token: faker.random.alphaNumeric(30),
  }
  response = await client.get('/auth/google/mobile').send(googleDummyUserData).end()
  response.assertStatus(400)
  response.assertJSONSubset({ data: 'Invalid token' })
  //TODO: success case will be here
}).timeout(0)

test('Login failed due to empty parameters', async ({ assert, client }) => {
  const response = await client.post('/api/v1/login').send({}).end()

  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      email: getExceptionMessage('email', REQUIRED),
      role: getExceptionMessage('role', REQUIRED),
      password: getExceptionMessage('password', REQUIRED),
    },
  })
})

test('Login failed due to min length', async ({ assert, client }) => {
  const response = await client
    .post('/api/v1/login')
    .send({
      email: faker.random.numeric(5),
      password: faker.random.numeric(5),
      role: faker.random.numeric(5),
    })
    .end()

  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      email: getExceptionMessage('email', EMAIL),
      role: getExceptionMessage(
        'role',
        OPTION,
        `[${ROLE_USER},${ROLE_LANDLORD},${ROLE_PROPERTY_MANAGER}]`
      ),
      password: getExceptionMessage('password', MINLENGTH, 6),
    },
  })
})

test('Login failed due to max length', async ({ assert, client }) => {
  const response = await client
    .post('/api/v1/login')
    .send({
      email: prospectData.email,
      password: faker.random.numeric(37),
      device_token: faker.random.numeric(29),
      role: ROLE_USER,
    })
    .end()

  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      password: getExceptionMessage('password', MAXLENGTH, 36),
      device_token: getExceptionMessage('password', MINLENGTH, 30),
    },
  })
})

test('Login failed due to not existing email', async ({ assert, client }) => {
  //wrong email
  const response = await client
    .post('/api/v1/login')
    .send({
      email: `${faker.random.numeric(1)}${prospectData.email}`,
      password: prospectData.password,
      role: ROLE_USER,
    })
    .end()

  response.assertStatus(400)
  response.assertJSONSubset({
    status: 'error',
    data: getExceptionMessage(undefined, USER_NOT_EXIST),
    code: 0,
  })
})

test('Login failed due to inactive user', async ({ assert, client }) => {
  //if not active, log in failed
  const user = await User.query()
    .select('*')
    .where('email', prospectData.email)
    .whereIn('role', [ROLE_USER])
    .orderBy('updated_at', 'desc')
    .first()

  assert.isNotNull(user)
  assert.isNotNull(user.id)

  const response = await client
    .post('/api/v1/login')
    .send({
      email: prospectData.email,
      password: prospectData.password,
      role: ROLE_USER,
    })
    .end()
  response.assertStatus(400)
  response.assertJSONSubset({
    status: 'error',
    data: `${ERROR_USER_NOT_VERIFIED_LOGIN}${user.id}: ${getExceptionMessage(
      undefined,
      USER_NOT_VERIFIED
    )}`,
    code: 0,
  })
})

test('prospect log in successfully', async ({ assert, client }) => {
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

test('landlord log in successfully', async ({ assert, client }) => {
  const agreement = await AgreementService.getLatestActive()
  const term = await AgreementService.getActiveTerms()

  assert.isNotNull(agreement)
  assert.isNotNull(term)

  await User.query()
    .where('email', landlordData.email)
    .update({ status: STATUS_ACTIVE, agreements_id: agreement.id, terms_id: term.id })

  testLandlord = await User.query()
    .where('email', landlordData.email)
    .where('role', ROLE_LANDLORD)
    .first()
  assert.isNotNull(testLandlord)

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

test('Login failed due to Wrong password', async ({ assert, client }) => {
  //wrong password
  let response = await client
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
    data: getExceptionMessage(undefined, USER_WRONG_PASSWORD),
    code: 0,
  })
}).timeout(0)

test('update profile failed due to without token', async ({ assert, client }) => {
  const response = await client.put('/api/v1/users').end()
  response.assertStatus(401)
})

test('update profile failed due to min length validation and wrong data', async ({ client }) => {
  const response = await client
    .put('/api/v1/users')
    .loginVia(landlord, 'jwtLandlord')
    .send({
      email: faker.random.numeric(5),
      password: faker.random.numeric(5),
      sex: faker.random.numeric(5),
      phone: faker.random.alphaNumeric(5),
      birthday: faker.random.alphaNumeric(10),
      firstname: faker.random.alphaNumeric(1),
      secondname: faker.random.alphaNumeric(1),
      lang: faker.random.alphaNumeric(4),
      notice: faker.random.alphaNumeric(1),
      prospect_visibility: faker.random.numeric(3),
      landlord_visibility: faker.random.numeric(3),
      lord_size: faker.random.alphaNumeric(3),
      preferred_services: faker.random.alphaNumeric(3),
    })
    .end()

  response.assertStatus(422)
  response.assertJSONSubset({
    status: 'error',
    data: {
      email: getExceptionMessage('email', EMAIL),
      password: getExceptionMessage('password', MINLENGTH, 6),
      sex: getExceptionMessage('sex', OPTION, `[${GENDER_MALE},${GENDER_FEMALE},${GENDER_ANY}]`),
      phone: getExceptionMessage(undefined, MATCH),
      birthday: getExceptionMessage('birthday', DATE),
      firstname: getExceptionMessage('firstname', MINLENGTH, 2),
      secondname: getExceptionMessage('secondname', MINLENGTH, 2),
      lang: getExceptionMessage('lang', OPTION, `[en,de]`),
      notice: getExceptionMessage('notice', BOOLEAN),
      prospect_visibility: getExceptionMessage(
        'prospect_visibility',
        OPTION,
        `[${IS_PRIVATE},${IS_PUBLIC}]`
      ),
      landlord_visibility: getExceptionMessage(
        'landlord_visibility',
        OPTION,
        `[${IS_PRIVATE},${IS_PUBLIC}]`
      ),
      lord_size: getExceptionMessage(
        'lord_size',
        OPTION,
        `[${LANDLORD_SIZE_LARGE},${LANDLORD_SIZE_MID},${LANDLORD_SIZE_SMALL}]`
      ),
      preferred_services: getExceptionMessage('preferred_services', ARRAY),
    },
  })
})

test('update profile failed due to max length validation', async ({ client }) => {
  const response = await client
    .put('/api/v1/users')
    .loginVia(landlord, 'jwtLandlord')
    .send({
      firstname: faker.random.alphaNumeric(255),
      secondname: faker.random.alphaNumeric(255),
      preferred_services: [faker.random.alphaNumeric(3)],
    })
    .end()
  response.assertStatus(422)

  response.assertJSONSubset({
    data: {
      firstname: getExceptionMessage('firstname', MAXLENGTH, 254),
      secondname: getExceptionMessage('secondname', MAXLENGTH, 254),
      'preferred_services[0]': getExceptionMessage(
        'preferred_services[0]',
        OPTION,
        ` ${CONNECT_SERVICE_INDEX}, ${MATCH_SERVICE_INDEX}`
      ),
    },
  })
}).timeout(0)

test('update profile successfully without email', async ({ assert, client }) => {
  const agreement = await AgreementService.getLatestActive()
  const term = await AgreementService.getActiveTerms()
  assert.isNotNull(agreement.id)
  assert.isNotNull(term.id)
  assert.isNotNull(testLandlord.id)

  await User.query()
    .where('id', testLandlord.id)
    .update({ status: STATUS_ACTIVE, agreements_id: agreement.id, terms_id: term.id })

  const updateInfo = {
    sex: GENDER_FEMALE,
    password: landlordData.password,
    phone: faker.phone.number('+4891#######'),
    birthday: faker.date.between('1990-01-01', '2000-12-30').toISOString(),
    firstname: faker.name.firstName(),
    secondname: faker.name.lastName(),
    lang: 'en',
    notice: true,
    prospect_visibility: [IS_PRIVATE],
    landlord_visibility: [IS_PRIVATE],
    lord_size: LANDLORD_SIZE_LARGE,
    preferred_services: [CONNECT_SERVICE_INDEX],
  }

  const response = await client
    .put('/api/v1/users')
    .loginVia(testLandlord, 'jwtLandlord')
    .send(updateInfo)
    .end()

  response.assertStatus(200)

  response.assertJSONSubset({
    data: {
      ...omit(updateInfo, ['password']),
      status: STATUS_ACTIVE,
      landlord_visibility: updateInfo.landlord_visibility[0],
      prospect_visibility: updateInfo.prospect_visibility[0],
      preferred_services: '[1]',
    },
  })
  //password doesn't have to be changed
  const user = await User.query().where('id', testLandlord.id).first()
  assert.isNotNull(user.id)
  const verifyPassword = await Hash.verify(landlordData.password, user.password)
  assert.isTrue(verifyPassword)
}).timeout(0)

test('Update Profile successfully with email', async ({ assert, client }) => {
  const updateInfo = {
    email: faker.internet.email(),
    password: landlordData.password,
    sex: GENDER_FEMALE,
    phone: faker.phone.number('+4891#######'),
    birthday: faker.date.between('1990-01-01', '2000-12-30').toISOString(),
    firstname: faker.name.firstName(),
    secondname: faker.name.lastName(),
    lang: 'en',
    notice: true,
    prospect_visibility: [IS_PRIVATE],
    landlord_visibility: [IS_PRIVATE],
    lord_size: LANDLORD_SIZE_LARGE,
    preferred_services: [CONNECT_SERVICE_INDEX],
  }

  const response = await client
    .put('/api/v1/users')
    .loginVia(testLandlord, 'jwtLandlord')
    .send(updateInfo)
    .end()

  response.assertStatus(200)
  response.assertJSONSubset({
    data: {
      ...omit(updateInfo, ['password']),
      status: STATUS_EMAIL_VERIFY,
      landlord_visibility: updateInfo.landlord_visibility[0],
      prospect_visibility: updateInfo.prospect_visibility[0],
      preferred_services: '[1]',
    },
  })

  //password doesn't have to be changed
  const user = await User.query().where('id', testLandlord.id).first()
  assert.isNotNull(user.id)
  const verifyPassword = await Hash.verify(landlordData.password, user.password)
  assert.isTrue(verifyPassword)
}).timeout(0)

test('Failed Change Password due to empty token', async ({ client }) => {
  const response = await client.put('/api/v1/users/password').end()
  response.assertStatus(401)
})

test('Failed Change Password due to min length', async ({ client }) => {
  const response = await client
    .put('/api/v1/users/password')
    .loginVia(testLandlord, 'jwtLandlord')
    .send({
      current_password: faker.random.numeric(3),
      new_password: faker.random.numeric(3),
    })
    .end()

  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      current_password: getExceptionMessage('current_password', MINLENGTH, 6),
      new_password: getExceptionMessage('new_password', MINLENGTH, 6),
    },
  })
})

test('Failed Change Password due to max length', async ({ client }) => {
  const response = await client
    .put('/api/v1/users/password')
    .loginVia(testLandlord, 'jwtLandlord')
    .send({
      current_password: faker.random.numeric(37),
      new_password: faker.random.numeric(37),
    })
    .end()

  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      current_password: getExceptionMessage('current_password', MAXLENGTH, 36),
      new_password: getExceptionMessage('new_password', MAXLENGTH, 36),
    },
  })
})

test('Failed Change Password', async ({ client }) => {
  if (testProspect.status === STATUS_EMAIL_VERIFY) {
    const response = await client
      .put('/api/v1/users/password')
      .loginVia(testProspect, 'jwt')
      .send({
        current_password: prospectData.password,
        new_password: faker.random.numeric(10),
      })
      .end()

    response.assertStatus(422)
  }
}).timeout(0)

test('Change Password successfully', async ({ client }) => {
  const agreement = await AgreementService.getLatestActive()
  const term = await AgreementService.getActiveTerms()

  await User.query()
    .where('email', testLandlord.email)
    .update({ status: STATUS_ACTIVE, agreements_id: agreement.id, terms_id: term.id })

  let response = await client
    .put('/api/v1/users/password')
    .loginVia(testProspect, 'jwtLandlord')
    .send({
      current_password: prospectData.password,
      new_password: faker.random.numeric(10),
    })
    .end()

  response.assertStatus(200)
  response.assertJSONSubset({ data: true })
}).timeout(0)

test('send code for forgot password to email faield due to empty data', async ({ client }) => {
  const response = await client.post('/api/v1/forgotPassword').send().end()
  response.assertStatus(422)
  response.assertJSON({
    status: 'error',
    data: {
      email: getExceptionMessage('email', REQUIRED),
    },
  })
})

test('send code for forgot password to email faield due to invalid email', async ({ client }) => {
  const response = await client
    .post('/api/v1/forgotPassword')
    .send({
      email: faker.random.numeric(10),
    })
    .end()
  response.assertStatus(422)
  response.assertJSON({
    status: 'error',
    data: {
      email: getExceptionMessage('email', EMAIL),
    },
  })
})

test('send code for forgot password to email faield due to invalid lang', async ({ client }) => {
  const response = await client
    .post('/api/v1/forgotPassword')
    .send({
      email: faker.internet.email(),
      lang: 'fe',
    })
    .end()

  response.assertStatus(422)
  response.assertJSON({
    status: 'error',
    data: {
      lang: getExceptionMessage('lang', OPTION, ` ${LANG_DE}, ${LANG_EN}`),
    },
  })
})

test('send code for forgot password to email successfully', async ({ client }) => {
  const response = await client.post('/api/v1/forgotPassword').send({ email: prospect.email }).end()

  response.assertStatus(200)
  response.assertJSON({ status: 'success' })
})

test('Reset password failed due to empty data', async ({ client }) => {
  const response = await client.post('/api/v1/forgotPassword/setPassword').send().end()
  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      email: getExceptionMessage('email', REQUIRED),
      code: getExceptionMessage('code', REQUIRED),
      password: getExceptionMessage('password', REQUIRED),
    },
  })
})

test('Reset password failed due to wrong email format & min length', async ({ client }) => {
  const response = await client
    .post('/api/v1/forgotPassword/setPassword')
    .send({
      email: faker.random.numeric(10),
      code: faker.random.alphaNumeric(5),
      password: faker.random.alphaNumeric(5),
    })
    .end()
  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      email: getExceptionMessage('email', EMAIL),
      code: getExceptionMessage('code', MINLENGTH, 6),
      password: getExceptionMessage('password', MINLENGTH, 6),
    },
  })
})

test('Reset password failed due to max length', async ({ client }) => {
  const response = await client
    .post('/api/v1/forgotPassword/setPassword')
    .send({
      email: faker.internet.email(),
      code: faker.random.alphaNumeric(6),
      password: faker.random.alphaNumeric(37),
    })
    .end()
  response.assertStatus(422)
  response.assertJSONSubset({
    data: {
      password: getExceptionMessage('password', MAXLENGTH, 36),
    },
  })
})

test('Reset password failed due to not existing email', async ({ client }) => {
  const response = await client
    .post('/api/v1/forgotPassword/setPassword')
    .send({
      email: faker.internet.email(),
      code: faker.random.alphaNumeric(6),
      password: faker.random.alphaNumeric(10),
    })
    .end()
  response.assertStatus(400)
  response.assertJSONSubset({
    data: getExceptionMessage(undefined, NOT_EXIST_WITH_EMAIL),
  })
})

test('Reset password failed', async ({ assert, client }) => {
  //wrong code
  response = await client
    .post('/api/v1/forgotPassword/setPassword')
    .send({
      email: testProspect.email,
      code: faker.random.alphaNumeric(6),
      password: faker.random.alphaNumeric(10),
    })
    .end()

  response.assertStatus(400)
  response.assertJSONSubset({
    data: getExceptionMessage(undefined, INVALID_CONFIRM_CODE),
  })
}).timeout(0)

test('Reset password succesfully', async ({ assert, client }) => {
  assert.isNotNull(testProspect)
  assert.isNotNull(testProspect.id)

  const { code } = await UserService.requestSendCodeForgotPassword(testProspect.email, 'de')
  assert.isNotNull(code)
  const newPassword = faker.random.alphaNumeric(10)

  const response = await client
    .post('/api/v1/forgotPassword/setPassword')
    .send({
      email: testProspect.email,
      code,
      password: newPassword,
    })
    .end()
  response.assertStatus(200)
  response.assertJSONSubset({ data: true })
}).timeout(0)

test('Failed Get Prospect By Landlord', async ({ client }) => {
  //without login
  let response = await client.get(`/api/v1/profile/tenant/${prospect.id}`).end()
  response.assertStatus(401)
  //with wrong auth
  response = await client
    .get(`/api/v1/profile/tenant/${prospect.id}`)
    .loginVia(prospect, 'jwt')
    .end()

  response.assertStatus(401)
}).timeout(0)

test('Get Prospect By Landlord', async ({ client }) => {
  const response = await client
    .get(`/api/v1/profile/tenant/${prospect.id}`)
    .loginVia(landlord, 'jwtLandlord')
    .end()

  response.assertStatus(200)
}).timeout(0)

test('resetUnreadNotificationCount', async ({ client }) => {
  const response = await client
    .get('/api/v1/notices/resetCount')
    .loginVia(landlord, 'jwtLandlord')
    .end()
  response.assertStatus(200)
}).timeout(0)

test('Update avatar', async ({ assert, client }) => {
  //TODO: needs improvement in the future. Not prioritized for now
  await User.query().where('email', testLandlord.email).update({ status: STATUS_ACTIVE })

  assert.isNull(testLandlord.avatar)
  const outputFileName = await ImageService.saveFunctionalTestImage(
    faker.image.abstract(1234, 2345)
  )

  if (outputFileName) {
    let response = await client
      .put('/api/v1/users/avatar')
      .loginVia(testLandlord, 'jwtLandlord')
      .attach('file', outputFileName)
      .end()

    if (outputFileName) {
      await fsPromise.unlink(outputFileName)
    }
    response.assertStatus(200)
    assert.isNotNull(response.body.data.avatar)
  }
}).timeout(0)
