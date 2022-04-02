const xlsx = require('node-xlsx')
const { get, has, isEmpty, reduce, isString, isFunction } = require('lodash')
const schema = require('../Validators/CreateEstate').schema()
const _ = require('lodash')
const l = use('Localize')

const HttpException = use('App/Exceptions/HttpException')
const EstateAttributeTranslations = require('./EstateAttributeTranslations')

class ExcelReader {
  dataMapping = {}
  constructor() {
    this.headerCol = 4
    this.sheetName = 'data'
    this.columns = [
      'No.',
      'Landlord email address',
      'Street',
      'House Number',
      'Extra Address',
      'Postcode',
      'City',
      'Country',
      'Property ID',
      'Property Type',
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
      'Area 1',
      'Name 1',
      'Photos 1',
      'Room 2',
      'Tags 2',
      'Area 2',
      'Name 2',
      'Photos 2',
      'Room 3',
      'Tags 3',
      'Area 3',
      'Name 3',
      'Photos 3',
      'Room 4',
      'Tags 4',
      'Area 4',
      'Name 4',
      'Photos 4',
      'Room 5',
      'Tags 5',
      'Area 5',
      'Name 5',
      'Photos 5',
      'Room 6',
      'Tags 6',
      'Area 6',
      'Name 6',
      'Photos 6',
      'Salutation',
      'Surname',
      'Contract End',
      'Tel',
      'Email',
      'Salary Burden',
      'Rent Arrears',
      'Credit Score',
      'Tenant Age Min',
      'Tenant Age Max',
      'Family Status',
      'Smoking Allowed',
      'Kids Allowed',
    ]
    this.columnVar = this.columns = [
      'No.',
      'Landlord email address',
      'Street',
      'House Number',
      'Extra Address',
      'Postcode',
      'City',
      'Country',
      'Property ID',
      'Property Type',
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
      'Area 1',
      'Name 1',
      'Photos 1',
      'Room 2',
      'Tags 2',
      'Area 2',
      'Name 2',
      'Photos 2',
      'Room 3',
      'Tags 3',
      'Area 3',
      'Name 3',
      'Photos 3',
      'Room 4',
      'Tags 4',
      'Area 4',
      'Name 4',
      'Photos 4',
      'Room 5',
      'Tags 5',
      'Area 5',
      'Name 5',
      'Photos 5',
      'Room 6',
      'Tags 6',
      'Area 6',
      'Name 6',
      'Photos 6',
      'Salutation',
      'Surname',
      'Contract End',
      'Tel',
      'Email',
      'Salary Burden',
      'Rent Arrears',
      'Credit Score',
      'Tenant Age Min',
      'Tenant Age Max',
      'Family Status',
      'Smoking Allowed',
      'Kids Allowed',
    ]
  }
  /**
   *
   */
  async validateHeader(sheet) {
    const header = get(sheet, `data.${this.headerCol}`) || []
    /*
    await header.forEach((i) => {
      if (!this.columns.includes(i)) {
        throw new HttpException('Invalid header data=' + i)
      }
    })*/
    return header
  }

