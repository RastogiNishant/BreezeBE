const BaseController = require('./BaseController')
const Logger = use('Logger')
const ContactRequestMessage = use('App/Models/ContactRequestMessage')
const MarketPlaceService = use('App/Services/MarketPlaceService')
const Database = use('Database')
const moment = require('moment')

class ContactRequestController extends BaseController {
  constructor({ socket, request, auth }) {
    super({ socket, request, auth })
  }

  async onGetPreviousMessages(data) {
    try {
      const query = ContactRequestMessage.query()
        .select(Database.raw('contact_request_messages.id as id'))
        .select(Database.raw('contact_request_messages.message'))
        .select(Database.raw('null as attachments'))
        .select(Database.raw('contact_request_messages.created_at as dateTime'))
        .select(Database.raw(`senders.sender`))
        .innerJoin(
          'estate_sync_contact_requests',
          'estate_sync_contact_requests.id',
          'contact_request_messages.contact_request_id'
        )
        .innerJoin('estates', 'estates.id', 'estate_sync_contact_requests.estate_id')
        .leftJoin(
          Database.raw(`(select id,
        json_build_object('id', users.id, 'firstname', users.firstname, 
          'secondname', users.secondname, 'avatar', users.avatar
        ) as sender
        from users group by id) as senders`),
          'senders.id',
          'estates.user_id'
        )
        .where('contact_request_id', this.request.contactRequestId)
        .orderBy('contact_request_messages.id', 'desc')
      const previousMessages = await query.fetch()
      if (this.topic) {
        this.topic.emitTo(
          'previousMessages',
          {
            messages: previousMessages.toJSON() || [],
            topic: this.socket.topic
          },
          [this.socket.id]
        )
      }
    } catch (e) {
      Logger.error(`onGetPreviousMessages error ${e?.message}`)
      this.emitError(e?.message)
    }
  }

  async onMessage(message) {
    try {
      const newMessage = await MarketPlaceService.sendMessageToMarketplaceProspect({
        contactRequestId: this.request.contactRequestId,
        message: message.message,
        landlordId: this.user.id
      })
      const messageSent = {
        id: newMessage.id,
        message: message.message,
        attachments: null,
        topic: this.socket.topic,
        dateTime: moment.utc(new Date()).format(),
        sender: {
          id: this.user.id,
          firstname: this.user.firstname,
          secondname: this.user.secondname,
          avatar: this.user.avatar
        }
      }
      this.topic.broadcast('message', { message: messageSent })
    } catch (e) {
      Logger.error(`onMessage error ${e?.message}`)
      this.emitError(e?.message)
    }
  }

  async onRemoveMessage() {
    this.emitError('Messages sent to contact requests cannot be removed.')
  }

  async onEditMessage() {
    this.emitError('Messages sent to contact requests cannot be edited.')
  }
}

module.exports = ContactRequestController
