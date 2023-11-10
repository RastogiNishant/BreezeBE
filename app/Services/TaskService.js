'use strict'
const {
  ROLE_LANDLORD,
  ROLE_USER,
  STATUS_DELETE,
  STATUS_EXPIRE,
  PREDEFINED_LAST,
  PREDEFINED_MSG_MULTIPLE_ANSWER_SIGNLE_CHOICE,
  PREDEFINED_MSG_MULTIPLE_ANSWER_MULTIPLE_CHOICE,
  PREDEFINED_MSG_OPEN_ENDED,
  CHAT_TYPE_BOT_MESSAGE,
  DEFAULT_LANG,
  PREDEFINED_MSG_MULTIPLE_ANSWER_CUSTOM_CHOICE,
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_RESOLVED,
  DATE_FORMAT,
  TASK_RESOLVE_HISTORY_PERIOD,
  TASK_STATUS_ARCHIVED,
  PREDEFINED_MSG_OPTION_SIGNLE_CHOICE,
  WEBSOCKET_EVENT_TASK_CREATED,
  TASK_SYSTEM_TYPE,
  TASK_STATUS_UNRESOLVED,
  SHOW_ACTIVE_TASKS_COUNT,
  TASK_COMMON_TYPE,
  TASK_ORDER_BY_URGENCY,
  WEBSOCKET_EVENT_TASK_UPDATED,
  MATCH_STATUS_KNOCK,
  NOTICE_TYPE_LANDLORD_SENT_TASK_MESSAGE
} = require('../constants')

const WebSocket = use('App/Classes/Websocket')
const l = use('Localize')
const { rc } = require('../Libs/utils')
const moment = require('moment')
const { generateAddress } = use('App/Libs/utils')

const { isArray, maxBy, countBy } = require('lodash')
const {
  TASK_STATUS_NEW,
  TASK_STATUS_DRAFT,
  TASK_STATUS_DELETE,
  ESTATE_FIELD_FOR_TASK
} = require('../constants')
const HttpException = require('../Exceptions/HttpException')

const {
  exceptions: { NO_TASK_FOUND, NO_ESTATE_EXIST, WRONG_PARAMS }
} = require('../exceptions')
const Estate = use('App/Models/Estate')
const Task = use('App/Models/Task')
const Chat = use('App/Models/Chat')
const PredefinedMessage = use('App/Models/PredefinedMessage')

const MatchService = use('App/Services/MatchService')
const EstateService = use('App/Services/EstateService')
const PredefinedMessageService = use('App/Services/PredefinedMessageService')

const Database = use('Database')
const TaskFilters = require('../Classes/TaskFilters')
const ChatService = require('./ChatService')
const NoticeService = require('./NoticeService')
const BaseService = require('./BaseService')
const MailService = require('./MailService')

class TaskService extends BaseService {
  static async create(request, user, trx) {
    const { ...data } = request.all()
    const tenant_id = await this.hasPermission({
      estate_id: data.estate_id,
      user_id: user.id,
      role: user.role
    })

    let task = {
      ...data,
      creator_role: user.role,
      tenant_id,
      status: TASK_STATUS_NEW,
      status_changed_by: user.role
    }

    const files = await this.saveFiles(request)
    if (files && files.file) {
      const path = !isArray(files.file) ? [files.file] : files.file
      const attachments = path.map((p) => {
        return { user_id: user.id, uri: p }
      })

      task = {
        ...task,
        attachments: JSON.stringify(attachments)
      }
    }

    return await Task.createItem(task, trx)
  }

  static async createGlobalTask({ tenantId, landlordId, estateId }, trx) {
    if (!landlordId) {
      const estate = await require('./EstateService').getById(estateId)
      if (!estate) {
        throw new HttpException(NO_ESTATE_EXIST, 400)
      }
      landlordId = estate.user_id
    }

    const systemTask = await Task.query()
      .where('tenant_id', tenantId)
      .where('estate_id', estateId)
      .where('type', TASK_SYSTEM_TYPE)
      .first()

    if (systemTask) {
      return systemTask
    }

    return await Task.createItem(
      {
        creator_role: ROLE_LANDLORD,
        tenant_id: tenantId,
        landlord_id: landlordId,
        title: '',
        type: TASK_SYSTEM_TYPE,
        status: TASK_STATUS_DRAFT,
        estate_id: estateId
      },
      trx
    )
  }

