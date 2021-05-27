'use strict'

const Database = use('Database')
const Schema = use('Schema')

const sql1 = `TRUNCATE options CASCADE;`

const sql2 = `
  INSERT INTO options (id, title, type)
  VALUES
    ('1', 'bicycle_storage_room', 'build'),
    ('2', 'common_room', 'build'),
    ('3', 'high_quality_entrance_hall', 'build'),
    ('4', 'mirror', 'build'),
    ('5', 'marble', 'build'),
    ('6', 'exclusive_lighting', 'build'),
    ('7', 'renewed_facade', 'build'),
    ('8', 'intercom_system_with_electric_door_opener', 'build'),
    ('9', 'elevator_5_floors', 'build'),
    ('10', 'thermal_insulation', 'build'),
    ('11', 'cellar', 'build'),
    ('12', 'house_entrance_door_not_lockable', 'build'),
    ('13', 'garage', 'build'),
    ('14', 'parking_space', 'build'),
    ('15', 'elevator', 'build'),
    ('16', 'storage_room', 'apt'),
    ('17', 'furnished', 'apt'),
    ('18', 'balcony', 'apt'),
    ('19', 'loggia', 'apt'),
    ('20', 'winter_roof_garden', 'apt'),
    ('21', 'mainly_underfloor_heating', 'apt'),
    ('22', 'roller_shutters', 'apt'),
    ('23', 'stucco', 'apt'),
    ('24', 'wainscoting', 'apt'),
    ('25', 'heating_pipes_not_visible', 'apt'),
    ('26', 'poor_cut', 'apt'),
    ('27', 'additional_burglar_alarm', 'apt'),
    ('28', 'thermal_insulation_glazing', 'apt'),
    ('29', 'single_glazing', 'apt'),
    ('30', 'washing_machine_not_placeable', 'apt'),
    ('31', 'high_quality_parquet', 'apt'),
    ('32', 'natural_artificial_stone', 'apt'),
    ('33', 'tiles', 'apt'),
    ('34', 'soundproof_windows', 'apt'),
    ('35', 'low_barrier_cut', 'apt'),
    ('36', 'fireplace', 'apt'),
    ('37', 'panoramic_view', 'apt'),
    ('38', 'south_facing', 'apt'),
    ('39', 'bright', 'apt'),
    ('40', 'roof_floor', 'apt'),
    ('41', 'exclusive_high_quality_luxury', 'apt'),
    ('42', 'preferred_city_location', 'out'),
    ('43', 'quiet', 'out'),
    ('44', 'polluted_by_traffic_noise', 'out'),
    ('45', 'heavily_neglected', 'out'),
    ('46', 'odorous', 'out'),
    ('47', 'childrens_playground', 'out'),
    ('48', 'benches', 'out'),
    ('49', 'rest_areas', 'out'),
    ('50', 'sidewalk_paving', 'out'),
    ('51', 'in_green', 'out'),
    ('52', 'lighting', 'out'),
    ('53', 'car_parking', 'out'),
    ('54', 'garden', 'out'),
    ('55', 'bicycle_parking', 'out'),
    ('56', 'courtyard', 'out'),
    ('57', 'with_window', 'kitchen'),
    ('58', 'sufficient_ventilation', 'kitchen'),
    ('59', 'separate_kitchen', 'kitchen'),
    ('60', 'fitted_kitchen', 'kitchen'),
    ('61', 'ceramic_hob', 'kitchen'),
    ('62', 'induction_hob', 'kitchen'),
    ('63', 'refrigerator', 'kitchen'),
    ('64', 'sink', 'kitchen'),
    ('65', 'gas_electric_stove_with_oven', 'kitchen'),
    ('66', 'high_quality_tiles', 'kitchen'),
    ('67', 'high_quality_linoleum', 'kitchen'),
    ('68', 'parquet', 'kitchen'),
    ('69', 'terrazzo', 'kitchen'),
    ('70', 'high_quality_laminate', 'kitchen'),
    ('71', 'central_hot_water_supply', 'kitchen'),
    ('72', 'extractor_fan', 'kitchen'),
    ('73', 'dishwasher', 'kitchen'),
    ('74', 'wood_coal_heating', 'kitchen'),
    ('75', 'large_washbasin', 'bad'),
    ('76', 'high_quality_bathroom_furniture', 'bad'),
    ('77', 'corner_bath', 'bad'),
    ('78', 'round_tub', 'bad'),
    ('79', 'bath_with_ventilation', 'bad'),
    ('80', 'second_wc', 'bad'),
    ('81', 'underfloor_heating', 'bad'),
    ('82', 'wall_covering', 'bad'),
    ('83', 'floor_covering', 'bad'),
    ('84', 'wall_hung_wc', 'bad'),
    ('85', 'towel_warmer', 'bad'),
    ('86', 'shower_tray', 'bad'),
    ('87', 'shower_cubicle', 'bad'),
    ('88', 'central_hot_water', 'bad'),
    ('89', 'with_window', 'bad'),
    ('90', 'bathtub', 'bad'),
    ('91', 'storage_room', 'room'),
    ('92', 'balcony', 'room'),
    ('93', 'loggia', 'room'),
    ('94', 'winter_roof_garden', 'room'),
    ('95', 'mainly_underfloor_heating', 'room'),
    ('96', 'roller_shutters', 'room'),
    ('97', 'stucco', 'room'),
    ('98', 'wainscoting', 'room'),
    ('99', 'heating_pipes_not_visible', 'room'),
    ('100', 'poor_cut', 'room'),
    ('101', 'additional_burglar_alarm', 'room'),
    ('102', 'thermal_insulation_glazing', 'room'),
    ('103', 'single_glazing', 'room'),
    ('104', 'washing_machine_not_placeable', 'room'),
    ('105', 'high_quality_parquet', 'room'),
    ('106', 'natural_artificial_stone', 'room'),
    ('107', 'tiles', 'room'),
    ('108', 'soundproof_windows', 'room'),
    ('109', 'low_barrier_cut', 'room'),
    ('110', 'fireplace', 'room'),
    ('111', 'panoramic_view', 'room'),
    ('112', 'south_facing', 'room'),
    ('113', 'bright', 'room'),
    ('114', 'roof_floor', 'room'),
    ('115', 'exclusive_high_quality_luxury', 'room');`

class EstatesSchema extends Schema {
  up() {
    this.drop('estate_option')
    this.table('estates', (table) => {
      table.specificType('options', 'INT[]')
    })

    this.schedule(async (trx) => {
      await Database.raw(sql1).transacting(trx)
      await Database.raw(`SELECT setval('options_id_seq', 116)`)
      await Database.raw(sql2).transacting(trx)
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('options')
    })
    this.create('estate_option', (table) => {
      table.increments()
      table.integer('estate_id').unsigned().references('id').inTable('estates').onDelete('cascade')
      table.integer('option_id').unsigned().references('id').inTable('options').onDelete('cascade')
    })
  }
}

module.exports = EstatesSchema
