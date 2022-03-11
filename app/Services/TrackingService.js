const Env = use('Env')
const Amplitude = require('@amplitude/node')
const { Identify } = require('@amplitude/identify')
const fetch = require('node-fetch')
const User = use('App/Models/User')

const { get } = require('lodash')

const AMPLITUDE_API_KEY = Env.get('AMPLITUDE_API_KEY')

var amplitudeClient = Amplitude.init(AMPLITUDE_API_KEY)

const logEvent = async (
  request,
  event_type,
  user_id,
  event_properties = {},
  isUserIdReady = true
) => {
  if (!request || !event_type || !user_id) {
    throw new AppException('Invalid event logging parameters')
  }

  // We need to user's "uid" field.
  // But in some endpoints we don't fetc the user and thus we don't have all user info
  // For these cases, we provide "id" and we fetch user in this function
  if (!isUserIdReady) {
    const user = await User.query().where('id', user_id).firstOrFail()
    user_id = user.uid
  }

  const headers = request.headers()
  const ip = get(headers, 'x-real-ip') || request.ip()
  const deviceId = get(headers, 'ampdeviceid')
  const smartlook_visitor_url = get(headers, 'smartlookvisitorurl')

  const identify = new Identify()
  identify.identifyUser(user_id, deviceId)

  await amplitudeClient.identify(user_id, deviceId, identify).catch((e) => console.log({ e }))

  event_properties = { ...event_properties, user_id }

  const event = {
    event_type,
    user_id,
    ip,
    event_properties,
    user_properties: {
      smartlook_visitor_url,
    },
  }

  amplitudeClient.logEvent(event).catch((e) => console.log({ e }))
}

module.exports = { logEvent }
