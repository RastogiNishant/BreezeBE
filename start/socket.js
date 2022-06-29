const Ws = use('Ws')

Ws.channel('chat:*', 'ChatController').middleware(['auth:jwtLandlord,jwt'])
Ws.channel('estate:*', 'EstateController').middleware(['auth:jwtLandlord,jwt', 'userCanChatHere'])
Ws.channel('task:*', 'TaskController').middleware(['auth:jwtLandlord,jwt', 'userCanChatHere'])
