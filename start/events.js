const Event = use('Event')
const Helpers = use('Helpers')

if (!Helpers.isAceCommand()) {
  Event.on('estate::update', 'EstateListener.changeEstate')
}

/**
 * Run match on estate change
 */
Event.on('match::estate', 'MatchListener.matchByEstate')
