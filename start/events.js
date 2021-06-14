const Event = use('Event')
const Helpers = use('Helpers')

if (!Helpers.isAceCommand()) {
  Event.on('estate::update', 'EstateListener.changeEstate')
}
