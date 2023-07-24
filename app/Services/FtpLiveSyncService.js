'use_strict'

const HttpException = require('../Exceptions/HttpException')
const { STATUS_ACTIVE, STATUS_DELETE } = require('../constants')
const Database = use('Database')
const FtpLiveSync = use('App/Models/FtpLiveSync')

class FtpLiveSyncService {
  static async get(user_id) {
    const result = await FtpLiveSync.query()
      .where('user_id', user_id)
      .where('status', STATUS_ACTIVE)
      .first()
    return result
  }

  static async create({ user_id, company, email }) {
    const trx = await Database.beginTransaction()
    try {
      const ftpAccount = await FtpLiveSync.query().where('user_id', user_id).first()
      if (ftpAccount.status === STATUS_ACTIVE) {
        throw new Error('FTP Live Sync account already exists.')
      }
      let result
      if (ftpAccount) {
        result = await ftpAccount.updateItem(
          { company_name: company, email, status: STATUS_ACTIVE },
          trx
        )
      } else {
        result = await FtpLiveSync.create(
          { user_id, company_name: company, email, status: STATUS_ACTIVE },
          trx
        )
      }
      await trx.commit()
      return result
    } catch (err) {
      await trx.rollback()
      throw new HttpException(err?.message || 'Error creating FTP Live Sync account.', 400)
    }
  }

  static async delete(user_id) {
    const trx = await Database.beginTransaction()
    try {
      const ftpAccount = await FtpLiveSync.query()
        .where('user_id', user_id)
        .where('status', STATUS_ACTIVE)
        .first()
      if (!ftpAccount) {
        throw new Error('Ftp Live Sync Account not found.')
      }
      await ftpAccount.update({ status: STATUS_DELETE }, trx)
      await trx.commit()
    } catch (err) {
      await trx.rollback()
      throw new HttpException(
        err?.message || 'Error found while deleting FTP Live Sync account.',
        400
      )
    }
  }

  static async update(user_id, { company, email }) {
    const trx = await Database.beginTransaction()
    try {
      const ftpAccount = await FtpLiveSync.query()
        .where('user_id', user_id)
        .where('status', STATUS_ACTIVE)
        .first()
      if (!ftpAccount) {
        throw new Error('Ftp Live Sync Account not found.')
      }
      await ftpAccount.update({ company_name: company, email, status: STATUS_DELETE }, trx)
      await trx.commit()
      return ftpAccount
    } catch (err) {
      await trx.rollback()
      throw new HttpException(
        err?.message || 'Error found while updating FTP Live Sync account.',
        400
      )
    }
  }
}

module.exports = FtpLiveSyncService
