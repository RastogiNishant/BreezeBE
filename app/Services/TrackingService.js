const Env = use('Env')
const Amplitude = require('@amplitude/node')
const { get } = require('lodash')

const AMPLITUDE_API_KEY = Env.get('AMPLITUDE_API_KEY')
var amplitudeClient = Amplitude.init(AMPLITUDE_API_KEY)

const logEvent = async (request, event_type, user_id, event_properties = {}) => {
  if (!request || !event_type || !user_id) {
    throw new AppException('Invalid event logging parameters')
  }
  const headers = request.headers()
  const ip = get(headers, 'x-real-ip') || request.ip()

  const event = {
    event_type,
    user_id,
    ip,
    event_properties,
  }

  console.log({ event })

  return amplitudeClient
    .logEvent(event)
    .then(() => console.log('logged'))
    .catch((e) => {
      console.log('Event loggin error occurred')
      console.log(e)
    })
}

module.exports = { logEvent }
