const Estate = use('App/Models/Estate')

class MapController {
  /**
   *
   */
  async getMap({ request, view, response }) {
    const estates = (await Estate.all()).rows
      .map((i) => i.coord_raw)
      .reduce((n, v) => {
        if (!v) {
          return n
        }
        const [lat, lng] = v.split(',')
        return [...n, { lat, lng }]
      }, [])

    return view.render('map', { points: JSON.stringify(estates) })
  }
}

module.exports = MapController
