const Option = use('App/Models/Option')

const { remember } = require('../Libs/Cache')
const DataStorage = use('DataStorage')

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
  GLOBAL_CACHE_KEY,
  GLOBAL_CACHE_OPTION
} = require('../constants')

class OptionService {
  /**
   *
   */
  static async getOptions() {
    let options = await DataStorage.getItem(GLOBAL_CACHE_KEY, GLOBAL_CACHE_OPTION)
    if (!options) {
      options = (
        await Option.query().orderBy('type', 'asc').orderBy('order', 'asc').fetch()
      ).toJSON()
      await DataStorage.setItem(GLOBAL_CACHE_KEY, { options }, GLOBAL_CACHE_OPTION)
    } else {
      options = options.options
    }
    return options
  }

  static getRoomTypes() {
    return [
      {
        key_index: ROOM_TYPE_LIVING_ROOM,
        key_name: `ROOM_TYPE_LIVING_ROOM`,
        name: 'Living room',
        locale_key: 'landlord.property.inside_view.rooms.living_room.message'
      },
      {
        key_index: ROOM_TYPE_BATH,
        key_name: `ROOM_TYPE_BATH`,
        name: 'Bathroom',
        locale_key: 'landlord.property.inside_view.rooms.bathroom.message'
      },
      {
        key_index: ROOM_TYPE_BEDROOM,
        key_name: `ROOM_TYPE_BEDROOM`,
        name: 'Bedroom',
        locale_key: 'landlord.property.inside_view.rooms.bedroom.message'
      },
      {
        key_index: ROOM_TYPE_KITCHEN,
        key_name: `ROOM_TYPE_KITCHEN`,
        name: 'Kitchen',
        locale_key: 'landlord.property.inside_view.rooms.kitchen.message'
      },
      {
        key_index: ROOM_TYPE_CORRIDOR,
        key_name: `ROOM_TYPE_CORRIDOR`,
        name: 'Corridor',
        locale_key: 'landlord.property.inside_view.rooms.corridor.message'
      },
      {
        key_index: ROOM_TYPE_OFFICE,
        key_name: `ROOM_TYPE_OFFICE`,
        name: 'Office',
        locale_key: 'landlord.property.inside_view.rooms.office.message'
      },
      {
        key_index: ROOM_TYPE_PANTRY,
        key_name: `ROOM_TYPE_PANTRY`,
        name: 'Pantry',
        locale_key: 'landlord.property.inside_view.rooms.pantry.message'
      },
      {
        key_index: ROOM_TYPE_CHILDRENS_ROOM,
        key_name: `ROOM_TYPE_CHILDRENS_ROOM`,
        name: "Children's room",
        locale_key: 'landlord.property.inside_view.rooms.childrens_room.message'
      },
      {
        key_index: ROOM_TYPE_WC,
        key_name: `ROOM_TYPE_WC`,
        name: 'WC',
        locale_key: 'landlord.property.inside_view.rooms.wc.message'
      },
      {
        key_index: ROOM_TYPE_GUEST_ROOM,
        key_name: `ROOM_TYPE_GUEST_ROOM`,
        name: 'Guest room',
        locale_key: 'landlord.property.inside_view.rooms.guest_room.message'
      },
      {
        key_index: ROOM_TYPE_OTHER_SPACE,
        key_name: `ROOM_TYPE_OTHER_SPACE`,
        name: 'Other space',
        locale_key: 'landlord.property.inside_view.rooms.other_space.message'
      },
      {
        key_index: ROOM_TYPE_CHECKROOM,
        key_name: `ROOM_TYPE_CHECKROOM`,
        name: 'Checkroom',
        locale_key: 'landlord.property.inside_view.rooms.checkroom.message'
      },
      {
        key_index: ROOM_TYPE_DINING_ROOM,
        key_name: `ROOM_TYPE_DINING_ROOM`,
        name: 'Dinning room',
        locale_key: 'landlord.property.inside_view.rooms.dining_room.message'
      },
      {
        key_index: ROOM_TYPE_ENTRANCE_HALL,
        key_name: `ROOM_TYPE_ENTRANCE_HALL`,
        name: 'Entrance hall',
        locale_key: 'landlord.property.inside_view.rooms.entrance_hall.message'
      },
      {
        key_index: ROOM_TYPE_GYM,
        key_name: `ROOM_TYPE_GYM`,
        name: 'Gym',
        locale_key: 'landlord.property.inside_view.rooms.gym.message'
      },
      {
        key_index: ROOM_TYPE_IRONING_ROOM,
        key_name: `ROOM_TYPE_IRONING_ROOM`,
        name: 'Ironing room',
        locale_key: 'landlord.property.inside_view.rooms.ironing_room.message'
      },
      {
        key_index: ROOM_TYPE_LOBBY,
        key_name: `ROOM_TYPE_LOBBY`,
        name: 'Lobby',
        locale_key: 'landlord.property.inside_view.rooms.lobby.message'
      },
      {
        key_index: ROOM_TYPE_MASSAGE_ROOM,
        key_name: `ROOM_TYPE_MASSAGE_ROOM`,
        name: 'Massage room',
        locale_key: 'landlord.property.inside_view.rooms.massage_room.message'
      },
      {
        key_index: ROOM_TYPE_STORAGE_ROOM,
        key_name: `ROOM_TYPE_STORAGE_ROOM`,
        name: 'Storage',
        locale_key: 'landlord.property.inside_view.rooms.storageroom.message'
      },
      {
        key_index: ROOM_TYPE_PLACE_FOR_GAMES,
        key_name: `ROOM_TYPE_PLACE_FOR_GAMES`,
        name: 'Place for games',
        locale_key: 'landlord.property.inside_view.rooms.place_for_games.message'
      },
      {
        key_index: ROOM_TYPE_SAUNA,
        key_name: `ROOM_TYPE_SAUNA`,
        name: 'Sauna',
        locale_key: 'landlord.property.inside_view.rooms.sauna.message'
      },
      {
        key_index: ROOM_TYPE_SHOWER,
        key_name: `ROOM_TYPE_SHOWER`,
        name: 'Shower',
        locale_key: 'landlord.property.inside_view.rooms.shower.message'
      },
      {
        key_index: ROOM_TYPE_STAFF_ROOM,
        key_name: `ROOM_TYPE_STAFF_ROOM`,
        name: 'Staff room',
        locale_key: 'landlord.property.inside_view.rooms.staff_room.message'
      },
      {
        key_index: ROOM_TYPE_SWIMMING_POOL,
        key_name: `ROOM_TYPE_SWIMMING_POOL`,
        name: 'Swiming pool',
        locale_key: 'landlord.property.inside_view.rooms.swiming_pool.message'
      },
      {
        key_index: ROOM_TYPE_TECHNICAL_ROOM,
        key_name: `ROOM_TYPE_TECHNICAL_ROOM`,
        name: 'Technical room',
        locale_key: 'landlord.property.inside_view.rooms.technical_room.message'
      },
      {
        key_index: ROOM_TYPE_TERRACE,
        key_name: `ROOM_TYPE_TERRACE`,
        name: 'Terrace',
        locale_key: 'landlord.property.inside_view.rooms.terrace.message'
      },
      {
        key_index: ROOM_TYPE_WASHING_ROOM,
        key_name: `ROOM_TYPE_WASHING_ROOM`,
        name: 'Washing room',
        locale_key: 'landlord.property.inside_view.rooms.washing_room.message'
      },
      {
        key_index: ROOM_TYPE_EXTERNAL_CORRIDOR,
        key_name: `ROOM_TYPE_EXTERNAL_CORRIDOR`,
        name: 'External corridor',
        locale_key: 'landlord.property.inside_view.rooms.external_corridor.message'
      },
      {
        key_index: ROOM_TYPE_STAIRS,
        key_name: `ROOM_TYPE_STAIRS`,
        name: 'Stairs',
        locale_key: 'landlord.property.inside_view.rooms.stairs.message'
      },
      {
        key_index: ROOM_TYPE_GARDEN,
        key_name: `ROOM_TYPE_GARDEN`,
        name: 'Garden',
        locale_key: 'landlord.property.inside_view.rooms.garden.message'
      },
      {
        key_index: ROOM_TYPE_LOGGIA,
        key_name: `ROOM_TYPE_LOGGIA`,
        name: 'Liggia',
        locale_key: 'landlord.property.inside_view.rooms.loggia.message'
      },
      {
        key_index: ROOM_TYPE_BALCONY,
        key_name: `ROOM_TYPE_BALCONY`,
        name: 'Balcony',
        locale_key: 'landlord.property.inside_view.rooms.balcony.message'
      },
      {
        key_index: ROOM_TYPE_PROPERTY_ENTRANCE,
        key_name: `ROOM_TYPE_PROPERTY_ENTRANCE`,
        name: 'Property entrance',
        locale_key: 'landlord.property.inside_view.rooms.property_entrance.message'
      }
    ]
  }
}

module.exports = OptionService
