const Ws = use('Ws')

Ws.channel('estate:*', 'EstateController').middleware(['auth:jwtLandlord,jwt', 'userCanChatHere'])
Ws.channel('task:*', 'TaskController').middleware(['auth:jwtLandlord,jwt', 'userCanChatHere'])
Ws.channel('tenant:*', 'TenantController').middleware(['auth:jwt', 'userIsATenant'])
Ws.channel('landlord:*', 'LandlordController').middleware(['auth:jwtLandlord', 'userIsALandlord'])
