const HttpException = use('App/Exceptions/HttpException')

const fs = use('fs/promises')
const xml2js = use('xml2js')
const { get } = use('lodash')
const map = {
  'objekt[0].interessent[0].anrede[0]': 'salutation',
  'objekt[0].interessent[0].vorname[0]': 'firstName',
  'objekt[0].interessent[0].nachname[0]': 'lastName',
  'objekt[0].interessent[0].strasse[0]': 'street',
  'objekt[0].interessent[0].plz[0]': 'postalCode',
  'objekt[0].interessent[0].ort[0]': 'city',
  'objekt[0].interessent[0].email[0]': 'email',
  'objekt[0].interessent[0].tel[0]': 'phone',
  'objekt[0].interessent[0].anfrage[0]': 'message'
}
const Database = use('Database')
const EstateSyncContactRequest = use('App/Models/EstateSyncContactRequest')
const MarketPlaceService = use('App/Services/MarketPlaceService')
const EstateService = use('App/Services/EstateService')

class UtilityController {
  async uploadContactRequest({ request, response }) {
    const uploadedFilePathName = request.file('file')
    const { publisher } = request.all()
    const contactRequestXml = await fs.readFile(uploadedFilePathName.tmpPath, {
      encoding: 'utf8'
    })
    const xmlParser = xml2js.Parser()
    xmlParser.parseString(contactRequestXml, async function (err, json) {
      if (err) {
        throw new HttpException(`Error parsing xml: ${err.message}`)
      }
      const objId = json.openimmo_feedback.objekt[0].oobj_id[0]
      const matches = objId.match(/^production-([0-9]+)$/)
      if (!matches) {
        throw new HttpException(`No matches...`)
      }
      const estateId = matches[1]
      const result = {}
      for (const key in map) {
        if (get(json.openimmo_feedback, key)) {
          result[map[key]] = get(json.openimmo_feedback, key)
        }
      }
      const address = { city: result.city, street: result.street, postalCode: result.postalCode }
      const contact = {
        estate_id: estateId,
        email: result.email,
        message: result.message,
        contact_info: {
          firstName: result.firstName,
          lastName: result.lastName,
          address,
          phone: result.phone,
          salutation: result.salutation,
          email: result.email
        },
        publisher
      }

      if (!(await EstateService.isPublished(contact.estate_id))) {
        throw new HttpException('Estate is NOT anymore published.')
      }
      const contactRequest = await EstateSyncContactRequest.query()
        .where({
          email: contact.email,
          estate_id: contact.estate_id
        })
        .first()

      if (contactRequest) {
        throw new HttpException('This contact request was already recorded.')
      }
      const trx = await Database.beginTransaction()
      try {
        const { link, newContactRequest, estate, landlord_name, lang } =
          await MarketPlaceService.handlePendingKnock(contact, trx)
        await trx.commit()
        await require('../../../Services/QueueService').sendKnockRequestEmail(
          {
            link,
            contact: newContactRequest,
            estate,
            landlord_name,
            lang
          },
          30000
        )
        await MarketPlaceService.sendContactRequestWebsocket(newContactRequest)
        return response.res(newContactRequest)
      } catch (err) {
        throw new HttpException(err.message)
      }
    })
  }
}

module.exports = UtilityController
