const Event = use('Event')
const Helpers = use('Helpers')

if (!Helpers.isAceCommand()) {
  Event.on('estate::update', 'EstateListener.changeEstate')

  Event.on('match::estate', 'MatchListener.matchByEstate')
  Event.on('match::user', 'MatchListener.matchByUser')

  Event.on('memberPermission:create', 'MemberPermissionListener.createMemberPermission')
  Event.on('tenant::update', 'TenantListener.updateTenant')
}

/**
 * Run match on estate change
 */
