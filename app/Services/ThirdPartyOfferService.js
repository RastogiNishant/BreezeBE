const axios = require('axios')
const OhneMakler = require('../Classes/OhneMakler')
const crypto = require('crypto')
const DataStorage = use('DataStorage')

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
      console.log(checksum, ohneMaklerChecksum)
      if (checksum !== ohneMaklerChecksum) {
        //there must be some difference between the data... we can process
        const ohneMakler = new OhneMakler(data)
        const estates = ohneMakler.process()
        return estates
        this.setOhneMaklerChecksum(checksum)
      }
    } catch (err) {
      console.log(err)
    }
  }
}

module.exports = ThirdPartyOfferService
