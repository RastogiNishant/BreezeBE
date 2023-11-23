import { object, string } from 'yup'
import { id } from '../Libs/schemas.js'

export const AcceptTerms = {
  schema: (): any =>
    object().shape({
      id: id.required(),
      type: string().oneOf(['agreement', 'terms']).required()
    })
}
