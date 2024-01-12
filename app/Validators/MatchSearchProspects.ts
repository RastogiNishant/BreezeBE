import * as yup from 'yup'

export const MatchSearchProspects = {
  schema: (): any =>
    yup.object().shape({
      q: yup.string().min(3).lowercase().required(),
      lang: yup.string().oneOf(['en', 'de'])
    })
}

module.exports = {
  MatchSearchProspects
}
