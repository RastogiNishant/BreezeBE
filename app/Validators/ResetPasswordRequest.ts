import * as yup from 'yup'
import { APP_CONFIG } from '../constants'

export const ResetPasswordRequest = {
  schema: () =>
    yup.object().shape({
      email: yup.string().email().lowercase().required(),
      from_web: yup.boolean(),
      lang: yup.string().oneOf(APP_CONFIG.SUPPORTED_LANGUAGE_LIST)
    })
}
