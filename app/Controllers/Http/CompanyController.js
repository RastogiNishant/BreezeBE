const CompanyService = use('App/Services/CompanyService')
const HttpException = use('App/Exceptions/HttpException')

class CompanyController {
  /**
   *
   */
  async getCompany({ auth, response }) {
    // TODO
  }

  /**
   *
   */
  async createCompany({ request, auth, response }) {
    const data = request.all()
    try {
      const company = await CompanyService.createCompany(data, auth.user.id)
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
    return response.res(request.all())
  }

  /**
   *
   */
  async removeCompany({ request, auth, response }) {
    return response.res(request.all())
  }

  /**
   *
   */
  async getContacts({ auth, response }) {
    // TODO
  }

  /**
   *
   */
  async createContact({ request, auth, response }) {
    return response.res(request.all())
  }

  /**
   *
   */
  async updateContact({ request, auth, response }) {
    return response.res(request.all())
  }

  /**
   *
   */
  async removeContact({ request, auth, response }) {
    return response.res(request.all())
  }
}

module.exports = CompanyController
