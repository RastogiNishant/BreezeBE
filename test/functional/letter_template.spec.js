const { ROLE_LANDLORD, STATUS_ACTIVE } = require('../../app/constants')

const { test, trait, before, beforeEach, after, afterEach } = use('Test/Suite')('LetterTemplate')
const User = use('App/Models/User')
const CompanyService = use('App/Services/CompanyService')

const LetterTemplateService = use('App/Services/LetterTemplateService')

const dummyLetterTemplateData = {
  title: `Letter template title_${new Date().getTime().toString()}`,
  body: `Letter template body_${new Date().getTime().toString()}`,
}

let dummyLetterTemplate = null
let landlord = null

trait('Test/ApiClient')
trait('Auth/Client')

before(async () => {
  landlord = await User.query()
    .where('role', ROLE_LANDLORD)
    .where('email', 'it@bits.ventures')
    .firstOrFail()
})

after(async () => {
  if (landlord)
    if (dummyLetterTemplate) {
      await LetterTemplateService.deleteComplete(dummyLetterTemplate.id)
    }
})

test('Create letter template', async ({ assert, client }) => {
  const letterTemplate = await LetterTemplateService.getByUserId(landlord.id)

  const request = client
    .post('/api/v1/letter_template')
    .loginVia(landlord, 'jwtLandlord')
    .field('title', dummyLetterTemplateData.title)
    .field('body', dummyLetterTemplateData.body)

  if (letterTemplate) {
    request.field('id', letterTemplate.id)
  }

  const response = await request.end()

  response.assertStatus(200)
}).timeout(0)

test('Create letter template with company address', async ({ assert, client }) => {
  const letterTemplate = await LetterTemplateService.getByUserId(landlord.id)

  let company = await CompanyService.getUserCompany(landlord.id)
  const companyAddress = company.address
  assert.isNotNull(company)

  const request = client
    .post('/api/v1/letter_template')
    .loginVia(landlord, 'jwtLandlord')
    .field('title', dummyLetterTemplateData.title)
    .field('body', dummyLetterTemplateData.body)
    .field('company_address', 'new address added')

  if (letterTemplate) {
    request.field('id', letterTemplate.id)
  }

  const response = await request.end()

  response.assertStatus(200)

  company = await CompanyService.getUserCompany(landlord.id)
  assert.equal(company.address, 'new address added')

  company = await CompanyService.updateCompany(landlord.id, { address: companyAddress })
  assert.equal(company.address, companyAddress)
}).timeout(0)

test('get letter template', async ({ assert, client }) => {
  const response = await client
    .get('/api/v1/letter_template')
    .loginVia(landlord, 'jwtLandlord')
    .end()

  response.assertStatus(200)

  response.assertJSONSubset({
    data: {
      title: dummyLetterTemplateData.title,
      body: dummyLetterTemplateData.body,
    },
  })
})