  /**
   *
   */
  mapDataToEntity(row) {
    const [
      num, //: 'No.',
      landlord_email, //: if property manager helps adding properties on behalf of landlord,
      street, //: 'Street',
      house_number, //: 'House Number',
      address, //: 'Extra Address',
      zip, //: 'Postcode',
      city, //: 'City',
      country, //: 'Country',
      property_id, //: 'Property ID',
      property_type, //: 'Property Type',
      apt_type, //: 'Apartment Type',
      house_type, //: 'House Type',
      use_type, //: 'Use Type',
      occupancy, //: 'occupancy',
      ownership_type, //: 'Ownership Type',
      letting_status,
      marketing_type, //: 'Deal Type',
      net_rent, //: 'Net Rent',
      ancillary_costs,
      additional_costs, //: 'Utility Costs',
      stp_garage, //: 'Parking Rent',
      deposit, //: 'Deposit',
      available_date, //: 'Available from',
      from_date, //: 'Visit from',
      currency, //: 'Currency',
      construction_year, //: 'Construction',
      last_modernization, //: 'Last modernization',
      building_status, //: 'Building Status',
      number_floors, //: 'Number of floors',
      energy_efficiency, //: 'Energy Consumption Value',
      firing, //: 'Energy Carrier',
      heating_type, //: 'Heating Type',
      area, //: 'Living Space',
      rooms_number, //: 'Number_of_Rooms',
      floor, //: 'Floor',
      apartment_status, //: 'Apartment Status', ----
      equipment_standard, //: 'Amenities Type',
      furnished, //: 'Furnished',
      parking_space_type, //: 'Parking Space Type',
      room1_type, //: 'Room 1',
      room1_tags, //: 'Tags 1',
      room1_area, //: 'Area 1',
      room1_name, //: 'Name 1',
      room1_photos, //: 'Photo 1',
      room2_type, //: 'Room 2',
      room2_tags, //: 'Tags 2',
      room2_area, //: 'Area 2',
      room2_name, //: 'Name 2',
      room2_photos, //: 'Photo 2',
      room3_type, //: 'Room 3',
      room3_tags, //: 'Tags 3',
      room3_area, //: 'Area 3',
      room3_name, //: 'Name 3',
      room3_photos, //: 'Photo 3',
      room4_type, //: 'Room 4',
      room4_tags, //: 'Tags 4',
      room4_area, //: 'Area 4',
      room4_name, //: 'Name 4',
      room4_photos, //: 'Photo 4',
      room5_type, //: 'Room 5',
      room5_tags, //: 'Tags 5',
      room5_area, //: 'Area 5',
      room5_name, //: 'Name 5',
      room5_photos, //: 'Photo 5',
      room6_type, //: 'Room 6',
      room6_tags, //: 'Tags 6',
      room6_area, //: 'Area 6',
      room6_name, //: 'Name 6',
      room6_photos, //: 'Photo 6',
      tenant_salutation,
      tenant_surname,
      contract_end,
      tenant_tel,
      tenant_email,
      budget, //: 'Salary Burden',
      rent_arrears, //: 'Rent Arrears',
      credit_score, //: 'Credit Score',
      tenant_min_age, //: 'Tenant Age Min',
      tenant_max_age, //: 'Tenant Age Max',
      family_status, //: 'Family Status',
      non_smoker, //: 'Smoking Allowed',
      kids_allowed,
    ] = row

    const result = {
      landlord_email,
      street,
      house_number,
      zip,
      city,
      country: 'Germany',
      address,
      property_id,
      property_type,
      apt_type,
      house_type,
      use_type,
      occupancy,
      ownership_type,
      marketing_type,
      net_rent,
      additional_costs,
      stp_garage,
      deposit,
      available_date,
      from_date,
      currency,
      construction_year,
      last_modernization,
      building_status,
      number_floors,
      energy_efficiency,
      firing,
      heating_type,
      area,
      rooms_number,
      floor,
      apartment_status,
      equipment_standard,
      furnished,
      parking_space_type,
      room1_type,
      room1_tags,
      room1_area,
      room1_name,
      room1_photos,
      room2_type,
      room2_tags,
      room2_area,
      room2_name,
      room2_photos,
      room3_type,
      room3_tags,
      room3_area,
      room3_name,
      room3_photos,
      room4_type,
      room4_tags,
      room4_area,
      room4_name,
      room4_photos,
      room5_type,
      room5_tags,
      room5_area,
      room5_name,
      room5_photos,
      room6_type,
      room6_tags,
      room6_area,
      room6_name,
      room6_photos,
      budget,
      rent_arrears,
      credit_score,
      min_age: tenant_min_age,
      max_age: tenant_max_age,
      family_status,
      non_smoker,
    }

    const mapValue = (k, v, result) => {
      if (isFunction(this.dataMapping[k])) {
        return this.dataMapping[k](v, result)
      } else if (isString(v)) {
        if (has(this.dataMapping, k)) {
          return get(this.dataMapping, `${k}.${escapeStr(v)}`)
        }
        return escapeStr(v)
      }

      return v
    }

    return reduce(
      result,
      (n, v, k) => {
        if (v === undefined) {
          // Address should process separately
          if (k === 'address') {
            return { ...n, [k]: mapValue(k, '', result) }
          } else if (k == 'property_id') {
            const r = Math.random().toString(36).substr(2, 8).toUpperCase()
            return { ...n, [k]: r }
          }
          return n
        } else if (Object.keys(this.dataMapping).includes(k)) {
          return { ...n, [k]: mapValue(k, v, result) }
        } else if (k.match(/room\d+_type/)) {
          v = isString(v) ? escapeStr(v) : v
          return { ...n, [k]: get(this.dataMapping, `room_type.${v}`) }
        }
        return { ...n, [k]: v }
      },
      {}
    )
  }