  static async init(user, data) {
    const {
      predefined_message_id,
      prev_predefined_message_id,
      predefined_message_choice_id,
      estate_id = null,
      task_id,
      answer
    } = data
    const { attachments } = data

    const lang = user.lang ?? DEFAULT_LANG

    // FIXME: predefined_message_id should be required?
    const predefinedMessage = await PredefinedMessage.query()
      .where('id', predefined_message_id)
      .firstOrFail()

    // Fetch estate and also check the tenant has valid "EstateCurrentTenant" for this estate

    let estate = null

    if (estate_id) {
      estate = await Estate.query()
        .whereNot('estates.status', STATUS_DELETE)
        .select('estates.user_id')
        .where('estates.id', estate_id)
        .innerJoin('estate_current_tenants', function () {
          this.on('estate_current_tenants.estate_id', 'estates.id').on(
            'estate_current_tenants.user_id',
            user.id
          )
        })
        .whereNotIn('estate_current_tenants.status', [STATUS_DELETE, STATUS_EXPIRE])
        .first()

      if (!estate) {
        throw new HttpException('Estate not found', 404)
      }
    }

    if (predefinedMessage.step === undefined || predefinedMessage.step === null) {
      throw new HttpException('Predefined message has to provide step ')
    }

    const trx = await Database.beginTransaction()

    try {
      let task = null

      // Handle task here.
      // If it is step 0, then create a task, else fetch the task
      if (predefinedMessage.step === 0) {
        if (task_id) throw new HttpException('There is already task. You can not create new task')
        task = await TaskService.handleFirstStep(user.id, estate_id, trx)
      } else {
        if (!task_id)
          throw new HttpException('You should have task to proceed with this predefined message')
        task = await this.getTaskById({ id: task_id, user })
      }

      let nextPredefinedMessage = null
      let messages = []

      // Create chat message that sent by the landlord according to the predefined message
      const landlordMessage = await Chat.createItem(
        {
          task_id: task.id,
          sender_id: estate?.user_id || null,
          text: rc(l.get(predefinedMessage.text, lang), [
            { name: user?.firstname + (user?.secondname ? ' ' + user?.secondname : '') }
          ]),
          type: CHAT_TYPE_BOT_MESSAGE
        },
        trx
      )
      messages.push(landlordMessage.toJSON())

      if (predefinedMessage.type === PREDEFINED_LAST) {
        task.status = TASK_STATUS_NEW
        /*
         * need to determine to send email to a user who will be a landlord later after signing up
         * Here figma design goes
         * https://www.figma.com/file/HlARfzphIIBod970Libkze/Prospects?node-id=19939-577&t=5gpiYu1FQFMSlWOz-0
         */
        await require('./OutsideLandlordService').handleTaskWithoutEstate(task, trx)
      } else if (
        predefinedMessage.type === PREDEFINED_MSG_MULTIPLE_ANSWER_SIGNLE_CHOICE ||
        predefinedMessage.type === PREDEFINED_MSG_MULTIPLE_ANSWER_MULTIPLE_CHOICE ||
        predefinedMessage.type === PREDEFINED_MSG_MULTIPLE_ANSWER_CUSTOM_CHOICE ||
        predefinedMessage.type === PREDEFINED_MSG_OPTION_SIGNLE_CHOICE
      ) {
        const resp = await PredefinedMessageService.handleMessageWithChoice(
          {
            answer,
            prev_predefined_message_id,
            task,
            predefinedMessage,
            predefined_message_choice_id,
            lang
          },
          trx
        )

        nextPredefinedMessage = resp.nextPredefinedMessage
        task = resp.task
        messages.push(resp.tenantMessage)
      } else if (predefinedMessage.type === PREDEFINED_MSG_OPEN_ENDED) {
        const resp = await PredefinedMessageService.handleOpenEndedMessage(
          {
            task,
            predefinedMessage,
            answer,
            attachments
          },
          trx
        )

        task = resp.task
        messages.push(resp.tenantMessage)
      }

      // Find the next predefined message by step if not assigned yet and if it's not last message
      if (!nextPredefinedMessage && predefinedMessage.type !== PREDEFINED_LAST) {
        nextPredefinedMessage = await PredefinedMessage.query()
          .where('step', predefinedMessage.step + 1)
          .firstOrFail()
      }

      task.next_predefined_message_id = nextPredefinedMessage ? nextPredefinedMessage.id : null

      task.attachments = task.attachments ? JSON.stringify(task.attachments) : null
      await task.save(trx)

      messages = await ChatService.getItemsWithAbsoluteUrl(messages)
      await trx.commit()

      if (predefinedMessage.type === PREDEFINED_LAST) {
        /*
         * need to determine to send email to a user who will be a landlord later after signing up
         * Here figma design goes
         * https://www.figma.com/file/HlARfzphIIBod970Libkze/Prospects?node-id=19939-577&t=5gpiYu1FQFMSlWOz-0
         */
        // unassigned task
        if (!task.estate_id) {
          await require('./OutsideLandlordService').noticeInvitationToLandlord({
            user,
            task_id: task.id
          })
        } else {
          // assigned task
          await this.sendTaskCreated({ estate_id: task.estate_id })
        }
      }

      return { task, messages }
    } catch (error) {
      await trx.rollback()
      throw new HttpException(error.message)
    }
  }

