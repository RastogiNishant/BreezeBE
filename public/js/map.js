function distance(lat1, lon1, lat2, lon2) {
  const toRad = (Value) => (Value * Math.PI) / 180

  const R = 6371 // km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  lat1 = toRad(lat1)
  lat2 = toRad(lat2)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c * 1000
}

function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 14,
    center: {
      lat: 52.4543251,
      lng: 13.577765,

      __proto__: Object,
    },
    mapTypeId: 'terrain',
  })

  function customIcon(opts) {
    return Object.assign(
      {
        path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
        fillColor: '#34495e',
        fillOpacity: 1,
        strokeColor: '#000',
        strokeWeight: 2,
        scale: 1,
      },
      opts
    )
  }

  // Construct the polygon.
  if (window.zone) {
    const zone = new google.maps.Polygon({
      paths: window.zone.map(([lng, lat]) => ({ lng, lat })),
      strokeWeight: 0,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
    })
    zone.setMap(map)
  }

  new google.maps.Circle({
    strokeWeight: 0,
    fillColor: '#FF0000',
    fillOpacity: 0.35,
    map,
    center: { lng: 13.577765, lat: 52.4543251 },
    radius: 1000,
  })

  if (window.points && window.points.length) {
    window.points.forEach(({ lat, lng, isIn }) => {
      new google.maps.Marker({
        position: { lat: parseFloat(lat), lng: parseFloat(lng) },
        map,
        title: '',
        icon: customIcon(isIn ? { fillColor: '#2ecc71' } : { fillColor: '#cc3f43' }),
      })
    })
  }

  if (window.tenants && window.tenants.length) {
    window.tenants.forEach(({ lat, lon, id }) => {
      new google.maps.Marker({
        position: { lat: parseFloat(lat), lng: parseFloat(lon) },
        map,
        title: '',
        icon: customIcon({ fillColor: '#2ecc71' }),
      })
    })
  }

  let points = []
  map.addListener('click', (mapsMouseEvent) => {
    const point = mapsMouseEvent.latLng.toJSON()
    points.push(point)
    if (points.length >= 2) {
      points = []
    }
  })
}
