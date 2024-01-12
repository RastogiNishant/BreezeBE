import * as yup from 'yup'
import { SUPPORTED_LANGUAGES } from '../constants'

export const MatchSearchProspects = {
  schema: (): any =>
    yup.object().shape({
      q: yup.string().min(3).lowercase().required(),
      lang: yup.string().oneOf(Object.values(SUPPORTED_LANGUAGES))
    })
}

module.exports = {
  MatchSearchProspects
}
