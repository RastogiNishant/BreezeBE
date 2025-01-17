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
  uniq
} = require('lodash')
const { props, Promise } = require('bluebird')
const Database = use('Database')
const Event = use('Event')
const Logger = use('Logger')
const GeoService = use('App/Services/GeoService')
const CompanyService = use('App/Services/CompanyService')
const NoticeService = use('App/Services/NoticeService')
const RoomService = use('App/Services/RoomService')
const MailService = use('App/Services/MailService')
const QueueService = use('App/Services/QueueService')
const WebSocket = use('App/Classes/Websocket')
const User = use('App/Models/User')
const Estate = use('App/Models/Estate')
const Match = use('App/Models/Match')
const Visit = use('App/Models/Visit')
const Task = use('App/Models/Task')
const Room = use('App/Models/Room')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const File = use('App/Models/File')
const Building = use('App/Models/Building')
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
  FLOOR_INTERVAL_COUNT,
  MAX_RENT_COUNT,
  MAX_FLOOR_COUNT,
  FURNISHED_GERMAN_NAME,
  PUBLISH_TYPE_ONLINE_MARKET,
  MAXIMUM_EXPIRE_PERIOD,
  MATCH_STATUS_KNOCK,
  ACTIVE_VISUALS_BY_AREA,
  ACTIVE_VISUALS_BY_BULK_UPLOAD
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
    BUILD_UNIT_CAN_NOT_PUBLISH_SEPRATELY
  },
  exceptionCodes: {
    ERROR_PROPERTY_AREADY_PUBLISHED_CODE,
    ERROR_PROPERTY_AVAILABLE_DURATION_CODE,
    ERROR_PROPERTY_UNDER_REVIEW_CODE,
    ERROR_PROPERTY_INVALID_STATUS_CODE,
    ERROR_PROPERTY_NOT_PUBLISHED_CODE,
    ERROR_PUBLISH_BUILDING_CODE,
    ERROR_SEPARATE_PUBLISH_UNIT_BUILDING_CODE
  }
} = require('../../app/exceptions')

const HttpException = use('App/Exceptions/HttpException')
const EstateFilters = require('../Classes/EstateFilters')
const BuildingService = require('./BuildingService')
const UnitCategoryService = require('./UnitCategoryService')

const MAX_DIST = 10000

