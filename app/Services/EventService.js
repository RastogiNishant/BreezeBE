const Event = use('Event')
const { get } = require('lodash')

const fireAdminAction = (action, request, auth) => {
  const ip = get(request.headers(), 'x-real-ip') || request.ip()
  const extra = {
    ...request.all(),
    ...request.params,
  }
  const user_id = auth.user.id
  Event.fire('referee::action', { action: 'addPayment', ip, extra, user_id })
}

module.exports = {
  fireAdminAction,
}
