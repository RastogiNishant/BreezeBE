const _ = require('lodash')
const l = use('Localize')
const addAsterisk = (string) => {
  return `${string} (*)`
}

class EstateImportHeaderTranslations {
  //default English Headers
  headers = [
    'Breeze ID',
    'Your ID',
    'No.',
    'Street (*)',
    'House Number (*)',
    'Extra Address',
    'Postcode (*)',
    'City (*)',
    'Country (*)',
    'Property Type (*)',
    'Apartment Type',
    'House Type',
    'Use Type',
    'occupancy',
    'Ownership Type',
    'Letting Status',
    'Deal Type',
    'Net Rent',
    'Ancillary costs',
    'Utility Costs',
    'Parking Rent',
    'Deposit',
    'Available from',
    'Visit from',
    'Currency',
    'Construction',
    'Last modernization',
    'Building Status',
    'Number of floors',
    'Energy Consumption Value',
    'Energy Carrier',
    'Heating Type',
    'Living Space',
    'Number_of_Rooms',
    'Floor',
    'Apartment Status',
    'Amenities Type',
    'Furnished',
    'Parking Space Type',
    'Room 1',
    'Tags 1',
    'Room 2',
    'Tags 2',
    'Room 3',
    'Tags 3',
    'Room 4',
    'Tags 4',
    'Room 5',
    'Tags 5',
    'Room 6',
    'Tags 6',
    'Salary Burden Max',
    'Rent Arrears',
    'Credit Score Min',
    'Tenant Age Min',
    'Tenant Age Max',
    'Family Size Max',
    'Family Status',
    'Smoking Allowed',
    'Kids Allowed',
    'Surname',
    'Contract End',
    'Pets Allowed',
    'Salutation',
    'Minors',
    'Tel',
    'Tel.',
    'Email',
  ]
  columnIdentifiers = [
    'six_char_code',
    'property_id',
    'num',
    'street',
    'house_number',
    'address',
    'zip',
    'city',
    'country',
    'property_type',
    'apt_type',
    'house_type',
    'use_type',
    'occupancy',
    'ownership_type',
    'letting_status',
    'marketing_type',
    'net_rent',
    'ancillary_costs',
    'additional_costs',
    'stp_garage',
    'deposit',
    'available_date',
    'from_date',
    'currency',
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
    'apartment_status',
    'equipment_standard',
    'furnished',
    'parking_space_type',
    'room1_type',
    'room1_tags',
    'room2_type',
    'room2_tags',
    'room3_type',
    'room3_tags',
    'room4_type',
    'room4_tags',
    'room5_type',
    'room5_tags',
    'room6_type',
    'room6_tags',
    'budget',
    'rent_arrears',
    'credit_score',
    'tenant_min_age',
    'tenant_max_age',
    'family_size',
    'family_status',
    'non_smoker',
    'kids_allowed',
    'surname',
    'contract_end',
    'pets_allowed',
    'txt_salutation',
    'minors',
    'tenant_tel_en',
    'tenant_tel_de',
    'tenant_email',
  ]
  constructor(lang) {
    if (lang !== 'en') {
      this.headers = [
        _.toLower(l.get('web.letting.property.import.Breeze_ID_cap.message')),
        _.toLower(l.get('web.letting.property.import.Your_ID.message')),
        _.toLower(l.get('web.letting.property.import.No.message', lang)),
        _.toLower(addAsterisk(l.get('web.letting.property.import.Street.message', lang))),
        _.toLower(addAsterisk(l.get('web.letting.property.import.House_Number.message', lang))),
        _.toLower(l.get('web.letting.property.import.Extra_Address.message', lang)),
        _.toLower(addAsterisk(l.get('web.letting.property.import.Postcode.message', lang))),
        _.toLower(addAsterisk(l.get('web.letting.property.import.City.message', lang))),
        _.toLower(addAsterisk(l.get('web.letting.property.import.Country.message', lang))),
        _.toLower(l.get('web.letting.property.import.Property_Type.message', lang)),
        _.toLower(l.get('web.letting.property.import.Apartment_Type.message', lang)),
        _.toLower(l.get('web.letting.property.import.House_Type.message', lang)),
        _.toLower(l.get('web.letting.property.import.Use_Type.message', lang)),
        _.toLower(l.get('web.letting.property.import.occupancy.message', lang)),
        _.toLower(l.get('web.letting.property.import.Ownership_Type.message', lang)),
        _.toLower(addAsterisk(l.get('web.letting.property.letting_status.message', lang))),
        _.toLower(l.get('web.letting.property.import.Deal_Type.message', lang)),
        _.toLower(l.get('web.letting.property.import.Net_Rent.message', lang)),
        _.toLower(l.get('web.letting.property.import.Extra_Costs.message', lang)),
        _.toLower(l.get('web.letting.property.import.Additional_Costs.message', lang)),
        _.toLower(l.get('web.letting.property.import.Parking_Rent.message', lang)),
        _.toLower(l.get('web.letting.property.import.Deposit.message', lang)),
        _.toLower(l.get('web.letting.property.import.Available_from.message', lang)),
        _.toLower(l.get('web.letting.property.import.Visit_from.message', lang)),
        _.toLower(l.get('web.letting.property.import.Currency.message', lang)),
        _.toLower(l.get('web.letting.property.import.Construction.message', lang)),
        _.toLower(l.get('web.letting.property.import.Last_modernization.message', lang)),
        _.toLower(l.get('web.letting.property.import.Building_Status.message', lang)),
        _.toLower(l.get('web.letting.property.import.Number_of_floors.message', lang)),
        _.toLower(l.get('web.letting.property.import.Energy_Consumption_Value.message', lang)),
        _.toLower(l.get('web.letting.property.import.Energy_Carrier.message', lang)),
        _.toLower(l.get('web.letting.property.import.Heating_Type.message', lang)),
        _.toLower(l.get('web.letting.property.import.Living_Space.message', lang)),
        _.toLower(l.get('web.letting.property.import.Number_of_Rooms.message', lang)),
        _.toLower(l.get('web.letting.property.import.Floor.message', lang)),
        _.toLower(l.get('web.letting.property.import.Apartment_Status.message', lang)),
        _.toLower(l.get('web.letting.property.import.Amenities_Type.message', lang)),
        _.toLower(l.get('web.letting.property.import.Furnished.message', lang)),
        _.toLower(l.get('web.letting.property.import.Parking_Space_Type.message', lang)),
        _.toLower(l.get('web.letting.property.import.Room_1.message', lang)),
        _.toLower(l.get('web.letting.property.import.Tags_1.message', lang)),
        _.toLower(l.get('web.letting.property.import.Room_2.message', lang)),
        _.toLower(l.get('web.letting.property.import.Tags_2.message', lang)),
        _.toLower(l.get('web.letting.property.import.Room_3.message', lang)),
        _.toLower(l.get('web.letting.property.import.Tags_3.message', lang)),
        _.toLower(l.get('web.letting.property.import.Room_4.message', lang)),
        _.toLower(l.get('web.letting.property.import.Tags_4.message', lang)),
        _.toLower(l.get('web.letting.property.import.Room_5.message', lang)),
        _.toLower(l.get('web.letting.property.import.Tags_5.message', lang)),
        _.toLower(l.get('web.letting.property.import.Room_6.message', lang)),
        _.toLower(l.get('web.letting.property.import.Tags_6.message', lang)),
        _.toLower(l.get('web.letting.property.import.Salary_Burden.message', lang)),
        _.toLower(l.get('web.letting.property.import.Rent_Arrears.message', lang)),
        _.toLower(l.get('web.letting.property.import.Credit_Score.message', lang)),
        _.toLower(l.get('web.letting.property.import.Tenant_Age_Min.message', lang)),
        _.toLower(l.get('web.letting.property.import.Tenant_Age_Max.message', lang)),
        _.toLower(l.get('web.letting.property.import.Family_Size.message', lang)),
        _.toLower(l.get('web.letting.property.import.Family_Status.message', lang)),
        _.toLower(l.get('web.letting.property.import.Smoking_Allowed.message', lang)),
        _.toLower(l.get('web.letting.property.import.Kids_Allowed.message', lang)),
        _.toLower(l.get('web.letting.property.import.Surname.message', lang)),
        _.toLower(l.get('web.letting.property.import.Contract_End.message', lang)),
        _.toLower(l.get('web.letting.property.import.Pets_Allowed.message', lang)),
        _.toLower(l.get('prospect.settings.user_details.txt_salutation.message', lang)),
        _.toLower('Minors'),
        _.toLower('Tel'),
        _.toLower('Tel.'),
        _.toLower(l.get('email_signature.email.message', lang)),
      ]
    }
  }
  getHeaderVars(toLower = true) {
    let headers = []
    if (toLower) {
      headers = this.headers.map((header) => _.toLower(header))
    } else {
      headers = this.headers
    }
    return headers
  }
  getColumnVars() {
    let columnVars = []
    for (let count = 0; count < this.headers.length; count++) {
      columnVars[this.headers[count]] = this.columnIdentifiers[count]
    }
    return columnVars
  }
}

module.exports = EstateImportHeaderTranslations
