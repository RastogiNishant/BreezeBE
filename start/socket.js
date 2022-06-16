const Ws = use('Ws')

Ws.channel('chat:*', 'ChatController')
Ws.channel('estate:*', 'EstateChatController')
Ws.channel('task:*', 'EstateTaskController')
