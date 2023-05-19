'use strict'
const moment = require('moment')
const {
  isEmpty,
  filter,
  omit,
  flatten,
  groupBy,
  countBy,
  maxBy,
  orderBy,
  sum,
  trim,
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
const { capitalize } = require('../Libs/utils')

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
} = require('../constants')

const {
  exceptions: { NO_ESTATE_EXIST, NO_FILE_EXIST, IMAGE_COUNT_LIMIT, FAILED_TO_ADD_FILE },
} = require('../../app/exceptions')

const HttpException = use('App/Exceptions/HttpException')
const EstateFilters = require('../Classes/EstateFilters')

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
      key: 'rooms_number',
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
    return await this.getActiveEstateQuery().where({ id }).first()
  }

  static async getByIdWithDetail(id) {
    return await this.getActiveEstateQuery()
      .where('id', id)
      .with('slots')
      .with('rooms', function (r) {
        r.with('images')
      })
      .with('files')
      .with('amenities')
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
      .where('estates.id', id)
      .whereNot('status', STATUS_DELETE)
      .withCount('notifications', function (n) {
        n.where('user_id', user_id)
      })
      .withCount('visits')
      .withCount('knocked')
      .withCount('decided')
      .withCount('invite')
      .withCount('final')
      .withCount('inviteBuddies')
      .with('point')
      .with('files')
      .with('current_tenant', function (q) {
        q.with('user')
      })
      .with('user', function (u) {
        u.select('id', 'company_id')
        u.with('company', function (c) {
          c.select('id', 'avatar', 'name', 'visibility')
          c.with('contacts', function (ct) {
            ct.select('id', 'full_name', 'company_id')
          })
        })
      })

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
      .with('estateSyncListings')

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
    const query = Estate.query().where({ id }).whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
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
          'contract_end',
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
      QueueService.getEstateCoords(estate.id)
      const estateData = await estate.toJSON({ isOwner: true })
      return {
        hash: estateHash?.hash || null,
        ...estateData,
      }
    } catch (e) {
      console.log('Creating estate error =', e.message)
      throw new HttpException(e.message, 500)
    }
  }

  static async updateEstate({ request, data, user_id }, trx = null) {
    data = request ? request.all() : data

    let updateData = {
      ...omit(data, ['delete_energy_proof', 'rooms', 'letting_type', 'cover_thumb']),
      status: STATUS_DRAFT,
    }

    let energy_proof = null
    const estate = await this.getByIdWithDetail(data.id)
    if (!estate) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }

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
            ...estate.toJSON({
              extraFields: ['verified_address', 'construction_year', 'cover_thumb'],
            }),
            ...updateData,
            energy_proof: null,
          }),
        }
      } else {
        const files = await this.saveEnergyProof(request)
        if (files && files.energy_proof) {
          updateData = {
            ...updateData,
            energy_proof: files.energy_proof,
            energy_proof_original_file: files.original_energy_proof,
            percent: this.calculatePercent({
              ...estate.toJSON({
                extraFields: ['verified_address', 'construction_year', 'cover_thumb'],
              }),
              ...updateData,
              energy_proof: files.energy_proof,
            }),
          }
        } else {
          updateData = {
            ...updateData,
            percent: this.calculatePercent({
              ...estate.toJSON({
                extraFields: ['verified_address', 'construction_year', 'cover_thumb'],
              }),
              ...updateData,
            }),
          }
        }
      }

      updateData = {
        ...estate.toJSON({
          extraFields: ['verified_address', 'cover_thumb'],
        }),
        ...updateData,
      }
      await estate.updateItemWithTrx(updateData, trx)
      await this.handleOfflineEstate({ estate_id: estate.id }, trx)

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
      // Run processing estate geo nearest
      if (data.address) {
        QueueService.getEstateCoords(estate.id)
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

      await trx.commit()
      return estate
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 500)
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
      await this.updatePercent({ estate_id: estate.id, files: [file.toJSON()] }, trx)
      await trx.commit()
      return file
    } catch (e) {
      await trx.rollback()
      throw new HttpException(FAILED_TO_ADD_FILE, 500)
    }
  }

  static async addManyFiles(data, trx) {
    try {
      const files = await File.createMany(data, trx)
      return files
    } catch (e) {
      console.log('AddManyFiles', e.message)
      throw new HttpException(FAILED_TO_ADD_FILE, 500)
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
      await this.updatePercent({ estate_id, deleted_files_ids: ids }, trx)
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
      throw new HttpException(e.message, 500)
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
      .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
      .first()
  }

  static getPublishedEstates(userID = null) {
    if (isEmpty(userID)) {
      return Estate.query()
    }

    return Estate.query()
      .where({ user_id: userID })
      .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
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
      await QueueService.notifyProspectWhoLikedButNotKnocked(estateId, userId, delay)
      await this.removeDislike(userId, estateId)
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
  static searchEstatesQuery(tenant) {
    return Database.select(Database.raw(`TRUE as inside`))
      .select('_e.*')
      .from({ _t: 'tenants' })
      .innerJoin({ _p: 'points' }, '_p.id', '_t.point_id')
      .crossJoin({ _e: 'estates' })
      .leftJoin({ _m: 'matches' }, function () {
        this.on('_m.user_id', tenant.user_id).on('_m.estate_id', '_e.id')
      })
      .where('_t.user_id', tenant.user_id)
      .where(function () {
        this.orWhereNull('_m.id')
        this.orWhere('_m.status', MATCH_STATUS_NEW)
      })
      .where('_e.status', STATUS_ACTIVE)
      .whereRaw(Database.raw(`_ST_Intersects(_p.zone::geometry, _e.coord::geometry)`))
  }

  static async searchEstateByPoint(point_id) {
    return await Database.select(Database.raw(`TRUE as inside`))
      .select(
        '_e.id',
        '_e.coord_raw as coord',
        '_e.street',
        '_e.city',
        '_e.address',
        '_e.house_number',
        '_e.country'
      )
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

  static getActiveMatchesQuery(userId) {
    return this.getMachesQuery(Estate.query(), userId)
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
      .select('_m.updated_at')
      .select(Database.raw('COALESCE(_m.percent, 0) as match'))
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

  static getMachesQuery(query, userId) {
    return query
      .select('estates.*')
      .withCount('knocked')
      .select(Database.raw(`_m.percent AS match`))
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
      .orderBy('_m.percent', 'DESC')
  }
  /**
   * If tenant not active get points by zone/point+dist/range zone
   */
  static getNotActiveMatchesQuery(tenant, userId) {
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

    return this.getMachesQuery(query, userId)
  }

  /**
   *
   */
  static async getTenantAllEstates(userId, page = 1, limit = 20) {
    const tenant = await require('./TenantService').getTenantWithGeo(userId)
    if (!tenant) {
      throw new AppException('Tenant geo invalid')
    }
    let query = null
    if (tenant.isActive()) {
      query = this.getActiveMatchesQuery(userId)
    } else {
      query = this.getNotActiveMatchesQuery(tenant, userId)
    }

    return query.paginate(page, limit)
  }

  /**
   *
   */
  static async publishEstate({ estate, publishers, performed_by = null }, is_queue = false) {
    let status = estate.status
    const trx = await Database.beginTransaction()

    try {
      const user = await User.query().where('id', estate.user_id).first()
      if (!user) {
        throw new HttpException(NO_ESTATE_EXIST, 400)
      }
      if (user.company_id != null) {
        await CompanyService.validateUserContacts(estate.user_id)
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

      if (
        estate.available_start_at &&
        moment(estate.available_start_at).format(DATE_FORMAT) <=
          moment.utc(new Date()).format(DATE_FORMAT) &&
        (!estate.available_end_at ||
          moment(estate.available_end_at).format(DATE_FORMAT) >=
            moment.utc(new Date()).format(DATE_FORMAT))
      ) {
        status = STATUS_ACTIVE
        if (publishers?.length) {
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
        const subject = LANDLORD_REQUEST_PUBLISH_EMAIL_SUBJECT
        const deeplink = `${process.env.APP_URL}/properties?id=${estate.id}` //make a deeplink
        let textMessage =
          `Landlord: ${user.firstname} ${user.secondname}\r\n` +
          `Landlord Email: ${user.email}\r\n` +
          `Estate Address: ${capitalize(estate.address)}\r\n` +
          `Url: ${deeplink}\r\n` +
          `Marketplace Publishers:\r\n`
        publishers.map((publisher) => {
          textMessage += ` - ${publisher}\r\n`
        })
        await require('./MailService').sendEmailToSupport({ subject, textMessage })
        // Run match estate
        Event.fire('match::estate', estate.id)
      }

      await estate.publishEstate(status, trx)

      if (!is_queue) {
        //send email to support for landlord update...
        QueueService.sendEmailToSupportForLandlordUpdate({
          type: PUBLISH_ESTATE,
          landlordId: estate.user_id,
          estateIds: [estate.id],
        })
        Event.fire('mautic:syncContact', estate.user_id, { published_property: 1 })
      }

      await trx.commit()
      return status
    } catch (e) {
      console.log(`publish estate error estate id is ${estate.id} ${e.message} `)
      await trx.rollback()
      throw new HttpException(e.message, 500)
    }
  }

  static async extendEstate({
    user_id,
    estate_id,
    available_end_at,
    is_duration_later,
    min_invite_count,
  }) {
    return await EstateService.getQuery()
      .where('id', estate_id)
      .where('user_id', user_id)
      .whereIn('status', [STATUS_EXPIRE, STATUS_ACTIVE])
      .update({ available_end_at, is_duration_later, min_invite_count, status: STATUS_ACTIVE })
  }

  static async handleOfflineEstate({ estate_id, is_notification = true }, trx) {
    const matches = await Estate.query()
      .select('estates.*')
      .where('estates.id', estate_id)
      .innerJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', estate_id)
      })
      .select('_m.user_id as prospect_id')
      .whereNotIn('_m.status', [MATCH_STATUS_FINISH, MATCH_STATUS_NEW])
      .fetch()

    await Match.query()
      .where('estate_id', estate_id)
      .whereNotIn('status', [MATCH_STATUS_FINISH])
      .delete()
      .transacting(trx)

    await Visit.query().where('estate_id', estate_id).delete().transacting(trx)
    await Database.table('likes').where({ estate_id: estate_id }).delete().transacting(trx)
    await Database.table('dislikes').where({ estate_id: estate_id }).delete().transacting(trx)

    if (is_notification) {
      NoticeService.prospectPropertDeactivated(matches.rows)
    }
  }

  static async getEstatesByUserId({ user_ids, limit = -1, page = -1, params = {} }) {
    let query = this.getEstates(user_ids, params)
      .whereNot('estates.status', STATUS_DELETE)
      .with('slots')
      .with('rooms', function (q) {
        q.with('images')
      })
      .with('files')
      .with('estateSyncListings')

    if (params && params.id) {
      query.where('estates.id', params.id)
    }

    let result
    if (page === -1 || limit === -1) {
      result = await query.fetch()
    } else {
      result = await query.paginate(page, limit)
    }
    result.data = await this.checkCanChangeLettingStatus(result, { isOwner: true })
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
      this.on('estates.id', 'tasks.estate_id').onNotIn('tasks.status', [
        TASK_STATUS_DRAFT,
        TASK_STATUS_DELETE,
      ])
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

        const has_unread_message = Estate.landlord_has_unread_messages(
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
        is_published: false,
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

  static async checkCanChangeLettingStatus(result, option = {}) {
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
    const channel = `landlord:*`
    const topicName = `landlord:${user_id}`
    const topic = Ws.getChannel(channel).topic(topicName)
    if (topic) {
      topic.broadcast(WEBSOCKET_EVENT_VALID_ADDRESS, {
        id,
        coord,
        address,
      })
    }
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
  static async updatePercent(
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

    if (trx) {
      await Estate.query()
        .where('id', estate.id)
        .update({ percent: this.calculatePercent(percentData) })
        .transacting(trx)
    } else {
      await Estate.query()
        .where('id', estate.id)
        .update({ percent: this.calculatePercent(percentData) })
    }
    if (this.calculatePercent(percentData) >= ESTATE_COMPLETENESS_BREAKPOINT) {
      QueueService.sendEmailToSupportForLandlordUpdate({
        type: COMPLETE_CERTAIN_PERCENT,
        landlordId: estate.user_id,
        estateIds: [estate.id],
      })
    }
    return estate
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
      estates = await EstateService.getTenantAllEstates(user_id, page, limit)
      estates = await Promise.all(
        estates.rows.map(async (estate) => {
          estate = estate.toJSON({ isShort: true, role: ROLE_USER })
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

  static async duplicateEstate(user_id, estate_id) {
    const estate = await this.getByIdWithDetail(estate_id)
    if (estate?.user_id !== user_id) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }

    const duplicatedCount = await this.countDuplicateProperty(estate.property_id)
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
        property_id: `${originalEstateData.property_id}-${duplicatedCount + 1}`,
        available_start_at: null,
        available_end_at: null,
        status: STATUS_DRAFT,
        is_published: false,
        vacant_date: null,
        hash: null,
        shared_link: null,
        six_char_code: null,
        rent_end_at: null,
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
        ...omit(amenity, ['room_id', 'id']),
        estate_id: newEstate.id,
      }))

      await Amenity.createMany(newAmenities, trx)

      await trx.commit()
      const estates = await require('./EstateService').getEstatesByUserId({
        limit: 1,
        page: 1,
        params: { id: newEstate.id },
      })
      return estates.data?.[0]
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400, e.code || 0)
    }
  }
}
module.exports = EstateService
