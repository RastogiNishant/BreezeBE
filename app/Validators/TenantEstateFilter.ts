import * as yup from 'yup'

export const TenantEstateFilter = {
  schema: (): any =>
    yup.object().shape({
      exclude: yup
        .array()
        .of(
          yup.mixed().test('isValid', 'Invalid Exclude', function (value) {
            const regex = /^[a-z]+-\d+$/
            return Number.isInteger(+value) || regex.test(value)
          })
        )
        .nullable(),
      limit: yup.number().integer().min(0).max(500)
    })
}

module.exports = {
  TenantEstateFilter
}
