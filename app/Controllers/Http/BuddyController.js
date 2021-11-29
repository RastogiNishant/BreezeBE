'use strict'

const ImportService = use('App/Services/ImportService')
const Buddy = use('App/Models/Buddy')

class BuddyController {

 
    async importBuddies({ request, auth, response }) {
        const importFilePathName = request.file('file')
        const result = await ImportService.processBuddies(importFilePathName.tmpPath, auth.current.user.id, 'xlsx')

        return response.res(result)
    }

    
    async getBuddies({ request, auth, response }) {
        
        const { limit, page, ...params } = request.all()
        const userId = auth.current.user.id
        const query = Buddy.query()
        query.where('user_id', userId)
        const buddies = await query.orderBy('id', 'desc').paginate(page, limit)
        response.res(buddies)

    }

 
}

module.exports = BuddyController
