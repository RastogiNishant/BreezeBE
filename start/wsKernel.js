const Ws = use('Ws')

const namedMiddleware = {
  auth: 'Adonis/Middleware/Auth',
}

Ws.registerNamed(namedMiddleware)
