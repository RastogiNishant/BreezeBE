const Note = use('App/Models/Note')
const HttpException = use('App/Exceptions/HttpException')

class NoteService {
  
  static async getNotes(page, limit, tenantId, userId) {
		const query = Note.query()
		query.where({ about_id: tenantId, writer_id: userId })
		const notes = await query.orderBy('id', 'desc').paginate(page, limit)

    return notes
  }

  static async createNote(note, tenantId, userId) {
    const existing = await Note.query().where({ about_id: tenantId, writer_id: userId }).first()
    if (existing) {
      throw new HttpException('Note already created')
    }

    return Note.createItem({
			note: note,
			writer_id: userId,
			about_id: tenantId,
		  })
  }

  static async updateNote(note, tenantId, userId) {
    const existingNote = await Note.query().where({ about_id: tenantId, writer_id: userId }).first()
    if (!existingNote) {
      throw new HttpException('Note does not exist')
    }
    await Note.query().where({ about_id: tenantId, writer_id: userId }).update({note: note})

    return note
  }

  static async removeNote(tenantId, userId) {
    return Note.query().where({ writer_id: userId, about_id: tenantId }).delete()
  }

  
}

module.exports = NoteService
