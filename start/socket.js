const Ws = use('Ws')

Ws.channel('chat:*', 'ChatController').middleware(['auth:jwtLandlord,jwt'])
Ws.channel('estate:*', 'EstateChatController').middleware([
  'auth:jwtLandlord,jwt',
  'userCanChatHere',
])
Ws.channel('task:*', 'EstateTaskController')
