const Database = use('Database')

class LandlordService {
  /**
   *
   */
  static async getBookedTimeslots(userId) {
    return Database.table({ _v: 'visits' })
      .select(
        '_u.firstname',
        '_u.secondname',
        '_t.members_count',
        '_t.minors_count',
        '_t.income',
        '_u.birthday',
        '_v.date',
        '_e.address',
        '_v.estate_id',
        '_v.user_id'
      )
      .select(Database.raw("'50'::int AS percent"))
      .select(Database.raw("'10'::int AS slot_length"))
      .innerJoin({ _e: 'estates' }, function () {
        this.on('_e.id', '_v.estate_id').onIn('_e.user_id', [userId])
      })
      .innerJoin({ _u: 'users' }, '_u.id', '_v.user_id')
      .innerJoin({ _t: 'tenants' }, '_t.user_id', '_u.id')
      .where('_v.date', '>', Database.fn.now())
      .orderBy('_v.date')
      .limit(500)
  }

  /**
   *
   */
  static async getLandlords(userId) {
    return Database.table({ _v: 'users' })
      .select(
        '_u.firstname',
        '_u.secondname',
        '_t.members_count',
        '_t.minors_count',
        '_t.income',
        '_u.birthday',
        '_v.date',
        '_e.address',
        '_v.estate_id',
        '_v.user_id'
      )
      .select(Database.raw("'50'::int AS percent"))
      .select(Database.raw("'10'::int AS slot_length"))
      .innerJoin({ _e: 'estates' }, function () {
        this.on('_e.id', '_v.estate_id').onIn('_e.user_id', [userId])
      })
      .innerJoin({ _u: 'users' }, '_u.id', '_v.user_id')
      .innerJoin({ _t: 'tenants' }, '_t.user_id', '_u.id')
      .where('_v.date', '>', Database.fn.now())
      .orderBy('_v.date')
      .limit(500)
  }
}

module.exports = LandlordService
