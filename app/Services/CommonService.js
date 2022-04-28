const Database = use('Database')

class CommonService {
  /**
   *
   */
  static async searchProfession(query) {
    const MAX_ITEMS = 5
    const subquery = Database.from('professions')
      .select('type')
      .where('title_en', 'ILIKE', `${query}%`)
      .orWhere('title_de', 'ILIKE', `${query}%`)
      .limit(MAX_ITEMS)

    return Database.from('professions').whereIn('type', subquery).limit(MAX_ITEMS)
  }
}

module.exports = CommonService