  static async handleFirstStep(tenant_id, estate_id, trx) {
    const task = await Task.createItem(
      {
        estate_id,
        tenant_id,
        creator_role: ROLE_USER,
        status: TASK_STATUS_DRAFT
      },
      trx
    )
    return task
  }

  static async update({ user, task }, trx) {
    if (user.role === ROLE_LANDLORD) {
      await EstateService.hasPermission({ id: task.estate_id, user_id: user.id })
    }

    const query = Task.query().where('id', task.id).where('estate_id', task.estate_id)

    if (user.role === ROLE_USER) {
      query.where('tenant_id', user.id)
    }

    const taskRow = await query.firstOrFail()
    task.status_changed_by = user.role
    let taskResult = null
    if (trx) {
      taskResult = await taskRow.updateItemWithTrx({ ...task }, trx)
    } else {
      taskResult = await taskRow.updateItem({ ...task })
    }
    // tasks.landlord_id is not always populated
    const estate = await EstateService.getById(task.estate_id)
    let user_id = taskRow.tenant_id
    let role = ROLE_USER
    if (user.role === ROLE_USER) {
      user_id = estate.user_id
      role = ROLE_LANDLORD
    }
    await TaskService.emitToChannel({
      user_id,
      role,
      event: WEBSOCKET_EVENT_TASK_UPDATED,
      data: {
        ...taskRow.toJSON(),
        property_id: estate.property_id,
        estate_id: task.estate_id,
        task_id: task.id
      }
    })

    // send notification to tenant to inform task has been resolved
    if (user.role === ROLE_LANDLORD && task.status === TASK_STATUS_RESOLVED) {
      NoticeService.notifyTenantTaskResolved([
        {
          user_id: taskRow.tenant_id,
          estate_id: taskRow.estate_id
        }
      ])
    }
    return taskResult
  }

  /**
   *
   * @param {*} estate_id
   * This function is only used when removing estate
   * can't be used controller directly without checking permission
   */
  static async deleteByEstateById(estate_id, trx) {
    const chatService = require('./ChatService')
    const PredefinedAnswerService = require('./PredefinedAnswerService')
    const tasks = (await Task.query().select('id').where('estate_id', estate_id).fetch()).rows

    if (tasks && tasks.length) {
      const taskIds = tasks.map((task) => task.id)
      await chatService.removeChatsByTaskIds(taskIds, trx)
      await PredefinedAnswerService.deleteByTaskIds(taskIds, trx)
    }

    return await Task.query()
      .where('estate_id', estate_id)
      .update({ status: TASK_STATUS_DELETE })
      .transacting(trx)
  }

  static async delete({ id, user }, trx) {
    const task = await this.get(id)
    if (task?.type === TASK_SYSTEM_TYPE) {
      // system task can't be deleted. created by system automatically for top match
      throw new HttpException(NO_TASK_FOUND, 400)
    }
    if (
      !(await this.hasPermission({
        estate_id: task.estate_id,
        user_id: user.id,
        role: user.role
      }))
    ) {
      throw new HttpException(NO_TASK_FOUND, 400)
    }

    const query = Task.query().where('id', id)

    if (trx) {
      await query.update({ status: TASK_STATUS_DELETE }).transacting(trx)
    } else {
      await query.update({ status: TASK_STATUS_DELETE })
    }

    return task
  }

