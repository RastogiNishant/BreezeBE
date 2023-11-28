import * as yup from 'yup'
import { phoneSchema } from '../Libs/schemas'

export const ResendSMS = {
  schema: (): any =>
    yup.object().shape({
      email: yup.string().email().lowercase().required(),
      phone: phoneSchema.required()
      // @TODO validate a code is present to verify
    })
}

module.exports = {
  ResendSMS
}
