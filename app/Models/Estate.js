'use strict'

const moment = require('moment')
const { isString, pick, isEmpty } = require('lodash')
const hash = require('../Libs/hash')
const { generateAddress } = use('App/Libs/utils')
const Database = use('Database')
const Contact = use('App/Models/Contact')
const HttpException = use('App/Exceptions/HttpException')
const { createDynamicLink } = require('../Libs/utils')

const Model = require('./BaseModel')
const {
  BATH_TUB,
  BATH_WINDOW,
  BATH_BIDET,
  BATH_URINAL,
  BATH_SHOWER,
  //
  KITCHEN_OPEN,
  KITCHEN_PANTRY,
  KITCHEN_BUILTIN,
  //
  EQUIPMENT_STACK,
  EQUIPMENT_AIR_CONDITIONED,
  EQUIPMENT_ELEVATOR,
  EQUIPMENT_GARDEN_USE,
  EQUIPMENT_WHEELCHAIR_ACCESSIBLE,
  EQUIPMENT_BIKE_ROOM,
  EQUIPMENT_GUEST_WC,
  EQUIPMENT_WG_SUITABLE,

  STATUS_ACTIVE,
  MATCH_STATUS_NEW,
  MATCH_STATUS_KNOCK,
  MATCH_STATUS_INVITE,
  MATCH_STATUS_VISIT,
  MATCH_STATUS_TOP,
  MATCH_STATUS_COMMIT,
  TENANT_MATCH_FIELDS,
  MATCH_STATUS_FINISH,
  MATCH_STATUS_SHARE,
  TASK_STATUS_NEW,
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_DELETE,
  TASK_STATUS_DRAFT,
  LETTING_TYPE_LET,
  STATUS_DRAFT,
  STATUS_DELETE,
  ROLE_LANDLORD,
  ROLE_USER,
  MAXIMUM_EXPIRE_PERIOD,
  DATE_FORMAT,
} = require('../constants')

