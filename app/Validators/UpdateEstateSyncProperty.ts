import * as yup from 'yup'

export const UpdateEstateSyncProperty = {
  schema: () =>
    yup.object().shape({
      estateId: yup.number().integer().positive().required(),
      title: yup.string(),
      description: yup.string()
    })
}
