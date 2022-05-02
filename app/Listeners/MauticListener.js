'use strict'

const MauticService = use('App/Services/MauticService')
const Mautic = (exports = module.exports = {})

Mautic.createContact = MauticService.createContact

Mautic.syncContact = MauticService.syncContact
