'use strict'

const Database = use('Database')
const EstateService = use('App/Services/EstateService')
const HttpException = use('App/Exceptions/HttpException')
const File = use('App/Classes/File')

const {
   MATCH_STATUS_VISIT,
   MATCH_STATUS_SHARE,
 } = require('../../constants')

class TimeSlotController {

  async getUpcomingShows({ request, auth, response }) {

      const { query } = request.all()
      const userId = auth.user.id
      try{
         const result = await EstateService.getUpcomingShows(query)
         .select('time_slots.*')
         .select('_t.*')
         .select('_m.updated_at', '_m.percent as percent', '_m.share')
         .select('_u.email', '_u.phone')
         .select(
            '_mb.firstname',
            '_mb.secondname',
            '_mb.birthday',
            '_mb.avatar',
            '_mb.last_address',
            '_v.date',
            '_v.tenant_status AS visit_status',
            '_v.tenant_delay AS delay',
            '_m.buddy',
            '_m.status as status',
            '_m.user_id'
          )   
         .innerJoin({ _e: 'estates' }, '_e.id', 'time_slots.estate_id')
         .innerJoin({ _m: 'matches' }, function () {
            this.on('_m.estate_id', '_e.id').onIn('_m.status', [MATCH_STATUS_VISIT, MATCH_STATUS_SHARE])
          })
         .innerJoin({ _u: 'users' }, '_e.user_id', '_u.id')
         .innerJoin({ _t: 'tenants' }, '_t.user_id', '_m.user_id')         
         .innerJoin({ _v: 'visits' }, function () {
            this.on('_v.user_id', '_m.user_id').on('_v.estate_id', '_m.estate_id')
          })
          .leftJoin({ _mb: 'members' }, function () {
            this.on('_mb.user_id', '_m.user_id').onIn('_mb.id', function () {
              this.min('id')
                .from('members')
                .where('user_id', Database.raw('_m.user_id'))
                .whereNot('child', true)
                .limit(1)
          })
         })          
         .where('_e.user_id', userId)
         .where('start_at', '>', Database.fn.now())
         .orderBy('start_at', 'asc')
         .fetch()

         return response.res(result)
      }catch(e) {
         throw new HttpException(e.message, 400)
      }
   }
}

module.exports = TimeSlotController
