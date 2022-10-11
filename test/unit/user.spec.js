const Suite = use('Test/Suite')('User')
const { test } = Suite
const User = use('App/Models/User')
const Estate = use('App/Models/Estate')
const Company = use('App/Models/Company')
const Match = use('App/Models/Match')
const Admin = use('App/Models/Admin')
const UserService = use('App/Services/UserService')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const { faker } = require('@faker-js/faker')
const DataStorage = use('DataStorage')
const Database = use('Database')
const { pick, omit } = require('lodash')

const {
  ROLE_LANDLORD,
  ROLE_USER,
  STATUS_EMAIL_VERIFY,
  MATCH_STATUS_FINISH,
  STATUS_DELETE,
  STATUS_ACTIVE,
  MATCH_STATUS_VISIT,
  MATCH_STATUS_COMMIT,
  USER_ACTIVATION_STATUS_ACTIVATED,
  SMS_VERIFY_PREFIX,
  PASS_ONBOARDING_STEP_COMPANY,
  CONNECT_SERVICE_INDEX,
  MATCH_SERVICE_INDEX,
  PASS_ONBOARDING_STEP_PREFERRED_SERVICES,
} = require('../../app/constants')

const {
  exceptions: {
    REQUIRED,
    MINLENGTH,
    MAXLENGTH,
    OPTION,
    DATE,
    BOOLEAN,
    EMAIL,
    MATCH,
    USER_NOT_FOUND,
    USER_WRONG_PASSWORD,
    ARRAY,
    NUMBER,
    USER_UNIQUE,
    USER_NOT_EXIST,
    SMS_CODE_NOT_CORERECT,
    USER_NOT_VERIFIED,
    NOT_EXIST_WITH_EMAIL,
    INVALID_CONFIRM_CODE,
  },
} = require('../../app/excepions')

const EstateService = require('../../app/Services/EstateService')
const MatchService = require('../../app/Services/MatchService')
const Hash = use('Hash')
let signUpProspectUser,
  dummyProspectUserData,
  signUpLandlordUser,
  dummyLandlordUserData,
  googleDummyUserData,
  googleSignupUser,
  googlePayload,
  landlord,
  prospect,
  globalEstate,
  globalMatch,
  newAdmin,
  adminData

const { before, beforeEach, after, afterEach } = Suite

const prospectDataEmail = `functional_prospect_${new Date().getTime().toString()}@gmail.com`
const landlordDataEmail = `functional_landlord_${new Date().getTime().toString()}@gmail.com`

