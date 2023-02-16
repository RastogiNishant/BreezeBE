'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')
const {
  ROOM_TYPE_GUEST_ROOM,
  ROOM_TYPE_BATH,
  ROOM_TYPE_BEDROOM,
  ROOM_TYPE_KITCHEN,
  ROOM_TYPE_CORRIDOR,
  ROOM_TYPE_OFFICE,
  ROOM_TYPE_PANTRY,
  ROOM_TYPE_CHILDRENS_ROOM,
  ROOM_TYPE_BALCONY,
  ROOM_TYPE_WC,
  ROOM_TYPE_OTHER_SPACE,
  ROOM_TYPE_CHECKROOM,
  ROOM_TYPE_DINING_ROOM,
  ROOM_TYPE_ENTRANCE_HALL,
  ROOM_TYPE_GYM,
  ROOM_TYPE_IRONING_ROOM,
  ROOM_TYPE_LIVING_ROOM,
  ROOM_TYPE_LOBBY,
  ROOM_TYPE_MASSAGE_ROOM,
  ROOM_TYPE_STORAGE_ROOM,
  ROOM_TYPE_PLACE_FOR_GAMES,
  ROOM_TYPE_SAUNA,
  ROOM_TYPE_SHOWER,
  ROOM_TYPE_STAFF_ROOM,
  ROOM_TYPE_SWIMMING_POOL,
  ROOM_TYPE_TECHNICAL_ROOM,
  ROOM_TYPE_TERRACE,
  ROOM_TYPE_WASHING_ROOM,
  ROOM_TYPE_EXTERNAL_CORRIDOR,
  ROOM_TYPE_STAIRS,
  ROOM_TYPE_PROPERTY_ENTRANCE,
  ROOM_TYPE_GARDEN,
  ROOM_TYPE_LOGGIA,
} = require('../constants')

class CreateRoom extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
      name: yup.string().max(255),
      type: yup
        .number()
        .positive()
        .oneOf([
          ROOM_TYPE_GUEST_ROOM,
          ROOM_TYPE_BATH,
          ROOM_TYPE_BEDROOM,
          ROOM_TYPE_KITCHEN,
          ROOM_TYPE_CORRIDOR,
          ROOM_TYPE_OFFICE,
          ROOM_TYPE_PANTRY,
          ROOM_TYPE_CHILDRENS_ROOM,
          ROOM_TYPE_BALCONY,
          ROOM_TYPE_WC,
          ROOM_TYPE_OTHER_SPACE,
          ROOM_TYPE_CHECKROOM,
          ROOM_TYPE_DINING_ROOM,
          ROOM_TYPE_ENTRANCE_HALL,
          ROOM_TYPE_GYM,
          ROOM_TYPE_IRONING_ROOM,
          ROOM_TYPE_LIVING_ROOM,
          ROOM_TYPE_LOBBY,
          ROOM_TYPE_MASSAGE_ROOM,
          ROOM_TYPE_STORAGE_ROOM,
          ROOM_TYPE_PLACE_FOR_GAMES,
          ROOM_TYPE_SAUNA,
          ROOM_TYPE_SHOWER,
          ROOM_TYPE_STAFF_ROOM,
          ROOM_TYPE_SWIMMING_POOL,
          ROOM_TYPE_TECHNICAL_ROOM,
          ROOM_TYPE_TERRACE,
          ROOM_TYPE_WASHING_ROOM,
          ROOM_TYPE_EXTERNAL_CORRIDOR,
          ROOM_TYPE_STAIRS,
          ROOM_TYPE_PROPERTY_ENTRANCE,
          ROOM_TYPE_GARDEN,
          ROOM_TYPE_LOGGIA,
        ])
        .required(),
      area: yup.number().min(0),
      options: yup.array().of(yup.string().lowercase().trim()),
      favorite: yup.boolean(),
      order: yup.number().positive(),
    })
}

module.exports = CreateRoom
