'use strict'
const moment = require('moment')
const {
  isEmpty,
  isNull,
  filter,
  omit,
  flatten,
  groupBy,
  countBy,
  maxBy,
  orderBy,
  isArray,
  sum,
  trim,
  uniq,
} = require('lodash')
const { props, Promise } = require('bluebird')
const Database = use('Database')
const Event = use('Event')
const Logger = use('Logger')
const GeoService = use('App/Services/GeoService')
const CompanyService = use('App/Services/CompanyService')
const NoticeService = use('App/Services/NoticeService')
const RoomService = use('App/Services/RoomService')
const QueueService = use('App/Services/QueueService')
const WebSocket = use('App/Classes/Websocket')
const User = use('App/Models/User')
const Estate = use('App/Models/Estate')
const Match = use('App/Models/Match')
const Visit = use('App/Models/Visit')
const Task = use('App/Models/Task')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const File = use('App/Models/File')
const FileBucket = use('App/Classes/File')
const Import = use('App/Models/Import')
const AppException = use('App/Exceptions/AppException')
const Amenity = use('App/Models/Amenity')
const TaskFilters = require('../Classes/TaskFilters')
const OpenImmoReader = use('App/Classes/OpenImmoReader')
const Ws = use('Ws')
const GeoAPI = use('GeoAPI')
const { capitalize, checkIfIsValid } = require('../Libs/utils')

const {
  STATUS_DRAFT,
  STATUS_DELETE,
  STATUS_ACTIVE,
  MATCH_STATUS_NEW,
  STATUS_EXPIRE,
  DATE_FORMAT,
  LOG_TYPE_PUBLISHED_PROPERTY,
  LETTING_TYPE_LET,
  LETTING_TYPE_VOID,
  MATCH_STATUS_FINISH,
  TASK_STATUS_DRAFT,
  TASK_STATUS_DELETE,
  MATCH_STATUS_SHARE,
  MATCH_STATUS_COMMIT,
  MATCH_STATUS_TOP,
  TRANSPORT_TYPE_WALK,
  SHOW_ACTIVE_TASKS_COUNT,
  MATCH_STATUS_INVITE,
  MATCH_STATUS_VISIT,
  LETTING_TYPE_NA,
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_NEW,
  URGENCY_SUPER,
  TENANT_INVITATION_EXPIRATION_DATE,
  ROLE_LANDLORD,
  TASK_STATUS_RESOLVED,
  TASK_STATUS_UNRESOLVED,
  IMPORT_TYPE_OPENIMMO,
  IMPORT_ENTITY_ESTATES,
  WEBSOCKET_EVENT_VALID_ADDRESS,
  FILE_TYPE_PLAN,
  LETTING_STATUS_NEW_RENOVATED,
  LETTING_STATUS_STANDARD,
  LETTING_STATUS_VACANCY,
  FILE_LIMIT_LENGTH,
  FILE_TYPE_UNASSIGNED,
  GENERAL_PERCENT,
  LEASE_CONTRACT_PERCENT,
  PROPERTY_DETAILS_PERCENT,
  TENANT_PREFERENCES_PERCENT,
  VISIT_SLOT_PERCENT,
  IMAGE_DOC_PERCENT,
  FILE_TYPE_EXTERNAL,
  DEFAULT_LANG,
  COMPLETE_CERTAIN_PERCENT,
  ESTATE_COMPLETENESS_BREAKPOINT,
  PUBLISH_ESTATE,
  ROLE_USER,
  MATCH_STATUS_FINISH_PENDING,
  DAY_FORMAT,
  LIKED_BUT_NOT_KNOCKED_FOLLOWUP_HOURS_AFTER,
  FILE_TYPE_CUSTOM,
  LANDLORD_REQUEST_PUBLISH_EMAIL_SUBJECT,
  ADMIN_URLS,
  GERMAN_DATE_FORMAT,
  PUBLISH_STATUS_INIT,
  PUBLISH_STATUS_BY_LANDLORD,
  TASK_STATUS_ARCHIVED,
  DEACTIVATE_PROPERTY,
  WEBSOCKET_EVENT_ESTATE_UNPUBLISHED,
  WEBSOCKET_EVENT_ESTATE_DEACTIVATED,
  PUBLISH_STATUS_APPROVED_BY_ADMIN,
  STATUS_OFFLINE_ACTIVE,
  PUBLISH_TYPE_OFFLINE_MARKET,
  TASK_COMMON_TYPE,
  TASK_SYSTEM_TYPE,
  STATUS_EMAIL_VERIFY,
  ESTATE_FIELD_FOR_TASK,
  PROPERTY_TYPE_SHORT_TERM,
  MAX_ROOM_COUNT,
  MAX_SPACE_COUNT,
  SPACE_INTERVAL_COUNT,
  ROOM_INTERVAL_COUNT,
  RENT_INTERVAL_COUNT,
  MAX_RENT_COUNT,
  FURNISHED_GERMAN_NAME,
  PUBLISH_TYPE_ONLINE_MARKET,
  MAXIMUM_EXPIRE_PERIOD,
} = require('../constants')

const {
  exceptions: {
    NO_ESTATE_EXIST,
    NO_FILE_EXIST,
    IMAGE_COUNT_LIMIT,
    FAILED_TO_ADD_FILE,
    ERROR_PROPERTY_AREADY_PUBLISHED,
    ERROR_PROPERTY_AVAILABLE_DURATION,
    ERROR_PROPERTY_UNDER_REVIEW,
    ERROR_PROPERTY_INVALID_STATUS,
    ERROR_PROPERTY_NOT_PUBLISHED,
    ERROR_PUBLISH_BUILDING,
  },
  exceptionCodes: {
    ERROR_PROPERTY_AREADY_PUBLISHED_CODE,
    ERROR_PROPERTY_AVAILABLE_DURATION_CODE,
    ERROR_PROPERTY_UNDER_REVIEW_CODE,
    ERROR_PROPERTY_INVALID_STATUS_CODE,
    ERROR_PROPERTY_NOT_PUBLISHED_CODE,
    ERROR_PUBLISH_BUILDING_CODE,
  },
} = require('../../app/exceptions')

const HttpException = use('App/Exceptions/HttpException')
const EstateFilters = require('../Classes/EstateFilters')
const BuildingService = require('./BuildingService')

const MAX_DIST = 10000