  mapToValues(row) {
    const mapValue = (k, v, result) => {
      if (isFunction(this.dataMapping[k])) {
        return this.dataMapping[k](v, result)
      } else if (isString(v)) {
        if (has(this.dataMapping, k)) {
          return get(this.dataMapping, `${k}.${escapeStr(v)}`)
        }
        return escapeStr(v)
      }

      return v
    }

    return reduce(
      row,
      (n, v, k) => {
        if (v === undefined) {
          // Address should process separately
          if (k === 'address') {
            return { ...n, [k]: mapValue(k, '', row) }
          } else if (k == 'property_id') {
            const r = Math.random().toString(36).substr(2, 8).toUpperCase()
            return { ...n, [k]: r }
          }
          return n
        } else if (Object.keys(this.dataMapping).includes(k)) {
          return { ...n, [k]: mapValue(k, v, row) }
        } else if (k.match(/room\d+_type/)) {
          v = isString(v) ? escapeStr(v) : v
          return { ...n, [k]: get(this.dataMapping, `room_type.${v}`) }
        }
        return { ...n, [k]: v }
      },
      {}
    )
  }
  /**
   *
   */
  async readFile(filePath) {
    const data = xlsx.parse(filePath, { cellDates: true })
    const sheet = data.find((i) => i.name === this.sheetName)
    if (!sheet || !sheet.data) {
      throw new HttpException('Invalid spreadsheet. Please use the correct template.')
    }

    //determine language
    const deTest = ['Nr.', 'Straße', 'Hausnummer', 'Zusatzadresse', 'PLZ', 'Stadt', 'Land']
    const columns = sheet.data[this.headerCol]
    let probableLang = columns
      .slice(0, 6)
      .map((column) => (_.indexOf(deTest, column) > -1 ? 'de' : 'en'))
    let lang = 'en'
    if (_.uniq(probableLang).length <= 1) {
      lang = probableLang[0]
    } else {
      throw new HttpException('Cannot determine Excel language.')
    }
    this.dataMapping = new EstateAttributeTranslations(lang)
    const columnHeaders = [
      l.get('web.letting.property.import.No.message', lang),
      l.get('web.letting.property.import.Street.message', lang),
      l.get('web.letting.property.import.House_Number.message', lang),
      l.get('web.letting.property.import.Extra_Address.message', lang),
      l.get('web.letting.property.import.Postcode.message', lang),
      l.get('web.letting.property.import.City.message', lang),
      l.get('web.letting.property.import.Country.message', lang),
      l.get('web.letting.property.import.Property_ID.message', lang),
      l.get('web.letting.property.import.Property_Type.message', lang),
      l.get('web.letting.property.import.Apartment_Type.message', lang),
      l.get('web.letting.property.import.House_Type.message', lang),
      l.get('web.letting.property.import.Use_Type.message', lang),
      l.get('web.letting.property.import.occupancy.message', lang),
      l.get('web.letting.property.import.Ownership_Type.message', lang),
      l.get('web.letting.property.letting_status.message', lang),
      l.get('web.letting.property.import.Deal_Type.message', lang),
      l.get('web.letting.property.import.Net_Rent.message', lang),
      l.get('web.letting.property.import.Extra_Costs.message', lang),
      l.get('web.letting.property.import.Parking_Rent.message', lang),
      l.get('web.letting.property.import.Deposit.message', lang),
      l.get('web.letting.property.import.Available_from.message', lang),
      l.get('web.letting.property.import.Visit_from.message', lang),
      l.get('web.letting.property.import.Currency.message', lang),
      l.get('web.letting.property.import.Construction.message', lang),
      l.get('web.letting.property.import.Last_modernization.message', lang),
      l.get('web.letting.property.import.Building_Status.message', lang),
      l.get('web.letting.property.import.Number_of_floors.message', lang),
      l.get('web.letting.property.import.Energy_Consumption_Value.message', lang),
      l.get('web.letting.property.import.Energy_Carrier.message', lang),
      l.get('web.letting.property.import.Heating_Type.message', lang),
      l.get('web.letting.property.import.Living_Space.message', lang),
      l.get('web.letting.property.import.Number_of_Rooms.message', lang),
      l.get('web.letting.property.import.Floor.message', lang),
      l.get('web.letting.property.import.Apartment_Status.message', lang),
      l.get('web.letting.property.import.Amenities_Type.message', lang),
      l.get('web.letting.property.import.Furnished.message', lang),
      l.get('web.letting.property.import.Parking_Space_Type.message', lang),
      l.get('web.letting.property.import.Room_1.message', lang),
      l.get('web.letting.property.import.Tags_1.message', lang),
      l.get('web.letting.property.import.Room_2.message', lang),
      l.get('web.letting.property.import.Tags_2.message', lang),
      l.get('web.letting.property.import.Room_3.message', lang),
      l.get('web.letting.property.import.Tags_3.message', lang),
      l.get('web.letting.property.import.Room_4.message', lang),
      l.get('web.letting.property.import.Tags_4.message', lang),
      l.get('web.letting.property.import.Room_5.message', lang),
      l.get('web.letting.property.import.Tags_5.message', lang),
      l.get('web.letting.property.import.Room_6.message', lang),
      l.get('web.letting.property.import.Tags_6.message', lang),
      l.get('web.letting.property.import.Salary_Burden.message', lang),
      l.get('web.letting.property.import.Rent_Arrears.message', lang),
      l.get('web.letting.property.import.Credit_Score.message', lang),
      l.get('web.letting.property.import.Tenant_Age_Min.message', lang),
      l.get('web.letting.property.import.Tenant_Age_Max.message', lang),
      l.get('web.letting.property.import.Family_Status.message', lang),
      l.get('web.letting.property.import.Smoking_Allowed.message', lang),
      l.get('web.letting.property.import.Kids_Allowed.message', lang),
      l.get('web.letting.property.import.Surname.message', lang),
      l.get('web.letting.property.import.Contract_End.message', lang),
      l.get('prospect.settings.user_details.txt_salutation.message', lang),
      'Tel',
      'Tel.',
      l.get('email_signature.email.message', lang),
    ]
    this.columns = columnHeaders
    await this.validateHeader(sheet)

    const errors = []
    const toImport = []
    const exampleRegex = new RegExp('example|beispiel', 'i')
    if (this.sheetName === 'data') {
      // old version...
      for (let k = this.headerCol + 1; k < sheet.data.length; k++) {
        if (k <= this.headerCol || isEmpty(sheet.data[k])) {
          continue
        }

        let itemData = this.mapDataToEntity(sheet.data[k])
        itemData = {
          ...itemData,
          credit_score: itemData.credit_score ? parseFloat(itemData.credit_score) * 100 : 0,
          floor: itemData.floor ? itemData.floor : 0,
        }

        try {
          toImport.push({ line: k, data: await schema.validate(itemData) })
        } catch (e) {
          errors.push({
            line: k,
            error: e.errors,
            street: itemData ? itemData.street : `no street code`,
            postcode: itemData ? itemData.zip : `no zip code`,
          })
        }
      }
    } else {
      const columnIdentifiers = [
        'num',
        'street',
        'house_number',
        'address',
        'zip',
        'city',
        'country',
        'property_id',
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
        'room1_name',
        'room1_tags',
        'room2_name',
        'room2_tags',
        'room3_name',
        'room3_tags',
        'room4_name',
        'room4_tags',
        'room5_name',
        'room5_tags',
        'room6_name',
        'room6_tags',
        'budget',
        'rent_arrears',
        'credit_score',
        'tenant_min_age',
        'tenant_max_age',
        'family_status',
        'non_smoker',
        'kids_allowed',
        'tenant_surname',
        'contract_end',
        'tenant_salutation',
        'tenant_tel',
        'tenant_tel_de',
        'tenant_email',
      ]
      let columnVars = {}
      for (let count = 0; count < columnHeaders.length; count++) {
        columnVars[columnHeaders[count]] = columnIdentifiers[count]
      }
      for (let k = this.headerCol + 1; k < sheet.data.length; k++) {
        let row = columns.reduce(function (row, field, index) {
          row[columnVars[columns[index]]] = sheet.data[k][index]
          return row
        }, {})
        //test if this is an example:
        if (row['street'] && row['street'].match(exampleRegex)) {
          continue
        }
        let itemData = this.mapToValues(row)
        itemData = {
          ...itemData,
          credit_score: itemData.credit_score ? parseFloat(itemData.credit_score) * 100 : 0,
          floor: itemData.floor ? itemData.floor : 0,
          tenant_tel: itemData.tenant_tel_de || itemData.tenant_tel,
        }
        try {
          toImport.push({ line: k, data: await schema.validate(itemData) })
        } catch (e) {
          errors.push({
            line: k,
            error: e.errors,
            street: itemData ? itemData.street : `no street code`,
            postcode: itemData ? itemData.zip : `no zip code`,
          })
        }
      }
    }
    return { errors, data: toImport }
  }
}

module.exports = ExcelReader
