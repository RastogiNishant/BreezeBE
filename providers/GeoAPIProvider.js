const { ServiceProvider } = require('@adonisjs/fold')

const GeoApify = require('../app/Classes/GeoApify')

class GeoAPIProvider extends ServiceProvider {
  register() {
    const Config = this.app.use('Adonis/Src/Config')
    const settings = Config.get('app.geo')
    this.app.singleton('GeoAPI', () => {
      return new GeoApify(settings)
    })
  }
}

module.exports = GeoAPIProvider