  static async getTaskById({ id, estate_id, prospect_id, user }) {
    const taskQuery = Task.query()

    if (id) {
      taskQuery.where('id', id)
    } else {
      if (user.role === ROLE_LANDLORD) {
        if (!prospect_id) {
          throw new HttpException(WRONG_PARAMS, 400)
        }
        taskQuery.where('landlord_id', user.id)
        taskQuery.where('tenant_id', prospect_id)
      } else {
        taskQuery.where('tenant_id', user.id)
      }
    }

    if (estate_id) {
      taskQuery.where('estate_id', estate_id)
      taskQuery.where('type', TASK_SYSTEM_TYPE)
    }

    let task = await taskQuery
      .whereNot('status', TASK_STATUS_DELETE)
      .with('user', function (u) {
        u.select('id', 'avatar')
      })
      .with('estate', function (e) {
        e.select(ESTATE_FIELD_FOR_TASK)
      })
      .first()

    if (!task) {
      // if it is system task but not exists, we need to create one automatically
      if (estate_id) {
        const estate = await EstateService.getById(estate_id)
        const match = await require('./MatchService').getMatches(prospect_id || user.id, estate_id)
        if (estate && match?.status >= MATCH_STATUS_KNOCK) {
          task = await this.createGlobalTask({
            tenantId: prospect_id || user.id,
            landlordId: estate.user_id,
            estateId: estate_id
          })
          console.log('task here=', task)
        } else {
          return null
        }
      } else {
        return null
      }
    }

    if (user.role === ROLE_LANDLORD) {
      if (task.estate_id) {
        await EstateService.hasPermission({ id: task.estate_id, user_id: user.id })
      }
      if (task.email && task.email.toLowerCase() !== user.email.toLowerCase()) {
        throw new HttpException(NO_TASK_FOUND, 400)
      }
    }

    if (user.role === ROLE_USER && task.tenant_id !== user.id) {
      throw new HttpException('No Permission')
    }

    task = await this.getWithAbsoluteUrl(task)
    return task
  }

  static async getUnassignedTask(id) {
    const task = await Task.query().where('id', id).with('user').first()
    if (!task) {
      throw new HttpException(NO_TASK_FOUND, 400)
    }
    return TaskService.convert(task.toJSON())
  }

  static convert(task) {
    const address = generateAddress({
      city: task.property_address?.city,
      street: task.property_address?.street,
      house_number: task.property_address?.housenumber,
      zip: task.property_address?.postcode,
      country: task.property_address?.country
    })

    return {
      id: task.id,
      activeTasks: [task],
      address,
      mosturgency: task.urgency,
      current_tenant: {
        salutation_int: task?.user?.sex,
        user: task.user
      },
      taskSummary: {
        activeTaskCount: 1,
        taskCount: 1,
        mostUrgency: task.urgency,
        mostUrgencyCount: 1
      }
    }
  }

  static async getAllUnassignedTasks({
    user_id,
    role = ROLE_LANDLORD,
    email,
    page = -1,
    limit = -1
  }) {
    const query = Task.query()
      .with('user')
      .whereNull('estate_id')
      .whereNotIn('status', [TASK_STATUS_DELETE, TASK_STATUS_DRAFT])

    if (role === ROLE_LANDLORD) {
      query.where('email', email)
    } else {
      query.where('tenant_id', user_id)
    }

    let tasks, count
    if (page === -1 || limit === -1) {
      tasks = await query.fetch()
      tasks = tasks.toJSON().map((task) => TaskService.convert(task))
      count = tasks.length
    } else {
      tasks = await query.paginate(page, limit)
      tasks = tasks.toJSON()
      tasks.data = (tasks.data || []).map((task) => TaskService.convert(task))
      count = tasks.total
    }

    return {
      tasks,
      count
    }
  }

