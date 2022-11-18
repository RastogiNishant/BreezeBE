const Database = use('Database')
const User = use('App/Models/User')
const UserService = use('App/Services/UserService')
const { faker } = require('@faker-js/faker')

const { ROLE_LANDLORD, ROLE_USER, STATUS_ACTIVE } = require('../../app/constants')

const landlordDataEmail = `test_company_landlord_${new Date().getTime().toString()}@gmail.com`
const prospectDataEmail = `test_company_prospect_${new Date().getTime().toString()}@gmail.com`

const secondProspectDataEmail = `second_test_company_prospect_${new Date()
  .getTime()
  .toString()}@gmail.com`

const secondLandlordDataEmail = `second_test_company_landlord_${new Date()
  .getTime()
  .toString()}@gmail.com`

const dummyLandlordUserData = {
  email: landlordDataEmail,
  role: ROLE_LANDLORD,
  password: '12345678',
  sex: '1',
  birthday: '1990-01-01',
  lang: 'en',
}

const secondDummyLandlordUserData = {
  email: secondLandlordDataEmail,
  role: ROLE_LANDLORD,
  password: '12345678',
  sex: '1',
  birthday: '1990-01-01',
  lang: 'en',
}

const dummyProspectUserData = {
  email: prospectDataEmail,
  firstname: faker.name.firstName(),
  secondname: faker.name.lastName(),
  role: ROLE_USER,
  password: '12345678',
  sex: '1',
  birthday: '1990-01-01',
  lang: 'en',
}

const secondDummyProspectUserData = {
  email: secondProspectDataEmail,
  firstname: faker.name.firstName(),
  secondname: faker.name.lastName(),
  role: ROLE_USER,
  password: '12345678',
  sex: '1',
  birthday: '1990-01-01',
  lang: 'en',
}

let testLandlord, testProspect, secondTestLandlord, secondTestProspect

const mockUser = async () => {
  const landlord = await UserService.createUser(dummyLandlordUserData)
  await User.query().where('id', landlord.user.id).update({ status: STATUS_ACTIVE })
  testLandlord = await User.query().where('id', landlord.user.id).first()

  const prospect = await UserService.createUser(dummyProspectUserData)
  await User.query().where('id', prospect.user.id).update({ status: STATUS_ACTIVE })
  testProspect = await User.query().where('id', prospect.user.id).first()

  return { testLandlord, testProspect }
}

const mockSecondUser = async () => {
  const landlord = await UserService.createUser(secondDummyLandlordUserData)
  await User.query().where('id', landlord.user.id).update({ status: STATUS_ACTIVE })
  secondTestLandlord = await User.query().where('id', landlord.user.id).first()

  const prospect = await UserService.createUser(secondDummyProspectUserData)
  await User.query().where('id', prospect.user.id).update({ status: STATUS_ACTIVE })
  secondTestProspect = await User.query().where('id', prospect.user.id).first()

  return { secondTestLandlord, secondTestProspect }
}

const clearMockUsers = async () => {
  await Promise.all([
    User.query().where('email', landlordDataEmail).delete(),
    User.query().where('email', secondLandlordDataEmail).delete(),
    User.query().where('email', prospectDataEmail).delete(),
    User.query().where('email', secondProspectDataEmail).delete(),
  ])
}

module.exports = {
  mockUser,
  mockSecondUser,
  clearMockUsers,
}
