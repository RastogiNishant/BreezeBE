import * as yup from 'yup'

export const MatchSearchProspects = {
  schema: (): any =>
    yup.object().shape({
      q: yup.string().min(3).lowercase().required()
    })
}

module.exports = {
  MatchSearchProspects
}