  static async getAllTasks({
    user_id,
    role,
    estate_id,
    type,
    orderby,
    query,
    status,
    page = -1,
    limit = -1
  }) {
    const taskQuery = Task.query()
      .select('tasks.*')
      .select(
        Database.raw(
          `coalesce( tasks.unread_role = ${role} AND tasks.unread_count > 0 , false) as is_unread_task`
        )
      )
      .select(
        Database.raw(`coalesce(
        ("tasks"."status"<= ${TASK_STATUS_INPROGRESS}
          or ("tasks"."status" = ${TASK_STATUS_RESOLVED}
          and "tasks"."updated_at" > '${moment
            .utc()
            .subtract(TASK_RESOLVE_HISTORY_PERIOD, 'd')
            .format(DATE_FORMAT)}' 
          and "tasks"."status_changed_by" = ${ROLE_LANDLORD})), false) as is_active_task`)
      )

    const estateFields = ESTATE_FIELD_FOR_TASK.map((field) => `_e.${field}`)
    taskQuery.select(estateFields)

    if (role === ROLE_USER) {
      taskQuery.whereNotIn('tasks.status', [TASK_STATUS_DELETE, TASK_STATUS_DRAFT])
      taskQuery.where('tenant_id', user_id)
      taskQuery.innerJoin({ _e: 'estates' }, function () {
        this.on('_e.id', 'tasks.estate_id')
      })
    } else {
      taskQuery.whereNotIn('tasks.status', [TASK_STATUS_DELETE, TASK_STATUS_DRAFT])
      taskQuery.innerJoin({ _e: 'estates' }, function () {
        this.on('_e.id', 'tasks.estate_id').on('_e.user_id', user_id)
      })
    }

    if (status) {
      taskQuery.whereIn('tasks.status', Array.isArray(status) ? status : [status])
    } else {
      taskQuery.whereNotIn('tasks.status', [
        TASK_STATUS_ARCHIVED,
        TASK_STATUS_DELETE,
        TASK_STATUS_DRAFT
      ])
    }

    taskQuery.select('_u.firstname', '_u.secondname', '_u.sex', '_u.avatar')
    taskQuery.leftJoin({ _u: 'users' }, function () {
      this.on('_u.id', 'tasks.tenant_id')
    })

    if (type) {
      taskQuery.where('tasks.type', type)
    }

    if (estate_id) {
      taskQuery.where('tasks.estate_id', estate_id)
    }

    if (query) {
      taskQuery.where(function () {
        this.orWhere('property_id', 'ilike', `%${query}%`)
        this.orWhere('address', 'ilike', `%${query}%`)
        this.orWhere('tasks.title', 'ilike', `%${query}%`)
        this.orWhere('tasks.description', 'ilike', `%${query}%`)
        this.orWhere('_u.firstname', 'ilike', `%${query}%`)
        this.orWhere('_u.secondname', 'ilike', `%${query}%`)
      })
    }

    if (orderby === TASK_ORDER_BY_URGENCY) {
      taskQuery
        .orderBy('tasks.status', 'asc')
        .orderBy('tasks.urgency', 'desc')
        .orderBy('is_unread_task', 'desc')
    } else {
      taskQuery
        .orderBy('is_unread_task', 'desc')
        .orderBy('tasks.status', 'asc')
        .orderBy('tasks.urgency', 'desc')
    }

    taskQuery.orderBy('tasks.updated_at', 'desc')

    let tasks = null
    let count = 0

    if (page === -1 || limit === -1) {
      tasks = await taskQuery.fetch()
      count = tasks.rows.length
    } else {
      tasks = await taskQuery.paginate(page, limit)
      count = tasks.pages.total
    }

    tasks = await Promise.all(
      tasks.rows.map(async (t) => {
        return await TaskService.getWithAbsoluteUrl(t)
      })
    )

    return {
      tasks,
      count
    }
  }

  static async getTaskSummary(estate_id) {
    const tasks = (
      await Task.query()
        .where('estate_id', estate_id)
        .whereNotIn('status', [TASK_STATUS_ARCHIVED, TASK_STATUS_DELETE, TASK_STATUS_DRAFT])
        .where('type', TASK_COMMON_TYPE)
        .orderBy('created_at')
        .orderBy('urgency')
        .fetch()
    ).toJSON()

    const activeTasks = (tasks || []).filter(
      (task) => task.status === TASK_STATUS_NEW || task.status === TASK_STATUS_INPROGRESS
    )

    const closed_tasks_count =
      (tasks || []).filter(
        (task) => task.status === TASK_STATUS_RESOLVED || task.status === TASK_STATUS_UNRESOLVED
      ).length || 0

    const in_progress_task =
      countBy(tasks || [], (task) => task.status === TASK_STATUS_INPROGRESS).true || 0

    const mostUrgency = maxBy(activeTasks, (re) => {
      return re.urgency
    })

    return {
      activeTasks: (activeTasks || []).slice(0, SHOW_ACTIVE_TASKS_COUNT),
      in_progress_task,
      mosturgency: mostUrgency?.urgency,
      taskSummary: {
        taskCount: tasks?.length || 0,
        activeTaskCount: activeTasks.length,
        closed_tasks_count,
        mostUrgency: mostUrgency?.urgency || null,
        mostUrgencyCount: mostUrgency
          ? countBy(activeTasks, (re) => re.urgency === mostUrgency.urgency).true || 0
          : 0
      }
    }
  }

