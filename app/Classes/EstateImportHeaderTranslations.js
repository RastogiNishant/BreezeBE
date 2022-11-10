const _ = require('lodash')
const l = use('Localize')
const HttpException = use('App/Exceptions/HttpException')
const addAsterisk = (string) => {
  return `${string} (*)`
}

class EstateImportHeaderTranslations {
  validHeaderVars = [
    'six_char_code',
    'property_id',
    'street',
    'house_number',
    'extra_address',
    'zip',
    'city',
    'country',
    'property_type',
    'letting',
    'use_type',
    'house_type',
    'construction_year',
    'last_modernization',
    'building_status',
    'number_floors',
    'energy_efficiency',
    'firing',
    'heating_type',
    'area',
    'rooms_number',
    'floor',
    'floor_direction',
    'apt_type',
    'apartment_status',
    'equipment_standard',
    'furnished',
    'parking_space_type',
    'room1_type',
    'room2_type',
    'room3_type',
    'room4_type',
    'room5_type',
    'room6_type',
    'net_rent',
    'additional_costs',
    'heating_costs',
    'stp_garage',
    'deposit',
    'currency',
    'available_date',
    'from_date',
    'txt_salutation',
    'surname',
    'contract_end',
    'phone_number',
    'email',
    'budget',
    'rent_arrears',
    'credit_score',
    'min_age',
    'max_age',
    'family_size_max',
    'minors',
    'pets_allowed',
  ]
}

module.exports = EstateImportHeaderTranslations
