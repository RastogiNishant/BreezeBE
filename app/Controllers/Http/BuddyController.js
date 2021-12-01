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
		return response.res(buddies)
	}

	async removeBuddies({ request, auth, response }) {
		const { selectedIds } = request.all()
		const userId = auth.current.user.id
		const query = Buddy.query()
		const res = await query.whereIn('id', selectedIds).where('user_id', userId).delete()
		return response.res(true)
	}

}

module.exports = BuddyController