  static async count({ estate_id, status, urgency, role }) {
    const query = Database.table('tasks')
      .count('*')
      .where('estate_id', estate_id)
      .whereNotIn('status', [TASK_STATUS_DELETE, TASK_STATUS_ARCHIVED])

    if (status) {
      if (!isArray(status)) {
        status = [status]
      }
      query.whereIn('status', status)
    }

    if (urgency) {
      if (!isArray(urgency)) {
        urgency = [urgency]
      }
      query.whereIn('status', status)
    }

    if (role === ROLE_LANDLORD) {
      query.whereNotIn('status', [TASK_STATUS_DRAFT, TASK_STATUS_DELETE])
    }
    return await query
  }

  static async getEstateAllTasks({ user_id, id, params }) {
    const { page, limit, ...param } = params
    let query = Task.query()
      .select('tasks.*')
      .where('estate_id', id)
      .whereNotIn('tasks.status', [TASK_STATUS_ARCHIVED, TASK_STATUS_DRAFT, TASK_STATUS_DELETE])
      .innerJoin({ _e: 'estates' }, function () {
        this.on('tasks.estate_id', '_e.id').on('_e.user_id', user_id)
      })

    const filter = new TaskFilters(param, query)
    query = filter.process()

    query.orderBy('tasks.updated_at', 'desc')

    if (!page || page === -1 || !limit || limit === -1) {
      return await query.fetch()
    } else {
      return await query.paginate(page, limit)
    }
  }

  static async get(id) {
    return await Task.query().where('id', id).firstOrFail()
  }

  static async getWithTenantId({ id, tenant_id }) {
    return await Task.query()
      .where('id', id)
      .whereNotIn('status', [TASK_STATUS_DELETE])
      .where('tenant_id', tenant_id)
      .firstOrFail()
  }

  static async getWithDependencies(id) {
    return await Task.query()
      .where('id', id)
      .whereNotIn('status', [TASK_STATUS_DELETE])
      .with('estate')
      .with('users')
  }

  static async hasPermission({ task, estate_id, user_id, role }) {
    if (role === ROLE_LANDLORD && !estate_id) {
      throw new HttpException('No Estate provided', 400)
    }

    // to check if the user has permission
    if (role === ROLE_LANDLORD) {
      await EstateService.hasPermission({ id: estate_id, user_id })
    }

    // to check if the user is the tenant for that property.
    if (role === ROLE_USER) {
      if (!task) {
        if (!(await MatchService.getUserToChat({ user_id, estate_id, role }))) {
          throw new HttpException('No permission for task', 400)
        }
      } else if (task && task.tenant_id !== user_id) {
        throw new HttpException('No permission for task', 400)
      }
    }

    // if (role === ROLE_USER) {
    //   if (
    //     task.type !== TASK_SYSTEM_TYPE &&
    //     !(await require('./EstateCurrentTenantService').getInsideTenant({
    //       estate_id,
    //       user_id,
    //     }))
    //   ) {
    //     throw new HttpException('You are not a breeze member yet', 400)
    //   }
    // }

    if (estate_id) {
      const finalMatch = await MatchService.getFinalMatch(estate_id)
      return finalMatch?.user_id
    }

    if (role === ROLE_USER) {
      return user_id
    }

    return null
  }

