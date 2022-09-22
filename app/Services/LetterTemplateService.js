'use strict'

const HttpException = require('../Exceptions/HttpException')

const LetterTemplate = use('App/Models/LetterTemplate')
const File = use('App/Classes/File')

class LetterTemplateService {
  static async get(id) {
    return await LetterTemplate.query().where('id', id).firstOrFail()
  }

  static async create(request, user) {
    const { ...data } = request.all()
    let letterTemplate = {
      ...data,
      user_id: user.id,
      company_id: user.company_id,
    }

    const files = await this.saveLogoToAWS(request)
    if (files && files.logo) {
      letterTemplate.logo = files.logo
    }

    return await LetterTemplate.createItem(letterTemplate)
  }

  static async update(request, user) {
    const template = await LetterTemplate.query().where('user_id', user.id).first()
    if (!template) {
      return await this.create(request, user)
    }

    const { ...data } = request.all()
    let letterTemplate = {
      ...data,
    }

    const files = await this.saveLogoToAWS(request)
    if (files && files.logo) {
      letterTemplate.logo = files.logo
    }

    if (!data.id) {
      throw new HttpException('id must be provided')
    }

    return await LetterTemplate.query()
      .where('id', data.id)
      .where('user_id', user.id)
      .update(letterTemplate)
  }

  static async getByUserId(user_id) {
    return await LetterTemplate.query()
      .with('user')
      .with('company')
      .where('user_id', user_id)
      .first()
  }

  static async saveLogoToAWS(request) {
    const imageMimes = [File.IMAGE_JPG, File.IMAGE_JPEG, File.IMAGE_PNG]
    const files = await File.saveRequestFiles(request, [
      { field: 'logo', mime: imageMimes, isPublic: true },
    ])

    return files
  }

  static async deleteLogo(id, user_id) {
    return await LetterTemplate.query()
      .where('id', id)
      .where('user_id', user_id)
      .update({ logo: null })
  }
}

module.exports = LetterTemplateService