before(async () => {
  adminData = {
    email: `admin_${new Date().getTime().toString()}@gmail.com`,
    fullname: faker.name.fullName(),
    password: 'admin_12345678',
  }

  dummyProspectUserData = {
    email: prospectDataEmail,
    firstname: faker.name.firstName(),
    secondname: faker.name.lastName(),
    role: ROLE_USER,
    password: '12345678',
    sex: '1',
    birthday: '1990-01-01',
    lang: 'en',
  }

  dummyProspectUserData = {
    email: landlordDataEmail,
    firstname: faker.name.firstName(),
    secondname: faker.name.lastName(),
    role: ROLE_USER,
    password: '12345678',
    sex: '1',
    birthday: '1990-01-01',
    lang: 'en',
  }

  dummyLandlordUserData = {
    email: `test_landlord_${new Date().getTime().toString()}@gmail.com`,
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

  landlord = await User.query()
    .where('role', ROLE_LANDLORD)
    .where('email', 'it@bits.ventures')
    .firstOrFail()

  prospect = await User.query()
    .where('role', ROLE_USER)
    .where('email', 'it@bits.ventures')
    .firstOrFail()
})

after(async () => {
  if (globalMatch) {
    await MatchService.deletePermanant({
      user_id: globalMatch.user_id,
    })
  }
  if (globalEstate) {
    await EstateService.deletePermanent(globalEstate.user_id)
  }
  if (signUpProspectUser) {
    await UserService.removeUser(signUpProspectUser.id)
  }
  if (signUpLandlordUser) {
    await UserService.removeUser(signUpLandlordUser.id)
  }
  if (googleSignupUser) {
    await UserService.removeUser(googleSignupUser.id)
  }
  if (newAdmin) {
    await Admin.query().where('id', newAdmin.id).delete()
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

test('Send signup confirm email & Activate account', async ({ assert }) => {
  const code = await UserService.sendConfirmEmail(signUpProspectUser)
  assert.equal(code.length, 4)

  await UserService.confirmEmail(signUpProspectUser, code)

  const user = await User.query().where('id', signUpProspectUser.id).first()
  assert.isNotNull(user)
  assert.equal(user.status, STATUS_ACTIVE)
}).timeout(0)

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

  assert.include(
    googleSignupUser.toJSON({ isOwner: true }),
    pick(googleDummyUserData, ['email', 'role', 'google_id', 'device_token'])
  )
}).timeout(0)

/*
  TODO: We need to implement this one right after implementing memerber unit test
*/
test('sign up with housekeeper', async ({ assert }) => {
  //add member first
  //MemberService.addMember
  // send invitation
  //Need to use MemberService.sendInvitationCode
  //housekeeper signup
}).timeout(0)

test('Fail with verified user to resend User Confirm', async ({ assert }) => {
  try {
    const result = await UserService.resendUserConfirm(signUpProspectUser.id)
    assert.equal(result, false)
  } catch (e) {
    assert.fail('Not passed resending user confirmation')
  }
}).timeout(0)

test('Get Me', async ({ assert }) => {
  let user = signUpProspectUser
  assert.include(user.toJSON({ isOwner: true }), omit(dummyProspectUserData, ['password']))
}).timeout(0)

test('Change Password', async ({ assert }) => {
  const newPassword = faker.random.numeric(20)
  const changed = await UserService.changePassword(
    signUpProspectUser,
    dummyProspectUserData.password,
    newPassword
  )
  assert.equal(changed, true)

  const tempProspect = await UserService.getById(signUpProspectUser.id)

  assert.isNotNull(tempProspect)
  assert.notEqual(dummyProspectUserData.password, newPassword)
  let verifyPassword = await Hash.verify(newPassword, tempProspect.password)
  assert.isTrue(verifyPassword)

  const tempLandlord = await UserService.getById(signUpLandlordUser.id)
  assert.isNotNull(tempLandlord)
  assert.notEqual(dummyLandlordUserData.password, newPassword)
}).timeout(0)

test('Get household', async ({ assert }) => {
  assert.isNotNull(prospect)
  const household = await UserService.getHousehouseId(prospect.id)
  assert.isNotNull(household)
  if (prospect.owner_id) {
    assert.isNotNull(household.owner_id)
  } else {
    assert.isNull(household.owner_id)
  }
})

test('Update device token', async ({ assert }) => {
  const device_token = faker.random.alphaNumeric(31)
  await UserService.updateDeviceToken(signUpProspectUser.id, device_token)
  const prospect = await UserService.getById(signUpProspectUser.id)
  assert.equal(prospect.device_token, device_token)
}).timeout(0)

test('Landlord has permission to access Tenant full profile', async ({ assert }) => {
  assert.isNotNull(signUpProspectUser)
  assert.isNotNull(signUpLandlordUser)
  assert.isNotNull(landlord)
  assert.isNotNull(prospect)

  let hasAccess = await UserService.landlordHasAccessTenant(landlord.id, signUpProspectUser.id)
  assert.equal(hasAccess, false)

  hasAccess = await UserService.landlordHasAccessTenant(signUpLandlordUser.id, prospect.id)
  assert.equal(hasAccess, false)

  globalEstate = await Estate.createItem({
    user_id: signUpLandlordUser.id,
    property_id: faker.random.alphaNumeric(5),
  })
  assert.isNotNull(globalEstate)

  await Database.table('matches').insert({
    user_id: signUpProspectUser.id,
    estate_id: globalEstate.id,
    percent: 0.5,
    share: true,
    status: MATCH_STATUS_VISIT,
  })

  globalMatch = await Match.query()
    .where('user_id', signUpProspectUser.id)
    .where('estate_id', globalEstate.id)
    .first()
  assert.isNotNull(globalMatch)
  globalMatch = globalMatch.toJSON()

  hasAccess = await UserService.landlordHasAccessTenant(
    signUpLandlordUser.id,
    signUpProspectUser.id
  )
  assert.equal(hasAccess, true)

  await MatchService.deletePermanant({ user_id: globalMatch.user_id })

  await Database.table('matches').insert({
    user_id: signUpProspectUser.id,
    estate_id: globalEstate.id,
    percent: 0.5,
    share: false,
    status: MATCH_STATUS_FINISH,
  })

  globalMatch = await Match.query()
    .where('user_id', signUpProspectUser.id)
    .where('estate_id', globalEstate.id)
    .first()
  assert.isNotNull(globalMatch)
  globalMatch = globalMatch.toJSON()

  hasAccess = await UserService.landlordHasAccessTenant(
    signUpLandlordUser.id,
    signUpProspectUser.id
  )
  assert.equal(hasAccess, true)

  await MatchService.deletePermanant({ user_id: globalMatch.user_id })

  await Database.table('matches').insert({
    user_id: signUpProspectUser.id,
    estate_id: globalEstate.id,
    percent: 0.5,
    share: false,
    status: MATCH_STATUS_COMMIT,
  })

  globalMatch = await Match.query()
    .where('user_id', signUpProspectUser.id)
    .where('estate_id', globalEstate.id)
    .first()
  assert.isNotNull(globalMatch)
  globalMatch = globalMatch.toJSON()

  hasAccess = await UserService.landlordHasAccessTenant(
    signUpLandlordUser.id,
    signUpProspectUser.id
  )
  assert.equal(hasAccess, false)
})

test('getTokenWithLocale', async ({ assert }) => {
  assert.isNotNull(signUpProspectUser)

  const user = await User.query().where('id', signUpProspectUser.id).first()
  assert.isNotNull(user)

  let tokens = await UserService.getTokenWithLocale([signUpProspectUser.id])
  if (user.notice && user.device_token) {
    assert.isNotNull(tokens)
    assert.equal(tokens.length, 1)
  } else {
    assert.isNull(tokens)
  }

  let updateResult = await User.query()
    .update({ device_token: null })
    .where('id', signUpProspectUser.id)
  assert.equal(updateResult, 1)

  tokens = await UserService.getTokenWithLocale([signUpProspectUser.id])
  assert.equal(tokens.length, 0)

  updateResult = await User.query()
    .update({ device_token: faker.random.alphaNumeric(32), notice: false })
    .where('id', signUpProspectUser.id)
  assert.equal(updateResult, 1)

  tokens = await UserService.getTokenWithLocale([signUpProspectUser.id])
  assert.equal(tokens.length, 0)
})

test('getUserIdsByToken', async ({ assert }) => {
  const device_token = faker.random.alphaNumeric(32)
  const updateResult = await User.query()
    .update({ device_token: device_token })
    .where('id', signUpProspectUser.id)
  assert.equal(updateResult, 1)

  const users = await UserService.getUserIdsByToken([{ identifier: device_token }])
  assert.isNotNull(users)
  assert.equal(users.length, 1)
  assert.equal(users[0].id, signUpProspectUser.id)
  assert.equal(users[0].device_token, device_token)
})

test('getNewestInactiveLandlordsIds', async ({ assert }) => {
  await User.query()
    .where({ id: signUpLandlordUser.id })
    .update({ status: STATUS_ACTIVE, created_at: new Date() })

  let landlordIds = await UserService.getNewestInactiveLandlordsIds()
  assert.isNotNull(landlordIds)

  const newLandlordCount = landlordIds.length
  assert.isAbove(landlordIds.length, 0)

  await User.query()
    .where({ id: signUpLandlordUser.id })
    .update({ status: STATUS_ACTIVE, created_at: new Date().setDate(new Date().getDate() - 2) })

  landlordIds = await UserService.getNewestInactiveLandlordsIds()
  assert.isNotNull(landlordIds)
  if (newLandlordCount > 0) {
    assert.notEqual(newLandlordCount, landlordIds.length)
  }
})

test('get7DaysInactiveLandlord', async ({ assert }) => {
  await User.query()
    .where({ id: signUpLandlordUser.id })
    .update({ status: STATUS_ACTIVE, created_at: new Date().setDate(new Date().getDate() - 7) })

  let landlordIds = await UserService.get7DaysInactiveLandlord()
  assert.isNotNull(landlordIds)
  assert.isAbove(landlordIds.length, 0)
})

test('verifyUsers', async ({ assert }) => {
  newAdmin = await Admin.createItem(adminData)
  assert.isNotNull(newAdmin)
  assert.isNotNull(newAdmin.id)
  await UserService.verifyUsers(newAdmin.id, [signUpLandlordUser.id], true)

  const user = await User.query().where('id', signUpLandlordUser.id).first()
  assert.isNotNull(user)
  const userJSON = user.toJSON({ isOwner: true })

  assert.equal(userJSON.activation_status, USER_ACTIVATION_STATUS_ACTIVATED)
  assert.equal(userJSON.is_verified, true)
  assert.equal(userJSON.verified_by, newAdmin.id)
})

test('sendSMS', async ({ assert }) => {
  assert.isNotNull(signUpLandlordUser)
  const code = await UserService.sendSMS(signUpLandlordUser.id, faker.phone.number())
  assert.isNumber(code)

  const verifyCode = await DataStorage.getItem(signUpLandlordUser.id, SMS_VERIFY_PREFIX)
  assert.isNotNull(verifyCode)
  assert.isNotNull(verifyCode.code)
  assert.equal(code, verifyCode.code)
})

test('confirmSMS', async ({ assert }) => {
  assert.isNotNull(signUpLandlordUser)
  await User.query().where('id', signUpLandlordUser.id).update({ status: STATUS_EMAIL_VERIFY })

  const phoneNumber = faker.phone.number()
  try {
    await UserService.confirmSMS(signUpLandlordUser.email, phoneNumber, faker.random.numeric(10))
  } catch (e) {
    assert.equal(e.message, USER_NOT_EXIST)
  }

  await User.query()
    .where('id', signUpLandlordUser.id)
    .update({ status: STATUS_EMAIL_VERIFY, phone: phoneNumber })

  try {
    await UserService.confirmSMS(signUpLandlordUser.email, phoneNumber, faker.random.numeric(10))
  } catch (e) {
    assert.equal(e.message, SMS_CODE_NOT_CORERECT)
    let verifyData = await DataStorage.getItem(signUpLandlordUser.id, SMS_VERIFY_PREFIX)
    assert.equal(verifyData.count, 4)
  }

  const code = await UserService.sendSMS(signUpLandlordUser.id, phoneNumber)
  assert.isNumber(code)

  await UserService.confirmSMS(signUpLandlordUser.email, phoneNumber, code)
  const user = await User.query().where('id', signUpLandlordUser.id).first()
  assert.equal(user.status, STATUS_ACTIVE)
})

test('proceedBuddyInviteLink', async ({ assert }) => {
  const user = await User.query().where('id', signUpLandlordUser.id).first()
  const userJSON = user.toJSON({ isOwner: true })

  /**
   * TODO: Need to be decided
   * Please check line 756 in UserService.js
   */
})

test('setOnboardingStep', async ({ assert }) => {
  assert.isNotNull(signUpLandlordUser)
  let user = await User.query().where('id', signUpLandlordUser.id).first()
  const userJSON = user.toJSON({ isOwner: true })

  assert.isUndefined(userJSON.onboarding_step)
  await UserService.setOnboardingStep(user)
  assert.equal(user.onboarding_step, PASS_ONBOARDING_STEP_COMPANY)

  const company = await Company.createItem({
    name: faker.company.name(),
    address: faker.address.cityName(),
  })
  assert.isNotNull(company)
  assert.isNotNull(company.id)

  await User.query().where('id', signUpLandlordUser.id).update({ company_id: company.id })
  user = await User.query().where('id', signUpLandlordUser.id).first()
  await UserService.setOnboardingStep(user)
  assert.equal(user.onboarding_step, PASS_ONBOARDING_STEP_PREFERRED_SERVICES)

  await User.query()
    .where('id', signUpLandlordUser.id)
    .update({ preferred_services: [CONNECT_SERVICE_INDEX, MATCH_SERVICE_INDEX] })

  user = await User.query().where('id', signUpLandlordUser.id).first()
  await UserService.setOnboardingStep(user)
  assert.isNull(user.onboarding_step)

  await User.query().where('id', signUpLandlordUser.id).update({ company_id: null })
  await Company.query().where('id', company.id).delete()
})

test('Request SendCode ForgotPassword', async ({ assert }) => {
  const { shortLink, code } = await UserService.requestSendCodeForgotPassword(
    signUpProspectUser.email,
    'de'
  )
  let verifyCode = await DataStorage.getItem(signUpProspectUser.id, 'forget_password')
  assert.isNotNull(code)
  assert.isDefined(code)
  assert.isDefined(verifyCode)
  assert.isNotNull(verifyCode)
  assert.equal(code, verifyCode.code)
  assert.isNotNull(shortLink)

  const webForgetPassword = await UserService.requestSendCodeForgotPassword(
    signUpProspectUser.email,
    'de',
    true
  )
  verifyCode = await DataStorage.getItem(signUpProspectUser.id, 'forget_password')
  assert.isNotNull(verifyCode)
  assert.isNotNull(webForgetPassword.code)
  assert.isDefined(webForgetPassword.code)
  assert.equal(webForgetPassword.code, verifyCode.code)
  assert.isNotNull(webForgetPassword.shortLink)
  assert.isNotNull(webForgetPassword.shortLink)
}).timeout(0)

test('Get tenant By Landlord', async ({ assert }) => {
  const tenant = await UserService.getTenantInfo(prospect.id, landlord.id)
  if (tenant) {
    assert.equal(tenant.id, prospect.id)
    assert.isUndefined(tenant.password)
    assert.isTrue(tenant.finish, true)
    assert.isDefined(tenant.tenant)
  }

  if (!tenant.share) {
    assert.equal(tenant.status, MATCH_STATUS_FINISH)
  } else {
    assert.isTrue(tenant.share)
  }

  if (tenant.tenant) {
    assert.isDefined(tenant.tenant.members)
    if (tenant.tenant.members && tenant.tenant.members.length) {
      assert.equal(tenant.tenant.members[0].user_id, prospect.id)
    }
  }
})

test('Increase Unread NotificationCount', async ({ assert }) => {
  assert.isNotNull(signUpProspectUser)
  assert.isNotNull(signUpProspectUser.id)
  let user = await User.query().where('id', signUpProspectUser.id).first()
  assert.isNotNull(user)
  const unread_notification_count = user.unread_notification_count

  await UserService.increaseUnreadNotificationCount(signUpProspectUser.id)
  user = await User.query().where('id', signUpProspectUser.id).first()
  assert.isNotNull(user)
  assert.equal(unread_notification_count + 1, user.unread_notification_count)
})

test('Reset Unread NotificationCount', async ({ assert }) => {
  assert.isNotNull(signUpProspectUser)
  assert.isNotNull(signUpProspectUser.id)

  let user = await User.query().where('id', signUpProspectUser.id).first()
  assert.isNotNull(user)
  const notificationCount = user.unread_notification_count
  assert.isAbove(notificationCount, 0)

  await UserService.resetUnreadNotificationCount(signUpProspectUser.id)
  user = await User.query().where('id', signUpProspectUser.id).first()

  assert.isNotNull(user)
  assert.equal(user.unread_notification_count, 0)
})

test('Change email', async ({ assert }) => {
  const newEmail = faker.internet.email()
  await UserService.changeEmail({ user: signUpProspectUser, email: newEmail })
  const user = await User.query().where('id', signUpProspectUser.id).first()
  assert.isNotNull(user)
  const userObject = user.toJSON({ isOwner: true })
  assert.equal(newEmail, userObject.email)
  assert.equal(userObject.status, STATUS_EMAIL_VERIFY)

  const code = await DataStorage.getItem(user.id, 'confirm_email')
  assert.isNotNull(code)
}).timeout(0)

test('Close Account', async ({ assert }) => {
  const closedUser = await UserService.closeAccount(signUpProspectUser)
  assert.notEqual(closedUser.email, null)
  const isClosed = closedUser.email.includes('_breezeClose') ? true : false
  assert.equal(isClosed, true)

  assert.equal(closedUser.firstname, ' USER')
  assert.equal(closedUser.secondname, ' DELETED')
  assert.equal(closedUser.approved_landlord, false)
  assert.equal(closedUser.is_admin, false)
  assert.equal(closedUser.device_token, null)
  assert.equal(closedUser.google_id, null)
  assert.equal(closedUser.status, STATUS_DELETE)
}).timeout(0)