const ESTATE_PERCENTAGE_VARIABLE = {
  general: [
    {
      key: 'address',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    },
    {
      key: 'property_type',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    },
    {
      key: 'area',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
      isNumber: true
    },
    {
      key: 'rooms_number',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
      isNumber: true
    },
    {
      key: 'floor',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
      zeroIsValid: true
    },
    {
      key: 'floor_direction',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    }
  ],
  lease_price: [
    {
      key: 'net_rent',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
      isNumber: true
    },
    {
      key: 'deposit',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
      isNumber: true
    },
    {
      key: 'parking_space',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
      zeroIsValid: true
    },
    {
      key: 'extra_costs',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
      isNumber: true
    },
    {
      key: 'heating_costs',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
      isNumber: true
    }
  ],
  property_detail: [
    {
      key: 'construction_year',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    },
    {
      key: 'house_type',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    },
    {
      key: 'building_status',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    },
    {
      key: 'apt_type',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    },
    {
      key: 'heating_type',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    },
    {
      key: 'energy_efficiency',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    },
    {
      key: 'firing',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    }
  ],
  tenant_preference: [
    {
      key: 'min_age',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    },
    {
      key: 'max_age',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    },
    /* {
      key: 'household_type',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    }, */
    {
      key: 'minors',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
      isBoolean: true
    },
    {
      key: 'pets_allowed',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    },
    {
      key: 'is_new_tenant_transfer',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
      isBoolean: true
    },
    {
      key: 'budget',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
      isNumber: true
    },
    {
      key: 'credit_history_status',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
      isNumber: true
    },
    {
      key: 'rent_arrears',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false,
      isBoolean: true
    },
    {
      key: 'income_sources',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    }
  ],
  visit_slots: [
    {
      key: 'available_start_at',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    },
    {
      key: 'available_end_at',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    },
    {
      key: 'slot',
      mandatory: [LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: true
    }
  ],
  views: [
    {
      key: 'inside_view',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: true
    },
    {
      key: 'outside_view',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: true
    },
    {
      key: 'floor_plan',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: true
    },
    {
      key: 'energy_proof',
      mandatory: [LETTING_TYPE_LET, LETTING_TYPE_VOID, LETTING_TYPE_NA],
      is_custom: false
    }
  ]
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
      .with('category')
      .first()
  }

  static async getEstateWithUser(id) {
    return await this.getActiveEstateQuery().where('id', id).with('user').first()
  }

  static async getEstateWithDetails({ id, user_id, role }) {
    const estateQuery = Estate.query()
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
              end as title`
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
    const amenities = await Amenity.query()
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
                  end as title
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

  static async getMatchEstate(estateId, userId) {
    const estate = await Estate.query()
      .where({ id: estateId, user_id: userId })
      .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE, STATUS_DRAFT])
      .first()
    if (!estate) {
      throw new HttpException('Estate not found', 404)
    }

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
      FileBucket.IMAGE_PDF
    ]
    try {
      const files = await FileBucket.saveRequestFiles(request, [
        { field: 'energy_proof', mime: imageMimes, isPublic: true }
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
          'rooms'
        ]),
        user_id: userId,
        property_id: propertyId,
        status: STATUS_DRAFT
      }

      if (data?.min_invite_count === 0) {
        createData.min_invite_count = null
      }

      if (data?.rent_end_at === 0) {
        createData.rent_end_at = null
      }

      if (request) {
        const files = await this.saveEnergyProof(request)

        if (files && files.energy_proof) {
          createData = {
            ...createData,
            energy_proof: files.energy_proof,
            energy_proof_original_file: files.original_energy_proof
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
          percent: this.calculatePercent(createData)
        },
        trx
      )
      // test percent
      if (+estate.percent >= ESTATE_COMPLETENESS_BREAKPOINT) {
        QueueService.sendEmailToSupportForLandlordUpdate({
          type: COMPLETE_CERTAIN_PERCENT,
          landlordId: userId,
          estateIds: [estate.id]
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
        ...estateData
      }
    } catch (e) {
      Logger.error(`Creating estate error = ${userId} e.message`)
      throw new HttpException(e.message, e.status || 400)
    }
  }

  static async updateShowRequired({ id, is_not_show = false }, trx) {
    const query = Estate.query()
      .whereIn('id', Array.isArray(id) ? id : [id])
      .update({ is_not_show })
    if (trx) {
      query.transacting(trx)
    }

    await query
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
        'status'
      ]),
      status: STATUS_DRAFT
    }

    if (data?.min_invite_count === 0) {
      updateData.min_invite_count = null
    }

    if (data?.rent_end_at === 0) {
      updateData.rent_end_at = null
    }

    let energy_proof = null
    const estate = await this.getByIdWithDetail(data.id)
    if (!estate) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }

    updateData = {
      ...estate.toJSON({
        extraFields: ['verified_address', 'cover_thumb']
      }),
      ...updateData
    }
    updateData = omit(updateData, 'category')
    const { verified_address, cover_thumb, ...omittedData } = updateData
    const insideTrx = !trx
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
            energy_proof: null
          }),
          can_publish: this.isAllInfoAvailable({
            ...omittedData,
            energy_proof: null
          })
        }
      } else {
        const files = await this.saveEnergyProof(request)
        if (files && files.energy_proof) {
          updateData = {
            ...updateData,
            percent: this.calculatePercent({
              ...omittedData
            }),
            can_publish: this.isAllInfoAvailable({
              ...omittedData
            }),

            energy_proof: files.energy_proof,
            energy_proof_original_file: files.original_energy_proof
          }
        } else {
          updateData = {
            ...updateData,
            percent: this.calculatePercent({
              ...omittedData
            }),
            can_publish: this.isAllInfoAvailable({
              ...omittedData
            })
          }
        }
      }

      updateData = { ...omit(updateData, ['category']) }
      await estate.updateItemWithTrx(updateData, trx)

      if (estate.build_id) {
        await BuildingService.updateCanPublish(
          {
            user_id: estate.user_id,
            build_id: estate.build_id,
            estate: {
              ...estate.toJSON(),
              can_publish: this.isAllInfoAvailable({
                ...omittedData
              })
            }
          },
          trx
        )
      }

      QueueService.estateSyncUnpublishEstates([estate.id], true)

      if (+updateData.percent >= ESTATE_COMPLETENESS_BREAKPOINT) {
        QueueService.sendEmailToSupportForLandlordUpdate({
          type: COMPLETE_CERTAIN_PERCENT,
          landlordId: user_id,
          estateIds: [estate.id]
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
        updateData
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

    // need to backup this energy proof to gallery to be used later
    const estate = await this.getById(estate_id)
    if (estate && estate.energy_proof) {
      await require('./GalleryService').addFromView(
        {
          user_id,
          url: estate.energy_proof,
          file_name: estate.energy_proof_original_file
        },
        trx
      )
    }

    const estateData = {
      user_id,
      energy_proof: galleries[0].url,
      energy_proof_original_file: galleries[0].file_name
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

    if (params?.isStatusSort) {
      query.orderBy(
        Database.raw(
          `case estates.publish_status when ${PUBLISH_STATUS_APPROVED_BY_ADMIN} then 1 when ${PUBLISH_STATUS_BY_LANDLORD} then 2 when ${PUBLISH_STATUS_INIT} then 3 else 3 end`
        )
      )
    } else {
      query.orderBy('estates.id', 'desc')
    }
    return query
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
          file_format
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
        type
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
    const query = File.query()
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
    const query = File.query().where('estate_id', estate_id)
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
      const favImages = this.extractImages(
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
          /* if no images in rooms */
          let files =
            (await this.getFiles({
              estate_id: room?.estate_id || estate_id,
              type: [FILE_TYPE_PLAN, FILE_TYPE_EXTERNAL],
              orderBy: [{ key: 'type', order: 'asc' }]
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
    const query = Estate.query()
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
    estateId = await this.getEstateIdsInBuilding(estateId)

    const trx = await Database.beginTransaction()
    try {
      estateId = Array.isArray(estateId) ? estateId : [estateId]
      const likes = estateId.map((id) => ({
        user_id: userId,
        estate_id: id
      }))

      await this.upsertBulkLikes(likes, trx)
      const delay = LIKED_BUT_NOT_KNOCKED_FOLLOWUP_HOURS_AFTER * 1000 * 60 * 60 // ms
      await this.removeDislike({ user_id: userId, estate_id: estateId }, trx)
      await trx.commit()
      QueueService.notifyProspectWhoLikedButNotKnocked(estateId, userId, delay)
    } catch (e) {
      await trx.rollback()
      Logger.error(e)
      throw new AppException('Cant create like')
    }
  }

  static async upsertBulkLikes(likes, trx) {
    let queries = `INSERT INTO likes
                  ( user_id, estate_id )
                  VALUES
                `

    queries = (likes || []).reduce(
      (q, current, index) =>
        `${q}\n ${index ? ',' : ''}
        ( ${current.user_id}, ${current.estate_id} ) `,
      queries
    )

    queries += ` ON CONFLICT ( user_id, estate_id )
                  DO NOTHING
                `

    await Database.raw(queries).transacting(trx)
  }

  static async getEstateIdsInBuilding(estate_id) {
    const estate = await this.getActiveEstateQuery()
      .select('id', 'build_id')
      .where('id', estate_id)
      .first()

    if (!estate) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }
    if (estate.build_id) {
      const estates = (
        await Estate.query()
          .select('id')
          .where('build_id', estate.build_id)
          .whereNot('status', STATUS_DELETE)
          .fetch()
      ).toJSON()

      if (!estates?.length) {
        throw new HttpException(NO_ESTATE_EXIST, 400)
      }

      estate_id = estates.map((estate) => estate.id)
    }

    return Array.isArray(estate_id) ? estate_id : [estate_id]
  }

  /**
   *
   */
  static async removeLike({ user_id, estate_id }, trx) {
    if (Array.isArray(estate_id) && estate_id?.length) {
      estate_id = estate_id[0]
    }
    estate_id = await this.getEstateIdsInBuilding(estate_id)

    const query = Database.table('likes')
      .where('user_id', user_id)
      .whereIn('estate_id', Array.isArray(estate_id) ? estate_id : [estate_id])
      .delete()
    if (trx) {
      query.transacting(trx)
    }

    return query
  }

  /**
   *
   */
  static async addDislike({ user_id, estate_id }, trx) {
    estate_id = await this.getEstateIdsInBuilding(estate_id)
    const shouldTrxProceed = trx

    if (!trx) {
      trx = await Database.beginTransaction()
    }

    try {
      const dislikes = estate_id.map((id) => ({
        user_id,
        estate_id: id
      }))

      await this.upsertBulkDislikes(dislikes, trx)
      await this.removeLike({ user_id, estate_id }, trx)
      if (!shouldTrxProceed) await trx.commit()
    } catch (e) {
      Logger.error(e)
      if (!shouldTrxProceed) await trx.rollback()
      throw new AppException('Cant create dislike')
    }
  }

  static async upsertBulkDislikes(likes, trx) {
    let queries = `INSERT INTO dislikes
                  ( user_id, estate_id )
                  VALUES
                `

    queries = (likes || []).reduce(
      (q, current, index) =>
        `${q}\n ${index ? ',' : ''}
        ( ${current.user_id}, ${current.estate_id} ) `,
      queries
    )

    queries += ` ON CONFLICT ( user_id, estate_id )
                  DO NOTHING
                `

    await Database.raw(queries).transacting(trx)
  }

  /**
   *
   */
  static async removeDislike({ user_id, estate_id }, trx) {
    if (Array.isArray(estate_id) && estate_id?.length) {
      estate_id = estate_id[0]
    }
    estate_id = await this.getEstateIdsInBuilding(estate_id)

    const query = Database.table('dislikes')
      .where('user_id', user_id)
      .whereIn('estate_id', Array.isArray(estate_id) ? estate_id : [estate_id])
      .delete()

    if (trx) {
      query.transacting(trx)
    }
    return query
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

    const filteredEstates = await this.filterEstates({ tenant, estates, inside_property: true })
    const groupedEstates = groupBy(filteredEstates, (estate) =>
      estate.build_id ? `g_${estate.build_id}` : estate.id
    )
    estates = Object.keys(groupedEstates).map((key) => ({ ...groupedEstates[key][0] }))

    const categoryCounts = this.calculateCategoryCounts(estates, tenant)

    return {
      estates: filteredEstates,
      groupedEstates: estates,
      categoryCounts
    }
  }

  static calculateCounts({ estates, fieldName, start, end, interval }) {
    const list = []
    const counts = []
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

  static calculateCategoryCounts(estates, tenant) {
    const rooms_number = this.calculateCounts({
      estates,
      fieldName: 'rooms_number',
      start: 0,
      end: MAX_ROOM_COUNT,
      interval: ROOM_INTERVAL_COUNT
    })

    const area = this.calculateCounts({
      estates,
      fieldName: 'area',
      start: 0,
      end: MAX_SPACE_COUNT,
      interval: SPACE_INTERVAL_COUNT
    })

    const net_rent = this.calculateCounts({
      estates,
      fieldName: 'net_rent',
      start: 0,
      end: tenant.income ?? MAX_RENT_COUNT,
      interval: RENT_INTERVAL_COUNT
    })

    const number_floors = this.calculateCounts({
      estates,
      fieldName: 'number_floors',
      start: 0,
      end: MAX_FLOOR_COUNT,
      interval: FLOOR_INTERVAL_COUNT
    })

    return {
      rooms_number,
      area,
      net_rent,
      number_floors
    }
  }

  static sumCategoryCounts({ insideMatchCounts, outsideMatchCounts }) {
    const counts = {}

    Object.keys(insideMatchCounts).forEach((categoryKey) => {
      counts[categoryKey] = Object.keys(insideMatchCounts[categoryKey]).map((key) => ({
        [key]:
          (insideMatchCounts?.[categoryKey]?.[key] || 0) +
          (outsideMatchCounts?.[categoryKey]?.[key] || 0)
      }))
    })
    return counts
  }

  static async filterEstates({ tenant, estates, inside_property = false }, debug = false) {
    Logger.info(`before filterEstates count ${estates?.length}`)

    const budgetMax = tenant?.budget_max
    const budgetMin = tenant?.budget_min
    const trace = [{ estateIds: estates.map((e) => e.id), stage: 'original' }]

    let maxTenantBudget = 0
    if (budgetMax) {
      if (budgetMax > 100) {
        maxTenantBudget = budgetMax
      } else {
        maxTenantBudget = (budgetMax * tenant?.income) / 100
      }
    }

    let minTenantBudget = 0
    if (budgetMin) {
      if (budgetMin > 100) {
        minTenantBudget = budgetMin
      } else {
        minTenantBudget = (budgetMin * tenant?.income) / 100
      }
    }
    if (maxTenantBudget) {
      estates = estates.filter((estate) => {
        const budget = tenant.include_utility
          ? estate.net_rent + estate.extra_costs
          : estate.net_rent
        return budget >= minTenantBudget && budget <= maxTenantBudget
      })
    }
    trace.push({ stage: 'after BUDGET test', estateIds: estates.map((e) => e.id) })

    if (process.env.DEV === 'true') {
      Logger.info(`filterEstates after budget ${estates?.length}`)
    }

    // transfer budget
    if (tenant.transfer_budget_min && tenant.transfer_budget_max) {
      estates = estates.filter(
        (estate) =>
          !estate.transfer_budget ||
          (estate.transfer_budget >= (tenant.transfer_budget_min ?? 0) &&
            estate.transfer_budget <= (tenant.transfer_budget_max ?? 0))
      )
      if (process.env.DEV === 'true') {
        Logger.info(`filterEstates after transfer ${estates?.length}`)
      }
    }
    trace.push({ stage: 'after TRANSFER BUDGET test', estateIds: estates.map((e) => e.id) })

    if (tenant.rent_start && inside_property) {
      estates = estates.filter(
        (estate) =>
          // estate vacant_date not set
          !estate.vacant_date ||
          // estate vacant_date is greater than rent_start
          moment.utc(estate.vacant_date).format(DAY_FORMAT) >=
            moment.utc(tenant.rent_start).format(DAY_FORMAT) ||
          // estate.vacant_date is lesser than today
          moment.utc(estate.vacant_date).format(DAY_FORMAT) <= moment.utc().format(DAY_FORMAT)
      )
      if (process.env.DEV === 'true') {
        Logger.info(`filterEstates after rent start ${estates?.length}`)
      }
    }
    trace.push({ stage: 'after RENT START test', estateIds: estates.map((e) => e.id) })

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
    trace.push({ stage: 'after RENT DURATION test', estateIds: estates.map((e) => e.id) })

    if (tenant.rooms_min !== null && tenant.rooms_max !== null) {
      estates = estates.filter(
        (estate) =>
          !estate.rooms_number ||
          (estate.rooms_number >= (tenant.rooms_min || 1) &&
            estate.rooms_number <= (tenant.rooms_max || 1))
      )
      if (process.env.DEV === 'true') {
        Logger.info(`filterEstates after rooms ${estates?.length}`)
      }
    }
    trace.push({
      stage: 'after NUMBER OF ROOMS preference test',
      estateIds: estates.map((e) => e.id)
    })

    if (tenant.floor_min !== null && tenant.floor_max !== null) {
      estates = estates.filter(
        (estate) =>
          estate.floor === null ||
          (estate.floor >= (tenant.floor_min || 0) && estate.floor <= (tenant.floor_max || 20))
      )
      if (process.env.DEV === 'true') {
        Logger.info(`filterEstates after floors ${estates?.length}`)
      }
    }
    trace.push({
      stage: 'after NUMBER OF FLOORS preference test',
      estateIds: estates.map((e) => e.id)
    })

    if (tenant.space_min !== null && tenant.space_max !== null) {
      estates = estates.filter(
        (estate) =>
          !estate.area ||
          (estate.area >= (tenant.space_min || 1) && estate.area <= (tenant.space_max || 1))
      )
      if (process.env.DEV === 'true') {
        Logger.info(`filterEstates after area ${estates?.length}`)
      }
    }
    trace.push({
      stage: 'after AREA preference test',
      estateIds: estates.map((e) => e.id)
    })

    if (tenant.apt_type?.length) {
      estates = estates.filter(
        (estate) => !estate.apt_type || tenant.apt_type.includes(estate.apt_type)
      )
      if (process.env.DEV === 'true') {
        Logger.info(`filterEstates apt type after ${estates?.length}`)
      }
    }
    trace.push({
      stage: 'after APARTMENT TYPE preference test',
      estateIds: estates.map((e) => e.id)
    })

    if (tenant.house_type?.length) {
      estates = estates.filter(
        (estate) => !estate.house_type || tenant.house_type.includes(estate.house_type)
      )
      if (process.env.DEV === 'true') {
        Logger.info(`filterEstates after house type ${estates?.length}`)
      }
    }

    if (tenant.is_public_certificate) {
      // estate.cert_category : inside estates
      // estate.wbs: outside estates
      if (inside_property) {
        estates = estates.filter((estate) => estate?.cert_category?.length > 0)
      } else {
        estates = estates.filter((estate) => estate.wbs)
      }

      if (process.env.DEV === 'true') {
        Logger.info(`filterEstates after public certificate ${estates?.length}`)
      }
    }
    trace.push({
      stage: 'after WBS Certificate test',
      estateIds: estates.map((e) => e.id)
    })

    if (tenant.income_level?.length && inside_property) {
      estates = estates.filter(
        (estate) =>
          estate?.cert_category?.length < 1 ||
          tenant.income_level.some((level) => estate.cert_category.includes(level))
      )
      if (process.env.DEV === 'true') {
        Logger.info(`filterEstates after income level ${estates?.length}`)
      }
    }
    trace.push({
      stage: 'after Certificate Income Level test',
      estateIds: estates.map((e) => e.id)
    })

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
    trace.push({
      stage: 'after AMENITIES preference test',
      estateIds: estates.map((e) => e.id)
    })

    return debug ? trace : estates
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
      .whereNotIn('status', [MATCH_STATUS_FINISH, MATCH_STATUS_NEW, MATCH_STATUS_TOP])
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
    if (!build_id) {
      query.select(
        Database.raw(
          `distinct on (case when build_id is null then estates.id else estates.build_id end) build_id`
        )
      )
    }

    query
      .select('estates.*')
      .withCount('knocked')
      .select(Database.raw(`_m.prospect_score AS match`))
      .select(
        Database.raw(
          'CAST(COALESCE(estates.rooms_number, 0) + COALESCE(estates.bedrooms_number, 0) + COALESCE(estates.bathrooms_number, 0) as INTEGER) as rooms_max'
        )
      )
      .select(Database.raw('1 as rooms_min'))
      .select('_m.status as match_status')
      .innerJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id')
          .onIn('_m.user_id', [userId])
          .onIn('_m.status', [MATCH_STATUS_NEW, MATCH_STATUS_KNOCK])
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
      return query.orderBy('_m.prospect_score', 'DESC')
    }
    return query
      .orderBy(
        Database.raw(`case when build_id is null then estates.id else estates.build_id end`),
        'DESC'
      )
      .orderBy('_m.prospect_score', 'DESC')
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
  static async getTenantAllEstates({
    userId,
    build_id,
    page = 1,
    limit = 20,
    includeGeography = true
  }) {
    const tenant = await require('./TenantService').getTenantWithGeo(userId)
    if (!tenant) {
      throw new AppException('Tenant geo invalid')
    }
    let query = null

    if (!includeGeography) {
      query = Estate.query().where('build_id', build_id).whereNotIn('status', [STATUS_DELETE])
    } else {
      if (tenant.isActive()) {
        query = this.getActiveMatchesQuery({ userId, build_id })
      } else {
        query = this.getNotActiveMatchesQuery({ tenant, userId, build_id })
      }
    }

    let estates = []
    if (page != -1 && limit != -1) {
      estates =
        (await query.paginate(page, limit)).toJSON({
          isShort: false,
          role: ROLE_USER
        })?.data || []
    } else {
      estates = (await query.fetch()).toJSON({ isShort: false, role: ROLE_USER })
    }

    return orderBy(estates, 'match', 'desc')
  }

  static async countPublishedPropertyByLandlord(user_id) {
    return await Estate.query().where('user_id', user_id).where('is_published', true).count('*')
  }

  static async isPaid() {}

  /**
   *
   */
  static async publishEstate(
    {
      estate,
      publishers,
      performed_by = null,
      is_queue = false,
      is_build_publish = false,
      retainOldMatches = true
    },
    trx
  ) {
    const user = await User.query().where('id', estate.user_id).first()
    if (!user) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }

    if (performed_by && estate.build_id && !is_build_publish) {
      throw new HttpException(
        BUILD_UNIT_CAN_NOT_PUBLISH_SEPRATELY,
        400,
        ERROR_SEPARATE_PUBLISH_UNIT_BUILDING_CODE
      )
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

    const status = estate.status
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
            publishers
          },
          trx
        )
      }

      if (!retainOldMatches) {
        await props({
          delMatches: Database.table('matches')
            .where({ estate_id: estate.id })
            .delete()
            .transacting(trx),
          delLikes: Database.table('likes')
            .where({ estate_id: estate.id })
            .delete()
            .transacting(trx),
          delDislikes: Database.table('dislikes')
            .where({ estate_id: estate.id })
            .delete()
            .transacting(trx)
        })
      }

      if (performed_by) {
        // this is performed by landlord, we need to send to admin to request publish approval
        const subject = LANDLORD_REQUEST_PUBLISH_EMAIL_SUBJECT
        const link = `${ADMIN_URLS[process.env.NODE_ENV]}/properties?id=${estate.id}` // fixme: make a deeplink
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

        await MailService.sendTextEmail('support@breeze4me.de', subject, textMessage)
      }

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
          notify_sent: null
        })
        .transacting(trx)

      if (isNull(performed_by)) {
        // comes from admin so we can publish to market place
        await QueueService.estateSyncPublishEstate({ estate_id: estate.id })
      }
      if (!is_queue) {
        // send email to support for landlord update...
        QueueService.sendEmailToSupportForLandlordUpdate({
          type: PUBLISH_ESTATE,
          landlordId: estate.user_id,
          estateIds: [estate.id]
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
          publish_status: PUBLISH_STATUS_INIT
        },
        trx,
        true
      )
      let building
      if (estate.build_id) {
        building = await EstateService.updateBuildingPublishStatus(
          {
            building_id: estate.build_id,
            action: 'deactivate'
          },
          trx
        )
      }
      await this.deleteMatchInfo({ estate_id: id }, trx)
      await trx.commit()
      await this.handleOffline({
        estates: [estate],
        building,
        event: WEBSOCKET_EVENT_ESTATE_DEACTIVATED
      })
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
          publish_type: PUBLISH_TYPE_OFFLINE_MARKET
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

    const trx = await Database.beginTransaction()

    try {
      await estate.updateItemWithTrx(
        {
          status: STATUS_EXPIRE,
          publish_status: PUBLISH_STATUS_INIT
        },
        trx,
        true
      )
      let building
      if (estate.build_id) {
        building = await EstateService.updateBuildingPublishStatus(
          { building_id: estate.build_id, action: 'unpublish' },
          trx
        )
      }

      await this.handleOffline(
        {
          building,
          estates: [estate],
          event: WEBSOCKET_EVENT_ESTATE_UNPUBLISHED
        },
        trx
      )
      await trx.commit()
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }

  static async handleOffline({ building, build_id, estates, event }, trx) {
    const data = {
      success: true,
      build_id: building?.id || build_id,
      published: building?.published,
      building_status: building?.status,
      status: estates?.[0]?.status,
      publish_status: estates?.[0]?.publish_status,
      property_id: estates?.[0]?.property_id
    }

    const EstateSyncService = require('./EstateSyncService')
    await EstateSyncService.emitWebsocketEventToLandlord({
      event,
      user_id: estates?.[0].user_id,
      data
    })

    if (estates?.length) {
      const ids = estates.map((estate) => estate.id)
      await EstateSyncService.markListingsForDelete(ids, trx)
      // unpublish estate from estate_sync
      QueueService.estateSyncUnpublishEstates(ids, false)
    }
  }

  static async extendEstate({
    user_id,
    estate_id,
    available_end_at,
    is_duration_later,
    min_invite_count
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
    notify_on_green_matches
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
        status: STATUS_DRAFT
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
    const query = this.getEstates(user_ids, params).whereNot('estates.status', STATUS_DELETE)
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
    const query = this.getQueryEstatesByUserId({ user_ids, params })
      .with('slots')
      .with('rooms', function (q) {
        q.with('images')
      })
      .with('files')
      .with('estateSyncListings')
      .with('category')

    let result
    if (from === -1 || limit === -1) {
      result = await query.fetch()
    } else {
      result = await query.offset(from).limit(limit).fetch()
      // result = await query.paginate(1, 10)
    }
    result.data = this.checkCanChangeLettingStatus(result, { isOwner: true })

    let contactRequests
    if (params.build_id) {
      contactRequests = await require('./BuildingService').getContactRequestsCountByBuilding(
        params.build_id
      )
    }
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

      const deposit_multiplier = Math.round(Number(estate?.deposit) / Number(estate?.net_rent))
      if (estate.build_id && estate.unit_category_id) {
        estate.__meta__.contact_requests_count =
          contactRequests?.find((cr) => cr.unit_category_id === estate.unit_category_id)
            ?.contact_requests_count || 0
      }

      return {
        ...estate,
        inside_view_has_media,
        outside_view_has_media,
        document_view_has_media,
        unassigned_view_has_media,
        deposit_multiplier
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
          (parseInt(count?.[0]?.count || 0) % limit > 0 ? 1 : 0)
      }
    }
    result = {
      ...result,
      pages
    }
    return result
  }

  static async landlordTenantDetailInfo(user_id, estate_id, tenant_id) {
    return Estate.query()
      .select(['estates.*', '_m.share', '_m.status'])
      .with('user')
      .innerJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id').on('_m.user_id', tenant_id)
        // .on('_m.status', MATCH_STATUS_FINISH)
      })
      .leftJoin({ _mb: 'members' }, function () {
        this.on('_mb.user_id', '_m.user_id')
      })
      .where('estates.id', estate_id)
      .where('estates.user_id', user_id)
      .orderBy('_mb.id')
      .first()
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

  static async getShortEstatesByQuery({ user_id, query, letting_type, status }) {
    const estateQuery = this.getActiveEstateQuery()
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

    if (letting_type?.includes(LETTING_TYPE_LET)) {
      estateQuery.where('estates.letting_type', LETTING_TYPE_LET)
      estateQuery.innerJoin({ _ect: 'estate_current_tenants' }, function () {
        this.on('_ect.estate_id', 'estates.id')
          .on(Database.raw(`_ect.user_id IS NOT NULL`))
          .on('_ect.status', STATUS_ACTIVE)
      })
    }

    if (status) {
      estateQuery.whereIn('estates.status', Array.isArray(status) ? status : [status])
    }

    estateQuery.orderBy('estates.property_id').orderBy('estates.address')

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
        house_number: estate.properties.housenumber
      }
    })
    const coords = estates.map((estate) => `${estate.coord.lat},${estate.coord.lon}`)
    let existingEstates =
      (
        await Estate.query()
          .leftJoin({ _ect: 'estate_current_tenants' }, function () {
            this.on('_ect.estate_id', 'estates.id').onNotIn('_ect.status', [
              STATUS_DELETE,
              STATUS_EXPIRE
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
      ...notGroupExistingEstates
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
      'verified_address'
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
      'verified_address'
    ])
    return estateCount
  }

  static async getEstateHasTenant({ condition = {} }) {
    const query = Estate.query()
      .where('letting_type', LETTING_TYPE_LET)
      .where('status', STATUS_DRAFT)
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
      return await Estate.findByOrFail({ id, user_id })
    } catch (e) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }
  }

  static async getEstatesWithTask({ user_id, params, page, limit = -1 }) {
    const query = Estate.query()
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
        const activeTasks = (r[0].activeTasks || []).slice(0, SHOW_ACTIVE_TASKS_COUNT)

        const taskCount = (r[0].tasks || []).length || 0
        return {
          ...omit(r[0], ['activeTasks', 'mosturgency', 'tasks']),
          activeTasks,
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
              : 0
          }
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
      connected_count
    }
  }

  static async getTotalLetCount(user_id, params, filtering = true) {
    const query = Estate.query()
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
        publish_status: PUBLISH_STATUS_INIT
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
    const query = Estate.query()
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
        canChangeLettingType: !(isMatchCountValidToChangeLettingType || estate.current_tenant)
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
        const images = property.images
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
        entity: IMPORT_ENTITY_ESTATES
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
        address
      }
    })
  }

  static async getFilesByEstateId(estateId) {
    const File = use('App/Models/File')
    const files = await File.query().where('estate_id', estateId).fetch()
    const typeAssigned = {
      external: ['external'],
      documents: ['plan', 'energy_certificate', 'custom', 'doc'],
      unassigned: ['unassigned']
    }
    const ret = {
      external: [],
      documents: { plan: [], energy_certificate: [], custom: [] },
      unassigned: []
    }
    // return files
    files.toJSON().map((file) => {
      if (typeAssigned[file.type]?.includes(file.type)) {
        ret[file.type] = [...ret[file.type], file]
      } else if (typeAssigned.documents.includes(file.type)) {
        ret.documents[file.type] = [...ret.documents[file.type], file]
      }
    })
    return ret
  }

  static calculatePercent(estate, debug = false) {
    delete estate.verified_address
    delete estate.cover_thumb
    let percent = 0
    const debugArr = []
    const is_let = estate.letting_type === LETTING_TYPE_LET
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

    const general = ESTATE_PERCENTAGE_VARIABLE.general.filter((g) => g.mandatory.includes(let_type))
    general.length &&
      general
        .filter((g) => !g.is_custom)
        .map(({ key, isNumber, zeroIsValid }) => {
          let score = 0
          if (isNumber) {
            score = Number(estate[key]) ? GENERAL_PERCENT_VAL / general.length : 0
          } else if (zeroIsValid) {
            score = !isNull(estate[key]) ? GENERAL_PERCENT_VAL / general.length : 0
          } else {
            score = estate[key] ? GENERAL_PERCENT_VAL / general.length : 0
          }
          percent += score
          debugArr.push({
            key,
            value: estate[key],
            score,
            percent
          })
        })
    const lease_price = ESTATE_PERCENTAGE_VARIABLE.lease_price.filter((g) =>
      g.mandatory.includes(let_type)
    )
    lease_price.length &&
      lease_price
        .filter((l) => !l.is_custom)
        .map(({ key, isNumber }) => {
          let score = 0
          if (isNumber) {
            score = Number(estate[key]) ? LEASE_CONTRACT_PERCENT_VAL / lease_price.length : 0
          } else {
            score = estate[key] ? LEASE_CONTRACT_PERCENT_VAL / lease_price.length : 0
          }
          percent += score
          debugArr.push({
            key,
            value: estate[key],
            score,
            percent
          })
        })

    const property_detail = ESTATE_PERCENTAGE_VARIABLE.property_detail.filter((g) =>
      g.mandatory.includes(let_type)
    )
    property_detail.length &&
      property_detail
        .filter((p) => !p.is_custom)
        .map(({ key }) => {
          // we add one more to property_detail.length to accomodate amenities below
          percent += estate[key] ? PROPERTY_DETAILS_PERCENT_VAL / (property_detail.length + 1) : 0
          debugArr.push({
            key,
            value: estate[key],
            score: estate[key] ? PROPERTY_DETAILS_PERCENT_VAL / (property_detail.length + 1) : 0,
            percent
          })
        })

    if (estate.amenities && estate.amenities.length) {
      percent += PROPERTY_DETAILS_PERCENT_VAL / (property_detail.length + 1)
      debugArr.push({
        key: 'amenities',
        value: estate.amenities,
        score: PROPERTY_DETAILS_PERCENT_VAL / (property_detail.length + 1),
        percent
      })
    } else {
      debugArr.push({
        key: 'amenities',
        value: estate.amenities,
        score: 0,
        percent
      })
    }

    const tenant_preference = ESTATE_PERCENTAGE_VARIABLE.tenant_preference.filter((g) =>
      g.mandatory.includes(let_type)
    )
    tenant_preference.length &&
      tenant_preference
        .filter((t) => !t.is_custom)
        .map(({ key, isBoolean, isNumber }) => {
          let score = 0
          if (isBoolean) {
            score =
              estate[key] === true || estate[key] === false
                ? TENANT_PREFERENCES_PERCENT_VAL / tenant_preference.length
                : 0
          } else if (isNumber) {
            score = Number(estate[key])
              ? TENANT_PREFERENCES_PERCENT_VAL / tenant_preference.length
              : 0
          } else {
            score = estate[key] ? TENANT_PREFERENCES_PERCENT_VAL / tenant_preference.length : 0
          }
          percent += score
          debugArr.push({
            key,
            value: estate[key],
            score,
            percent
          })
        })

    const visit_slots = ESTATE_PERCENTAGE_VARIABLE.visit_slots.filter((g) =>
      g.mandatory.includes(let_type)
    )
    visit_slots.length &&
      visit_slots
        .filter((v) => !v.is_custom)
        .map(({ key }) => {
          // add 1 to denominator to compensate for estates.slots
          percent += estate[key] ? VISIT_SLOT_PERCENT_VAL / visit_slots.length : 0
          debugArr.push({
            key,
            value: estate[key],
            score: estate[key] ? VISIT_SLOT_PERCENT_VAL / visit_slots.length : 0,
            percent
          })
        })

    if (
      visit_slots.length &&
      !is_let &&
      estate.slots &&
      estate.slots.length &&
      estate.slots.find((slot) => slot.start_at >= moment.utc(new Date()).format(DATE_FORMAT))
    ) {
      percent += VISIT_SLOT_PERCENT_VAL / visit_slots.length
      debugArr.push({
        key: 'slots',
        value: estate.slots,
        score: VISIT_SLOT_PERCENT_VAL / visit_slots.length,
        percent
      })
    } else {
      debugArr.push({
        key: 'slots',
        value: estate.slots,
        score: 0,
        percent
      })
    }

    const views = ESTATE_PERCENTAGE_VARIABLE.views.filter((g) => g.mandatory.includes(let_type))
    views.length &&
      views
        .filter((v) => !v.is_custom)
        .map(({ key }) => {
          percent += estate[key] ? IMAGE_DOC_PERCENT_VAL / views.length : 0
          debugArr.push({
            key,
            value: estate[key],
            score: estate[key] ? IMAGE_DOC_PERCENT_VAL / views.length : 0,
            percent
          })
        })

    if (views.length) {
      let score = sum((estate?.rooms || []).map((room) => room?.images?.length || 0))
        ? IMAGE_DOC_PERCENT_VAL / views.length
        : 0
      percent += score
      debugArr.push({
        key: 'room_image',
        value: estate.rooms,
        score,
        percent
      })
      score = (estate?.files || []).find((f) => f.type === FILE_TYPE_PLAN)
        ? IMAGE_DOC_PERCENT_VAL / views.length
        : 0
      percent += score
      debugArr.push({
        key: 'house plan',
        value: estate.files,
        score,
        percent
      })
      score = (estate?.files || []).find((f) => f.type === FILE_TYPE_EXTERNAL)
        ? IMAGE_DOC_PERCENT_VAL / views.length
        : 0
      percent += score
      debugArr.push({
        key: 'external',
        value: estate.files,
        score,
        percent
      })
    }
    if (debug) return debugArr
    return percent >= 100 ? 100 : Math.ceil(percent)
  }

  static async updatePercentAndIsPublished(
    {
      estate,
      estate_id,
      slots = null,
      files = null,
      amenities = null,
      deleted_slots_ids = null,
      deleted_files_ids = null
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

    const percentData = {
      ...estate.toJSON({ extraFields: ['verified_address', 'construction_year', 'cover_thumb'] })
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
        estateIds: [estate.id]
      })
    }

    estate = {
      ...estate,
      percent,
      can_publish: isAvailablePublish
    }
    if (estate?.build_id) {
      await BuildingService.updateCanPublish(
        {
          user_id: estate.user_id,
          build_id: estate.build_id,
          estate
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

  static async getTenantBuildingEstates({
    user_id,
    build_id,
    is_social = false,
    includeGeography = true
  }) {
    let estates =
      (
        await EstateService.getTenantAllEstates({
          userId: user_id,
          build_id,
          page: -1,
          limit: -1,
          includeGeography
        })
      )?.filter((estate) =>
        is_social ? estate?.cert_category?.length : !estate?.cert_category?.length
      ) || []
    estates = orderBy(estates, 'rooms_number', 'asc')

    let category_ids = uniq(estates.map((estate) => estate.unit_category_id))
    category_ids = category_ids.map((cat_id) => cat_id || -1)

    const yAxisKey = is_social ? `cert_category` : `floor`
    const yAxisEstates = is_social
      ? groupBy(
          estates.filter((estate) => estate.cert_category),
          (estate) => estate?.cert_category?.join('+')
        )
      : groupBy(estates, (estate) => estate.floor)

    const buildingEstates = {}
    Object.keys(yAxisEstates).forEach((axis) => {
      const categoryEstates = {}
      category_ids.forEach((cat_id) => {
        const filteredEstates = estates.filter((estate) => {
          const yAxisKeyCondition =
            yAxisKey === 'floor'
              ? estate[yAxisKey].toString() === axis.toString()
              : estate[yAxisKey]?.join('+') === axis.toString()

          return (
            yAxisKeyCondition &&
            (cat_id != -1 ? estate.unit_category_id === cat_id : !estate.unit_category_id)
          )
        })
        if (filteredEstates?.length) {
          categoryEstates[cat_id] = filteredEstates
        }
      })

      if (Object.keys(categoryEstates)?.length) {
        buildingEstates[axis] = categoryEstates
      }
    })

    return {
      categories: Object.keys(yAxisEstates).sort((a, b) =>
        is_social ? a.localeCompare(b) : b - a
      ),
      xAxisCategories: category_ids,
      estates: buildingEstates
    }
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
        estates.map(async (estate) => {
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
      console.log('thirdPartyOffers', thirdPartyOffers.length)
      estates = [...estates, ...thirdPartyOffers]
      console.log('estates', estates.length)
    }

    return {
      estates,
      page,
      limit,
      count: totalCount
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
          'updated_at'
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
          : null
      }

      const newEstate = await this.createEstate({ data: estateData, userId: user_id }, false, trx)
      await Promise.map(
        originalEstateData.rooms || [],
        async (room) => {
          const newRoom = await RoomService.createRoom(
            {
              estate_id: newEstate.id,
              roomData: omit(room, ['id', 'estate_id', 'images', 'created_at', 'updated_at'])
            },
            trx
          )
          const newImages = room.images.map((image) => ({
            ...omit(image, ['id', 'relativeUrl', 'thumb']),
            url: image.relativeUrl,
            room_id: newRoom.id
          }))
          await RoomService.addManyImages(newImages, trx)
        },
        { concurrency: 1 }
      )

      const newFiles = (originalEstateData.files || []).map((file) => ({
        ...omit(file, ['id', 'relativeUrl', 'thumb']),
        url: file.relativeUrl,
        estate_id: newEstate.id
      }))
      await this.addManyFiles(newFiles, trx)

      const newAmenities = (originalEstateData.amenities || []).map((amenity) => ({
        ...omit(amenity, ['room_id', 'id', 'option']),
        estate_id: newEstate.id
      }))

      await Amenity.createMany(newAmenities, trx)

      await trx.commit()
      const estates = await require('./EstateService').getEstatesByUserId({
        limit: 1,
        from: 0,
        params: { id: newEstate.id }
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
    const query = Estate.query()
      .innerJoin({ _ect: 'estate_sync_contact_requests' }, function () {
        this.on('estates.id', '_ect.estate_id').onIn('_ect.status', [
          STATUS_DRAFT,
          STATUS_EMAIL_VERIFY
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
      role: role ?? null
    })

    if (!estate) {
      throw new HttpException('Invalid estate', 404)
    }

    estate.isoline = await this.getIsolines(estate)
    estate = estate.toJSON({
      isShort: true,
      role: role ?? null,
      extraFields: ['landlord_type', 'hash', 'property_type', 'active_visuals']
    })

    let match
    if (user_id && role === ROLE_USER) {
      match = await require('./MatchService').getMatches(user_id, id)
    }

    estate = {
      ...estate,
      match: match?.prospect_score
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
      params
    })

    const total = buildEstateCount + noBuildEstateCount
    const buildEstatePage = Math.ceil(buildEstateCount / limit) || 1

    const buildEstates = await require('./BuildingService').getMatchBuilding({
      user_id,
      limit,
      from: (page - 1) * limit,
      params
    })

    let estates = buildEstates

    if (page && limit) {
      if (buildEstateCount < page * limit) {
        const offsetCount = buildEstateCount % limit
        let from = (page - buildEstatePage) * limit - offsetCount
        if (from < 0) from = 0
        const to = (page - buildEstatePage) * limit - offsetCount < 0 ? limit - offsetCount : limit

        const result = await EstateService.getEstatesByUserId({
          user_ids: [user_id],
          limit: to,
          from,
          params: {
            ...(params || {}),
            is_no_build: true,
            isStatusSort: true
          }
        })
        estates = [...estates, ...(result?.data || [])]
      }
    } else {
      const result = await EstateService.getEstatesByUserId({
        user_ids: [user_id],
        params: {
          ...(params || {}),
          is_no_build: true,
          isStatusSort: true
        }
      })

      estates = [...estates, ...(result?.data || [])]
    }

    return {
      pages: {
        total,
        lastPage: Math.ceil(total / limit) || 1,
        page,
        perPage: limit
      },
      estates
    }
  }

  static isDocumentsUploaded(estateDetails) {
    const { files, rooms } = estateDetails ?? {}
    // const floorPlans = files?.filter(({ type }) => type === DOCUMENT_VIEW_TYPES.PLAN)
    const externalView = (files ?? []).filter(({ type }) => type === FILE_TYPE_EXTERNAL)
    const insideView = (rooms ?? []).filter(({ images }) => images?.length || false)
    Logger.info(
      `isDocumentsUpload= ${estateDetails.id} ${externalView?.length && insideView.length}`
    )
    return externalView?.length && insideView.length
  }

  static isTenantPreferenceUpdated(estateDetails) {
    const { rent_arrears, budget, min_age, max_age, family_size_max } = estateDetails ?? {}
    const tenantPreferenceObject = {
      budget,
      min_age,
      max_age,
      rent_arrears,
      family_size_max
    }
    Logger.info(
      `isTenantPreferenceUpdated= ${estateDetails.id} ${checkIfIsValid(tenantPreferenceObject)}`
    )
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
      deposit_multiplier
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
        energy_efficiency
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
        property_type
      }
    }
    Logger.info(`isLocationRentUnitUpdated= ${estateDetails.id} ${checkIfIsValid(locationObject)}`)

    const isValid = checkIfIsValid(locationObject)
    if (!isValid) {
      Object.keys(locationObject).forEach((key) =>
        console.log(`locationObject ${estateDetails.id} > ${key} ${locationObject[key]}`)
      )
    }
    return isValid
  }

  static isAllInfoAvailable(estate) {
    return (
      this.isDocumentsUploaded(estate) &&
      this.isLocationRentUnitUpdated(estate) &&
      this.isTenantPreferenceUpdated(estate)
    )
  }

  // TODO: need to fill out room images/floor plan for the units in the same category
  static async fillOutUnit() {}

  static async checkBuildCanPublish({ build_id }) {
    // for checking publish
    const buildingEstates = (
      await require('./EstateService').getEstatesByUserId({
        limit: 1,
        from: 0,
        params: { build_id }
      })
    ).data

    buildingEstates.map((estate) => EstateService.isAllInfoAvailable(estate))
  }

  static async publishBuilding({ user_id, publishers, build_id, estate_ids }) {
    const estates = await this.getEstatesByBuilding({
      user_id,
      build_id,
      exclude_letting_type_let: true
    })

    const can_publish = estates.every((estate) => estate.can_publish)
    if (!can_publish) {
      throw new HttpException(ERROR_PUBLISH_BUILDING, 400, ERROR_PUBLISH_BUILDING_CODE)
    }

    const categories =
      uniq(estates.map((estate) => this.getBasicPropertyId(estate.property_id))) || []
    const categoryEstates = {}

    categories.forEach((category) => {
      categoryEstates[category] = estates.filter((estate) =>
        (estate.property_id ?? '').includes(category)
      )
    })

    const notAvailableCategories = []
    const availableCategories = []

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
          marketplace_estate_ids: availableCategories
        },
        trx
      )

      await Promise.map(estates, async (estate) => {
        await EstateService.publishEstate(
          {
            estate,
            publishers,
            performed_by: user_id,
            is_build_publish: true
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

    // TODO: publish estates here
  }

  static async getEstatesByBuilding({ user_id, build_id, exclude_letting_type_let }) {
    const query = Estate.query()
      .where('user_id', user_id)
      .where('build_id', build_id)
      .whereNot('status', STATUS_DELETE)
    if (exclude_letting_type_let) {
      query.whereNot('letting_type', LETTING_TYPE_LET)
    }
    const estates = await query.fetch()
    return estates.toJSON()
  }

  static async getEstatesByBuildingId({ user_id, build_id, exclude_letting_type_let }) {
    const query = Estate.query()
      .where('user_id', user_id)
      .where('build_id', build_id)
      .whereNot('status', STATUS_DELETE)
      .with('estateSyncListings')
      .withCount('visits')
      .with('final')
      .withCount('inviteBuddies')
      .withCount('knocked')
      .withCount('contact_requests')
      .select(
        Database.raw(
          `case when status='${STATUS_ACTIVE}'
  then true else false end
  as "unpublishable"`
        ),
        Database.raw(
          `case when status in ('${STATUS_DRAFT}', '${STATUS_EXPIRE}') and
    publish_status='${PUBLISH_STATUS_BY_LANDLORD}' and
    not (
      (available_start_at is null) is true or
      ((is_duration_later is false or is_duration_later is null)
        and (available_end_at is null) is true) or
      (is_duration_later is true and min_invite_count < 1) or
      ((available_end_at is not null) is true and available_end_at < NOW()) or
      ((available_end_at is not null) is true and
        (available_start_at is not null) is true and
        available_start_at >= available_end_at)
    ) and
    letting_type <> '${LETTING_TYPE_LET}'
    then true else false end
    as "approvable"`
        ),
        Database.raw(
          `case when status in ('${STATUS_DRAFT}', '${STATUS_EXPIRE}') and
    publish_status='${PUBLISH_STATUS_BY_LANDLORD}'
    then true else false end
    as "declineable"`
        ),
        Database.raw(
          `case when status in ('${STATUS_DRAFT}', '${STATUS_EXPIRE}') and
    publish_status not in ('${PUBLISH_STATUS_BY_LANDLORD}') and
    not (
      (available_start_at is null) is true or
      ((is_duration_later is false or is_duration_later is null)
        and (available_end_at is null) is true) or
      (is_duration_later is true and min_invite_count < 1) or
      ((available_end_at is not null) is true and available_end_at < NOW()) or
      ((available_end_at is not null) is true and
        (available_start_at is not null) is true and
        available_start_at >= available_end_at)
    ) and
    letting_type <> '${LETTING_TYPE_LET}'
    then true else false end
    as "publishable"
  `
        ),
        Database.raw(
          `json_build_object(
    'letting_type_is_let', (letting_type = '${LETTING_TYPE_LET}') is true,
    'available_start_at_is_null', (available_start_at is null) is true,
    'is_not_duration_later_but_available_end_at_is_null',
      ((is_duration_later is false or is_duration_later is null)
      and (available_end_at is null) is true) is true,
    'is_duration_later_but_no_min_invite_count',
      (is_duration_later is true and min_invite_count < 1) is true,
    'available_end_at_is_past',
      ((available_end_at is not null) is true and available_end_at < NOW()) is true,
    'available_start_at_is_later_than_available_end_at',
      ((available_end_at is not null) is true and
      (available_start_at is not null) is true and
      available_start_at >= available_end_at) is true
  ) as non_publishable_approvable_reasons`
        )
      )
    if (exclude_letting_type_let) {
      query.whereNot('letting_type', LETTING_TYPE_LET)
    }
    const estates = await query.fetch()
    return estates.toJSON()
  }

  static async unpublishBuilding({ user_id, build_id }) {
    const estates = await this.getEstatesByBuilding({ user_id, build_id })

    if (!estates?.length) {
      return true
    }

    const trx = await Database.beginTransaction()
    try {
      const buildingPublishStatus = estates.some(
        (estate) => estate.publish_status === PUBLISH_STATUS_BY_LANDLORD
      )
        ? PUBLISH_STATUS_BY_LANDLORD
        : PUBLISH_STATUS_INIT

      await BuildingService.updatePublishedMarketPlaceEstateIds(
        {
          id: build_id,
          user_id,
          published: PUBLISH_STATUS_INIT,
          marketplace_estate_ids: null
        },
        trx
      )

      await Estate.query()
        .where('build_id', build_id)
        .update({
          status: STATUS_EXPIRE,
          publish_status: PUBLISH_STATUS_INIT
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
          publish_status: PUBLISH_STATUS_INIT
        })
        .transacting(trx)

      // TODO: need to confirm....
      await this.deleteMatchInfo({ estate_id: estates.map((e) => e.id) }, trx)
      await this.handleOffline(
        { build_id, estates, event: WEBSOCKET_EVENT_ESTATE_DEACTIVATED },
        trx
      )
      await Building.query().where('id', build_id).update({ status: STATUS_DRAFT }).transacting(trx)
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

  static async getEstatesInSameCategory({ id, estate, status }) {
    if (!estate && !id) {
      throw new HttpException('params are wrong', 500)
    }
    if (!estate) {
      estate = await this.getById(id)
    }

    if (!estate) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }

    if (!estate.unit_category_id || !estate.build_id) {
      return [{ id: estate.id }]
    }

    return (
      await Estate.query()
        .select('id')
        .where('user_id', estate.user_id)
        .where('unit_category_id', estate.unit_category_id)
        .whereIn('status', Array.isArray(status) ? status : [status])
        .where('build_id', estate.build_id)
        .fetch()
    ).toJSON()
  }

  static async updateBuildingPublishStatus({ building_id, action = 'publish' }, trx = null) {
    const building = await Building.findOrFail(building_id)
    const estatesOfSameBuilding = await Estate.query()
      .select('status')
      .where('build_id', building_id)
      .whereNot('status', STATUS_DELETE)
      .fetch()
    const unpublishedPublishedOfSameBuilding = (estatesOfSameBuilding.toJSON() || []).filter(
      (estate) => {
        if (action === 'publish') {
          return estate.status !== STATUS_ACTIVE
        }
        return estate.status === STATUS_ACTIVE
      }
    )
    if (unpublishedPublishedOfSameBuilding.length === 0) {
      // mark building
      building.published =
        action === 'publish' ? PUBLISH_STATUS_APPROVED_BY_ADMIN : PUBLISH_STATUS_INIT
      building.status = action === 'publish' ? STATUS_ACTIVE : STATUS_DRAFT
      await building.save(trx)
    }
    return building
  }

  static async updateCoverByVisuals(visualsType, estateId) {
    // update image cover image while bulk upload screen
    if (visualsType === ACTIVE_VISUALS_BY_BULK_UPLOAD) {
      const fileData = await this.getFileByEstateId(estateId, FILE_TYPE_UNASSIGNED)

      if (fileData.length !== 0) {
        await Estate.query().where('id', estateId).update({ cover: fileData[0].url })
      }
    } else if (visualsType === ACTIVE_VISUALS_BY_AREA) {
      const roomData = (
        await Room.query()
          .where('estate_id', estateId)
          .with('images', function (i) {
            i.orderBy('order', 'asc')
          })
          .fetch()
      ).toJSON()
      let coverUrl = null

      if (roomData.length !== 0 && roomData[0]?.images?.length !== 0) {
        coverUrl = roomData[0]?.images[0].url
      } else {
        const externalFileData = await this.getFileByEstateId(estateId, FILE_TYPE_EXTERNAL)
        if (externalFileData.length !== 0) {
          coverUrl = externalFileData[0].url
        } else {
          const documentFileData = await this.getFileByEstateId(estateId, FILE_TYPE_PLAN)

          if (documentFileData.length !== 0) {
            coverUrl = documentFileData[0].url
          }
        }
      }
      if (coverUrl) {
        await Estate.query().where('id', estateId).update({ cover: coverUrl })
      }
    }
  }

  static async getFileByEstateId(estateId, type) {
    return (
      await File.query()
        .where('estate_id', estateId)
        .where('type', type)
        .orderBy('order', 'asc')
        .fetch()
    ).toJSON()
  }
}
module.exports = EstateService
