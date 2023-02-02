'use strict'

const MatchListener = (exports = module.exports = {})
const MatchService = use('App/Services/MatchService')

MatchListener.matchByEstate = async (estateId) => {
  await MatchService.matchByEstate(estateId)
}

MatchListener.matchByUser = async (userId) => {
  await MatchService.matchByUser({ userId })
}
