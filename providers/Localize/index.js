const { map } = require('bluebird')
const { get, trim } = require('lodash')

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
    //during test, if we go through pulling localization, response.res not found will result
    //FIXME: find a way to handle this when localization is to be tested.
    const File = use('App/Classes/File')
    if (
      (trim(process.env.DEV) == 'true' && trim(process.env.NO_LOCALIZATION_PULL) == 'true') ||
      process.env.NODE_ENV === 'test'
    ) {
      console.log('Loading local translations')
      this._data = JSON.parse(await File.readLog('locales.json'))
    } else {
      const req = new Request(ROOT_LOCALISATION_API)
      console.log('Location File downloading')
      const getLocale = async (locale) => {
        return await req.send({
          url: `/projects/${this.settings.projectId}/locales/${locale}/download?file_format=json`,
          data: {},
          headers: { Authorization: `token ${this.settings.accessToken}` },
        })
      }
      try {
        const data = await map(this.locales, async (l) => {
          const res = await getLocale(l)
          return { locale: l, data: res }
        })
        this._data = data.reduce((n, { locale, data }) => ({ ...n, [locale]: data }), {})
        console.log('Location loading success')
        // if (process.env.NODE_ENV === 'development') {
        //   File.logFile(this._data, 'locales.json')
        // }
      } catch (e) {
        console.log('Loading location failure', e)
      }
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
