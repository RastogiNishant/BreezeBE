const Env = use('Env')

module.exports = {
  port: Env.get('WS_PORT', 5000),
  pingInterval: 18000000,
  pingTimeout: 10000,
  serveClient: false,
}
