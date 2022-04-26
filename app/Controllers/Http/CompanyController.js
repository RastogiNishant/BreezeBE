const File = use('App/Classes/File')
const CompanyService = use('App/Services/CompanyService')
const HttpException = use('App/Exceptions/HttpException')
const Event = use('Event')
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
      const company = await CompanyService.createCompany(data, auth.user.id)
      Event.fire('mautic:syncContact', auth.user.id)
      return response.res(company)
    } catch (e) {
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
      const company = await CompanyService.updateCompany(id, auth.user.id, data)
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

    const currentContact = await CompanyService.getContacts(auth.user.id)
    if (currentContact) {
      throw new HttpException('only 1 contact can be added', 400)
    }
    const contacts = await CompanyService.createContact(data, auth.user.id)

    return response.res(contacts)
  }

  /**
   *
   */
  async updateContact({ request, auth, response }) {
    const { id, ...data } = request.all()
    const contact = await CompanyService.updateContact(id, auth.user.id, data)

    return response.res(contact)
  }

  /**
   *
   */
  async removeContact({ request, auth, response }) {
    const { id } = request.all()
    await CompanyService.removeContact(id, auth.user.id)

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
