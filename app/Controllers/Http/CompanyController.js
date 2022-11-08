const File = use('App/Classes/File')
const UserService = use('App/Services/UserService')
const CompanyService = use('App/Services/CompanyService')
const HttpException = use('App/Exceptions/HttpException')
const Database = use('Database')
const Event = use('Event')
const { omit } = require('lodash')
class CompanyController {
  /**
   *
   */
  async getCompany({ auth, response }) {
    const company = await CompanyService.getUserCompany(auth.user.id)

    return response.res(company)
  }

  /**
   *
   */
  async createCompany({ request, auth, response }) {
    const data = request.all()
    const imageMimes = [File.IMAGE_JPG, File.IMAGE_JPEG, File.IMAGE_PNG]
    const files = await File.saveRequestFiles(request, [
      { field: 'avatar', mime: imageMimes, isPublic: true },
    ])

    if (files.avatar) {
      data.avatar = files.avatar
    }

    try {
      const trx = await Database.beginTransaction()
      const company = await CompanyService.createCompany(omit(data, ['address']), auth.user.id, trx)
      await UserService.updateCompany({ user_id: auth.user.id, company_id: company.id }, trx)

      await trx.commit()
      Event.fire('mautic:syncContact', auth.user.id)
      return response.res(company)
    } catch (e) {
      await trx.rollback()
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400)
      }
      throw e
    }
  }

  /**
   *
   */
  async updateCompany({ request, auth, response }) {
    const { id, ...data } = request.all()
    const imageMimes = [File.IMAGE_JPG, File.IMAGE_JPEG, File.IMAGE_PNG]
    const files = await File.saveRequestFiles(request, [
      { field: 'avatar', mime: imageMimes, isPublic: true },
    ])
    if (files.avatar) {
      data.avatar = files.avatar
    }

    try {
      const company = await CompanyService.updateCompany(auth.user.id, omit(data, ['address']))
      Event.fire('mautic:syncContact', auth.user.id)
      return response.res(company)
    } catch (e) {
      if (e.name === 'AppException') {
        throw new HttpException(e.message, e.code || 400)
      }
      throw e
    }
  }

  /**
   *
   */
  async removeCompany({ request, auth, response }) {
    const { id } = request.all()
    await CompanyService.removeCompany(id, auth.user.id)
    Event.fire('mautic:syncContact', auth.user.id)
    return response.res(true)
  }

  /**
   *
   */
  async getContacts({ auth, response }) {
    const contacts = (await CompanyService.getContacts(auth.user.id)).rows

    response.res(contacts)
  }

  /**
   *
   */
  async createContact({ request, auth, response }) {
    const data = request.all()
    const imageMimes = [File.IMAGE_JPG, File.IMAGE_JPEG, File.IMAGE_PNG]
    const files = await File.saveRequestFiles(request, [
      { field: 'avatar', mime: imageMimes, isPublic: true },
    ])
    if (files.avatar) {
      data.avatar = files.avatar
    }

    if (!auth.user.company_id) {
      throw new HttpException('Please add company first', 400)
    }

    data.company_id = auth.user.company_id
    let contactData = data
    if (data.address) {
      await CompanyService.updateCompany(auth.user.id, { address: data.address })
      contactData = omit(contactData, ['address'])
    }
    const contacts = await CompanyService.createContact(contactData, auth.user.id)
    Event.fire('mautic:syncContact', auth.user.id)
    return response.res(contacts)
  }

  /**
   *
   */
  async updateContact({ request, auth, response }) {
    const { id, ...data } = request.all()

    if (data.address) {
      await CompanyService.updateCompany(auth.user.id, { address: data.address })
    }
    const contact = await CompanyService.updateContact(id, auth.user.id, omit(data, ['address']))
    Event.fire('mautic:syncContact', auth.user.id)
    return response.res(contact)
  }

  /**
   *
   */
  async removeContact({ request, auth, response }) {
    const { id } = request.all()
    await CompanyService.removeContact(id, auth.user.id)
    Event.fire('mautic:syncContact', auth.user.id)
    return response.res(true)
  }

  /**
   *
   */
  async getCompanyByLandlord({ request, auth, response }) {
    const { id } = request.all()

    const company = await CompanyService.getLandlordContacts(id, auth.user.id)
    return response.res(company)
  }
}

module.exports = CompanyController