  static async addImages(request, user) {
    const { id } = request.all()
    let task = await this.get(id)
    await this.hasPermission({ task, estate_id: task.estate_id, user_id: user.id, role: user.role })
    const files = await this.saveFiles(request)
    if (files && files.file) {
      const path = !isArray(files.file) ? [files.file] : files.file
      const pathJSON = path.map((p) => {
        return { user_id: user.id, uri: p }
      })

      task = {
        ...task.toJSON(),
        attachments: JSON.stringify((task.toJSON().attachments || []).concat(pathJSON))
      }

      await Task.query()
        .where('id', id)
        .update({ ...task })

      files.attachments = await this.getAbsoluteUrl(
        Array.isArray(files.file) ? files.file : [files.file]
      )
      return files
    }
    throw new HttpException('Image Not saved', 400)
  }

  static async removeImages({ id, user, uri }) {
    uri = uri.split(',')

    const task = await this.get(id)
    await this.hasPermission({ task, estate_id: task.estate_id, user_id: user.id, role: user.role })

    const trx = await Database.beginTransaction()
    try {
      const taskAttachments = task
        .toJSON()
        .attachments.filter(
          (attachment) => !(attachment.user_id === user.id && uri.includes(attachment.uri))
        )

      await Task.query()
        .where('id', id)
        .update({
          ...task.toJSON(),
          attachments:
            taskAttachments && taskAttachments.length ? JSON.stringify(taskAttachments) : null
        })
        .transacting(trx)

      const chat = await Chat.query()
        .select('*')
        .where('task_id', task.id)
        .where('sender_id', user.id)
        .where(Database.raw(`attachments::jsonb \\?| array['${uri.join(',')}']`))
        .first()

      if (chat) {
        const attachments = chat.attachments.filter((attachment) => !uri.includes(attachment))
        await ChatService.updateChatMessage(
          {
            id: chat.id,
            message: chat.message,
            attachments: attachments.length ? attachments : null
          },
          trx
        )
      }

      await trx.commit()
    } catch (e) {
      console.log('Remove image error=', e.message)
      await trx.rollback()
    }
  }

  static async archiveTask(estate_id, trx) {
    estate_id = !Array.isArray(estate_id) ? [estate_id] : estate_id
    await Task.query()
      .whereIn('estate_id', estate_id)
      .update({ status: TASK_STATUS_ARCHIVED })
      .transacting(trx)
  }

  static async updateUnreadMessageCount({ task_id, role, chat_id }, trx = null) {
    const unread_role = role === ROLE_LANDLORD ? ROLE_USER : ROLE_LANDLORD
    const task = await Task.query().where('id', task_id).first()

    if (task) {
      if (!task.unread_role || task.unread_role === role) {
        await Task.query()
          .where('id', task.id)
          .update({
            unread_count: 1,
            unread_role,
            first_not_read_chat_id: chat_id,
            status: TASK_STATUS_INPROGRESS
          })
          .transacting(trx)
      } else {
        await Task.query()
          .where('id', task.id)
          .update({
            unread_count: +(task.unread_count || 0) + 1,
            unread_role,
            status: TASK_STATUS_INPROGRESS
          })
          .transacting(trx)
      }
    }
  }

  static async sendTaskCreated({ estate_id }) {
    if (!estate_id) {
      return
    }

    const estates = await require('./EstateService').getEstatesWithTask({ params: { estate_id } })

    if (!estates?.length) {
      return
    }
    this.emitTaskCreated({ user_id: estates[0].user_id, role: ROLE_LANDLORD, data: estates[0] })
  }

  static async emitTaskCreated({ user_id, role, data }) {
    if (role === ROLE_LANDLORD) {
      WebSocket.publishToLandlord({ event: WEBSOCKET_EVENT_TASK_CREATED, userId: user_id, data })
    } else {
      WebSocket.publishToTenant({ event: WEBSOCKET_EVENT_TASK_CREATED, userId: user_id, data })
    }
  }

  static async emitToChannel({ user_id, role, event, data }) {
    if (role == ROLE_LANDLORD) {
      WebSocket.publishToLandlord({
        event,
        userId: user_id,
        data
      })
    } else {
      WebSocket.publishToTenant({
        event,
        userId: user_id,
        data
      })
    }
  }

  static async getGlobalTaskByEstateIdAndTenantId({ tenantId, estateId }) {
    const task = await Task.query()
      .select('id')
      .where('type', TASK_SYSTEM_TYPE)
      .where('tenant_id', tenantId)
      .where('estate_id', estateId)
      .first()
    return task ? task.id : null
  }
}

module.exports = TaskService
