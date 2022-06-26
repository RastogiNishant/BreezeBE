const Ws = use('Ws')

Ws.channel('chat:*', 'ChatController').middleware(['auth:jwtLandlord'])
Ws.channel('estate:*', 'EstateChatController').middleware([
  'auth:jwtLandlord,jwt',
  'userCanChatHere',
])
Ws.channel('task:*', 'EstateTaskController')
