const Ws = use('Ws')

Ws.channel('chat:*', 'ChatController').middleware(['auth:jwtLandlord'])
Ws.channel('estate:*', 'EstateChatController')
Ws.channel('task:*', 'EstateTaskController')
