'use strict'
const Event = use('Event')
const Env = use('Env')
const SECURE_API_KEY = Env.get('SECURE_API_KEY')
const User = use('App/Models/User')

let startedAt = 0
class MauticController {
  async populateMauticDB({ params }) {
    const { secure_key } = params
    if (secure_key !== SECURE_API_KEY) {
      return 'Invalid Credentials.'
    }
    const fiveMinsBeforeTimeStamp = new Date().getTime() - 5 * 60000
    if (startedAt && startedAt < fiveMinsBeforeTimeStamp) return 'Job is already started!'

    startedAt = new Date().getTime()
    const allUsers = await User.query().select('id').where('mautic_id', null).fetch()
    allUsers.rows.forEach((u) => {
      Event.fire('mautic:createContact', u.id)
    })
    return 'Job started!'
  }
}

module.exports = MauticController
