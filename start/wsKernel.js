const Ws = use('Ws')

const namedMiddleware = {
  auth: 'Adonis/Middleware/Auth',
  userCanChatHere: 'App/Middleware/UserCanChatHere',
}

Ws.registerNamed(namedMiddleware)
