'use strict'

const HttpException = use('App/Exceptions/HttpException')
const LetterTemplateService = use('App/Services/LetterTemplateService')

class LetterTemplateController {
  async get({ request, auth, response }) {
    try {
      const letterTemplates = await LetterTemplateService.getByUserId(auth.user.id)
      response.res(letterTemplates)
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async update({ request, auth, response }) {
    try {
      response.res(await LetterTemplateService.update(request, auth.user))
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async deleteLogo({ request, auth, response }) {
    const { id } = request.all()
    try {
      response.res(await LetterTemplateService.deleteLogo(id, auth.user.id))
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  async delete({ request, auth, response }) {
    try {
      const { id } = request.all()
      await LetterTemplateService.delete(id, auth.user.id)
      response.res(true)
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }
}

module.exports = LetterTemplateController
