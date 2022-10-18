const Suite = use('Test/Suite')('User')
const { test } = Suite
const User = use('App/Models/User')
const Tenant = use('App/Models/Tenant')
const Estate = use('App/Models/Estate')
const Company = use('App/Models/Company')
const Match = use('App/Models/Match')
const Admin = use('App/Models/Admin')
const UserService = use('App/Services/UserService')
const { faker } = require('@faker-js/faker')
const DataStorage = use('DataStorage')
const Database = use('Database')
const { pick, omit } = require('lodash')
const AgreementService = use('App/Services/AgreementService')
const moment = require('moment')

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
  ERROR_USER_NOT_VERIFIED_LOGIN,
} = require('../../app/constants')

const {
  exceptions: { USER_NOT_EXIST, SMS_CODE_NOT_CORERECT, INVALID_TOKEN },
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
  globalCompany,
  newAdmin,
  adminData,
  fakePhoneNumber,
  emailCode,
  smsCode

const { before, after } = Suite

const prospectDataEmail = `unit_prospect_${new Date().getTime().toString()}@gmail.com`
const landlordDataEmail = `unit_landlord_${new Date().getTime().toString()}@gmail.com`
const adminDataEmail = `admin_${new Date().getTime().toString()}@gmail.com`

const createFakeMatchAndValidate = async (data, assert) => {
  assert.isNotNull(globalEstate)
  await Database.table('matches').insert({
    ...data,
    user_id: signUpProspectUser.id,
    estate_id: globalEstate.id,
    percent: 0.5,
  })

  globalMatch = await Match.query()
    .where('user_id', signUpProspectUser.id)
    .where('estate_id', globalEstate.id)
    .first()
  assert.isNotNull(globalMatch)
  globalMatch = globalMatch.toJSON()
}

before(async () => {
  adminData = {
    email: adminDataEmail,
    fullname: faker.name.fullName(),
    password: 'admin_12345678',
  }

  dummyProspectUserData = {
    email: prospectDataEmail,
    firstname: faker.name.firstName(),
    secondname: faker.name.lastName(),
    role: ROLE_USER,
    password: '12345678',
    sex: 1,
    birthday: '1990-01-01',
    lang: 'en',
  }

  dummyLandlordUserData = {
    email: landlordDataEmail,
    role: ROLE_LANDLORD,
    password: '12345678',
    sex: 1,
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

  fakePhoneNumber = faker.phone.number()
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

test('it shoud sign up with email successfully for prospect', async ({ assert }) => {
  const agreement = await AgreementService.getLatestActive()
  const term = await AgreementService.getActiveTerms()
  assert.isNotNull(agreement.id)
  assert.isNotNull(term.id)

  signUpProspectUser = await UserService.signUp({
    ...dummyProspectUserData,
  })

  assert.include(signUpProspectUser.toJSON({ isOwner: true }), {
    ...omit(dummyProspectUserData, ['password']),
    status: STATUS_EMAIL_VERIFY,
    agreements_id: agreement.id,
    terms_id: term.id,
  })
  let verifyPassword = await Hash.verify(
    dummyProspectUserData.password,
    signUpProspectUser.password
  )

  assert.isTrue(verifyPassword)

  const tenant = await Tenant.query().where('user_id', signUpProspectUser.id).first()
  assert.isNotNull(tenant)
  assert.isNotNull(tenant.id)
}).timeout(0)

test('it shoud sign up with email successfully for landlord', async ({ assert }) => {
  const agreement = await AgreementService.getLatestActive()
  const term = await AgreementService.getActiveTerms()
  assert.isNotNull(agreement.id)
  assert.isNotNull(term.id)

  signUpLandlordUser = await UserService.signUp({
    ...dummyLandlordUserData,
  })
  assert.include(signUpLandlordUser.toJSON({ isOwner: true }), {
    ...omit(dummyLandlordUserData, ['password']),
    status: STATUS_EMAIL_VERIFY,
    agreements_id: agreement.id,
    terms_id: term.id,
  })

  verifyPassword = await Hash.verify(dummyLandlordUserData.password, signUpLandlordUser.password)
  assert.isTrue(verifyPassword)
}).timeout(0)

test('it shoud sign in failure before activation', async ({ assert }) => {
  try {
    signInUser = await UserService.login({
      email: dummyProspectUserData.email,
      password: dummyProspectUserData.password,
      role: dummyProspectUserData.role,
    })
    assert.fail("User shouldn't be able to sign in before activation, error should be catched")
  } catch (e) {
    assert.equal(e.code, parseInt(`${ERROR_USER_NOT_VERIFIED_LOGIN}${signUpProspectUser.id}`))
    assert.isNotOk(false, 'Pass')
  }
}).timeout(0)

test('it should return prospect token', async ({ assert }) => {
  assert.isNotNull(signUpProspectUser.id)

  const user = await User.query().where('id', signUpProspectUser.id).first()
  assert.isNotNull(user)

  let tokens = await UserService.getTokenWithLocale([signUpProspectUser.id])
  assert.isNotNull(tokens)
  if (user.notice && user.device_token) {
    assert.equal(tokens.length, 1)
  } else {
    assert.equal(tokens.length, 0)
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

test('it should send confirm email successfully', async ({ assert }) => {
  const code = await UserService.sendConfirmEmail(signUpProspectUser)
  emailCode = code
  assert.equal(code.length, 4)

  const verifyCode = await DataStorage.getItem(signUpProspectUser.id, 'confirm_email')
  assert.isNotNull(verifyCode)
  assert.isNotNull(verifyCode.code)
  assert.equal(code, verifyCode.code)
}).timeout(0)

test('it should confirm email successfully by the code sent', async ({ assert }) => {
  await UserService.confirmEmail(signUpProspectUser, emailCode)
  const user = await User.query().where('id', signUpProspectUser.id).first()
  assert.isNotNull(user)
  assert.equal(user.status, STATUS_ACTIVE)

  const verifyCode = await DataStorage.getItem(signUpProspectUser.id, 'confirm_email')
  assert.isNull(verifyCode)
}).timeout(0)

test('it should return invalid token message with expired token of Google oAuth', async ({
  assert,
}) => {
  const token =
    'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijc0ODNhMDg4ZDRmZmMwMDYwOWYwZTIyZjNjMjJkYTVmZTM5MDZjY2MiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiNTcwNzY0NjIzNDEzLTM3NTE2N3YydXVpYjFuZzZlaWg4Z24zbzZxcmg3aGZuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiNTcwNzY0NjIzNDEzLTM3NTE2N3YydXVpYjFuZzZlaWg4Z24zbzZxcmg3aGZuLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTEwODA5MzkxNzYzMjM3MTQyMTUyIiwiZW1haWwiOiJyYXN0b2dpbmlzaGFudGZsQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdF9oYXNoIjoiY3hSOUNiTE9qYWpUaU1JazdQVUJtZyIsIm5hbWUiOiJOaXNoYW50IFJhc3RvZ2kiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUFUWEFKeG5nazhiM2dGc3lRdU5DTnNmRFVTdzBzRlZxdkRpOURrQm1NOD1zOTYtYyIsImdpdmVuX25hbWUiOiJOaXNoYW50IiwiZmFtaWx5X25hbWUiOiJSYXN0b2dpIiwibG9jYWxlIjoiZW4tR0IiLCJpYXQiOjE2NTQ1ODEyOTEsImV4cCI6MTY1NDU4NDg5MSwianRpIjoiZmE2YWI4ZThlOTBjMzljMjEzM2RiZWQxNDA3ODZiNmRiMzJjM2U4NiJ9.BUjqRHnlPAUllfFbMlerIsldM4xgn0Oafj8fuhAWly7kOOZgGszUVRLvR1aEzEkTmrEHE8uyyubkAfU3OGtegj02Ath3w0IyUc7eHSDjkBCBYwS6TgqEaiIuIGmeACvgUQwKwpyHQyYWQ6y3VhVQLOaXSeptyGPt7gfQLOleu7KDoLtx3KDNB6ke_47gO2u9M46H0BaU4MN8PrCKquoUeeH0EQ_sbkqHnnV0YgKj88paNpeR3GTYKYNAWhukzRPtys9R9w0J8y_8Oia1T_kOcNL4JfKLsaxiUQZOAcefvaaDAvpb3_-0tfypKDEJkF-v2YfeM0MRdFKCe55_Nn-ORA'
  try {
    const isValidToken = await UserService.verifyGoogleToken(token)
    assert.isTrue(isValidToken)
  } catch (e) {
    assert.isOk(true)
    assert.equal(e.message, INVALID_TOKEN)
  }
}).timeout(0)

test('it should sign up with google oAuth successfully', async ({ assert }) => {
  //TODO: improvement needed in the future
  googleSignupUser = await UserService.createUserFromOAuth(null, { ...googleDummyUserData })

  assert.include(
    googleSignupUser.toJSON({ isOwner: true }),
    pick(googleDummyUserData, ['email', 'role', 'google_id', 'device_token'])
  )
}).timeout(0)

/*
  TODO: We need to implement this one right after implementing memerber unit test
*/
test('it should sign up with housekeeper', async ({ assert }) => {
  //add member first
  //MemberService.addMember
  // send invitation
  //Need to use MemberService.sendInvitationCode
  //housekeeper signup
}).timeout(0)

test('it should return false with verified user to get unverified user', async ({ assert }) => {
  try {
    const result = await UserService.resendUserConfirm(signUpProspectUser.id)
    assert.equal(result, false)
  } catch (e) {
    assert.fail('Not passed resending user confirmation')
  }
}).timeout(0)

test('it should get all info for the account', async ({ assert }) => {
  let user = signUpProspectUser
  assert.include(user.toJSON({ isOwner: true }), omit(dummyProspectUserData, ['password']))

  assert.isNotNull(signUpProspectUser.id)
  assert.equal(signUpProspectUser.status, STATUS_ACTIVE)

  const newToken = faker.random.alphaNumeric(35)
  assert.notEqual(signUpProspectUser.device_token, newToken)
  user = await UserService.me(signUpProspectUser, newToken)

  assert.include(
    { ...user, birthday: user.birthday.toISOString() },
    {
      ...omit(dummyProspectUserData, ['password']),
      birthday: moment.utc(dummyProspectUserData.birthday).toISOString(),
      status: STATUS_ACTIVE,
      device_token: newToken,
    }
  )
}).timeout(0)

test('it should change password successfully', async ({ assert }) => {
  //TODO: we update all accounts with the same email. We have to validate that all accounts are updated synchronously
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

test('it should get household of prospect', async ({ assert }) => {
  assert.isNotNull(prospect)
  const household = await UserService.getHousehouseId(prospect.id)
  assert.isNotNull(household)
  if (prospect.owner_id) {
    assert.isNotNull(household.owner_id)
  } else {
    assert.isNull(household.owner_id)
  }
})

test('it should update device token', async ({ assert }) => {
  const device_token = faker.random.alphaNumeric(31)
  await UserService.updateDeviceToken(signUpProspectUser.id, device_token)
  const prospect = await UserService.getById(signUpProspectUser.id)
  assert.equal(prospect.device_token, device_token)
}).timeout(0)

test('it should validate for landlord not to have access to tenant full profile before thre is no match', async ({
  assert,
}) => {
  assert.isNotNull(signUpProspectUser)
  assert.isNotNull(signUpLandlordUser)
  assert.isNotNull(landlord)
  assert.isNotNull(prospect)

  let hasAccess = await UserService.landlordHasAccessTenant(landlord.id, signUpProspectUser.id)
  assert.equal(hasAccess, false)

  hasAccess = await UserService.landlordHasAccessTenant(signUpLandlordUser.id, prospect.id)
  assert.equal(hasAccess, false)
})

test('it should return false for Landlord not to have access to tenant full profile before tenant shares his profile', async ({
  assert,
}) => {
  globalEstate = await Estate.createItem({
    user_id: signUpLandlordUser.id,
    property_id: faker.random.alphaNumeric(5),
  })

  await createFakeMatchAndValidate({ share: false, status: MATCH_STATUS_VISIT }, assert)

  hasAccess = await UserService.landlordHasAccessTenant(
    signUpLandlordUser.id,
    signUpProspectUser.id
  )
  assert.equal(hasAccess, false)
  await MatchService.deletePermanant({ user_id: globalMatch.user_id })
})

test('it should return true for landlord to have access to tenant full profile after tenant shares his profile', async ({
  assert,
}) => {
  await createFakeMatchAndValidate({ share: true, status: MATCH_STATUS_VISIT }, assert)

  hasAccess = await UserService.landlordHasAccessTenant(
    signUpLandlordUser.id,
    signUpProspectUser.id
  )
  assert.equal(hasAccess, true)

  await MatchService.deletePermanant({ user_id: globalMatch.user_id })
})

test('it should return true for landlord to have permission to access tenant full profile with final match even no share', async ({
  assert,
}) => {
  await createFakeMatchAndValidate({ share: false, status: MATCH_STATUS_FINISH }, assert)

  hasAccess = await UserService.landlordHasAccessTenant(
    signUpLandlordUser.id,
    signUpProspectUser.id
  )
  assert.equal(hasAccess, true)

  await MatchService.deletePermanant({ user_id: globalMatch.user_id })
})

test('it should return false for landlord not to have permission to access tenant full profile with commit match and no share', async ({
  assert,
}) => {
  await createFakeMatchAndValidate({ share: false, status: MATCH_STATUS_COMMIT }, assert)

  hasAccess = await UserService.landlordHasAccessTenant(
    signUpLandlordUser.id,
    signUpProspectUser.id
  )
  assert.equal(hasAccess, false)

  await MatchService.deletePermanant({ user_id: globalMatch.user_id })
})

test('it should return user who has provided token', async ({ assert }) => {
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

test('it should return new landlord ids which has been created and activated 1 day ago', async ({
  assert,
}) => {
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

test('it should return new landlord ids which has been created and activated 1 day 7 days ago', async ({
  assert,
}) => {
  await User.query()
    .where({ id: signUpLandlordUser.id })
    .update({ status: STATUS_ACTIVE, created_at: new Date().setDate(new Date().getDate() - 7) })

  let landlordIds = await UserService.get7DaysInactiveLandlord()
  assert.isNotNull(landlordIds)
  assert.isAbove(landlordIds.length, 0)
})

test('it should update to activate landlords by admin', async ({ assert }) => {
  assert.isNotNull(signUpLandlordUser)
  assert.isNotNull(signUpLandlordUser.id)

  try {
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
  } catch (e) {}
})

test('it should send sms successfully', async ({ assert }) => {
  assert.isNotNull(signUpLandlordUser)
  const code = await UserService.sendSMS(signUpLandlordUser.id, faker.phone.number())
  assert.isNumber(code)

  smsCode = code

  const verifyCode = await DataStorage.getItem(signUpLandlordUser.id, SMS_VERIFY_PREFIX)
  assert.isNotNull(verifyCode)
  assert.isNotNull(verifyCode.code)
  assert.equal(code, verifyCode.code)
})

test('it should fail to confirm sms code due to not existing phone number', async ({ assert }) => {
  // prepare user
  await User.query().where('id', signUpLandlordUser.id).update({ status: STATUS_EMAIL_VERIFY })
  try {
    await UserService.confirmSMS(
      signUpLandlordUser.email,
      fakePhoneNumber,
      faker.random.numeric(10)
    )
  } catch (e) {
    assert.equal(e.message, USER_NOT_EXIST)
  }
})

test('it should fail to confirm sms codes due to wrong code', async ({ assert }) => {
  // prepare user
  await User.query()
    .where('id', signUpLandlordUser.id)
    .update({ status: STATUS_EMAIL_VERIFY, phone: fakePhoneNumber })
  try {
    await UserService.confirmSMS(
      signUpLandlordUser.email,
      fakePhoneNumber,
      faker.random.numeric(10)
    )
  } catch (e) {
    assert.equal(e.message, SMS_CODE_NOT_CORERECT)
    let verifyData = await DataStorage.getItem(signUpLandlordUser.id, SMS_VERIFY_PREFIX)
    assert.equal(verifyData.count, 4)
  }
})

test('it should confirm sms successfully', async ({ assert }) => {
  await UserService.confirmSMS(signUpLandlordUser.email, fakePhoneNumber, smsCode)
  const user = await User.query().where('id', signUpLandlordUser.id).first()
  const verifyCode = await DataStorage.getItem(signUpLandlordUser.id, SMS_VERIFY_PREFIX)
  assert.isNull(verifyCode)
  assert.equal(user.status, STATUS_ACTIVE)
})

test('proceedBuddyInviteLink', async ({ assert }) => {
  //TODO: handle it later
  const user = await User.query().where('id', signUpLandlordUser.id).first()
  const userJSON = user.toJSON({ isOwner: true })

  /**
   * TODO: Need to be decided
   * Please check line 756 in UserService.js
   */
})

test('setOnboardingStep should set it as company step in case no company', async ({ assert }) => {
  assert.isNotNull(signUpLandlordUser)
  const user = await User.query().where('id', signUpLandlordUser.id).first()
  const userJSON = user.toJSON({ isOwner: true })

  assert.isUndefined(userJSON.onboarding_step)
  await UserService.setOnboardingStep(user)
  assert.equal(user.onboarding_step, PASS_ONBOARDING_STEP_COMPANY)
})

test('setOnboardingStep should set it as company step in case there is a company but no preferred services', async ({
  assert,
}) => {
  // prepare company
  globalCompany = await Company.createItem({
    name: faker.company.name(),
    address: faker.address.cityName(),
  })
  assert.isNotNull(globalCompany)
  assert.isNotNull(globalCompany.id)
  await User.query().where('id', signUpLandlordUser.id).update({ company_id: globalCompany.id })

  const user = await User.query().where('id', signUpLandlordUser.id).first()
  assert.isNull(user.preferred_services)

  await UserService.setOnboardingStep(user)
  assert.equal(user.onboarding_step, PASS_ONBOARDING_STEP_PREFERRED_SERVICES)
})

test('setOnboardingStep should set it as null in case there is a company and preferred services', async ({
  assert,
}) => {
  // Set preferred services for user
  await User.query()
    .where('id', signUpLandlordUser.id)
    .update({ preferred_services: [CONNECT_SERVICE_INDEX, MATCH_SERVICE_INDEX] })

  const user = await User.query().where('id', signUpLandlordUser.id).first()
  await UserService.setOnboardingStep(user)
  assert.isNull(user.onboarding_step)

  // Revert changes
  await User.query().where('id', signUpLandlordUser.id).update({ company_id: null })
  await Company.query().where('id', globalCompany.id).delete()
})

test('it should return code for forgotPassword for mobile', async ({ assert }) => {
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
}).timeout(0)

test('it should return return code for forgotPassword for web', async ({ assert }) => {
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

test('it should return tenant who has match status or share his account to landlord', async ({
  assert,
}) => {
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

test('it should increase unread notification count', async ({ assert }) => {
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

test('it should reset unread notification count', async ({ assert }) => {
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

test('it should change email successfully', async ({ assert }) => {
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

test('it should close account', async ({ assert }) => {
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
