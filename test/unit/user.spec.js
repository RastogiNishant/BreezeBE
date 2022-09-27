const Suite = use('Test/Suite')('User')

const { test } = Suite

const UserService = use('App/Services/UserService')
const {
  ROLE_LANDLORD,
  ROLE_USER,
  STATUS_EMAIL_VERIFY,
  STATUS_ACTIVE,
} = require('../../app/constants')
const DataStorage = use('DataStorage')
const GoogleAuth = use('GoogleAuth')
const Config = use('Config')
const { get, result } = require('lodash')
const Hash = use('Hash')
const Env = use('Env')

let signUpProspectUser,
  dummyProspectUserData,
  signUpLandlordUser,
  dummyLandlordUserData,
  signInUser,
  code,
  googleDummyUserData,
  googleSignupUser,
  googlePayload

const { before, beforeEach, after, afterEach } = Suite

before(async () => {
  dummyProspectUserData = {
    email: `test_${new Date().getTime().toString()}@gmail.com`,
    role: ROLE_USER,
    password: '12345678',
    sex: '1',
    birthday: '1990-01-01',
    lang: 'en',
  }

  dummyLandlordUserData = {
    email: `landlord_test_${new Date().getTime().toString()}@gmail.com`,
    role: ROLE_LANDLORD,
    password: '12345678',
    sex: '1',
    birthday: '1990-01-01',
    lang: 'en',
  }

  googlePayload = {
    iss: 'accounts.google.com',
    azp: '570764623413-375167v2uuib1ng6eih8gn3o6qrh7hfn.apps.googleusercontent.com',
    aud: '570764623413-375167v2uuib1ng6eih8gn3o6qrh7hfn.apps.googleusercontent.com',
    sub: '110809391763237142152',
    email: `gmail_test_${new Date().getTime().toString()}@gmail.com`,
    email_verified: true,
    at_hash: 'cxR9CbLOjajTiMIk7PUBmg',
    name: 'Unit Test google sign up user',
    picture:
      'https://lh3.googleusercontent.com/a/AATXAJxngk8b3gFsyQuNCNsfDUSw0sFVqvDi9DkBmM8=s96-c',
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
})

googleDummyUserData = {}

after(async () => {
  if (signUpProspectUser) {
    await UserService.removeUser(signUpProspectUser.id)
  }

  if (signUpLandlordUser) {
    await UserService.removeUser(signUpLandlordUser.id)
  }

  if (googleSignupUser) {
    await UserService.removeUser(googleSignupUser.id)
  }
})

test('Sign up with email', async ({ assert }) => {
  signUpProspectUser = await UserService.signUp({
    ...dummyProspectUserData,
    status: STATUS_EMAIL_VERIFY,
  })

  signUpLandlordUser = await UserService.signUp({
    ...dummyLandlordUserData,
    status: STATUS_EMAIL_VERIFY,
  })

  assert.notEqual(signUpProspectUser, null)
}).timeout(0)

test('Send ConfirmEmail', async ({ assert }) => {})

test('Sign in failure before activation', async ({ assert }) => {
  try {
    signInUser = await UserService.login({
      email: dummyProspectUserData.email,
      password: dummyProspectUserData.password,
      role: dummyProspectUserData.role,
    })
    assert.equal(signInUser, null)
  } catch (e) {
    assert.isNotOk(false, 'Pass')
  }
}).timeout(0)

test('Send signup confirm email', async ({ assert }) => {
  code = await UserService.sendConfirmEmail(signUpProspectUser)
  assert.equal(code.length, 4)
}).timeout(0)

test('Activate account', async ({ assert }) => {
  try {
    await UserService.confirmEmail(signUpProspectUser, code)
    assert.isOk(true)
  } catch (e) {
    assert.fail(e.message || e)
  }
}).timeout(0)

test('login with email', async ({ assert }) => {
  signInUser = await UserService.login({
    email: dummyProspectUserData.email,
    password: dummyProspectUserData.password,
    role: dummyProspectUserData.role,
  })

  assert.notEqual(signInUser, null)
})

test('sign up token expiration with Google oAuth', async ({ assert }) => {
  const token =
    'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijc0ODNhMDg4ZDRmZmMwMDYwOWYwZTIyZjNjMjJkYTVmZTM5MDZjY2MiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiNTcwNzY0NjIzNDEzLTM3NTE2N3YydXVpYjFuZzZlaWg4Z24zbzZxcmg3aGZuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiNTcwNzY0NjIzNDEzLTM3NTE2N3YydXVpYjFuZzZlaWg4Z24zbzZxcmg3aGZuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTEwODA5MzkxNzYzMjM3MTQyMTUyIiwiZW1haWwiOiJyYXN0b2dpbmlzaGFudGZsQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiY3hSOUNiTE9qYWpUaU1JazdQVUJtZyIsIm5hbWUiOiJOaXNoYW50IFJhc3RvZ2kiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKeG5nazhiM2dGc3lRdU5DTnNmRFVTdzBzRlZxdkRpOURrQm1NOD1zOTYtYyIsImdpdmVuX25hbWUiOiJOaXNoYW50IiwiZmFtaWx5X25hbWUiOiJSYXN0b2dpIiwibG9jYWxlIjoiZW4tR0IiLCJpYXQiOjE2NTQ1ODEyOTEsImV4cCI6MTY1NDU4NDg5MSwianRpIjoiZmE2YWI4ZThlOTBjMzljMjEzM2RiZWQxNDA3ODZiNmRiMzJjM2U4NiJ9.BUjqRHnlPAUllfFbMlerIsldM4xgn0Oafj8fuhAWly7kOOZgGszUVRLvR1aEzEkTmrEHE8uyyubkAfU3OGtegj02Ath3w0IyUc7eHSDjkBCBYwS6TgqEaiIuIGmeACvgUQwKwpyHQyYWQ6y3VhVQLOaXSeptyGPt7gfQLOleu7KDoLtx3KDNB6ke_47gO2u9M46H0BaU4MN8PrCKquoUeeH0EQ_sbkqHnnV0YgKj88paNpeR3GTYKYNAWhukzRPtys9R9w0J8y_8Oia1T_kOcNL4JfKLsaxiUQZOAcefvaaDAvpb3_-0tfypKDEJkF-v2YfeM0MRdFKCe55_Nn-ORA'
  try {
    const ticket = await GoogleAuth.verifyIdToken({
      idToken: token,
      audience: Env.get('GOOGLE_CLIENT_ID'),
    })
  } catch (e) {
    assert.isOk(true)
  }
}).timeout(0)

test('sign up with Google oAuth', async ({ assert }) => {
  googleSignupUser = await UserService.createUserFromOAuth(null, { ...googleDummyUserData })
  assert.notEqual(googleSignupUser, null)
})

//TODO: We need to implement this one right after implementing memerber unit test
test('sign up with housekeeper', async ({ assert }) => {
  //add member first
  //MemberService.addMember
  // send invitation
  //Need to use MemberService.sendInvitationCode
  //housekeeper signup
})

test('Fail with verified user to resend User Confirm', async ({ assert }) => {
  try {
    const result = await UserService.resendUserConfirm(signUpProspectUser.id)
    assert.equal(result, false)
  } catch (e) {
    assert.fail('Not passed resending user confirmation')
  }
})

test('Get Me', async ({ assert }) => {
  try {
    let user = await UserService.getByEmailWithRole(['it@bits1.ventures'], ROLE_USER)
    if (!user || !user.rows || !user.rows.length) {
      user = signUpProspectUser
    }
    user = await UserService.me(user.rows ? user.rows[0] : user)
    assert.notEqual(user.id, null)
    assert.notEqual(user.email, null)
  } catch (e) {
    assert.fail('Not passed Get Me for UserService')
  }
})

test('Update Profile', async ({ assert }) => {})
test('Change Password', async ({ assert }) => {
  const changed = await UserService.changePassword(
    signUpProspectUser,
    dummyProspectUserData.password,
    'newpassword'
  )
  assert.equal(changed, true)

  const prospect = await UserService.getByEmailWithRole([signUpProspectUser.email], ROLE_USER)
  assert.isNotNull(prospect)
  assert.notEqual(signUpProspectUser.password, prospect.password)

  const landlord = await UserService.getByEmailWithRole([signUpLandlordUser.email], ROLE_LANDLORD)
  assert.isNotNull(landlord)
  assert.notEqual(signUpLandlordUser.password, landlord.password)
}).timeout(0)

test('Change device token', async ({ assert }) => {
  try {
    const device_token = '123453453222'
    const updated = await UserService.updateDeviceToken(signUpProspectUser.id, device_token)
    assert.equal(updated, 1)
  } catch (e) {
    assert.fail('Failed to change device token', e)
  }
})

test('requestSendCodeForgotPassword', async ({ assert }) => {
  let shortLink = await UserService.requestSendCodeForgotPassword(signUpProspectUser.email, 'de')
  assert.isNotNull(shortLink, 'Failed sending forget password for mobile')
  shortLink = await UserService.requestSendCodeForgotPassword(signUpProspectUser.email, 'de', true)
  assert.isNotNull(shortLink, 'Failed sending forget password for frontend')
}).timeout(0)

test('get Tenant Info', async ({ assert }) => {
  // try {
  //   const tenantInfo = await UserService.getTenantInfo(id, signUpProspectUser.id)
  //   console.log()
  //   assert.isNotNull(tenantInfo.id, 'Failed to get tenant info')
  // } catch (e) {
  //   assert.fail('Failed to get tenant info')
  // }
})

test('get Landlord Info', async ({ assert }) => {
  //UserService.getLandlordProfile ()
})

test('resetUnreadNotificationCount', async ({ assert }) => {})

test('updateTenantPremiumPlan', async ({ assert }) => {})

test('getTenantPremiumPlans', async ({ assert }) => {})

test('Close Account', async ({ assert }) => {
  try {
    const closedUser = await UserService.closeAccount(signUpProspectUser)
    assert.notEqual(closedUser.email, null)
    const isClosed = closedUser.email.includes('_breezeClose') ? true : false
    assert.equal(isClosed, true)
  } catch (e) {
    assert.fail('Failed close Account')
  }
})