class Estate extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'property_type',
      'six_char_code',
      'type',
      'apt_type',
      'house_type',
      'description',
      'category',
      'coord',
      'street',
      'house_number',
      'country',
      'floor',
      'floor_direction',
      'number_floors',
      'prices',
      'net_rent',
      'cold_rent',
      'rent_including_heating',
      'additional_costs',
      'heating_costs_included',
      'heating_costs',
      'rent_per_sqm',
      'deposit',
      'stp_garage',
      'stp_parkhaus',
      'stp_tiefgarage',
      'currency',
      'area',
      'living_space',
      'usable_area',
      'rooms_number',
      'bedrooms_number',
      'bathrooms_number',
      'kitchen_options',
      'bath_options',
      'wc_number',
      'balconies_number',
      'terraces_number',
      'occupancy',
      'use_type',
      'ownership_type',
      'marketing_type',
      'energy_type',
      'available_start_at',
      'available_end_at',
      'to_date',
      'min_lease_duration',
      'max_lease_duration',
      'non_smoker',
      'gender',
      'monumental_protection',
      'parking_space',
      'parking_space_type',
      'construction_year',
      'last_modernization',
      'building_status',
      'building_age',
      'firing',
      'heating_type',
      'equipment',
      'equipment_standard',
      'ground',
      'energy_efficiency',
      'energy_proof',
      'energy_proof_original_file',
      'energy_pass',
      'status',
      'property_id',
      'plan',
      'cover',
      'point_id',
      'repair_need',
      'city',
      'zip',
      'budget',
      'credit_score',
      'rent_arrears',
      'full_address',
      'kids_type',
      'photo_require',
      'furnished',
      'source_person',
      'address',
      'family_status',
      'min_age',
      'max_age',
      'hash',
      'options',
      'is_duration_later',
      'min_invite_count',
      'vacant_date',
      'others',
      'minors',
      'letting_status',
      'letting_type',
      'family_size_max',
      'family_size_min',
      'pets_allowed',
      'apartment_status',
      'extra_costs',
      'extra_address',
      'is_new_tenant_transfer',
      'transfer_budget',
      'rent_end_at',
      'income_sources',
      'percent',
      'is_published',
      'share_link',
    ]
  }

  /**
   *
   */
  static get readonly() {
    return ['id', 'status', 'user_id', 'point_id', 'hash', 'six_char_code', 'share_link']
  }

  static shortColumns() {
    return [
      'id',
      'user_id',
      'house_type',
      'description',
      'coord',
      'street',
      'city',
      'address',
      'house_number',
      'country',
    ]
  }

  /**
   *
   */
  static get options() {
    return {
      //bath_options: [BATH_TUB, BATH_WINDOW, BATH_BIDET, BATH_URINAL, BATH_SHOWER],
      //kitchen_options: [KITCHEN_OPEN, KITCHEN_PANTRY, KITCHEN_BUILTIN],
      equipment: [
        EQUIPMENT_STACK,
        EQUIPMENT_AIR_CONDITIONED,
        EQUIPMENT_ELEVATOR,
        EQUIPMENT_GARDEN_USE,
        EQUIPMENT_WHEELCHAIR_ACCESSIBLE,
        EQUIPMENT_BIKE_ROOM,
        EQUIPMENT_GUEST_WC,
        EQUIPMENT_WG_SUITABLE,
      ],
    }
  }

  static get shortFieldsList() {
    return TENANT_MATCH_FIELDS
  }

  /**
   *
   */
  static get Serializer() {
    return 'App/Serializers/EstateSerializer'
  }

  static generateRandomString(length = 6) {
    let randomString = ''
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
    for (var i = 0; i < length; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return randomString
  }

  /**
   *
   */
  static boot() {
    super.boot()
    this.addTrait('@provider:SerializerExtender')

    this.addHook('beforeUpdate', async (instance) => {
      if (
        instance.letting_type === LETTING_TYPE_LET &&
        ![STATUS_DRAFT, STATUS_DELETE].includes(instance.status)
      ) {
        instance.status = STATUS_DRAFT
      }
    })

    this.addHook('beforeSave', async (instance) => {
      delete instance.dirty
      if (instance.dirty.coord && isString(instance.dirty.coord)) {
        const [lat, lon] = instance.dirty.coord.split(',')
        instance.coord_raw = instance.dirty.coord
        instance.coord = Database.gis.setSRID(Database.gis.point(lon, lat), 4326)
      }

      if (!isEmpty(pick(instance.dirty, ['house_number', 'street', 'city', 'zip', 'country']))) {
        instance.address = generateAddress(instance)
        if (instance.dirty.is_coord_changed) {
          instance.coord = null
          instance.coord_raw = null
        }
      }

      if (instance.dirty?.parking_space === 0) {
        instance.stp_garage = 0
      }
      ;[
        'bath_options',
        'energy_type',
        'firing',
        'ground',
        'heating_type',
        'marketing_type',
        'parking_space_type',
        'use_type',
      ].map((field) => {
        if (
          instance.dirty &&
          instance.dirty[field] !== undefined &&
          instance.dirty[field] != null &&
          !Array.isArray(instance.dirty[field])
        ) {
          instance[field] = [instance.dirty[field]]
        }
      })

      if (
        instance.dirty.extra_costs &&
        (instance.dirty.heating_costs || instance.dirty.additional_costs)
      ) {
        throw new HttpException(
          'Cannot update extra_costs with heating and/or additional_costs',
          422
        )
      } else if (instance.dirty.heating_costs || instance.dirty.additional_costs) {
        instance.extra_costs =
          (Number(instance.dirty.additional_costs) || Number(instance.additional_costs) || 0) +
          (Number(instance.dirty.heating_costs) || Number(instance.heating_costs) || 0)
      } else if (
        instance.dirty.extra_costs &&
        !(instance.dirty.heating_costs || instance.dirty.additional_costs)
      ) {
        instance.extra_costs = Number(instance.dirty.extra_costs)
        //need confirmation...
        instance.additional_costs = 0
        instance.heating_costs = 0
      }

      delete instance.is_coord_changed
    })

    this.addHook('afterCreate', async (instance) => {
      await this.updateBreezeId(instance.id)
    })
  }

  static async updateBreezeId(id) {
    let exists
    let randomString
    do {
      randomString = this.generateRandomString(6)
      exists = await Database.table('estates')
        .where('six_char_code', randomString)
        .select('id')
        .first()
    } while (exists)

    await this.updateHashInfo(id, randomString)
  }

  static async updateHashInfo(id, randomString=null) {
    const hash = Estate.getHash(id)
    const share_link = await createDynamicLink(`${process.env.DEEP_LINK}/invite?code=${hash}`)

    let estateInfo = {
      hash,
      share_link,
    }
    if (randomString) {
      estateInfo.randomString = randomString
    }
    await Database.table('estates')
      .where('id', id)
      .update({ ...estateInfo })
  }

  /**
   *
   */
  user() {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }

  /**
   *
   */
  point() {
    return this.hasOne('App/Models/Point', 'point_id', 'id')
  }

  /**
   *
   */
  rooms() {
    return this.hasMany('App/Models/Room').whereNot('status', STATUS_DELETE)
  }

  amenities() {
    return this.hasMany('App/Models/Amenity', 'estate_id', 'id').whereNot('status', STATUS_DELETE)
  }

  estateSyncListings() {
    return this.hasMany('App/Models/EstateSyncListing', 'id', 'estate_id').whereNot(
      'status',
      STATUS_DELETE
    )
  }

  activeTasks() {
    return this.hasMany('App/Models/Task', 'id', 'estate_id')
      .whereIn('status', [TASK_STATUS_NEW, TASK_STATUS_INPROGRESS])
      .orderBy('updated_at', 'desc')
      .orderBy('urgency', 'desc')
  }

  tenant_has_unread_task() {
    return this.hasMany('App/Models/Task', 'id', 'estate_id')
      .whereIn('status', [TASK_STATUS_NEW, TASK_STATUS_INPROGRESS])
      .where('unread_role', ROLE_USER)
      .where('unread_count', '>', 0)
  }

  static landlord_has_unread_messages(active_tasks, role = ROLE_LANDLORD) {
    return active_tasks.findIndex((task) => task.unread_role === role && task.unread_count) !== -1
  }

  tasks() {
    return this.hasMany('App/Models/Task', 'id', 'estate_id').whereNotIn('status', [
      TASK_STATUS_DELETE,
      TASK_STATUS_DRAFT,
    ])
  }
  all_tasks() {
    return this.hasMany('App/Models/Task', 'id', 'estate_id').whereNotIn('status', [
      TASK_STATUS_DELETE,
      TASK_STATUS_DRAFT,
    ])
  }

  /**
   *
   */
  knocked() {
    return this.hasMany('App/Models/Match').whereIn('status', [MATCH_STATUS_KNOCK])
  }

  /**
   *
   */
  visits() {
    return this.hasMany('App/Models/Match').whereIn('status', [
      MATCH_STATUS_INVITE,
      MATCH_STATUS_VISIT,
      MATCH_STATUS_SHARE,
    ])
  }

  /**
   *
   */
  visit_relations() {
    return this.hasMany('App/Models/Visit')
  }

  /**
   *
   */
  matches() {
    return this.hasMany('App/Models/Match')
  }

  /**
   *
   */
  slots() {
    return this.hasMany('App/Models/TimeSlot').orderBy('end_at')
  }

  current_tenant() {
    return this.hasOne('App/Models/EstateCurrentTenant', 'id', 'estate_id').where(
      'status',
      STATUS_ACTIVE
    )
  }

  /**
   *
   */
  decided() {
    return this.hasMany('App/Models/Match').whereIn('status', [
      MATCH_STATUS_TOP,
      MATCH_STATUS_COMMIT,
    ])
  }
  final() {
    return this.hasMany('App/Models/Match').whereIn('status', [MATCH_STATUS_FINISH])
  }

  /**
   *
   */
  invite() {
    return this.hasMany('App/Models/Match').where({ status: MATCH_STATUS_KNOCK })
  }
  /**
   *
   */
  inviteBuddies() {
    return this.hasMany('App/Models/Match').where({ status: MATCH_STATUS_NEW, buddy: true })
  }

  invited() {
    return this.hasMany('App/Models/Match').where({ status: MATCH_STATUS_INVITE })
  }

  visited() {
    return this.hasMany('App/Models/Match').whereIn('status', [
      MATCH_STATUS_VISIT,
      MATCH_STATUS_SHARE,
    ])
  }
  /**
   *
   */
  files() {
    return this.hasMany('App/Models/File').orderBy('type').orderBy('order', 'asc')
  }

  amenities() {
    return this.hasMany('App/Models/Amenity')
  }

  notifications() {
    return this.hasOne('App/Models/Notice')
  }

  /**
   *
   */
  getLatLon() {
    const toCoord = (str, reverse = true) => {
      let [lat, lon] = String(str || '').split(',')
      ;[lat, lon] = reverse
        ? [parseFloat(lon), parseFloat(lat)]
        : [parseFloat(lat), parseFloat(lon)]

      return { lat: lat || 0, lon: lon || 0 }
    }

    return toCoord(this.coord_raw, false)
  }

  /**
   *
   */
  static getHash(id) {
    return hash.crc32(`estate_${id}`, true)
  }

  /**
   *
   */
  async publishEstate(status, trx) {
    await this.updateItemWithTrx(
      {
        status: status,
        is_published: true,
        available_end_at:
          this.available_end_at ||
          moment(this.available_start_at).add(MAXIMUM_EXPIRE_PERIOD, 'days').format(DATE_FORMAT),
      },
      trx,
      true
    )
  }

  /**
   *
   */
  static getFinalPrice(e) {
    return parseFloat(e.net_rent) || 0 //+ (parseFloat(e.additional_costs) || 0)
  }

  /**
   *
   */
  async getContacts(user_id) {
    const contact = await Contact.query()
      .select('contacts.*', '_c.avatar')
      .innerJoin({ _c: 'companies' }, '_c.id', 'contacts.company_id')
      .innerJoin({ _u: 'users' }, function () {
        this.on('_u.company_id', '_c.id').on('_u.id', user_id)
      })
      .orderBy('contacts.id')
      .first()

    return contact
  }

  /**
   *
   */
  getAptParams() {
    return `${this.rooms_number}r ${this.area}㎡ ${this.floor}/${this.number_floors}`
  }

  static isShortTermMeet({
    prospect_duration_min,
    prospect_duration_max,
    vacant_date,
    rent_end_at,
  }) {
    if (!vacant_date || !rent_end_at) {
      return false
    }

    const rent_duration = moment(rent_end_at).format('x') - moment(vacant_date).format('x')
    if (
      rent_duration < prospect_duration_min * 24 * 60 * 60 * 1000 ||
      rent_duration > prospect_duration_max * 24 * 60 * 60 * 1000
    ) {
      return false
    }
    return true
  }
}

module.exports = Estate
