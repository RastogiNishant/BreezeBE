'use strict'

const MatchListener = (exports = module.exports = {})
const MatchService = use('App/Services/MatchService')

MatchListener.matchByEstate = async (estateId) => {
  await MatchService.matchByEstate(estateId)
}
