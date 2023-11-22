import * as yup from 'yup'
import { APP_ROLES } from '../constants'

export const AdminGeneratePassword = {
  schema: (): any =>
    yup.object().shape({
      email: yup.string().email('Email must be valid').required('Email is required'),
      role: yup.number().oneOf([APP_ROLES.LANDLORD, APP_ROLES.USER]).required('Role is required'),
      password: yup.string()
    })
}
