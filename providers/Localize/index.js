const { map } = require('bluebird')
const { get, trim } = require('lodash')
const { TEST_ENVIRONMENT } = require('../../app/constants')

const Request = require('../../app/Libs/Request')

const ROOT_LOCALISATION_API = 'https://api.phrase.com/v2'
class Localization {
  constructor(settings) {
    this.settings = settings
    this.locales = ['en', 'de']
    this._data = {}
  }

  /**
   *
   */
  async getData() {}

  /**
   *
   */
  async init() {
    return true
    if (trim(process.env.DEV) == 'true' && trim(process.env.NO_LOCALIZATION_PULL) == 'true')
      return true

    const File = use('App/Classes/File')
    // Disable loading localisation from phrase
    const req = new Request(ROOT_LOCALISATION_API)
    const getLocale = async (locale) => {
      return req.send({
        url: `/projects/${this.settings.projectId}/locales/${locale}/download?file_format=json`,
        data: {},
        headers: { Authorization: `token ${this.settings.accessToken}` },
      })
    }
    console.log('Location File downloading')
    // try {
    //   this._data = JSON.parse(await File.readLog('../resources/locales.json'))
    // } catch (e) {
    //   console.log('Cache file not exists')
    // }
    try {
      const data = await map(this.locales, async (l) => {
        const res = await getLocale(l)
        return { locale: l, data: res }
      })
      this._data = data.reduce((n, { locale, data }) => ({ ...n, [locale]: data }), {})
      //console.log( "Locale", this._data );
      //await File.logFile(this._data, 'locales.json')
      console.log('Location loading success')
    } catch (e) {
      console.log('Loading location failure', e)
    }
  }

  /**
   *
   */
  get(key, locale = this.locales[0], count = null) {
    if (!locale) {
      locale = 'de'
    }

    if (count !== null) {
      key += count > 0 ? (count > 1 ? '.other' : '.one') : '.zero'
    }
    return get(this._data, [locale, key, 'message'], key)
  }
}

module.exports = Localization
