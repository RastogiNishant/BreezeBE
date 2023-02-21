const axios = require('axios')
const OhneMakler = require('../Classes/OhneMakler')
const crypto = require('crypto')
const ThirdPartyOffer = use('App/Models/ThirdPartyOffer')
const DataStorage = use('DataStorage')
const Promise = require('bluebird')

class ThirdPartyOfferService {
  static generateChecksum(data) {
    return crypto.createHash('md5').update(data, 'utf8').digest('hex')
  }

  static async getOhneMaklerChecksum() {
    return await DataStorage.getItem('ohne-makler-checksum')
  }

  static async setOhneMaklerChecksum(checksum) {
    return await DataStorage.setItem('ohne-makler-checksum', checksum, '', {
      expire: 7 * 24 * 60 * 60,
    })
  }

  static async pullOhneMakler() {
    try {
      const { data } = await axios.get(process.env.OHNE_MAKLER_API_URL, { timeout: 2000 })
      if (!data) {
        throw new Error('Error found on pulling ohne makler')
      }
      const ohneMaklerChecksum = await ThirdPartyOfferService.getOhneMaklerChecksum()
      const checksum = ThirdPartyOfferService.generateChecksum(JSON.stringify(data))
      if (checksum !== ohneMaklerChecksum) {
        //there must be some difference between the data... we can process
        const ohneMakler = new OhneMakler(data)
        const estates = ohneMakler.process()

        await Promise.map(estates, async (estate) => {
          const found = await ThirdPartyOffer.query()
            .where('source', 'ohnemakler')
            .where('source_id', estate.source_id)
            .first()
          if (!found) {
            await ThirdPartyOffer.createItem(estate)
          } else {
            await ThirdPartyOffer.query()
              .where('source', 'ohnemakler')
              .where('source_id', estate.source_id)
              .update(estate)
          }
        })

        return estates
        this.setOhneMaklerChecksum(checksum)
      }
    } catch (err) {
      console.log(err)
    }
  }
}

module.exports = ThirdPartyOfferService