const ESTATE_PERCENTAGE_VARIABLE = {
  genenral: [
    {
      key: 'address',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'property_type',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'area',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'rooms_number',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'floor',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'floor_direction',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
  ],
  lease_price: [
    {
      key: 'net_rent',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'deposit',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'parking_space',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'extra_costs',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
    },
    {
      key: 'heating_costs',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
  ],
  property_detail: [
    {
      key: 'construction_year',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'house_type',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'building_status',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'apt_type',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'heating_type',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'energy_efficiency',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'firing_type',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
  ],
  tenant_preference: [
    {
      key: 'min_age',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'max_age',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'household_type',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'minors',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'pets_allowed',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'is_new_tenant_transfer',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'budget',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'credit_score',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'rent_arrears',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'income_sources',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
  ],
  visit_slots: [
    {
      key: 'available_start_at',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'available_end_at',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
    {
      key: 'slot',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: true,
    },
  ],
  views: [
    {
      key: 'inside_view',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: true,
    },
    {
      key: 'outside_view',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: true,
    },
    {
      key: 'floor_plan',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: true,
    },
    {
      key: 'energy_proof',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
    },
  ],
}
/**
 *
 */
class EstateService {
  /**
   *
   */
  static getQuery(condition = {}) {
    if (isEmpty(condition)) {
      return Estate.query()
    }

    return Estate.query().where(condition)
  }

  /**
   *
   */
  static getActiveEstateQuery() {
    return Estate.query().whereNot('estates.status', STATUS_DELETE)
  }

  static async getById(id) {
    return await EstateService.getActiveEstateQuery().where('estates.id', id).first()
  }

  static async getByIdWithDetail(id) {
    return await this.getActiveEstateQuery()
      .where('id', id)
      .with('slots')
      .with('rooms', function (r) {
        r.with('images')
      })
      .with('files')
      .with('amenities', function (q) {
        q.with('option')
      })
      .first()
  }

  static async getEstateWithUser(id) {
    return await this.getActiveEstateQuery().where('id', id).with('user').first()
  }

  static async getEstateWithDetails({ id, user_id, role }) {
    let estateQuery = Estate.query()
      .select(Database.raw('estates.*'))
      .select(Database.raw(`coalesce(_c.landlord_type, 'private') as landlord_type`))
      .leftJoin(
        Database.raw(`
          (select
            users.id as user_id,
            companies.type as landlord_type
          from users
          left join companies
          on companies.id=users.company_id
          ) as _c`),
        function () {
          this.on('estates.user_id', '_c.user_id').on('estates.id', id)
        }
      )
    estateQuery.where('estates.id', id).whereNot('status', STATUS_DELETE)

    if (user_id) {
      estateQuery.withCount('notifications', function (n) {
        n.where('user_id', user_id)
      })
    }

    if (user_id && role === ROLE_LANDLORD) {
      estateQuery
        .withCount('visits')
        .withCount('knocked')
        .withCount('decided')
        .withCount('invite')
        .withCount('final')
        .withCount('contact_requests')
        .withCount('inviteBuddies')
        .with('current_tenant', function (q) {
          q.with('user')
        })
      estateQuery.with('estateSyncListings')
    }

    estateQuery
      .with('point')
      .with('files')
      .with('rooms', function (b) {
        b.whereNot('status', STATUS_DELETE)
          .with('images')
          .orderBy('order', 'asc')
          .orderBy('favorite', 'desc')
          .orderBy('id', 'asc')
          .with('room_amenities', function (q) {
            q.select(
              Database.raw(
                `amenities.*,
              case
                when
                  amenities.type='amenity'
                then
                  "options"."title"
                else
                  "amenities"."amenity"
              end as amenity`
              )
            )
              .from('amenities')
              .leftJoin('options', 'options.id', 'amenities.option_id')
              .where('amenities.location', 'room')
              .whereNot('amenities.status', STATUS_DELETE)
              .orderBy('amenities.sequence_order', 'desc')
          })
      })

    if (user_id && role === ROLE_USER) {
      estateQuery.with('user', function (u) {
        u.select('id', 'company_id')
        u.with('company', function (c) {
          c.select('id', 'avatar', 'name', 'visibility')
          c.with('contacts', function (ct) {
            ct.select('id', 'full_name', 'company_id')
          })
        })
      })
    }

    if (user_id && role === ROLE_LANDLORD) {
      estateQuery.where('estates.user_id', user_id)
    }
    return estateQuery.first()
  }

  static async assignEstateAmenities(estate) {
    let amenities = await Amenity.query()
      .select(
        Database.raw(
          `amenities.location, json_agg(amenities.* order by sequence_order desc) as amenities`
        )
      )
      .from(
        Database.raw(`(
          select amenities.*,
            case
              when
                "amenities".type='amenity'
              then
                "options"."title"
              else
                "amenities"."amenity"
                  end as amenity
          from amenities
          left join options
          on options.id=amenities.option_id
          where
            amenities.status = '${STATUS_ACTIVE}'
          and
            amenities.location not in('room')
          and
            amenities.estate_id in ('${estate?.id}')
        ) as amenities`)
      )
      .where('status', STATUS_ACTIVE)
      .whereIn('estate_id', [estate?.id])
      .groupBy('location')
      .fetch()
    estate.amenities = amenities
    return estate
  }

  /**
   *
   */
  static async getActiveById(id, conditions = {}) {
    const query = Estate.query()
      .where({ id })
      .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE, STATUS_OFFLINE_ACTIVE])
    if (!isEmpty(conditions)) {
      query.where(conditions)
    }

    return await query.first()
  }

  static async getEstateWithTenant(id, user_id) {
    const query = Estate.query()
      .select('estates.*', '_u.avatar')
      .leftJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id')
        this.on('_m.status', MATCH_STATUS_FINISH)
      })
      .leftJoin({ _u: 'users' }, '_m.user_id', '_u.id')
      .where('estates.id', id)
      .whereNotIn('estates.status', [STATUS_DELETE])

    query.where('estates.user_id', user_id)

    return await query.firstOrFail()
  }

  static async saveEnergyProof(request) {
    const imageMimes = [
      FileBucket.IMAGE_JPG,
      FileBucket.IMAGE_JPEG,
      FileBucket.IMAGE_PNG,
      FileBucket.IMAGE_PDF,
    ]
    try {
      const files = await FileBucket.saveRequestFiles(request, [
        { field: 'energy_proof', mime: imageMimes, isPublic: true },
      ])

      return files
    } catch (e) {
      return null
    }
  }
  /**
   *
   */
  static async createEstate(
    { request, data, userId, is_coord_changed = true },
    fromImport = false,
    trx = null
  ) {
    data = request ? request.all() : data

    const propertyId = data.property_id
      ? data.property_id
      : Math.random().toString(36).substr(2, 8).toUpperCase()

    if (!userId) {
      throw new HttpException('No user Id passed')
    }

    try {
      let createData = {
        ...omit(data, [
          'room1_type',
          'room2_type',
          'room3_type',
          'room4_type',
          'room5_type',
          'room6_type',
          'txt_salutation',
          'surname',
          'phone_number',
          'email',
          'salutation_int',
          'rooms',
        ]),
        user_id: userId,
        property_id: propertyId,
        status: STATUS_DRAFT,
      }

      if (request) {
        const files = await this.saveEnergyProof(request)

        if (files && files.energy_proof) {
          createData = {
            ...createData,
            energy_proof: files.energy_proof,
            energy_proof_original_file: files.original_energy_proof,
          }
        }
      }

      if (!fromImport) {
        createData.letting_type = createData.letting_type || LETTING_TYPE_VOID
        createData.letting_status = createData.letting_status || LETTING_STATUS_VACANCY
      }
      let estateHash
      const estate = await Estate.createItem(
        {
          ...createData,
          is_coord_changed,
          percent: this.calculatePercent(createData),
        },
        trx
      )
      //test percent
      if (+estate.percent >= ESTATE_COMPLETENESS_BREAKPOINT) {
        QueueService.sendEmailToSupportForLandlordUpdate({
          type: COMPLETE_CERTAIN_PERCENT,
          landlordId: userId,
          estateIds: [estate.id],
        })
      }
      // we can't get hash when we use transaction because that record won't be created before commiting the transaction
      if (!trx) {
        estateHash = await Estate.query().select('hash').where('id', estate.id).firstOrFail()
      }

      // Run processing estate geo nearest
      const estateData = await estate.toJSON({ isOwner: true })
      return {
        hash: estateHash?.hash || null,
        ...estateData,
      }
    } catch (e) {
      Logger.error(`Creating estate error = ${userId} e.message`)
      throw new HttpException(e.message, e.status || 400)
    }
  }

  static async updateShowRequired({ id, is_not_show = false }) {
    await Estate.query().where('id', id).update({ is_not_show })
  }

  static async updateEstate({ request, data, user_id }, trx = null) {
    data = request ? request.all() : data
    let updateData = {
      ...omit(data, [
        'delete_energy_proof',
        'rooms',
        'letting_type',
        'cover_thumb',
        'can_publish',
        'status',
      ]),
      status: STATUS_DRAFT,
    }

    let energy_proof = null
    const estate = await this.getByIdWithDetail(data.id)
    if (!estate) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }

    updateData = {
      ...estate.toJSON({
        extraFields: ['verified_address', 'cover_thumb'],
      }),
      ...updateData,
    }

    const { verified_address, construction_year, cover_thumb, ...omittedData } = updateData

    let insideTrx = !trx ? true : false
    trx = insideTrx ? await Database.beginTransaction() : trx
    try {
      if (data.delete_energy_proof) {
        energy_proof = estate?.energy_proof

        updateData = {
          ...updateData,
          energy_proof: null,
          energy_proof_original_file: null,
          percent: this.calculatePercent({
            ...omittedData,
            energy_proof: null,
          }),
          can_publish: this.isAllInfoAvailable({
            ...omittedData,
            energy_proof: null,
          }),
        }
      } else {
        const files = await this.saveEnergyProof(request)
        if (files && files.energy_proof) {
          updateData = {
            ...updateData,
            percent: this.calculatePercent({
              ...omittedData,
            }),
            can_publish: this.isAllInfoAvailable({
              ...omittedData,
            }),

            energy_proof: files.energy_proof,
            energy_proof_original_file: files.original_energy_proof,
          }
        } else {
          updateData = {
            ...updateData,
            percent: this.calculatePercent({
              ...omittedData,
            }),
            can_publish: this.isAllInfoAvailable({
              ...omittedData,
            }),
          }
        }
      }

      await estate.updateItemWithTrx(updateData, trx)
      await this.deleteMatchInfo({ estate_id: estate.id }, trx)

      if (estate.build_id) {
        await BuildingService.updateCanPublish(
          {
            user_id: estate.user_id,
            build_id: estate.build_id,
            estate: {
              ...estate.toJSON(),
              can_publish: this.isAllInfoAvailable({
                ...omittedData,
              }),
            },
          },
          trx
        )
      }

      QueueService.estateSyncUnpublishEstates([estate.id], true)

      if (+updateData.percent >= ESTATE_COMPLETENESS_BREAKPOINT) {
        QueueService.sendEmailToSupportForLandlordUpdate({
          type: COMPLETE_CERTAIN_PERCENT,
          landlordId: user_id,
          estateIds: [estate.id],
        })
      }
      if (data.delete_energy_proof && energy_proof) {
        FileBucket.remove(energy_proof)
      }

      if (insideTrx) {
        await trx.commit()
      }

      return {
        ...estate.toJSON(),
        updateData,
      }
    } catch (e) {
      if (insideTrx) {
        await trx.rollback()
      }
      throw new HttpException(e.message, e.status || 400)
    }
  }

  static async updateEnergyProofFromGallery({ estate_id, user_id, galleries }, trx) {
    if (!galleries || !galleries.length) {
      return null
    }

    //need to backup this energy proof to gallery to be used later
    const estate = await this.getById(estate_id)
    if (estate && estate.energy_proof) {
      await require('./GalleryService').addFromView(
        {
          user_id,
          url: estate.energy_proof,
          file_name: estate.energy_proof_original_file,
        },
        trx
      )
    }

    const estateData = {
      user_id,
      energy_proof: galleries[0].url,
      energy_proof_original_file: galleries[0].file_name,
    }
    await Estate.query().where('id', estate_id).update(estateData).transacting(trx)
    return galleries.map((gallery) => gallery.id)
  }

  /**
   *
   */
  static getEstates(user_ids, params = {}) {
    user_ids = user_ids ? (Array.isArray(user_ids) ? user_ids : [user_ids]) : null

    let query = Estate.query()
      .whereNot('status', STATUS_DELETE)
      .withCount('notifications', function (n) {
        if (user_ids?.length) {
          n.whereIn('user_id', user_ids)
        }
        if (params && params.id) {
          n.where('estate_id', params.id)
        }
      })
      .withCount('visits')
      .withCount('knocked')
      .withCount('decided')
      .withCount('invite')
      .withCount('final')
      .withCount('contact_requests')
      .withCount('inviteBuddies')
      .with('user', function (u) {
        u.select('id', 'company_id')
        u.with('company', function (c) {
          c.select('id', 'avatar', 'name', 'visibility')
          c.with('contacts', function (ct) {
            ct.select('id', 'full_name', 'company_id')
          })
        })
      })
      .with('current_tenant', function (q) {
        q.with('user')
      })
    if (user_ids?.length) {
      query.whereIn('estates.user_id', user_ids)
    }
    const Filter = new EstateFilters(params, query)
    query = Filter.process()
    return query.orderBy('estates.id', 'desc')
  }

  /**
   *
   */
  static getUpcomingShows(userIds, query = '') {
    return this.getEstates(userIds)
      .innerJoin({ _t: 'time_slots' }, '_t.estate_id', 'estates.id')
      .whereNotIn('status', [STATUS_DELETE, STATUS_DRAFT])
      .whereNot('area', 0)
      .where(function () {
        if (query !== '') this.where('address', 'ILIKE', `%${query}%`)
      })
      .where('_t.start_at', '>', Database.fn.now())
      .with('slots')
      .orderBy('start_at', 'asc')
  }

  /**
   *
   */
  static async removeEstate(id, user_id) {
    // TODO: remove indexes
    await Estate.findByOrFail({ id, user_id })
    const trx = await Database.beginTransaction()
    try {
      const estate = await Estate.query()
        .where('id', id)
        .update({ status: STATUS_DELETE })
        .transacting(trx)

      const taskService = require('./TaskService')
      await taskService.deleteByEstateById(id, trx)
      await require('./EstateSyncService').unpublishEstate(id)

      await trx.commit()
      return estate
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 500)
    }
  }

  static async completeRemoveEstate(id) {
    await EstateCurrentTenant.query().where('estate_id', id).delete()
    return await Estate.query().where('id', id).delete()
  }

  /**
   *
   */
  static async getSqrRange({ year, sqr, quality }) {
    return Database.from('sqr_rates')
      .whereRaw(`COALESCE(min_year, 0) <= ?`, [year])
      .whereRaw(`COALESCE(max_year, 2050) >= ?`, [year])
      .whereRaw(`COALESCE(min_sqr, 0) <= ?`, [sqr])
      .whereRaw(`COALESCE(max_sqr, 100000) >= ?`, [sqr])
      .where('quality', quality)
  }

  /**
   *
   */
  static async addFile({ url, file_name, disk, estate, type, file_format }) {
    const trx = await Database.beginTransaction()
    try {
      const file = await File.createItem(
        {
          url,
          disk,
          file_name,
          estate_id: estate.id,
          type,
          file_format,
        },
        trx
      )
      await this.updatePercentAndIsPublished({ estate_id: estate.id, files: [file.toJSON()] }, trx)
      await trx.commit()
      return file
    } catch (e) {
      await trx.rollback()
      throw new HttpException(FAILED_TO_ADD_FILE, e.status || 500)
    }
  }

  static async addManyFiles(data, trx) {
    try {
      const files = await File.createMany(data, trx)
      return files
    } catch (e) {
      console.log('AddManyFiles', e.message)
      throw new HttpException(FAILED_TO_ADD_FILE, e.status || 500)
    }
  }

  static async addFileFromGallery({ user_id, estate_id, galleries, type }, trx) {
    await this.hasPermission({ id: estate_id, user_id })
    const files = galleries.map((gallery) => {
      return {
        url: gallery.url,
        file_name: gallery.file_name,
        disk: 's3public',
        estate_id,
        type,
      }
    })
    await File.createMany(files, trx)
    return galleries.map((gallery) => gallery.id)
  }

  /**
   *
   */
  static async removeFile({ ids, estate_id, user_id }) {
    let files
    const trx = await Database.beginTransaction()
    try {
      ids = Array.isArray(ids) ? ids : [ids]
      files = (
        await File.query()
          .select('files.*')
          .whereIn('files.id', ids)
          .innerJoin('estates', 'estates.id', 'files.estate_id')
          .where('estates.id', estate_id)
          .where('estates.user_id', user_id)
          .fetch()
      ).rows
      if (!files || !files.length) {
        throw new HttpException(NO_FILE_EXIST, 404)
      }

      ids = files.map((file) => file.id)
      await File.query().delete().whereIn('id', ids).transacting(trx)
      await this.updatePercentAndIsPublished({ estate_id, deleted_files_ids: ids }, trx)
      await this.updateCover({ estate_id, removeImages: files }, trx)
      await trx.commit()
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400)
    }
  }

  static async moveToGallery({ ids, estate_id, user_id }, trx = null) {
    await this.hasPermission({ id: estate_id, user_id })
    let query = File.query()
      .update({ type: FILE_TYPE_UNASSIGNED })
      .whereIn('id', ids)
      .where('estate_id', estate_id)

    if (trx) {
      await query.transacting(trx)
    } else {
      await query
    }
  }

  static async restoreFromGallery({ ids, estate_id, user_id, type }, trx) {
    await this.hasPermission({ id: estate_id, user_id })

    const files = await this.getFiles({ estate_id, type })
    if (files && (files?.length || 0) + ids.length > FILE_LIMIT_LENGTH) {
      throw new HttpException(IMAGE_COUNT_LIMIT, 400)
    }
    const file = await File.query().where('id', ids[0]).first()
    await File.query()
      .update({ type })
      .whereIn('id', ids)
      .where('estate_id', estate_id)
      .transacting(trx)

    if (file) {
      await this.updateCover({ estate_id, addImage: { ...file.toJSON(), type } }, trx)
    }
  }

  static async getFiles({ estate_id, ids, type, orderBy }) {
    let query = File.query().where('estate_id', estate_id)
    if (ids) {
      query.whereIn('id', ids)
    }
    if (type) {
      type = Array.isArray(type) ? type : [type]
      query.whereIn('type', type)
    }
    if (orderBy) {
      orderBy.map((ob) => {
        query.orderBy(ob.key, ob.order)
      })
    }

    return (await query.fetch()).rows || []
  }

  static async updateCover({ estate_id, room, removeRoomId, removeImages, addImage }, trx = null) {
    try {
      const estate = await this.getById(room?.estate_id || estate_id)
      if (!estate) {
        throw new HttpException('No permission to update cover', 400)
      }

      const rooms = ((await RoomService.getRoomsByEstate(estate.id, true)) || [])
        .toJSON()
        .filter((r) => r.id !== removeRoomId?.id)
      let favoriteRooms = []
      if (room) {
        favoriteRooms = room.favorite
          ? [room]
          : filter(rooms, function (r) {
              return r.favorite
            })
      }
      let favImages = this.extractImages(
        favoriteRooms,
        removeImages,
        addImage?.room_id ? addImage : undefined
      )
      // no cover or cover is no longer favorite image
      if (favImages && favImages.length) {
        if (!estate.cover || !favImages.find((i) => i.relativeUrl === estate.cover)) {
          await this.setCover(estate.id, favImages[0].relativeUrl, trx)
        }
      } else {
        let images
        if (rooms) {
          images = this.extractImages(rooms, removeImages, addImage?.room_id ? addImage : undefined)
        }

        if (images && images.length) {
          await this.setCover(estate.id, images[0].relativeUrl, trx)

          if (room) {
            await RoomService.setFavorite(
              { estate_id: estate.id, room_id: images[0].room_id, favorite: true },
              trx
            )
          }
        } else {
          /* if no images in rooms*/
          let files =
            (await this.getFiles({
              estate_id: room?.estate_id || estate_id,
              type: [FILE_TYPE_PLAN, FILE_TYPE_EXTERNAL],
              orderBy: [{ key: 'type', order: 'asc' }],
            })) || []

          if (addImage) {
            files.push(addImage)
          }

          const removeImageIds = (removeImages || []).map((ri) => ri.id)
          if (removeImageIds && removeImageIds.length) {
            files = files.filter((f) => !removeImageIds.includes(f.id))
          }

          if (files && files.length) {
            await this.setCover(estate.id, files[0]?.relativeUrl || files[0].url, trx)
          } else {
            await this.setCover(estate.id, null, trx)
          }
        }
      }
    } catch (e) {
      throw new HttpException(e.message, e.status || 500)
    }
  }

  static extractImages(rooms, removeImages = undefined, addImage = undefined) {
    let images = []

    rooms.map((r) => {
      if (addImage) {
        r.images.push(addImage.toJSON())
      }
      if (!r.images || !r.images.length) {
        return
      }
      images.push(r.images)
    })

    images = flatten(images)
    if (removeImages && removeImages.length) {
      const removeImageIds = removeImages.map((ri) => ri.id)
      images = images.filter((i) => !removeImageIds.includes(i.id))
    }

    return images
  }

  static async changeEstateCoverInFavorite(room, images, firstId, trx) {
    if (!images || !images.length) {
      return
    }

    const image = images.find((i) => i.id === firstId)
    await this.setCover(room.estate_id, image.relativeUrl, trx)
  }

  /**
   *
   */
  static async setCover(estateId, filePathName, trx = null) {
    const coverUpdateQuery = Estate.query().update({ cover: filePathName }).where('id', estateId)
    if (trx) {
      coverUpdateQuery.transacting(trx)
    }
    return await coverUpdateQuery
  }

  static async removeCover(estateId, filePathName, trx = null) {
    return await Estate.query()
      .update({ cover: null })
      .where('id', estateId)
      .where('cover', filePathName)
      .transacting(trx)
  }

  /**
   *
   */
  static async getEstateByHash(hash) {
    return Estate.query()
      .where('hash', hash)
      .whereIn('status', [STATUS_ACTIVE, STATUS_OFFLINE_ACTIVE, STATUS_EXPIRE])
      .first()
  }

  static async getAllPublishedEstatesByIds({ ids, user_id }) {
    let query = Estate.query()
    if (ids) {
      ids = Array.isArray(ids) ? ids : [ids]
      query.whereIn('id', ids)
    }
    if (user_id) {
      query.where('user_id', user_id)
    }

    return (
      await query
        .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
        .with('user', function (user) {
          user.select('id', 'lang')
        })
        .fetch()
    ).toJSON()
  }
  /**
   *
   */
  static async addLike(userId, estateId) {
    const estate = await this.getActiveEstateQuery().where({ id: estateId }).first()
    if (!estate) {
      throw new AppException('Invalid estate')
    }

    try {
      await Database.into('likes').insert({ user_id: userId, estate_id: estateId })
      const delay = LIKED_BUT_NOT_KNOCKED_FOLLOWUP_HOURS_AFTER * 1000 * 60 * 60 //ms
      await this.removeDislike(userId, estateId)
      QueueService.notifyProspectWhoLikedButNotKnocked(estateId, userId, delay)
    } catch (e) {
      Logger.error(e)
      throw new AppException('Cant create like')
    }
  }

  /**
   *
   */
  static async removeLike(userId, estateId, trx) {
    return Database.table('likes')
      .where({ user_id: userId, estate_id: estateId })
      .delete()
      .transacting(trx)
  }

  /**
   *
   */
  static async addDislike(userId, estateId, trx) {
    const shouldTrxProceed = trx

    if (!trx) {
      trx = await Database.beginTransaction()
    }

    const estate = await this.getActiveEstateQuery().where({ id: estateId }).first()
    if (!estate) {
      throw new AppException('Invalid estate')
    }

    try {
      await Database.table('dislikes')
        .insert({ user_id: userId, estate_id: estateId })
        .transacting(trx)
      await this.removeLike(userId, estateId, trx)
      if (!shouldTrxProceed) await trx.commit()
    } catch (e) {
      Logger.error(e)
      if (!shouldTrxProceed) await trx.rollback()
      throw new AppException('Cant create like')
    }
  }

  /**
   *
   */
  static async removeDislike(userId, estateId) {
    return Database.table('dislikes').where({ user_id: userId, estate_id: estateId }).delete()
  }

  /**
   *
   */
  static async searchEstatesQuery(tenant) {
    let estates = await Database.select(Database.raw(`TRUE as inside`))
      .select('_e.*')
      .from({ _t: 'tenants' })
      .innerJoin({ _p: 'points' }, '_p.id', '_t.point_id')
      .crossJoin({ _e: 'estates' })
      // .innerJoin({ _a: 'amenities' }, '_e.id', '_a.estate_id')
      .leftJoin({ _m: 'matches' }, function () {
        this.on('_m.user_id', tenant.user_id).on('_m.estate_id', '_e.id')
      })
      .where('_t.user_id', tenant.user_id)
      .where(function () {
        this.orWhereNull('_m.id')
        this.orWhere('_m.status', MATCH_STATUS_NEW)
      })
      .whereNotIn('_e.id', function () {
        // Remove already liked/disliked
        this.select('estate_id')
          .from('likes')
          .where('user_id', tenant.user_id)
          .union(function () {
            this.select('estate_id').from('dislikes').where('user_id', tenant.user_id)
          })
      })

      .where('_e.status', STATUS_ACTIVE)
      .whereRaw(Database.raw(`_ST_Intersects(_p.zone::geometry, _e.coord::geometry)`))

    const estateIds = estates.map((estate) => estate.id)
    const amenities = (
      await Amenity.query()
        .select('estate_id', 'option_id', 'location')
        .whereIn('estate_id', estateIds)
        .fetch()
    ).toJSON()

    const estateAmenities = groupBy(amenities, (amenity) => amenity.estate_id)
    estates = estates.map((estate) => ({ ...estate, amenities: estateAmenities?.[estate.id] }))

    const categoryCounts = this.calculateInsideCategoryCounts(estates, tenant)
    const filteredEstates = await this.filterEstates({ tenant, estates, inside_property: true })
    return {
      estates: filteredEstates,
      categoryCounts,
    }
  }

  static calculateCounts({ estates, fieldName, start, end, interval }) {
    let list = []
    let counts = []
    while (start < end) {
      list.push({ min: start, max: start + interval })
      start += interval
    }

    list.forEach((element) => {
      counts[`${element.min}_${element.max}`] = estates.filter(
        (estate) => estate[fieldName] >= element.min && estate[fieldName] < element.max
      )?.length
    })

    return counts
  }

  static calculateInsideCategoryCounts(estates, tenant) {
    const rooms_number = this.calculateCounts({
      estates,
      fieldName: 'rooms_number',
      start: 0,
      end: MAX_ROOM_COUNT,
      interval: ROOM_INTERVAL_COUNT,
    })

    const area = this.calculateCounts({
      estates,
      fieldName: 'area',
      start: 0,
      end: MAX_SPACE_COUNT,
      interval: SPACE_INTERVAL_COUNT,
    })

    const net_rent = this.calculateCounts({
      estates,
      fieldName: 'net_rent',
      start: 0,
      end: tenant.income ?? MAX_RENT_COUNT,
      interval: RENT_INTERVAL_COUNT,
    })

    return {
      rooms_number,
      area,
      net_rent,
    }
  }

  static sumCategoryCounts({ insideMatchCounts, outsideMatchCounts }) {
    let counts = {}

    Object.keys(insideMatchCounts).forEach((categoryKey) => {
      counts[categoryKey] = Object.keys(insideMatchCounts[categoryKey]).map((key) => ({
        [key]:
          (insideMatchCounts?.[categoryKey]?.[key] || 0) +
          (outsideMatchCounts?.[categoryKey]?.[key] || 0),
      }))
    })
    return counts
  }

  static async filterEstates({ tenant, estates, inside_property = false }) {
    Logger.info(`before filterEstates count ${estates?.length}`)

    const minTenantBudget = tenant?.budget_min || 0
    const maxTenantBudget = tenant?.budget_max || 0

    estates = estates.filter((estate) => {
      const budget = tenant.include_utility ? estate.net_rent + estate.extra_costs : estate.net_rent
      return budget >= minTenantBudget && budget <= maxTenantBudget
    })

    if (process.env.DEV === 'true') {
      Logger.info(`filterEstates after budget ${estates?.length}`)
    }

    //transfer budget
    estates = estates.filter(
      (estate) =>
        !estate.transfer_budget ||
        (estate.transfer_budget >= (tenant.transfer_budget_min ?? 0) &&
          estate.transfer_budget <= (tenant.transfer_budget_max ?? 0))
    )
    if (process.env.DEV === 'true') {
      Logger.info(`filterEstates after transfer ${estates?.length}`)
    }

    if (tenant.rent_start && inside_property) {
      estates = estates.filter(
        (estate) =>
          !estate.vacant_date ||
          moment.utc(estate.vacant_date).format(DAY_FORMAT) >=
            moment.utc(tenant.rent_start).format(DAY_FORMAT)
      )
      if (process.env.DEV === 'true') {
        Logger.info(`filterEstates after rent start ${estates?.length}`)
      }
    }

    if (tenant.is_short_term_rent) {
      estates = estates.filter((estate) => {
        const vacant_date = estate.vacant_date
        const rent_end_at = estate.rent_end_at

        if (tenant.residency_duration_min && tenant.residency_duration_max) {
          // if it's inside property
          if (!estate.source_id) {
            if (!vacant_date || !rent_end_at) {
              return false
            }

            const rent_duration = moment(rent_end_at).format('x') - moment(vacant_date).format('x')
            if (
              rent_duration < tenant.residency_duration_min * 24 * 60 * 60 * 1000 ||
              rent_duration > tenant.residency_duration_max * 24 * 60 * 60 * 1000
            ) {
              return false
            }
          } else {
            if (estate.property_type !== PROPERTY_TYPE_SHORT_TERM) {
              return false
            }
          }
          return true
        }
        return true
      })
    }
    if (process.env.DEV === 'true') {
      Logger.info(`filterEstates after short term ${estates?.length}`)
    }

    estates = estates.filter(
      (estate) =>
        !estate.rooms_number ||
        (estate.rooms_number >= (tenant.rooms_min || 1) &&
          estate.rooms_number <= (tenant.rooms_max || 1))
    )
    if (process.env.DEV === 'true') {
      Logger.info(`filterEstates after rooms ${estates?.length}`)
    }

    estates = estates.filter(
      (estate) =>
        estate.floor === null ||
        (estate.floor >= (tenant.floor_min || 0) && estate.rooms_number <= (tenant.floor_max || 20))
    )
    if (process.env.DEV === 'true') {
      Logger.info(`filterEstates after floors ${estates?.length}`)
    }

    estates = estates.filter(
      (estate) =>
        !estate.area ||
        (estate.area >= (tenant.space_min || 1) && estate.area <= (tenant.space_max || 1))
    )
    if (process.env.DEV === 'true') {
      Logger.info(`filterEstates after area ${estates?.length}`)
    }

    if (tenant.apt_type?.length) {
      estates = estates.filter(
        (estate) => !estate.apt_type || tenant.apt_type.includes(estate.apt_type)
      )
      if (process.env.DEV === 'true') {
        Logger.info(`filterEstates apt type after ${estates?.length}`)
      }
    }

    if (tenant.house_type?.length) {
      estates = estates.filter(
        (estate) => !estate.house_type || tenant.house_type.includes(estate.house_type)
      )
      if (process.env.DEV === 'true') {
        Logger.info(`filterEstates after house type ${estates?.length}`)
      }
    }

    if (tenant.is_public_certificate) {
      //estate.cert_category : inside estates
      //estate.wbs: outside estates
      if (inside_property) {
        estates = estates.filter((estate) => estate.cert_category)
      } else {
        estates = estates.filter((estate) => estate.wbs)
      }

      if (process.env.DEV === 'true') {
        Logger.info(`filterEstates after public certificate ${estates?.length}`)
      }
    }

    if (tenant.income_level?.length && inside_property) {
      estates = estates.filter(
        (estate) => !estate.cert_category || tenant.income_level.includes(estate.cert_category)
      )
      if (process.env.DEV === 'true') {
        Logger.info(`filterEstates after income level ${estates?.length}`)
      }
    }

    if (tenant.options?.length) {
      const options = await require('../Services/OptionService').getOptions()
      const hashOptions = groupBy(options, 'title')
      const OhneMaker = require('../Classes/OhneMakler')
      estates = estates.filter((estate) => {
        let amenities = estate.amenities || []
        if (estate.source_id) {
          amenities =
            estate.property_type === PROPERTY_TYPE_SHORT_TERM
              ? [...amenities, FURNISHED_GERMAN_NAME]
              : amenities
          amenities = OhneMaker.getOptionIds(amenities, hashOptions)
        } else {
          amenities = amenities.map((amenity) => amenity.option_id)
        }
        return tenant.options.every((op) => amenities.includes(op))
      })
      if (process.env.DEV === 'true') {
        Logger.info(`filterEstates after amenity ${estates.length}`)
      }
    }

    return estates
  }

  static async searchEstateByPoint(point_id) {
    const estateFields = ESTATE_FIELD_FOR_TASK.map((field) => `_e.${field}`)
    return await Database.select(Database.raw(`TRUE as inside`))
      .select('_e.id', 'net_rent', 'extra_costs', 'available_end_at')
      .select(estateFields)
      .from({ _e: 'estates' })
      .innerJoin({ _p: 'points' }, function () {
        this.on('_p.id', point_id)
      })
      .where('_e.status', STATUS_ACTIVE)
      .whereRaw(Database.raw(`_ST_Intersects(_p.zone::geometry, _e.coord::geometry)`))
  }

  /**
   *
   */
  static getEstatesByPointZoneQuery(pointId) {
    /*
      select estates.*
      from "estates"
        LEFT JOIN dislikes AS _d
          on estates.id = _d.estate_id AND _d.user_id = 1
      where
          _ST_Intersects(
              estates.coord::geometry,
              (select "_p"."zone" from "points" as "_p" where "_p"."id" = 1 limit 1)::geometry)
      and "status" = 1
      and "estates"."id" not in (select "estate_id" from "likes" where "user_id" = 1)
      ORDER BY COALESCE(_d.created_at, '2000-01-01') ASC, estates.id DESC
      limit 10
     */
    const zoneQuery = Database.from({ _p: 'points' })
      .select('_p.zone')
      .where({ '_p.id': pointId })
      .limit(1)

    return Estate.query().where(
      Database.raw(`_ST_Intersects(estates.coord::geometry, (${zoneQuery.toString()})::geometry)`)
    )
  }

  /**
   *
   */
  static getEstatesByPointCoordQuery(lat, lon) {
    const pointsQuery = Database.raw(
      `SELECT ST_Buffer(ST_MakePoint(?, ?)::geography, ?)::geometry`,
      [lon, lat, MAX_DIST]
    )

    const intersectQuery = Database.raw(
      `_ST_Intersects(estates.coord::geometry, (${pointsQuery.toString()})::geometry)`
    )

    return Estate.query().where(intersectQuery)
  }

  /**
   * Get estates according to es
   */

  static getActiveMatchesQuery({ userId, build_id }) {
    return this.getMachesQuery(Estate.query(), { userId, build_id })
  }

  static async getTenantTrashEstates(userId) {
    // 2 cases for trash estates
    // Find the estates which the user has a match, but rented by another user
    // Find the estates which the user shared the info first, and then canceled the share
    // Find the estates which the user has been invited but there is no available time slot anymore
    // Find the estates which the user has a missed visit

    const allActiveMatches = await Match.query()
      .select('estate_id')
      .where('user_id', userId)
      .whereNotIn('status', [MATCH_STATUS_FINISH, MATCH_STATUS_NEW])
      .fetch()

    const estateIds = allActiveMatches.rows.map((m) => m.estate_id)

    const trashedEstates = await Estate.query()
      .select('estates.*')
      .select('_m.updated_at', '_m.status_at')
      .select(Database.raw('COALESCE(_m.prospect_score, 0) as match'))
      .select('_m.status as match_status')
      .select('_m.user_id as match_user_id')
      .innerJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id').on('_m.user_id', userId)
      })
      .whereIn('estates.id', estateIds)
      // .where('_m.user_id', userId)
      .where(function () {
        this.orWhere((query) => {
          query.whereHas('matches', (estateQuery) => {
            estateQuery
              .where('matches.status', MATCH_STATUS_FINISH)
              .whereIn('estates.id', estateIds)
          })
        })
        this.orWhere(function () {
          this.whereIn('_m.status', [MATCH_STATUS_SHARE, MATCH_STATUS_TOP, MATCH_STATUS_COMMIT])
            .where('_m.user_id', userId)
            .where('_m.share', false)
            .where('estates.is_not_show', false)
        })
        this.orWhere(function () {
          this.where('_m.status', MATCH_STATUS_INVITE)
          this.where('_m.user_id', userId)
          this.whereDoesntHave('slots', (query) => {
            query.where('time_slots.end_at', '>=', moment().utc(new Date()).format(DATE_FORMAT))
          })
        })
        this.orWhere(function () {
          this.where('_m.status', MATCH_STATUS_VISIT)
          this.where('_m.user_id', userId)
          this.whereDoesntHave('visit_relations', (query) => {
            query
              .where('visits.user_id', userId)
              .andWhere('visits.start_date', '>=', moment().utc(new Date()).format(DATE_FORMAT))
          })
        })
      })
      .fetch()
    return trashedEstates
  }

  static getMachesQuery(query, { userId, build_id }) {
    query
      .select('estates.*')
      .withCount('knocked')
      .select(Database.raw(`_m.prospect_score AS match`))
      .innerJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id')
          .onIn('_m.user_id', [userId])
          .onIn('_m.status', [MATCH_STATUS_NEW])
      })
      .whereNot('_m.buddy', true)
      .where('estates.status', STATUS_ACTIVE)
      .whereNotIn('estates.id', function () {
        // Remove already liked/disliked
        this.select('estate_id')
          .from('likes')
          .where('user_id', userId)
          .union(function () {
            this.select('estate_id').from('dislikes').where('user_id', userId)
          })
      })
      .with('rooms', function (b) {
        b.whereNot('status', STATUS_DELETE).with('images')
      })
      .with('files')
      .with('user', function (u) {
        u.select('id', 'company_id')
        u.with('company', function (c) {
          c.select('id', 'avatar', 'name', 'visibility')
          c.with('contacts', function (ct) {
            ct.select('id', 'full_name', 'company_id')
          })
        })
      })

    if (build_id) {
      query.where('estates.build_id', build_id)
    }

    return query.orderBy('_m.prospect_score', 'DESC')
  }
  /**
   * If tenant not active get points by zone/point+dist/range zone
   */
  static getNotActiveMatchesQuery({ tenant, userId, build_id }) {
    let query = null
    if (!tenant.coord_raw) {
      throw new AppException('Invalid user anchor')
    }

    if (!tenant.point_id) {
      const { lat, lon } = tenant.getLatLon()
      query = this.getEstatesByPointCoordQuery(lat, lon)
    } else if (tenant.zones && !isEmpty[tenant.zones]) {
      // TODO: Get apartments by user selected zones
    } else if (tenant.point_zone) {
      // Get apartments by zone
      query = this.getEstatesByPointZoneQuery(tenant.point_id)
    } else {
      // Get apartments by anchor coords
      query = this.getEstatesByPointCoordQuery(tenant.point_lat, tenant.point_lon)
    }

    if (!query) {
      throw new AppException('Invalid match query')
    }

    return this.getMachesQuery(query, { userId, build_id })
  }

  /**
   *
   */
  static async getTenantAllEstates({ userId, build_id, page = 1, limit = 20 }) {
    const tenant = await require('./TenantService').getTenantWithGeo(userId)
    if (!tenant) {
      throw new AppException('Tenant geo invalid')
    }
    let query = null
    if (tenant.isActive()) {
      query = this.getActiveMatchesQuery({ userId, build_id })
    } else {
      query = this.getNotActiveMatchesQuery({ tenant, userId, build_id })
    }

    if (page != -1 && limit != -1) {
      return query.paginate(page, limit)
    } else {
      return query.fetch()
    }
  }

  static async countPublishedPropertyByLandlord(user_id) {
    return await Estate.query().where('user_id', user_id).where('is_published', true).count('*')
  }

  static async isPaid() {}

  /**
   *
   */
  static async publishEstate({ estate, publishers, performed_by = null, is_queue = false }, trx) {
    const user = await User.query().where('id', estate.user_id).first()
    if (!user) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }

    estate.available_end_at = estate.is_duration_later ? null : estate.available_end_at
    if (
      !estate.available_start_at ||
      (!estate.is_duration_later && !estate.available_end_at) ||
      (estate.is_duration_later && !estate.min_invite_count) ||
      (estate.available_end_at &&
        moment.utc(estate.available_end_at).format() <= moment.utc(new Date()).format()) ||
      (estate.available_start_at &&
        estate.available_end_at &&
        moment.utc(estate.available_start_at).format() >=
          moment.utc(estate.available_end_at).format())
    ) {
      throw new HttpException(
        ERROR_PROPERTY_AVAILABLE_DURATION,
        400,
        ERROR_PROPERTY_AVAILABLE_DURATION_CODE
      )
    }

    if (estate.status === STATUS_ACTIVE) {
      throw new HttpException(
        ERROR_PROPERTY_AREADY_PUBLISHED,
        400,
        ERROR_PROPERTY_AREADY_PUBLISHED_CODE
      )
    }

    if (estate.publish_status === PUBLISH_STATUS_BY_LANDLORD) {
      throw new HttpException(ERROR_PROPERTY_UNDER_REVIEW, 400, ERROR_PROPERTY_UNDER_REVIEW_CODE)
    }

    if (estate.publish_status === PUBLISH_STATUS_APPROVED_BY_ADMIN) {
      throw new HttpException(
        ERROR_PROPERTY_AREADY_PUBLISHED,
        400,
        ERROR_PROPERTY_NOT_PUBLISHED_CODE
      )
    }
    if (
      [STATUS_DRAFT, STATUS_EXPIRE].includes(estate.status) &&
      estate.letting_type === LETTING_TYPE_LET
    ) {
      throw new HttpException(
        ERROR_PROPERTY_INVALID_STATUS,
        400,
        ERROR_PROPERTY_INVALID_STATUS_CODE
      )
    }

    let status = estate.status
    let insideTrx = false
    if (!trx) {
      trx = await Database.beginTransaction()
      insideTrx = true
    }

    try {
      if (user.company_id != null) {
        await CompanyService.validateUserContacts(estate.user_id)
      }

      if (publishers?.length && (!estate.build_id || (estate.build_id && estate.to_market))) {
        await require('./EstateSyncService.js').saveMarketPlacesInfo(
          {
            estate_id: estate.id,
            estate_sync_property_id: null,
            performed_by,
            publishers,
          },
          trx
        )
      }

      await props({
        delMatches: Database.table('matches')
          .where({ estate_id: estate.id })
          .delete()
          .transacting(trx),
        delLikes: Database.table('likes').where({ estate_id: estate.id }).delete().transacting(trx),
        delDislikes: Database.table('dislikes')
          .where({ estate_id: estate.id })
          .delete()
          .transacting(trx),
      })

      const subject = LANDLORD_REQUEST_PUBLISH_EMAIL_SUBJECT
      const link = `${ADMIN_URLS[process.env.NODE_ENV]}/properties?id=${estate.id}` //fixme: make a deeplink
      let textMessage =
        `Landlord: ${user.firstname} ${user.secondname}\r\n` +
        `Landlord Email: ${user.email}\r\n` +
        `Estate Address: ${capitalize(estate.address)}\r\n` +
        `Scheduled to be available on: ${moment(new Date(estate.available_start_at)).format(
          GERMAN_DATE_FORMAT
        )}\r\n` +
        `Url: ${link}\r\n` +
        `Marketplace Publishers:\r\n`
      publishers?.map((publisher) => {
        textMessage += ` - ${publisher}\r\n`
      })

      await Estate.query()
        .where('id', estate.id)
        .update({
          status: performed_by ? estate.status : STATUS_ACTIVE,
          publish_type: PUBLISH_TYPE_ONLINE_MARKET,
          publish_status: performed_by
            ? PUBLISH_STATUS_BY_LANDLORD
            : PUBLISH_STATUS_APPROVED_BY_ADMIN,
          available_end_at:
            this.available_end_at ||
            moment(this.available_start_at).add(MAXIMUM_EXPIRE_PERIOD, 'days').format(DATE_FORMAT),
          notify_sent: null,
        })
        .transacting(trx)

      if (isNull(performed_by)) {
        //comes from admin so we can publish to market place
        await QueueService.estateSyncPublishEstate({ estate_id: estate.id })
      }
      if (!is_queue) {
        //send email to support for landlord update...
        QueueService.sendEmailToSupportForLandlordUpdate({
          type: PUBLISH_ESTATE,
          landlordId: estate.user_id,
          estateIds: [estate.id],
        })
        Event.fire('mautic:syncContact', estate.user_id, { published_property: 1 })
      }

      if (insideTrx) {
        await trx.commit()
      }

      // Run match estate
      Event.fire('match::estate', estate.id)

      return status
    } catch (e) {
      console.log(`publish estate error estate id is ${estate.id} ${e.message} `)
      if (insideTrx) {
        await trx.rollback()
      }

      throw new HttpException(e.message, e.status || 500)
    }
  }

  static async deactivateEstate(id) {
    const estate = await Estate.findOrFail(id)
    const trx = await Database.beginTransaction()
    try {
      await estate.updateItemWithTrx(
        {
          status: STATUS_DRAFT,
          publish_status: PUBLISH_STATUS_INIT,
        },
        trx,
        true
      )

      await this.deleteMatchInfo({ estate_id: id }, trx)
      await trx.commit()
      await this.handleOffline({ estates: [estate], event: WEBSOCKET_EVENT_ESTATE_DEACTIVATED })
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400, e.code || 0)
    }
  }

  static async offMarketPublish(estate) {
    if (estate.publish_status === PUBLISH_STATUS_APPROVED_BY_ADMIN) {
      throw HttpException(ERROR_PROPERTY_AREADY_PUBLISHED, 400, ERROR_PROPERTY_NOT_PUBLISHED_CODE)
    }

    try {
      await estate.updateItem(
        {
          status: STATUS_OFFLINE_ACTIVE,
          publish_status: PUBLISH_STATUS_INIT,
          publish_type: PUBLISH_TYPE_OFFLINE_MARKET,
        },
        true
      )
    } catch (e) {
      console.log('offMarketPublish error=', e.message)
    }
  }

  static async deactivateBulkEstates(ids) {
    await Promise.map(
      ids,
      async (id) => {
        await this.deactivateEstate(id)
      },
      { concurrency: 1 }
    )
  }

  static async unpublishBulkEstates(ids) {
    await Promise.map(
      ids,
      async (id) => {
        const estate = await Estate.findByOrFail({ id })
        await this.unpublishEstate(estate)
      },
      { concurrency: 1 }
    )
  }

  static async unpublishEstate(estate) {
    if (estate.status !== STATUS_ACTIVE) {
      throw new HttpException(ERROR_PROPERTY_NOT_PUBLISHED, 400, ERROR_PROPERTY_NOT_PUBLISHED_CODE)
    }

    await estate.updateItem(
      {
        status: STATUS_EXPIRE,
        publish_status: PUBLISH_STATUS_INIT,
      },
      true
    )

    await this.handleOffline({ estates: [estate], event: WEBSOCKET_EVENT_ESTATE_UNPUBLISHED })
  }

  static async handleOffline({ build_id, estates, event }, trx) {
    const data = {
      success: true,
      build_id,
      status: estates?.[0]?.status,
      publish_status: estates?.[0]?.publish_status,
    }

    const EstateSyncService = require('./EstateSyncService')
    await EstateSyncService.emitWebsocketEventToLandlord({
      event,
      user_id: estates?.[0].user_id,
      data,
    })

    if (estates?.length) {
      const ids = estates.map((estate) => estate.id)
      await EstateSyncService.markListingsForDelete(ids, trx)
      //unpublish estate from estate_sync
      QueueService.estateSyncUnpublishEstates(ids, false)
    }
  }

  static async extendEstate({
    user_id,
    estate_id,
    available_end_at,
    is_duration_later,
    min_invite_count,
  }) {
    estate_id = Array.isArray(estate_id) ? estate_id : [estate_id]
    return await EstateService.getQuery()
      .whereIn('id', estate_id)
      .where('user_id', user_id)
      .whereIn('status', [STATUS_EXPIRE, STATUS_ACTIVE])
      .update({ available_end_at, is_duration_later, min_invite_count, status: STATUS_ACTIVE })
  }

  static async updatEstatesePublishInfo({
    user_id,
    estate_id,
    available_start_at,
    available_end_at,
    is_duration_later,
    min_invite_count,
    notify_on_green_matches,
  }) {
    estate_id = Array.isArray(estate_id) ? estate_id : [estate_id]
    return await EstateService.getQuery()
      .whereIn('id', estate_id)
      .where('user_id', user_id)
      .update({
        available_start_at,
        available_end_at,
        is_duration_later,
        min_invite_count,
        notify_on_green_matches,
        status: STATUS_DRAFT,
      })
  }

  static async deleteMatchInfo({ estate_id, is_notification = true }, trx) {
    estate_id = Array.isArray(estate_id) ? estate_id : [estate_id]
    const matches = await Estate.query()
      .select('estates.*')
      .whereIn('estates.id', estate_id)
      .innerJoin({ _m: 'matches' }, function () {
        this.onIn('_m.estate_id', estate_id)
      })
      .select('_m.user_id as prospect_id')
      .whereNotIn('_m.status', [MATCH_STATUS_FINISH, MATCH_STATUS_NEW])
      .fetch()

    await Match.query()
      .whereIn('estate_id', estate_id)
      .whereNotIn('status', [MATCH_STATUS_FINISH])
      .delete()
      .transacting(trx)

    await Visit.query().whereIn('estate_id', estate_id).delete().transacting(trx)
    await Database.table('likes').whereIn('estate_id', estate_id).delete().transacting(trx)
    await Database.table('dislikes').whereIn('estate_id', estate_id).delete().transacting(trx)

    if (is_notification) {
      NoticeService.prospectPropertDeactivated(matches.rows)
    }
  }

  static getQueryEstatesByUserId({ user_ids, params = {} }) {
    let query = this.getEstates(user_ids, params).whereNot('estates.status', STATUS_DELETE)
    if (params?.id) {
      params.id = Array.isArray(params.id) ? params.id : [params.id]
      query.whereIn('estates.id', params.id)
    }
    if (params?.build_id) {
      params.build_id = Array.isArray(params.build_id) ? params.build_id : [params.build_id]
      query.whereIn('estates.build_id', params.build_id)
    }
    return query
  }

  static async getEstatesByUserId({ user_ids, limit = -1, from = -1, params = {} }) {
    let query = this.getQueryEstatesByUserId({ user_ids, params })
      .with('slots')
      .with('rooms', function (q) {
        q.with('images')
      })
      .with('files')
      .with('estateSyncListings')

    let result
    if (from === -1 || limit === -1) {
      result = await query.fetch()
    } else {
      result = await query.offset(from).limit(limit).fetch()
      // result = await query.paginate(1, 10)
    }
    result.data = this.checkCanChangeLettingStatus(result, { isOwner: true })

    result.data = (result.data || []).map((estate) => {
      const outside_view_has_media =
        (estate.files || []).filter((f) => f.type == FILE_TYPE_EXTERNAL).length || 0
      const inside_view_has_media = sum(
        (estate?.rooms || []).map((room) => room?.images?.length || 0)
      )
      const document_view_has_media =
        ((estate.files || []).filter(
          (f) => f.type === FILE_TYPE_CUSTOM || f.type === FILE_TYPE_PLAN
        ).length || 0) + (estate.energy_proof && trim(estate.energy_proof) !== '' ? 1 : 0)
      const unassigned_view_has_media =
        (estate.files || []).filter((f) => f.type == FILE_TYPE_UNASSIGNED).length || 0

      return {
        ...estate,
        inside_view_has_media,
        outside_view_has_media,
        document_view_has_media,
        unassigned_view_has_media,
      }
    })
    delete result?.rows

    let pages = null
    if (from !== -1 && limit !== -1) {
      const count = await this.getQueryEstatesByUserId({ user_ids, params })
        .clearSelect()
        .clearOrder()
        .count()

      pages = {
        total: parseInt(count?.[0]?.count || 0),
        page: from / limit + 1,
        perPage: limit,
        lastPage:
          parseInt(parseInt(count?.[0]?.count || 0) / limit) +
          (parseInt(count?.[0]?.count || 0) % limit > 0 ? 1 : 0),
      }
    }
    result = {
      ...result,
      pages,
    }
    return result
  }

  static async landlordTenantDetailInfo(user_id, estate_id, tenant_id) {
    return Estate.query()
      .select(['estates.*', '_m.share', '_m.status'])
      .with('user')
      .innerJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id').on('_m.user_id', tenant_id)
        //.on('_m.status', MATCH_STATUS_FINISH)
      })
      .leftJoin({ _mb: 'members' }, function () {
        this.on('_mb.user_id', '_m.user_id')
      })
      .where('estates.id', estate_id)
      .where('estates.user_id', user_id)
      .orderBy('_mb.id')
      .firstOrFail()
  }

  /**
   * Soft deletes of estates
   */
  static async deleteEstates(ids, user_id) {
    const affectedRows = await Estate.query()
      .where('user_id', user_id)
      .whereIn('id', ids)
      .update({ status: STATUS_DELETE })
    return affectedRows
  }

  static getCounts() {
    return Estate.query()
      .select(Database.raw(`count(*) as all_count`))
      .select(
        Database.raw(`count(*) filter(where letting_type='${LETTING_TYPE_LET}') as let_count`)
      )
      .select(
        Database.raw(`count(*) filter(where letting_type='${LETTING_TYPE_VOID}') as void_count`)
      )
      .select(Database.raw(`count(*) filter(where letting_type='${LETTING_TYPE_NA}') as na_count`))
      .select(
        Database.raw(
          `count(*) filter(where status IN ('${STATUS_DRAFT}', '${STATUS_EXPIRE}') ) as offline_count`
        )
      )
      .select(Database.raw(`count(*) filter(where status='${STATUS_ACTIVE}') as online_count`))
  }

  static async getShortEstatesByQuery({ user_id, query, letting_type }) {
    let estateQuery = this.getActiveEstateQuery()
      .select(
        'estates.id',
        'area',
        'rooms_number',
        'floor',
        'number_floors',
        'property_type',
        'description',
        'house_number',
        'rent_per_sqm',
        'address',
        'city',
        'country',
        'street',
        'zip',
        'cover',
        'net_rent',
        'cold_rent',
        'additional_costs',
        'heating_costs',
        'deposit',
        'stp_garage',
        'currency',
        'building_status',
        'property_id',
        'floor_direction',
        'six_char_code',
        'available_start_at',
        'available_end_at',
        'to_date',
        'rent_end_at',
        'estates.status'
      )
      .where('estates.user_id', user_id)
    if (query) {
      estateQuery.andWhere(function () {
        this.orWhere('address', 'ilike', `%${query}%`)
        this.orWhere('city', 'ilike', `%${query}%`)
        this.orWhere('country', 'ilike', `%${query}%`)
        this.orWhere('zip', 'ilike', `%${query}%`)
        this.orWhere('property_id', 'ilike', `%${query}%`)
        this.orWhere('street', 'ilike', `%${query}%`)
      })
    }

    if (letting_type.includes(LETTING_TYPE_LET)) {
      estateQuery.where('estates.letting_type', LETTING_TYPE_LET)
      estateQuery.innerJoin({ _ect: 'estate_current_tenants' }, function () {
        this.on('_ect.estate_id', 'estates.id')
          .on(Database.raw(`_ect.user_id IS NOT NULL`))
          .on('_ect.status', STATUS_ACTIVE)
      })
    }

    return await estateQuery.fetch()
  }

  static async getEstatesByQuery({ user_id, query, coord }) {
    let estates
    const data = await require('./UserService').getTokenWithLocale([user_id])
    const lang = data && data.length && data[0].lang ? data[0].lang : DEFAULT_LANG

    if (coord) {
      const [lat, lon] = coord.split(',')
      estates = await GeoAPI.getPlacesByCoord({ lat, lon }, lang)
    } else {
      estates = await GeoAPI.getGeoByAddress(query, lang)
    }
    if (!estates) {
      return null
    }
    estates = estates.map((estate) => {
      return {
        country: estate.properties.country,
        city: estate.properties.city,
        zip: estate.properties.postcode,
        street: estate.properties.street,
        address: estate.properties.formatted,
        coord: { lat: estate.properties.lat, lon: estate.properties.lon },
        house_number: estate.properties.housenumber,
      }
    })
    const coords = estates.map((estate) => `${estate.coord.lat},${estate.coord.lon}`)
    let existingEstates =
      (
        await Estate.query()
          .leftJoin({ _ect: 'estate_current_tenants' }, function () {
            this.on('_ect.estate_id', 'estates.id').onNotIn('_ect.status', [
              STATUS_DELETE,
              STATUS_EXPIRE,
            ])
          })
          .select(
            'estates.id',
            'estates.street',
            'estates.address',
            'estates.city',
            'estates.country',
            'estates.zip',
            'estates.coord_raw',
            'estates.floor',
            'estates.house_number',
            'estates.floor_direction'
          )
          .select(Database.raw(`true as is_exist`))
          .whereNot('estates.status', STATUS_DELETE)
          .where('estates.user_id', user_id)
          .where(
            Database.raw(`
          _ect.user_id IS NULL AND
          ( _ect.code IS NULL OR
          (_ect.code IS NOT NULL AND _ect.invite_sent_at < '${moment
            .utc(new Date())
            .subtract(TENANT_INVITATION_EXPIRATION_DATE, 'days')
            .format(DATE_FORMAT)}') )`)
          )
          .whereIn('coord_raw', coords)
          .fetch()
      ).toJSON() || []
    const existingCoords = existingEstates.map((estate) => estate.coord_raw)
    const notExistingEstates = estates.filter(
      (estate) => !existingCoords.includes(`${estate.lat},${estate.lon}`)
    )

    const notGroupExistingEstates = groupBy(notExistingEstates, (estate) => estate.address)
    existingEstates = groupBy(existingEstates, (estate) => {
      return `${estate.street || ''} ${estate.house_number || ''}, ${estate.zip || ''} ${
        estate.city || ''
      }`
    })
    return {
      ...existingEstates,
      ...notGroupExistingEstates,
    }
  }

  static async getFilteredCounts(userId, params) {
    let query = EstateService.getCounts()
      .whereNot('estates.status', STATUS_DELETE)
      .where('user_id', userId)
    const Filter = new EstateFilters(params, query)
    query = Filter.process()
    let filteredCounts = await query.first()

    filteredCounts = omit(filteredCounts.toJSON(), [
      'hash',
      'coord',
      'coord_raw',
      'bath_options',
      'kitchen_options',
      'equipment',
      'verified_address',
    ])
    return filteredCounts
  }

  static async getTotalEstateCounts(userId) {
    let estateCount = await EstateService.getCounts()
      .where('user_id', userId)
      .whereNot('status', STATUS_DELETE)
      .first()
    estateCount = omit(estateCount.toJSON(), [
      'hash',
      'coord',
      'coord_raw',
      'bath_options',
      'kitchen_options',
      'equipment',
      'verified_address',
    ])
    return estateCount
  }

  static async getEstateHasTenant({ condition = {} }) {
    let query = Estate.query().where('letting_type', LETTING_TYPE_LET).where('status', STATUS_DRAFT)
    if (isEmpty(condition)) {
      return await query.first()
    }

    return await query.where(condition).first()
  }

  static async getIsolines(estate) {
    try {
      if (estate.coord_raw || estate.coord) {
        const coords = (estate.coord_raw || estate.coord).split(',')
        const lat = coords[0]
        const lon = coords[1]

        const isolinePoints = await GeoService.getOrCreateIsoline(
          { lat, lon },
          TRANSPORT_TYPE_WALK,
          60
        )

        return isolinePoints?.toJSON()?.data || []
      }
      return []
    } catch (e) {
      console.log(`getIsolines Error ${e.message}`)
      return []
    }
  }

  static async hasPermission({ id, user_id }) {
    try {
      return await Estate.findByOrFail({ id, user_id: user_id })
    } catch (e) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }
  }

  static async getEstatesWithTask({ user_id, params, page, limit = -1 }) {
    let query = Estate.query()
      .with('current_tenant', function (b) {
        b.with('user', function (u) {
          u.select('id', 'firstname', 'secondname', 'email', 'avatar')
        })
      })
      .with('tasks')
      .select(
        'estates.id',
        'estates.coord',
        'estates.user_id',
        'estates.street',
        'estates.area',
        'estates.house_number',
        'estates.country',
        'estates.floor',
        'estates.rooms_number',
        'estates.number_floors',
        'estates.city',
        'estates.cover',
        'estates.zip',
        'estates.coord_raw',
        'estates.property_id',
        'estates.net_rent',
        'estates.address',
        'estates.extra_address',
        Database.raw('COALESCE(max("tasks"."urgency"), -1) as "mosturgency" ')
      )

    query.leftJoin({ _ect: 'estate_current_tenants' }, function () {
      this.on('_ect.estate_id', 'estates.id').onIn('_ect.status', [STATUS_ACTIVE])
    })

    query.leftJoin({ _u: 'users' }, function () {
      this.on('_ect.user_id', '_u.id')
    })

    query.leftJoin('tasks', function () {
      this.on('estates.id', 'tasks.estate_id')
        .onNotIn('tasks.status', [TASK_STATUS_ARCHIVED, TASK_STATUS_DRAFT, TASK_STATUS_DELETE])
        .on('tasks.type', TASK_COMMON_TYPE)
    })

    if (user_id) {
      query.where('estates.user_id', user_id)
    }

    query.whereNot('estates.status', STATUS_DELETE)
    query.where('estates.letting_type', LETTING_TYPE_LET)
    if (params.estate_id) {
      query.whereIn('estates.id', [params.estate_id])
    }

    const taskFilter = new TaskFilters(params, query)

    query.groupBy('estates.id')

    taskFilter.afterQuery()

    query.orderBy('mosturgency', 'desc')

    let result = null
    if (limit === -1 || page === -1) {
      result = await query.fetch()
    } else {
      result = await query.paginate(page, limit)
    }

    result = Object.values(groupBy(result.toJSON().data || result.toJSON(), 'id'))

    let estates = await Promise.all(
      result.map(async (r) => {
        r[0].activeTasks = (r[0].tasks || []).filter(
          (task) => task.status === TASK_STATUS_NEW || task.status === TASK_STATUS_INPROGRESS
        )

        const closed_tasks_count =
          (r[0].tasks || []).filter(
            (task) => task.status === TASK_STATUS_RESOLVED || task.status === TASK_STATUS_UNRESOLVED
          ).length || 0
        const in_progress_task =
          countBy(r[0].tasks || [], (task) => task.status === TASK_STATUS_INPROGRESS).true || 0

        const mostUrgency = maxBy(r[0].activeTasks, (re) => {
          return re.urgency
        })

        const mostUpdated =
          r[0].activeTasks && r[0].activeTasks.length ? r[0].activeTasks[0].updated_at : null

        r[0].tasks.map((task) => {
          task.unread_message_count =
            task.unread_role === ROLE_LANDLORD ? task.unread_count || 0 : 0
        })

        const has_unread_message = Estate.landlord_has_topic_unread_messages(
          r[0].activeTasks || [],
          ROLE_LANDLORD
        )
        let activeTasks = (r[0].activeTasks || []).slice(0, SHOW_ACTIVE_TASKS_COUNT)

        const taskCount = (r[0].tasks || []).length || 0
        return {
          ...omit(r[0], ['activeTasks', 'mosturgency', 'tasks']),
          activeTasks: activeTasks,
          in_progress_task,
          mosturgency: mostUrgency?.urgency,
          most_task_updated: mostUpdated,
          has_unread_message,
          taskSummary: {
            taskCount,
            activeTaskCount: r[0].activeTasks.length || 0,
            closed_tasks_count,
            mostUrgency: mostUrgency?.urgency || null,
            mostUrgencyCount: mostUrgency
              ? countBy(r[0].activeTasks, (re) => re.urgency === mostUrgency.urgency).true || 0
              : 0,
          },
        }
      })
    )

    if (params && params.filter_by_unread_message) {
      estates = filter(estates, { has_unread_message: true })
    }

    let orderKeys = ['most_task_updated', 'mosturgency']
    let orderRules = ['desc', 'desc']

    if (params && params.order_by_unread_message) {
      orderKeys = ['has_unread_message', ...orderKeys]
      orderRules = ['desc', ...orderRules]
    }
    estates = orderBy(estates, orderKeys, orderRules)

    return estates
  }

  static async getQuickActionsCount(user_id) {
    const quickActions =
      (
        await Estate.query()
          .select(Database.raw(` DISTINCT("estates"."id")`))
          .select(Database.raw(` count( DISTINCT("_ut"."id" )) as "urgency_count"`))
          .select(Database.raw(` count( DISTINCT("_t"."id")) as unread_count`))
          .select(Database.raw(` count( DISTINCT("_tsi"."id")) as in_progress_count`))
          .select('_ect.user_id', '_ect.code', '_ect.invite_sent_at')
          .leftJoin({ _t: 'tasks' }, function () {
            this.on('estates.id', '_t.estate_id')
              .on('_t.unread_role', ROLE_LANDLORD)
              .onNotIn('_t.type', [TASK_SYSTEM_TYPE])
              .on(Database.raw(`_t.unread_count > 0`))
              .on(Database.raw(`_t.status not in (${[TASK_STATUS_DRAFT, TASK_STATUS_DELETE]})`))
              .onIn('_t.status', [TASK_STATUS_NEW, TASK_STATUS_INPROGRESS])
          })
          .leftJoin({ _ut: 'tasks' }, function () {
            this.on('estates.id', '_ut.estate_id')
              .on('_ut.urgency', URGENCY_SUPER)
              .on(Database.raw(`_ut.status not in (${[TASK_STATUS_DRAFT, TASK_STATUS_DELETE]})`))
              .onIn('_ut.status', [TASK_STATUS_NEW, TASK_STATUS_INPROGRESS])
          })
          .leftJoin({ _tsi: 'tasks' }, function () {
            this.on('estates.id', '_tsi.estate_id').on('_tsi.status', TASK_STATUS_INPROGRESS)
          })
          .leftJoin({ _ect: 'estate_current_tenants' }, function () {
            this.on('_ect.estate_id', 'estates.id').on('_ect.status', STATUS_ACTIVE)
          })
          .where('estates.user_id', user_id)
          .where('estates.letting_type', LETTING_TYPE_LET)
          .whereNot('estates.status', STATUS_DELETE)
          .groupBy('estates.id', '_ect.id')
          .fetch()
      ).rows || []

    let urgency_count = 0
    let in_progress_count = 0
    let not_connected_count = 0
    let pending_count = 0
    let unread_count = 0
    let connected_count = 0

    quickActions.map((estate) => {
      urgency_count += parseInt(estate.urgency_count) || 0
      in_progress_count += parseInt(estate.in_progress_count) || 0
      unread_count += parseInt(estate.unread_count) || 0

      if (!estate.user_id) {
        if (
          estate.code != null &&
          moment.utc(estate.invite_sent_at).format('X') >=
            moment.utc(new Date()).subtract(TENANT_INVITATION_EXPIRATION_DATE, 'days').format('X')
        ) {
          pending_count++
        } else {
          not_connected_count++
        }
      } else {
        connected_count++
      }
    })

    return {
      urgency_count,
      in_progress_count,
      not_connected_count,
      pending_count,
      unread_count,
      connected_count,
    }
  }

  static async getTotalLetCount(user_id, params, filtering = true) {
    let query = Estate.query()
      .count('estates.*')
      .leftJoin('tasks', function () {
        this.on('estates.id', 'tasks.estate_id').on(
          Database.raw(`tasks.status not in (${[TASK_STATUS_DRAFT, TASK_STATUS_DELETE]})`)
        )
      })
      .leftJoin({ _ect: 'estate_current_tenants' }, function () {
        this.on('_ect.estate_id', 'estates.id').on('_ect.status', STATUS_ACTIVE)
      })
      .leftJoin({ _u: 'users' }, function () {
        this.on('_ect.user_id', '_u.id')
      })
      .where('estates.user_id', user_id)
      .where('estates.letting_type', LETTING_TYPE_LET)
      .whereNot('estates.status', STATUS_DELETE)

    if (!filtering) {
      query.groupBy('estates.id')
      return await query
    }
    const filter = new TaskFilters(params, query)
    query.groupBy('estates.id')
    filter.afterQuery()

    return await query
  }

  static async getLatestEstates(limit = 5) {
    return (
      await this.getQuery()
        .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
        .select('id', 'city', 'cover')
        .orderBy('created_at', 'desc')
        .paginate(1, limit)
    ).rows
  }

  static async rented(estateId, trx) {
    // Make estate status DRAFT to hide from tenants' matches list
    await Database.table('estates')
      .where({ id: estateId })
      .update({
        status: STATUS_DRAFT,
        letting_type: LETTING_TYPE_LET,
        letting_status: LETTING_STATUS_STANDARD,
        publish_status: PUBLISH_STATUS_INIT,
      })
      .transacting(trx)
  }

  static async rentable(estateId, fromInvitation) {
    const estate = await Estate.query().where('id', estateId).firstOrFail()

    if (
      !fromInvitation &&
      (estate.letting_type === LETTING_TYPE_LET ||
        ![STATUS_ACTIVE, STATUS_EXPIRE].includes(estate.status))
    ) {
      throw new Error(
        "You can't rent this property because this property already has been delete or rented by someone else"
      )
    }
    return estate
  }

  static async notAvailable(estate_ids, trx = null) {
    const query = Estate.query()
      .whereIn('id', Array.isArray(estate_ids) ? estate_ids : [estate_ids])
      .whereNot('status', STATUS_DELETE)
      .update({ letting_type: LETTING_TYPE_NA, letting_status: LETTING_STATUS_NEW_RENOVATED })

    if (!trx) {
      return await query
    }
    return await query.transacting(trx)
  }

  static async unrented(estate_ids, trx = null) {
    let query = Estate.query()
      .whereIn('id', Array.isArray(estate_ids) ? estate_ids : [estate_ids])
      .whereNot('status', STATUS_DELETE)
      .where('letting_type', LETTING_TYPE_LET)
      .update({ letting_type: LETTING_TYPE_VOID })

    if (!trx) {
      return await query
    }
    return await query.transacting(trx)
  }

  static checkCanChangeLettingStatus(result, option = {}) {
    const resultObject = result.toJSON(option)

    if (resultObject.data) {
      result = resultObject.data
    } else if (resultObject) {
      result = resultObject
    } else {
      result = []
    }
    return result.map((estate) => {
      const isMatchCountValidToChangeLettingType =
        0 + parseInt(estate.__meta__.visits_count) ||
        0 + parseInt(estate.__meta__.knocked_count) ||
        0 + parseInt(estate.__meta__.decided_count) ||
        0 + parseInt(estate.__meta__.invite_count) ||
        0 + parseInt(estate.__meta__.final_count) ||
        0

      return {
        ...estate,
        canChangeLettingType:
          isMatchCountValidToChangeLettingType || estate.current_tenant ? false : true,
      }
    })
  }

  static async hasEstate(user_id) {
    const estate = await Estate.query()
      .select('id')
      .where('user_id', user_id)
      .whereNot('status', STATUS_DELETE)
      .first()

    if (!estate) {
      return false
    }
    return true
  }

  static async getEstateByAddress({ email, address }) {
    if (!email || !address) {
      return null
    }

    const estates =
      (
        await Estate.query()
          .innerJoin({ _u: 'users' }, function () {
            this.on('_u.user_id', 'estates.id').on('status', STATUS_ACTIVE).on('_u.email', email)
          })
          .whereNot('status', STATUS_DELETE)
          .where('address', address)
          .fetch()
      ).rows || []

    return estates
  }

  static async importOpenimmo(importFile, user_id) {
    const filename = importFile.clientName
    const reader = new OpenImmoReader(importFile.tmpPath, importFile.headers['content-type'])
    const trx = await Database.beginTransaction()
    try {
      const result = await reader.process()
      await Promise.map(result, async (property) => {
        property.user_id = user_id
        property.status = STATUS_DRAFT
        let images = property.images
        let result
        const existingProperty = await Estate.query()
          .where({ property_id: property.property_id, user_id })
          .whereNot({ status: STATUS_DELETE })
          .first()
        if (existingProperty) {
          existingProperty.merge(omit(property, ['images']))
          result = await this.updateEstate(
            { data: { ...omit(property, ['images']), id: existingProperty.id }, user_id },
            trx
          )
          QueueService.uploadOpenImmoImages(images, existingProperty.id)
        } else {
          result = await this.createEstate(
            { data: omit(property, ['images']), userId: user_id },
            false,
            trx
          )
          QueueService.uploadOpenImmoImages(images, result.id)
        }
      })
      await Import.createItem({
        user_id,
        filename,
        type: IMPORT_TYPE_OPENIMMO,
        entity: IMPORT_ENTITY_ESTATES,
      })
      await trx.commit()
      return result
    } catch (err) {
      await trx.rollback()
      console.log(err)
      throw new HttpException(err.message)
    }
  }

  static async deletePermanent(user_id) {
    await Estate.query().where('user_id', user_id).delete()
  }

  static emitValidAddress({ id, user_id, coord, address }) {
    WebSocket.publishToLandlord({
      event: WEBSOCKET_EVENT_VALID_ADDRESS,
      userId: user_id,
      data: {
        id,
        coord,
        address,
      },
    })
  }

  static async getFilesByEstateId(estateId) {
    const File = use('App/Models/File')
    const files = await File.query().where('estate_id', estateId).fetch()
    let typeAssigned = {
      external: ['external'],
      documents: ['plan', 'energy_certificate', 'custom', 'doc'],
      unassigned: ['unassigned'],
    }
    let ret = {
      external: [],
      documents: { plan: [], energy_certificate: [], custom: [] },
      unassigned: [],
    }
    //return files
    files.toJSON().map((file) => {
      if (typeAssigned[file.type]?.includes(file.type)) {
        ret[file.type] = [...ret[file.type], file]
      } else if (typeAssigned.documents.includes(file.type)) {
        ret.documents[file.type] = [...ret.documents[file.type], file]
      }
    })
    return ret
  }

  static calculatePercent(estate) {
    delete estate.verified_address
    delete estate.construction_year
    delete estate.cover_thumb
    let percent = 0
    const is_let = estate.letting_type === LETTING_TYPE_LET ? true : false
    const let_type = is_let ? LETTING_TYPE_LET : LETTING_TYPE_VOID

    const GENERAL_PERCENT_VAL = is_let ? GENERAL_PERCENT.let : GENERAL_PERCENT.void

    const LEASE_CONTRACT_PERCENT_VAL = is_let
      ? LEASE_CONTRACT_PERCENT.let
      : LEASE_CONTRACT_PERCENT.void

    const PROPERTY_DETAILS_PERCENT_VAL = is_let
      ? PROPERTY_DETAILS_PERCENT.let
      : PROPERTY_DETAILS_PERCENT.void

    const TENANT_PREFERENCES_PERCENT_VAL = is_let
      ? TENANT_PREFERENCES_PERCENT.let
      : TENANT_PREFERENCES_PERCENT.void

    const VISIT_SLOT_PERCENT_VAL = is_let ? VISIT_SLOT_PERCENT.let : VISIT_SLOT_PERCENT.void

    const IMAGE_DOC_PERCENT_VAL = is_let ? IMAGE_DOC_PERCENT.let : IMAGE_DOC_PERCENT.void

    const general = ESTATE_PERCENTAGE_VARIABLE.genenral.filter((g) =>
      g.mandatory.includes(let_type)
    )
    general.length &&
      general
        .filter((g) => !g.is_custom)
        .map(({ key }) => {
          percent += estate[key] ? GENERAL_PERCENT_VAL / general.length : 0
        })
    const lease_price = ESTATE_PERCENTAGE_VARIABLE.lease_price.filter((g) =>
      g.mandatory.includes(let_type)
    )
    lease_price.length &&
      lease_price
        .filter((l) => !l.is_custom)
        .map(({ key }) => {
          percent += estate[key] ? LEASE_CONTRACT_PERCENT_VAL / lease_price.length : 0
        })

    const property_detail = ESTATE_PERCENTAGE_VARIABLE.property_detail.filter((g) =>
      g.mandatory.includes(let_type)
    )
    property_detail.length &&
      property_detail
        .filter((p) => !p.is_custom)
        .map(({ key }) => {
          percent += estate[key] ? PROPERTY_DETAILS_PERCENT_VAL / property_detail.length : 0
        })

    if (estate['amenities'] && estate['amenities'].length) {
      percent += PROPERTY_DETAILS_PERCENT_VAL / property_detail.length
    }

    const tenant_preference = ESTATE_PERCENTAGE_VARIABLE.tenant_preference.filter((g) =>
      g.mandatory.includes(let_type)
    )
    tenant_preference.length &&
      tenant_preference
        .filter((t) => !t.is_custom)
        .map(({ key }) => {
          percent += estate[key] ? TENANT_PREFERENCES_PERCENT_VAL / tenant_preference.length : 0
        })

    let visit_slots = ESTATE_PERCENTAGE_VARIABLE.visit_slots.filter((g) =>
      g.mandatory.includes(let_type)
    )

    visit_slots.length &&
      visit_slots
        .filter((v) => !v.is_custom)
        .map(({ key }) => {
          percent += estate[key] ? VISIT_SLOT_PERCENT_VAL / visit_slots.length : 0
        })

    if (
      visit_slots.length &&
      !is_let &&
      estate.slots &&
      estate.slots.length &&
      estate.slots.find((slot) => slot.start_at >= moment.utc(new Date()).format(DATE_FORMAT))
    ) {
      percent += VISIT_SLOT_PERCENT_VAL / visit_slots.length
    }
    let views = ESTATE_PERCENTAGE_VARIABLE.views.filter((g) => g.mandatory.includes(let_type))

    views.length &&
      views
        .filter((v) => !v.is_custom)
        .map(({ key }) => {
          percent += estate[key] ? IMAGE_DOC_PERCENT_VAL / views.length : 0
        })

    if (views.length) {
      percent += sum((estate?.rooms || []).map((room) => room?.images?.length || 0))
        ? IMAGE_DOC_PERCENT_VAL / views.length
        : 0
      percent += (estate?.files || []).find((f) => f.type === FILE_TYPE_PLAN)
        ? IMAGE_DOC_PERCENT_VAL / views.length
        : 0
      percent += (estate?.files || []).find((f) => f.type === FILE_TYPE_EXTERNAL)
        ? IMAGE_DOC_PERCENT_VAL / views.length
        : 0
    }

    return Math.ceil(percent)
  }

  static async updatePercentAndIsPublished(
    {
      estate,
      estate_id,
      slots = null,
      files = null,
      amenities = null,
      deleted_slots_ids = null,
      deleted_files_ids = null,
    },
    trx = null
  ) {
    if (!estate && !estate_id) {
      return
    }

    if (!estate) {
      estate = await this.getByIdWithDetail(estate_id)
    }

    if (!estate) {
      return
    }
    delete estate.verified_address
    delete estate.construction_year
    delete estate.cover_thumb

    let percentData = {
      ...estate.toJSON({ extraFields: ['verified_address', 'construction_year', 'cover_thumb'] }),
    }

    if (slots) {
      percentData.slots = (percentData.slots || []).concat(slots)
    }
    if (files) {
      percentData.files = (percentData.files || []).concat(files)
    }

    if (amenities) {
      percentData.amenities = (percentData.amenities || []).concat(amenities)
    }

    if (deleted_slots_ids) {
      percentData.slots = (percentData.slots || []).filter(
        (slot) => !deleted_slots_ids.includes(slot.id)
      )
    }

    if (deleted_files_ids) {
      percentData.files = (percentData.files || []).filter(
        (file) => !deleted_files_ids.includes(file.id)
      )
    }

    const isAvailablePublish = this.isAllInfoAvailable(estate.toJSON())

    const percent = this.calculatePercent(percentData)
    if (trx) {
      await Estate.query()
        .where('id', estate.id)
        .update({ percent, can_publish: isAvailablePublish })
        .transacting(trx)
    } else {
      await Estate.query()
        .where('id', estate.id)
        .update({ percent, can_publish: isAvailablePublish })
    }
    if (this.calculatePercent(percentData) >= ESTATE_COMPLETENESS_BREAKPOINT) {
      QueueService.sendEmailToSupportForLandlordUpdate({
        type: COMPLETE_CERTAIN_PERCENT,
        landlordId: estate.user_id,
        estateIds: [estate.id],
      })
    }

    estate = {
      ...estate,
      percent,
      can_publish: isAvailablePublish,
    }
    if (estate?.build_id) {
      await BuildingService.updateCanPublish(
        {
          user_id: estate.user_id,
          build_id: estate.build_id,
          estate,
        },
        trx
      )
    }

    return estate
  }

  static getBasicPropertyId(property_id = '') {
    const property_id_list = property_id?.split('-') || [property_id]
    return property_id_list[0]
    // if (!isNaN(property_id_list[property_id_list.length - 1])) {
    //   property_id_list.splice(property_id_list.length - 1, 1)
    // }

    // return property_id_list.join('')
  }

  static async getTenantBuildingEstates({ user_id, build_id, is_social = false }) {
    const estates = (
      await EstateService.getTenantAllEstates({ userId: user_id, build_id, page: -1, limit: -1 })
    ).toJSON()

    const categories = uniq(
      estates.map((estate) => EstateService.getBasicPropertyId(estate.property_id))
    )

    // const regex = /-\d+/

    const yAxisKey = is_social ? `cert_category` : `floor`
    const yAxisEstates = is_social
      ? groupBy(
          estates.filter((estate) => estate.cert_category),
          (estate) => estate.cert_category
        )
      : groupBy(
          estates.filter((estate) => estate.floor),
          (estate) => estate.floor
        )

    let buildingEstates = {}
    Object.keys(yAxisEstates).forEach((axis) => {
      let categoryEstates = {}
      categories.forEach((category) => {
        categoryEstates[category] = estates.filter(
          (estate) =>
            estate[yAxisKey].toString() === axis.toString() && estate.property_id.includes(category)
        )
      })
      buildingEstates[axis] = categoryEstates
    })

    return buildingEstates
  }

  static async getTenantEstates({ user_id, page, limit }) {
    let estates = []
    let totalCount = 0
    const insideNewMatchesCount = await require('./MatchService').getNewMatchCount(user_id)
    const outsideNewMatchesCount = await require('./ThirdPartyOfferService').getNewMatchCount(
      user_id
    )
    totalCount = parseInt(insideNewMatchesCount) + parseInt(outsideNewMatchesCount)
    let enoughOfInsideMatch = false
    const offsetCount = insideNewMatchesCount % limit
    const insidePage = Math.ceil(insideNewMatchesCount / limit) || 1
    if ((page - 1) * limit < insideNewMatchesCount) {
      estates = await EstateService.getTenantAllEstates({ userId: user_id, page, limit })
      estates = await Promise.all(
        estates.rows.map(async (estate) => {
          estate = estate.toJSON({ isShort: false, role: ROLE_USER })
          estate.isoline = await EstateService.getIsolines(estate)
          return estate
        })
      )
      if (estates.length >= limit) {
        enoughOfInsideMatch = true
      }
    }

    if (!enoughOfInsideMatch) {
      let from = (page - insidePage) * limit - offsetCount
      if (from < 0) from = 0
      const to = (page - insidePage) * limit - offsetCount < 0 ? limit - offsetCount : limit
      const thirdPartyOffers = await require('./ThirdPartyOfferService').getMatches(
        user_id,
        from,
        to
      )
      estates = [...estates, ...thirdPartyOffers]
    }

    return {
      estates,
      page,
      limit,
      count: totalCount,
    }
  }

  static async correctWrongEstates(user_id) {
    try {
      const estates =
        (
          await Estate.query()
            .select('id')
            .where('user_id', user_id)
            .whereNot('status', STATUS_DELETE)
            .whereNull('six_char_code')
            .fetch()
        ).toJSON() || []

      await Promise.map(
        estates,
        async (estate) => {
          await Estate.updateBreezeId(estate.id)
        },
        { concurrency: 1 }
      )
    } catch (e) {
      Logger.error(`${user_id} correctWrongEstates error `, e.message)
    }
  }

  static async getCities(user_id) {
    return await Estate.query()
      .select('country', 'city')
      .whereNot('status', STATUS_DELETE)
      .where('user_id', user_id)
      .whereNotNull('city')
      .groupBy('city', 'country')
      .orderBy('country', 'city')
      .fetch()
  }

  /**
   *
   * @param {*} user_id : prospect Id
   */
  static async getPendingFinalMatchEstate(user_id) {
    const inviteOutsideLanlordTasks = await Task.query()
      .select(Database.raw(`${MATCH_STATUS_FINISH} as status`))
      .select(Database.raw(`id as task_id`))
      .select(Database.raw(`null as id`))
      .select('property_address as address')
      .select('address_detail as floor')
      .whereNotIn('status', [TASK_STATUS_DELETE, TASK_STATUS_DRAFT])
      .whereNotNull('email')
      .where('tenant_id', user_id)
      .whereNull('estate_id')
      .fetch()

    if (inviteOutsideLanlordTasks) {
      return inviteOutsideLanlordTasks.toJSON()
    }
    return []
  }

  static async searchNotConnectedAddressByPropertyId({ user_id, property_id }) {
    if (!property_id) {
      property_id = ''
    }
    property_id = trim(property_id)
    return (
      await this.getActiveEstateQuery()
        .select('estates.*')
        .innerJoin({ _ect: 'estate_current_tenants' }, function () {
          this.on('_ect.estate_id', 'estates.id').on(Database.raw(` _ect.user_id is NULL`))
        })
        .where('estates.letting_type', LETTING_TYPE_LET)
        .where('estates.user_id', user_id)
        .where('estates.property_id', 'ilike', `%${property_id}%`)
        .fetch()
    ).toJSON()
  }

  static async getLikedButNotKnockedExpiringEstates() {
    let oneDayBeforeExpiredDate = moment.utc(new Date(), DAY_FORMAT, true).format(DAY_FORMAT)
    oneDayBeforeExpiredDate = moment
      .utc(oneDayBeforeExpiredDate + ` 23:59:59`)
      .add(1, 'days')
      .format(DATE_FORMAT)

    return (
      await Estate.query()
        .select('_l.estate_id', '_l.user_id', 'estates.address', 'estates.cover')
        .where('estates.status', STATUS_ACTIVE)
        .where('available_end_at', '<', oneDayBeforeExpiredDate)
        .innerJoin({ _l: 'likes' }, function () {
          this.on('_l.estate_id', 'estates.id')
        })
        .leftJoin({ _m: 'matches' }, function () {
          this.on('_m.estate_id', 'estates.id')
        })
        .where(function () {
          this.orWhere('_m.status', MATCH_STATUS_NEW).orWhereNull('_m.status')
        })
        .fetch()
    ).toJSON()
  }

  static async isPublished(id) {
    const estate = await this.getQuery({ status: STATUS_ACTIVE, id }).first()
    return !!estate
  }

  static async createShareLink(user_id, id) {
    const estate = await this.getActiveEstateQuery()
      .where('id', id)
      .where('user_id', user_id)
      .first()
    if (!estate) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }

    if (estate.share_link) {
      return estate.share_link
    }

    return await Estate.updateHashInfo(id)
  }

  static async countDuplicateProperty(property_id) {
    const estateCount = await Estate.query()
      .where('property_id', 'ilike', `${property_id}-%`)
      .whereNot('status', STATUS_DELETE)
      .count('*')
    if (estateCount?.length) {
      return parseInt(estateCount[0].count)
    }
    return 0
  }

  static async publishRequestedProperty(id) {
    return await Estate.query()
      .select('estates.*')
      .select('estates.id as estate_id')
      .select('users.*')
      .innerJoin('users', 'users.id', 'estates.user_id')
      .where('estates.id', id)
      .whereIn('estates.status', [STATUS_EXPIRE, STATUS_DRAFT])
      .where('publish_status', PUBLISH_STATUS_BY_LANDLORD)
      .first()
  }

  static async duplicateEstate(user_id, estate_id) {
    const estate = await this.getByIdWithDetail(estate_id)
    if (estate?.user_id !== user_id) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }

    const property_id = this.getBasicPropertyId(estate.property_id)
    const duplicatedCount = await this.countDuplicateProperty(property_id)
    const trx = await Database.beginTransaction()
    try {
      const originalEstateData = estate.toJSON()

      const estateData = {
        ...omit(originalEstateData, [
          'id',
          'rooms',
          'files',
          'amenities',
          'slots',
          'cover_thumb',
          'verified_address',
          'created_at',
          'updated_at',
        ]),
        property_id: `${property_id}-${duplicatedCount + 1}`,
        status: STATUS_DRAFT,
        publish_status: PUBLISH_STATUS_INIT,
        hash: null,
        shared_link: null,
        six_char_code: null,
        repair_needed: false,
        construction_year: originalEstateData?.construction_year
          ? `${originalEstateData?.construction_year}-01-01`
          : null,
      }

      const newEstate = await this.createEstate({ data: estateData, userId: user_id }, false, trx)
      await Promise.map(
        originalEstateData.rooms || [],
        async (room) => {
          const newRoom = await RoomService.createRoom(
            {
              estate_id: newEstate.id,
              roomData: omit(room, ['id', 'estate_id', 'images', 'created_at', 'updated_at']),
            },
            trx
          )
          const newImages = room.images.map((image) => ({
            ...omit(image, ['id', 'relativeUrl', 'thumb']),
            url: image.relativeUrl,
            room_id: newRoom.id,
          }))
          await RoomService.addManyImages(newImages, trx)
        },
        { concurrency: 1 }
      )

      const newFiles = (originalEstateData.files || []).map((file) => ({
        ...omit(file, ['id', 'relativeUrl', 'thumb']),
        url: file.relativeUrl,
        estate_id: newEstate.id,
      }))
      await this.addManyFiles(newFiles, trx)

      const newAmenities = (originalEstateData.amenities || []).map((amenity) => ({
        ...omit(amenity, ['room_id', 'id', 'option']),
        estate_id: newEstate.id,
      }))

      await Amenity.createMany(newAmenities, trx)

      await trx.commit()
      const estates = await require('./EstateService').getEstatesByUserId({
        limit: 1,
        from: 0,
        params: { id: newEstate.id },
      })
      return estates.data?.[0]
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400, e.code || 0)
    }
  }

  static async updateSentNotification(estate, notification_id) {
    const notify_sent = (estate.notify_sent || []).concat([notification_id])
    await Estate.query().where('id', estate.id).update({ notify_sent })
  }

  static async getEstatePendingKnockRequestCount({ user_id, excludeIds }) {
    let query = Estate.query()
      .innerJoin({ _ect: 'estate_sync_contact_requests' }, function () {
        this.on('estates.id', '_ect.estate_id').onIn('_ect.status', [
          STATUS_DRAFT,
          STATUS_EMAIL_VERIFY,
        ])
      })
      .whereIn('estates.status', [STATUS_ACTIVE, STATUS_EXPIRE])
      .where('estates.user_id', user_id)
    if (excludeIds?.length) {
      query.whereNotIn('estates.id', excludeIds)
    }
    return (await query.select('estates.id').groupBy('estates.id').fetch()).toJSON()?.length || 0
  }

  static async getTenantEstate({ id, user_id, role }) {
    let estate = await this.getEstateWithDetails({
      id,
      user_id: user_id ?? null,
      role: role ?? null,
    })

    if (!estate) {
      throw new HttpException('Invalid estate', 404)
    }

    estate.isoline = await this.getIsolines(estate)
    estate = estate.toJSON({
      isShort: true,
      role: role ?? null,
      extraFields: ['landlord_type', 'hash', 'property_type'],
    })

    let match
    if (user_id && role === ROLE_USER) {
      match = await require('./MatchService').getMatches(user_id, id)
    }

    estate = {
      ...estate,
      match: match?.prospect_score,
    }

    estate = await EstateService.assignEstateAmenities(estate)
    return estate
  }

  static async noBuildEstateCount({ user_id, params }) {
    let query = Estate.query()
      .whereNot('status', STATUS_DELETE)
      .where('estates.user_id', user_id)
      .whereNull('build_id')

    const Filter = new EstateFilters(params, query)
    query = Filter.process()
    return parseInt((await query.count())?.[0]?.count || 0)
  }

  static async buildEstateCount({ user_id, params }) {
    let query = Estate.query()
      .whereNot('status', STATUS_DELETE)
      .where('estates.user_id', user_id)
      .whereNotNull('build_id')

    const Filter = new EstateFilters(params, query)
    query = Filter.process()
    query.groupBy('build_id')
    return (await query.count())?.length
  }

  static async getMatchEstates({ user_id, params, limit, page }) {
    const buildEstateCount = await EstateService.buildEstateCount({ user_id, params })
    const noBuildEstateCount = await EstateService.noBuildEstateCount({
      user_id,
      params,
    })

    const total = buildEstateCount + noBuildEstateCount
    const buildEstatePage = Math.ceil(buildEstateCount / limit) || 1

    const buildEstates = await require('./BuildingService').getMatchBuilding({
      user_id,
      limit,
      from: (page - 1) * limit,
      params,
    })

    let estates = buildEstates

    if (page && limit) {
      if (buildEstateCount < page * limit) {
        const offsetCount = buildEstateCount % limit
        let from = (page - buildEstatePage) * limit - offsetCount
        if (from < 0) from = 0
        const to = (page - buildEstatePage) * limit - offsetCount < 0 ? limit - offsetCount : limit

        let result = await EstateService.getEstatesByUserId({
          user_ids: [user_id],
          limit: to,
          from,
          params: {
            ...(params || {}),
            is_no_build: true,
          },
        })
        estates = [...estates, ...(result?.data || [])]
      }
    } else {
      let result = await EstateService.getEstatesByUserId({
        user_ids: [user_id],
        params: {
          ...(params || {}),
          is_no_build: true,
        },
      })

      estates = [...estates, ...(result?.data || [])]
    }

    return {
      pages: {
        total,
        lastPage: Math.ceil(total / limit) || 1,
        page,
        perPage: limit,
      },
      estates,
    }
  }

  static isDocumentsUploaded(estateDetails) {
    const { files, rooms } = estateDetails ?? {}
    // const floorPlans = files?.filter(({ type }) => type === DOCUMENT_VIEW_TYPES.PLAN)
    const externalView = (files ?? []).filter(({ type }) => type === FILE_TYPE_EXTERNAL)
    const insideView = (rooms ?? []).filter(({ images }) => images?.length || false)
    Logger.info(`isDocumentsUpload= ${externalView?.length && insideView.length}`)
    return externalView?.length && insideView.length
  }

  static isTenantPreferenceUpdated(estateDetails) {
    const { rent_arrears, budget, credit_score, min_age, max_age, family_size_max } =
      estateDetails ?? {}
    const tenantPreferenceObject = {
      budget,
      min_age,
      max_age,
      credit_score,
      rent_arrears,
      family_size_max,
    }
    Logger.info(`isTenantPreferenceUpdated= ${checkIfIsValid(tenantPreferenceObject)}`)
    return checkIfIsValid(tenantPreferenceObject)
  }

  static isLocationRentUnitUpdated(estateDetails) {
    const {
      zip,
      city,
      area,
      floor,
      coord,
      coord_raw,
      street,
      firing,
      country,
      deposit,
      apt_type,
      net_rent,
      house_type,
      rent_end_at,
      house_number,
      // extra_costs, // Optional for publishing
      rooms_number,
      heating_type,
      number_floors,
      property_type,
      building_status,
      construction_year,
      energy_efficiency,
      deposit_multiplier,
    } = estateDetails ?? {}

    let locationObject
    const depositCheck = deposit_multiplier || Math.round(+deposit / +net_rent)
    if (!rent_end_at) {
      // when no contract end, below things are mandatory to publish
      locationObject = {
        zip,
        city,
        area,
        floor,
        coord: coord || coord_raw,
        street,
        firing,
        country,
        apt_type,
        net_rent,
        house_type,
        house_number,
        rooms_number,
        depositCheck,
        heating_type,
        number_floors,
        property_type,
        building_status,
        construction_year,
        energy_efficiency,
      }
    } else {
      // when contract end is added, below things are mandatory to publish
      locationObject = {
        zip,
        city,
        area,
        floor,
        coord: coord || coord_raw,
        street,
        country,
        net_rent,
        house_number,
        depositCheck,
        rooms_number,
        property_type,
      }
    }
    Logger.info(`isLocationRentUnitUpdated= ${checkIfIsValid(locationObject)}`)
    return checkIfIsValid(locationObject)
  }

  static isAllInfoAvailable(estate) {
    return (
      this.isDocumentsUploaded(estate) &&
      this.isLocationRentUnitUpdated(estate) &&
      this.isTenantPreferenceUpdated(estate)
    )
  }

  //TODO: need to fill out room images/floor plan for the units in the same category
  static async fillOutUnit() {}

  static async publishBuilding({ user_id, publishers, build_id, estate_ids }) {
    const estates = await this.getEstatesByBuilding({ user_id, build_id })

    const can_publish = estates.every((estate) => estate.can_publish)
    if (!can_publish) {
      throw new HttpException(ERROR_PUBLISH_BUILDING, 400, ERROR_PUBLISH_BUILDING_CODE)
    }

    const categories =
      uniq(estates.map((estate) => this.getBasicPropertyId(estate.property_id))) || []
    let categoryEstates = {}

    categories.forEach((category) => {
      categoryEstates[category] = estates.filter((estate) =>
        (estate.property_id ?? '').includes(category)
      )
    })

    let notAvailableCategories = []
    let availableCategories = []

    if (publishers?.length) {
      categories.forEach((category) => {
        if (categoryEstates[category]?.length) {
          const estate = categoryEstates[category][0]
          estate.to_market = true
        }
      })
    }

    const trx = await Database.beginTransaction()
    try {
      await BuildingService.updatePublishedMarketPlaceEstateIds(
        {
          id: build_id,
          user_id,
          published: PUBLISH_STATUS_BY_LANDLORD,
          marketplace_estate_ids: availableCategories,
        },
        trx
      )

      await Promise.map(estates, async (estate) => {
        await EstateService.publishEstate(
          {
            estate,
            publishers,
            performed_by: user_id,
          },
          trx
        )
      })

      await trx.commit()
    } catch (e) {
      Logger.error(`Publish building failed ${e.message}`)
      await trx.rollback()
      throw new HttpException(e.message, 400, e.code || 0)
    }

    //TODO: publish estates here
  }

  static async getEstatesByBuilding({ user_id, build_id }) {
    return (
      await Estate.query()
        .where('user_id', user_id)
        .where('build_id', build_id)
        .whereNot('status', STATUS_DELETE)
        .fetch()
    ).toJSON()
  }

  static async unpublishBuilding({ user_id, build_id }) {
    const estates = await this.getEstatesByBuilding({ user_id, build_id })

    if (!estates?.length) {
      return true
    }

    const trx = await Database.beginTransaction()
    try {
      await BuildingService.updatePublishedMarketPlaceEstateIds(
        {
          id: build_id,
          user_id,
          published: PUBLISH_STATUS_INIT,
          marketplace_estate_ids: null,
        },
        trx
      )

      await Estate.query()
        .where('build_id', build_id)
        .update({
          status: STATUS_EXPIRE,
          publish_status: PUBLISH_STATUS_INIT,
        })
        .transacting(trx)
      if (estates?.length) {
        await this.handleOffline(
          { build_id, estates, event: WEBSOCKET_EVENT_ESTATE_UNPUBLISHED },
          trx
        )
      }

      await trx.commit()
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400, e.code || 0)
    }
  }

  static async deactivateBuilding({ user_id, build_id }) {
    const estates = await this.getEstatesByBuilding({ user_id, build_id })
    if (!estates?.length) {
      return true
    }

    const trx = await Database.beginTransaction()
    try {
      await Estate.query()
        .where('user_id', user_id)
        .where('build_id', build_id)
        .update({
          status: STATUS_DRAFT,
          publish_status: PUBLISH_STATUS_INIT,
        })
        .transacting(trx)

      //TODO: need to confirm....
      await this.deleteMatchInfo({ estate_id: estates.map((e) => e.id) }, trx)
      await this.handleOffline(
        { build_id, estates, event: WEBSOCKET_EVENT_ESTATE_DEACTIVATED },
        trx
      )
      await trx.commit()
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400, e.code || 0)
    }
  }

  static async updateVacantDate() {
    await Estate.query()
      .where('status', STATUS_ACTIVE)
      .where('publish_status', PUBLISH_STATUS_APPROVED_BY_ADMIN)
      .where('vacant_date', '<=', moment.utc(new Date()).format(DAY_FORMAT))
      .update({ vacant_date: moment.utc(new Date()).format(DAY_FORMAT) })
  }
}
module.exports = EstateService
