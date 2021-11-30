'use strict'

const NoteService = require("../../Services/NoteService")

const Note = use('App/Models/Note')

class NoteController {



	async getNotes({ request, auth, response }) {
		const { limit, page , tenant_id} = request.all()
		const notes = await NoteService.getNotes(page, limit, tenant_id, auth.user.id)
		return response.res(notes)
	}

	async createNote({ request, auth, response }) {
		const { note, tenant_id } = request.all()
    	const newNote = await NoteService.createNote(note, tenant_id, auth.user.id)

    	return response.res(newNote)	
	}

	async updateNote({ request, auth, response }) {
		const { note, tenant_id } = request.all()
    	const updatedNote = await NoteService.updateNote(note, tenant_id, auth.user.id)

    	return response.res(updatedNote)	
	}

	async removeNote({ request, auth, response }) {
		const { tenant_id } = request.all()
    	await NoteService.removeNote(tenant_id, auth.user.id)
	
		return response.res(true)
	}

}

module.exports = NoteController
