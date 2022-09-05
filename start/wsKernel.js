const Ws = use('Ws')

const namedMiddleware = {
  auth: 'Adonis/Middleware/Auth',
  userCanChatHere: 'App/Middleware/UserCanChatHere',
  userIsATenant: 'App/Middleware/UserIsATenant',
  userIsALandlord: 'App/Middleware/UserIsALandlord',
}

Ws.registerNamed(namedMiddleware)
