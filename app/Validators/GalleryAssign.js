'use strict'

const yup = require('yup')
const {
  GALLERY_INSIDE_VIEW_TYPE,
  GALLERY_DOCUMENT_VIEW_TYPE,
  FILE_TYPE_PLAN,
  FILE_TYPE_CUSTOM,
  DOCUMENT_VIEW_ENERGY_TYPE,
  FILE_TYPE_EXTERNAL,
} = require('../constants')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, OPTION, INVALID_IDS, SIZE, NUMBER },
} = require('../exceptions')

class GalleryAssign extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
      view_type: yup
        .string()
        .oneOf(
          [GALLERY_INSIDE_VIEW_TYPE, GALLERY_DOCUMENT_VIEW_TYPE, DOCUMENT_VIEW_ENERGY_TYPE],
          getExceptionMessage(
            'view_type',
            OPTION,
            `[${GALLERY_INSIDE_VIEW_TYPE},${GALLERY_DOCUMENT_VIEW_TYPE},${DOCUMENT_VIEW_ENERGY_TYPE}]`
          )
        )
        .required(),
      room_id: yup
        .number()
        .integer()
        .typeError(getExceptionMessage('room_id', NUMBER))
        .when('view_type', {
          is: GALLERY_INSIDE_VIEW_TYPE,
          then: yup
            .number()
            .integer()
            .required(getExceptionMessage('room_id', REQUIRED))
            .typeError(getExceptionMessage('room_id', NUMBER)),
        }),

      document_type: yup.string().when('view_type', {
        is: GALLERY_DOCUMENT_VIEW_TYPE,
        then: yup
          .string()
          .oneOf(
            [FILE_TYPE_PLAN, FILE_TYPE_CUSTOM, FILE_TYPE_EXTERNAL],
            getExceptionMessage(
              'document_type',
              OPTION,
              `[${FILE_TYPE_PLAN},${FILE_TYPE_CUSTOM}, ${FILE_TYPE_EXTERNAL}]`
            )
          )
          .required(getExceptionMessage('document_type', REQUIRED)),
      }),
      ids: yup
        .array()
        .of(yup.number().integer().positive().typeError(getExceptionMessage('ids', NUMBER)))
        .when('document_type', {
          is: DOCUMENT_VIEW_ENERGY_TYPE,
          then: yup
            .array()
            .of(yup.number().integer().positive().typeError(getExceptionMessage('ids', NUMBER)))
            .max(1, getExceptionMessage('ids', SIZE, 1)),
        })
        .required(getExceptionMessage('ids', REQUIRED))
        .typeError(getExceptionMessage(undefined, INVALID_IDS)),
    })
}

module.exports = GalleryAssign
