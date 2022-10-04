'use strict'

const { STATUS_DELETE } = require('../constants')
const HttpException = require('../Exceptions/HttpException')
const { omit } = require('lodash')
const LetterTemplate = use('App/Models/LetterTemplate')
const File = use('App/Classes/File')
const CompanyService = use('App/Services/CompanyService')
const Database = use('Database')

class LetterTemplateService {
  static async get(id) {
    return await LetterTemplate.query()
      .where('id', id)
      .whereNot('status', STATUS_DELETE)
      .firstOrFail()
  }

  static async create(request, user) {
    const { ...data } = request.all()

    let letterTemplate = {
      ...omit(data, ['company_address']),
      user_id: user.id,
      company_id: user.company_id,
    }
    const files = await this.saveLogoToAWS(request)
    if (files && files.logo) {
      letterTemplate.logo = files.logo
    }
    const trx = await Database.beginTransaction()
    try {
      await this.updateCompany(user.id, data, trx)
      const createletterTemplateResult = await LetterTemplate.createItem(letterTemplate, trx)
      await trx.commit()
      return createletterTemplateResult
    } catch (e) {
      await trx.rollback()
      throw new HttpException('Failed to create template', 500)
    }
  }

  static async update(request, user) {
    const template = await LetterTemplate.query()
      .where('user_id', user.id)
      .whereNot('status', STATUS_DELETE)
      .first()
    if (!template) {
      return await this.create(request, user)
    }

    const { ...data } = request.all()
    let letterTemplate = {
      ...omit(data, ['company_address']),
    }

    const files = await this.saveLogoToAWS(request)
    if (files && files.logo) {
      letterTemplate.logo = files.logo
    }

    if (!data.id) {
      throw new HttpException('id must be provided')
    }

    const trx = await Database.beginTransaction()
    try {
      await this.updateCompany(user.id, data, trx)

      const updateLetterTemplateResult = await LetterTemplate.query()
        .update(letterTemplate)
        .where('id', data.id)
        .where('user_id', user.id)
        .transacting(trx)

      await trx.commit()
      return updateLetterTemplateResult
    } catch (e) {
      await trx.rollback()
      throw new HttpException('Failed to update template', 500)
    }
  }

  static async getByUserId(user_id) {
    return await LetterTemplate.query()
      .with('user')
      .with('company')
      .where('user_id', user_id)
      .whereNot('status', STATUS_DELETE)
      .first()
  }

  static async updateCompany(user_id, data, trx) {
    if (data.company_address) {
      const updatedcompany = await CompanyService.updateCompany(
        user_id,
        { address: data.company_address },
        trx
      )
    }
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
      .whereNot('status', STATUS_DELETE)
      .where('user_id', user_id)
      .update({ logo: null })
  }

  static async delete(id, user_id) {
    return await LetterTemplate.query()
      .update({ status: STATUS_DELETE })
      .where('id', id)
      .where('user_id', user_id)
  }

  static async deleteComplete(id) {
    return await LetterTemplate.query().where('id', id).delete()
  }
}

module.exports = LetterTemplateService
