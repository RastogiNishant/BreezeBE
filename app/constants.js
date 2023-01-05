const constants = {
  TEST_ENVIRONMENT: 'test',
  USER_ACTIVATION_STATUS_NOT_ACTIVATED: 1,
  USER_ACTIVATION_STATUS_ACTIVATED: 2,
  USER_ACTIVATION_STATUS_DEACTIVATED: 3,

  ERROR_AGREEMENT_CONFIRM: 10020,
  ERROR_TERMS_CONFIRM: 10030,
  ERROR_USER_NOT_VERIFIED_LOGIN: 10040,
  ERROR_WRONG_HOUSEHOLD_INVITATION_DATA: 10050,
  ERROR_BUDDY_EXISTS: 10110,
  ERROR_USER_INCOME_EXPIRE: 10140,
  ERROR_LANDLORD_DOES_NOT_OWN_THIS_ESTATE: 10150,
  ERROR_VIEW_INVITE_NOT_EXISTING: 10160,
  ERROR_PROSPECT_HAS_ALREADY_REGISTERED: 10180,
  ERROR_CHANGE_EMAIL_PASSWORD_NOT_MATCH: 10210,
  ERROR_ESTATE_NOT_FOUND_BY_HASH: 10220,
  ERROR_OUTSIDE_TENANT_INVITATION_EXPIRED: 10300,
  ERROR_OUTSIDE_TENANT_INVITATION_INVALID: 10301,
  ERROR_OUTSIDE_TENANT_INVITATION_ALREADY_USED: 10302,

  LANG_EN: 'en',
  LANG_DE: 'de',
  DEFAULT_LANG: 'de',
  FILE_TYPE_COVER: 'cover',
  FILE_TYPE_PLAN: 'plan',
  FILE_TYPE_CUSTOM: 'custom',
  FILE_TYPE_DOC: 'doc',
  FILE_TYPE_IMAGE: 'image',

  MAX_MINOR_COUNT: 5,

  MAX_SEARCH_ITEMS: 10000,

  MEMBER_FILE_TYPE_RENT: 'rent_proof',
  MEMBER_FILE_TYPE_DEBT: 'debt_proof',
  MEMBER_FILE_TYPE_INCOME: 'income_proof',
  MEMBER_FILE_TYPE_PASSPORT: 'passport',

  MEMBER_FILE_TYPE_EXTRA_RENT: 'extra_rent_proof',
  MEMBER_FILE_TYPE_EXTRA_DEBT: 'extra_debt_proof',
  MEMBER_FILE_TYPE_EXTRA_PASSPORT: 'extra_passport',

  MEMBER_FILE_RENT_ARREARS_DOC: 'rent_arrears_doc',
  MEMBER_FILE_EXTRA_RENT_ARREARS_DOC: 'extra_rent_arrears_doc',
  MEMBER_FILE_DEBT_PROOFS_DOC: 'debt_proof',
  MEMBER_FILE_EXTRA_DEBT_PROOFS_DOC: 'extra_debt_proof',
  MEMBER_FILE_PASSPORT_DOC: 'passport',
  MEMBER_FILE_EXTRA_PASSPORT_DOC: 'extra_passport',

  DEVICE_TYPE_ANDROID: 'android',
  DEVICE_TYPE_IOS: 'ios',

  CURRENCY_EUR: 'EUR',
  CURRENCY_USD: 'USD',
  CURRENCY_UAH: 'UAH',

  STATUS_ACTIVE: 1,
  STATUS_DELETE: 2,
  STATUS_NEED_VERIFY: 3,
  STATUS_EMAIL_VERIFY: 4,
  STATUS_DRAFT: 5,
  STATUS_EXPIRE: 6,

  IS_PRIVATE: 1,
  IS_PUBLIC: 2,

  ROLE_ADMIN: 2,
  ROLE_LANDLORD: 1,
  ROLE_USER: 3,
  ROLE_PROPERTY_MANAGER: 4,

  GENDER_MALE: 1,
  GENDER_FEMALE: 2,
  GENDER_NEUTRAL: 4,
  GENDER_ANY: 3,

  SALUTATION_MR_LABEL: 'landlord.profile.user_details.salut.mr.message',
  SALUTATION_MS_LABEL: 'landlord.profile.user_details.salut.ms.message',
  SALUTATION_SIR_OR_MADAM_LABEL: 'landlord.profile.user_details.salut.sir_madam.message',
  SALUTATION_NEUTRAL_LABEL: 'landlord.profile.user_details.salut.not_def.message',

  OCCUPATION_TYPE_OCCUPIED_OWN: 1,
  OCCUPATION_TYPE_OCCUPIED_TENANT: 2,
  OCCUPATION_TYPE_WRITE_OFF: 3,
  OCCUPATION_TYPE_VACANCY: 4,
  OCCUPATION_TYPE_NOT_RENT: 5,
  OCCUPATION_TYPE_NOT_OCCUPIED: 6,

  USE_TYPE_RESIDENTIAL: 1,
  USE_TYPE_COMMERCIAL: 2,
  USE_TYPE_CONSTRUCT: 3,
  USE_TYPE_WAZ: 4,
  USE_TYPE_PLANT: 5,
  USE_TYPE_OTHER: 6,

  OWNERSHIP_TYPE_FREEHOLDER: 1,
  OWNERSHIP_TYPE_DIRECT_PROPERTY: 2,
  OWNERSHIP_TYPE_LEASEHOLD: 3,
  OWNERSHIP_TYPE_OTHER: 4,

  MARKETING_TYPE_PURCHASE: 1,
  MARKETING_TYPE_RENT_LEASE: 2,
  MARKETING_TYPE_LEASEHOLD: 3,
  MARKETING_TYPE_LEASING: 4,

  // property_type
  PROPERTY_TYPE_APARTMENT: 1,
  PROPERTY_TYPE_ROOM: 2,
  PROPERTY_TYPE_HOUSE: 3,
  PROPERTY_TYPE_SITE: 4,
  PROPERTY_TYPE_OFFICE: 5,

  ENERGY_TYPE_LOW_ENERGY: 1,
  ENERGY_TYPE_PASSIVE_HOUSE: 2,
  ENERGY_TYPE_NEW_BUILDING_STANDARD: 3,
  ENERGY_TYPE_KFW40: 4,
  ENERGY_TYPE_KFW60: 5,
  ENERGY_TYPE_KFW55: 6,
  ENERGY_TYPE_KFW70: 7,
  ENERGY_TYPE_MINERGIE_CONSTRUCTION: 8,
  ENERGY_TYPE_MINERGIE_CERTIFIED: 9,

  BUILDING_STATUS_FIRST_TIME_OCCUPIED: 1,
  BUILDING_STATUS_PART_COMPLETE_RENOVATION_NEED: 2,
  BUILDING_STATUS_NEW: 3,
  BUILDING_STATUS_EXISTING: 4,
  BUILDING_STATUS_PART_FULLY_RENOVATED: 5,
  BUILDING_STATUS_PARTLY_REFURISHED: 6,
  BUILDING_STATUS_IN_NEED_OF_RENOVATION: 7,
  BUILDING_STATUS_READY_TO_BE_BUILT: 8,
  BUILDING_STATUS_BY_AGREEMENT: 9,
  BUILDING_STATUS_MODERNIZED: 10,
  BUILDING_STATUS_CLEANED: 11,
  BUILDING_STATUS_ROUGH_BUILDING: 12,
  BUILDING_STATUS_DEVELOPED: 13,
  BUILDING_STATUS_ABRISSOBJEKT: 14,
  BUILDING_STATUS_PROJECTED: 15,

  ROOM_TYPE_GUEST_ROOM: 1,
  ROOM_TYPE_BATH: 2,
  ROOM_TYPE_BEDROOM: 3,
  ROOM_TYPE_KITCHEN: 4,
  ROOM_TYPE_CORRIDOR: 5,
  ROOM_TYPE_OFFICE: 6,
  ROOM_TYPE_PANTRY: 7,
  ROOM_TYPE_CHILDRENS_ROOM: 8,
  ROOM_TYPE_BALCONY: 9,
  ROOM_TYPE_WC: 10,
  ROOM_TYPE_OTHER_SPACE: 11,
  ROOM_TYPE_CHECKROOM: 12,
  ROOM_TYPE_DINING_ROOM: 13,
  ROOM_TYPE_ENTRANCE_HALL: 14,
  ROOM_TYPE_GYM: 15,
  ROOM_TYPE_IRONING_ROOM: 16,
  ROOM_TYPE_LIVING_ROOM: 17,
  ROOM_TYPE_LOBBY: 18,
  ROOM_TYPE_MASSAGE_ROOM: 19,
  ROOM_TYPE_STORAGE_ROOM: 20,
  ROOM_TYPE_PLACE_FOR_GAMES: 21,
  ROOM_TYPE_SAUNA: 22,
  ROOM_TYPE_SHOWER: 23,
  ROOM_TYPE_STAFF_ROOM: 24,
  ROOM_TYPE_SWIMMING_POOL: 25,
  ROOM_TYPE_TECHNICAL_ROOM: 26,
  ROOM_TYPE_TERRACE: 27,
  ROOM_TYPE_WASHING_ROOM: 28,
  ROOM_TYPE_EXTERNAL_CORRIDOR: 29,
  ROOM_TYPE_STAIRS: 30,
  ROOM_TYPE_GARDEN: 32,
  ROOM_TYPE_LOGGIA: 33,

  // apartment type
  APARTMENT_TYPE_FLAT: 1,
  APARTMENT_TYPE_GROUND: 2,
  APARTMENT_TYPE_ROOF: 3,
  APARTMENT_TYPE_MAISONETTE: 4,
  APARTMENT_TYPE_LOFT: 5,
  APARTMENT_TYPE_SOCIAL: 6,
  APARTMENT_TYPE_SOUTERRAIN: 7,
  APARTMENT_TYPE_PENTHOUSE: 8,

  // Building type
  HOUSE_TYPE_MULTIFAMILY_HOUSE: 1,
  HOUSE_TYPE_HIGH_RISE: 2,
  HOUSE_TYPE_SERIES: 3,
  HOUSE_TYPE_SEMIDETACHED_HOUSE: 4,
  HOUSE_TYPE_2FAMILY_HOUSE: 5,
  HOUSE_TYPE_DETACHED_HOUSE: 6,
  HOUSE_TYPE_COUNTRY: 7,
  HOUSE_TYPE_BUNGALOW: 8,
  HOUSE_TYPE_VILLA: 9,
  HOUSE_TYPE_GARDENHOUSE: 10,

  PARKING_SPACE_TYPE_NO_PARKING: 0,
  PARKING_SPACE_TYPE_UNDERGROUND: 1,
  PARKING_SPACE_TYPE_CARPORT: 2,
  PARKING_SPACE_TYPE_OUTDOOR: 3,
  PARKING_SPACE_TYPE_CAR_PARK: 4,
  PARKING_SPACE_TYPE_DUPLEX: 5,
  PARKING_SPACE_TYPE_GARAGE: 6,

  FIRING_OEL: 1,
  FIRING_GAS: 2,
  FIRING_ELECTRIC: 3,
  FIRING_ALTERNATIVE: 4,
  FIRING_SOLAR: 5,
  FIRING_GROUND_HEAT: 6,
  FIRING_AIRWP: 7,
  FIRING_REMOTE: 8,
  FIRING_BLOCK: 9,
  FIRING_WATER_ELECTRIC: 10,
  FIRING_PELLET: 11,
  FIRING_COAL: 12,
  FIRING_WOOD: 13,
  FIRING_LIQUID_GAS: 14,

  HEATING_TYPE_NO: 0,
  HEATING_TYPE_OVEN: 1,
  HEATING_TYPE_FLOOR: 2,
  HEATING_TYPE_CENTRAL: 3,
  HEATING_TYPE_REMOTE: 4,
  HEATING_TYPE_FLOOR_HEATING: 5,

  EQUIPMENT_STANDARD_SIMPLE: 1,
  EQUIPMENT_STANDARD_NORMAL: 2,
  EQUIPMENT_STANDARD_ENHANCED: 3,

  ATTACHMENT_TITLE_PICTURE: 1,
  ATTACHMENT_INTERIOR_VIEWS: 2,
  ATTACHMENT_EXTERIOR_VIEWS: 3,
  ATTACHMENT_FLOOR_PLAN: 4,
  ATTACHMENT_MAPS_SITE_PLAN: 5,
  ATTACHMENT_PROVIDER_LOGO: 6,
  ATTACHMENT_PICTURE: 7,
  ATTACHMENT_DOCUMENTS: 8,
  ATTACHMENT_LINKS: 9,
  ATTACHMENT_PANORAMA: 10,
  ATTACHMENT_QRCODE: 11,
  ATTACHMENT_FILM: 12,
  ATTACHMENT_FILMLINK: 13,
  ATTACHMENT_EPASS_SCALE: 14,
  ATTACHMENT_ANBOBJURL: 5,

  GROUND_TILES: 1,
  GROUND_STONE: 2,
  GROUND_CARPET: 3,
  GROUND_PARQUET: 4,
  GROUND_FINISHED_PARQUET: 5,
  GROUND_LAMINATE: 6,
  GROUND_DIELEN: 7,
  GROUND_PLASTIC: 8,
  GROUND_ESTRICH: 9,
  GROUND_DOUBLE_FLOOR: 10,
  GROUND_LINOLEUM: 11,
  GROUND_MARMOR: 12,
  GROUND_TERRAKOTTA: 13,
  GROUND_GRANITE: 14,

  BATH_TUB: 1,
  BATH_WINDOW: 2,
  BATH_BIDET: 3,
  BATH_URINAL: 4,
  BATH_SHOWER: 5,

  KITCHEN_OPEN: 1,
  KITCHEN_PANTRY: 2,
  KITCHEN_BUILTIN: 3,

  EQUIPMENT_STACK: 1,
  EQUIPMENT_AIR_CONDITIONED: 2,
  EQUIPMENT_ELEVATOR: 3,
  EQUIPMENT_GARDEN_USE: 4,
  EQUIPMENT_WHEELCHAIR_ACCESSIBLE: 5,
  EQUIPMENT_BIKE_ROOM: 6,
  EQUIPMENT_GUEST_WC: 7,
  EQUIPMENT_WG_SUITABLE: 8,

  PETS_NO: 1,
  PETS_SMALL: 2,
  PETS_ANY: null,
  PETS_BIG: 3,

  KIDS_NO_KIDS: 1,
  KIDS_TO_5: 2,
  KIDS_UP_5: 3,

  SOURCE_TYPE_BUDDY: 1,
  SOURCE_TYPE_MATCHED: 2,

  ADULT_AGE_25: 1,
  ADULT_AGE_25_59: 2,
  ADULT_AGE_60: 3,

  LANDLORD_SIZE_SMALL: 1,
  LANDLORD_SIZE_MID: 2,
  LANDLORD_SIZE_LARGE: 3,

  OPTIONS_TYPE_BUILD: 'build',
  OPTIONS_TYPE_APT: 'apt',
  OPTIONS_TYPE_OUT: 'out',
  OPTIONS_TYPE_BAD: 'bad',
  OPTIONS_TYPE_KITCHEN: 'kitchen',
  OPTIONS_TYPE_ROOM: 'room',

  HIRING_TYPE_FULL_TIME: 'full',
  HIRING_TYPE_PART_TIME: 'part',

  TRANSPORT_TYPE_CAR: 'car',
  TRANSPORT_TYPE_WALK: 'walk',
  TRANSPORT_TYPE_SOCIAL: 'soc',

  POINT_TYPE_ZONE: 'zone',
  POINT_TYPE_POI: 'poi',

  INCOME_TYPE_EMPLOYEE: 'employee',
  INCOME_TYPE_WORKER: 'worker',
  INCOME_TYPE_UNEMPLOYED: 'unemployed',
  INCOME_TYPE_CIVIL_SERVANT: 'civil_servant',
  INCOME_TYPE_FREELANCER: 'freelancer',
  INCOME_TYPE_HOUSE_WORK: 'housewife_husband',
  INCOME_TYPE_PENSIONER: 'pensioner',
  INCOME_TYPE_SELF_EMPLOYED: 'self',
  INCOME_TYPE_TRAINEE: 'trainee',

  FAMILY_STATUS_SINGLE: 1,
  FAMILY_STATUS_WITH_CHILD: 3,
  FAMILY_STATUS_NO_CHILD: 2,

  NO_MATCH_STATUS: -1,
  MATCH_STATUS_NEW: 1,
  MATCH_STATUS_KNOCK: 2,
  MATCH_STATUS_INVITE: 3,
  MATCH_STATUS_VISIT: 4,
  MATCH_STATUS_SHARE: 5,
  MATCH_STATUS_TOP: 6,
  MATCH_STATUS_COMMIT: 7,
  MATCH_STATUS_FINISH: 8,

  TENANT_EMAIL_INVITE: 1,
  TENANT_SMS_INVITE: 2,

  COMPANY_TYPE_PRIVATE: 'private',
  COMPANY_TYPE_PROPERTY_MANAGER: 'propMan',
  COMPANY_TYPE_PRIVATE_HOUSING: 'prHost',
  COMPANY_TYPE_MUNICIPAL_HOUSING: 'numHost',
  COMPANY_TYPE_HOUSING_COOPERATIVE: 'hostCoop',
  COMPANY_TYPE_LISTED_HOUSING: 'listHost',
  COMPANY_TYPE_BROKER: 'broker',

  COMPANY_SIZE_SMALL: 'sm',
  COMPANY_SIZE_MID: 'md',
  COMPANY_SIZE_LARGE: 'lg',

  // Tabs matches list
  TENANT_TABS_BUDDY: 'buddy',
  TENANT_TABS_LIKE: 'like',
  TENANT_TABS_DISLIKE: 'dislike',
  TENANT_TABS_KNOCK: 'knock',
  TENANT_TABS_INVITE: 'invite',
  TENANT_TABS_SHARE: 'share',
  TENANT_TABS_TOP: 'top',
  TENANT_TABS_COMMIT: 'commit',

  LANDLORD_TABS_KNOCK: 'knock',
  LANDLORD_TABS_BUDDY: 'buddy',
  LANDLORD_TABS_INVITE: 'invite',
  LANDLORD_TABS_VISIT: 'visit',
  LANDLORD_TABS_TOP: 'top',
  LANDLORD_TABS_COMMIT: 'commit',

  DATE_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  GERMAN_DATE_TIME_FORMAT: 'DD.MM.YYYY, HH:MM',
  DAY_FORMAT: 'YYYY-MM-DD',
  ISO_DATE_FORMAT: 'YYYY-MM-DD"T"HH24:MI:SS"Z"', //ISO 8601

  AMENITIES_OPTIONS: [
    'elevator',
    'cellar',
    'parking_space',
    'apt_balcony',
    'furnished',
    'bathtub',
    'fitted_kitchen',
  ],

  ESTATE_NOTIFICATION_FIELDS: [
    'id',
    'address',
    'cover',
    'rooms_number',
    'area',
    'floor',
    'number_floors',
  ],
  SCHEDULED_EVERY_5M_JOB: 'scheduledEvery5Min',
  SCHEDULED_13H_DAY_JOB: 'scheduledEveryDay13H',
  SCHEDULED_9H_DAY_JOB: 'scheduledEveryDay9H',
  SCHEDULED_FRIDAY_JOB: 'scheduledFriday',
  SCHEDULED_MONTHLY_JOB: 'scheduledStartOfEveryMonth',

  NOTICE_TYPE_LANDLORD_FILL_PROFILE: 'notification_landlord_fill_profile',
  NOTICE_TYPE_LANDLORD_NEW_PROPERTY: 'notification_landlord_new_property',
  NOTICE_TYPE_LANDLORD_TIME_FINISHED: 'notification_landlord_time_finished',
  NOTICE_TYPE_LANDLORD_CONFIRM_VISIT: 'notification_landlord_confirmed_visits',
  NOTICE_TYPE_LANDLORD_VISIT30M: 'notification_landlord_visit_starting',
  NOTICE_TYPE_LANDLORD_MATCH: 'notification_landlord_match',
  NOTICE_TYPE_LANDLORD_DECISION: 'notification_landlord_decision',
  NOTICE_TYPE_PROSPECT_NEW_MATCH: 'notification_prospect_new_match',
  NOTICE_TYPE_PROSPECT_MATCH_LEFT: 'notification_prospect_match_left',
  NOTICE_TYPE_PROSPECT_INVITE: 'notification_prospect_invite',
  NOTICE_TYPE_PROSPECT_VISIT3H: 'notification_prospect_visit_1',
  NOTICE_TYPE_PROSPECT_VISIT30M: 'notification_prospect_visit_2',
  NOTICE_TYPE_PROSPECT_COMMIT: 'notification_prospect_commit',
  NOTICE_TYPE_PROSPECT_REJECT: 'notification_prospect_reject',
  NOTICE_TYPE_PROSPECT_NO_ACTIVITY: 'notification_prospect_no_activity',
  NOTICE_TYPE_PROSPECT_VISIT90M: 'notification_prospect_visit_90m',
  NOTICE_TYPE_LANDLORD_VISIT90M: 'notification_landlord_visit_90m',
  NOTICE_TYPE_PROSPECT_PROFILE_EXPIRE: 'notification_prospect_profile_expire',
  NOTICE_TYPE_PROSPECT_COME: 'notification_prospect_come',
  NOTICE_TYPE_CANCEL_VISIT: 'notification_cancel_visit',
  NOTICE_TYPE_CANCEL_VISIT_LANDLORD: 'notification_cancel_visit_landlord',
  NOTICE_TYPE_INVITE_TENANT_IN_TO_VISIT: 'notification_tenant_in_to_visit',
  NOTICE_TYPE_VISIT_DELAY: 'notification_visit_delay',
  NOTICE_TYPE_VISIT_DELAY_LANDLORD: 'notification_visit_delay_landlord',
  NOTICE_TYPE_ZENDESK_NOTIFY: 'notification_zendesk_notify',
  NOTICE_TYPE_USER_VERIFICATION_BY_ADMIN: 'notification_user_verification_by_admin',
  NOTICE_TYPE_ESTATE_SHOW_TIME_IS_OVER: 'notification_estate_show_time_is_over',
  NOTICE_TYPE_PROSPECT_INVITE_REMINDER: 'notification_prospect_invite_reminder',
  NOTICE_TYPE_PROSPECT_IS_NOT_INTERESTED: 'notification_prospect_is_not_interested',
  NOTICE_TYPE_LANDLORD_MOVED_PROSPECT_TO_TOP: 'notification_landlord_moved_prospect_to_top',
  NOTICE_TYPE_PROSPECT_HOUSEHOLD_INVITATION_ACCEPTED:
    'notification_prospect_household_invitation_accepted',
  NOTICE_TYPE_PROSPECT_HOUSEHOLD_DISCONNECTED: 'notification_prospect_household_disconnected',
  NOTICE_TYPE_PROSPECT_ARRIVED: 'notification_prospect_arrived',
  NOTICE_TYPE_PROSPECT_PROPERTY_DEACTIVATED: 'notification_prospect_property_deactivated',
  NOTICE_TYPE_PROSPECT_SUPER_MATCH: 'notification_prospect_super_match',
  NOTICE_TYPE_LANDLORD_SENT_TASK_MESSAGE: 'notification_type_landlord_sent_task_message',
  NOTICE_TYPE_TENANT_SENT_TASK_MESSAGE: 'notification_type_tenant_sent_task_message',
  NOTICE_TYPE_LANDLORD_DEACTIVATE_IN_TWO_DAYS: 'notification_landlord_deactivated_in_two_days',
  NOTICE_TYPE_LANDLORD_DEACTIVATE_NOW: 'notification_landlord_deactivated',
  NOTICE_TYPE_PROSPECT_INFORMED_LANDLORD_DEACTIVATED:
    'notification_prospect_informed_landlord_deactivated',
  NOTICE_TYPE_LANDLORD_FOLLOWUP_PROSPECT: 'notification_landlord_followup_prospect',
  NOTICE_TYPE_PROSPECT_FOLLOWUP_LANDLORD: 'notification_prospect_followup_landlord',
  NOTICE_TYPE_TENANT_DISCONNECTION: 'notification_tenant_disconnection',

  NOTICE_TYPE_LANDLORD_UPDATE_SLOT: 'notification_landlord_update_slot',
  NOTICE_TYPE_PROSPECT_KNOCK_PROPERTY_EXPIRED: 'notification_prospect_knock_property_expired',

  NOTICE_TYPE_PROSPECT_TASK_RESOLVED: 'notification_prospect_task_resolved',
  NOTICE_TYPE_PROSPECT_DEACTIVATED: 'notification_prospect_deactivated',
  NOTICE_TYPE_LANDLORD_FILL_PROFILE_ID: 2,
  NOTICE_TYPE_LANDLORD_NEW_PROPERTY_ID: 3,
  NOTICE_TYPE_LANDLORD_TIME_FINISHED_ID: 4,
  NOTICE_TYPE_LANDLORD_CONFIRM_VISIT_ID: 5,
  NOTICE_TYPE_LANDLORD_VISIT30M_ID: 7,
  NOTICE_TYPE_LANDLORD_MATCH_ID: 8,
  NOTICE_TYPE_LANDLORD_DECISION_ID: 9,
  NOTICE_TYPE_PROSPECT_NEW_MATCH_ID: 12,
  NOTICE_TYPE_PROSPECT_MATCH_LEFT_ID: 13,
  NOTICE_TYPE_PROSPECT_INVITE_ID: 14,
  NOTICE_TYPE_PROSPECT_VISIT3H_ID: 15,
  NOTICE_TYPE_PROSPECT_VISIT30M_ID: 16,
  NOTICE_TYPE_PROSPECT_COMMIT_ID: 17,
  NOTICE_TYPE_PROSPECT_NO_ACTIVITY_ID: 19,
  NOTICE_TYPE_PROSPECT_VISIT90M_ID: 20,
  NOTICE_TYPE_LANDLORD_VISIT90M_ID: 21,
  NOTICE_TYPE_PROSPECT_REJECT_ID: 22,
  NOTICE_TYPE_PROSPECT_PROFILE_EXPIRE_ID: 23,
  NOTICE_TYPE_PROSPECT_COME_ID: 24,

  NOTICE_TYPE_CANCEL_VISIT_ID: 26, // prospect sets timeslot to visit
  NOTICE_TYPE_VISIT_DELAY_ID: 27, // visit delayed
  NOTICE_TYPE_INVITE_TENANT_IN_TO_VISIT_ID: 28,
  NOTICE_TYPE_ZENDESK_NOTIFY_ID: 30,
  NOTICE_TYPE_USER_VERIFICATION_BY_ADMIN_ID: 31,
  NOTICE_TYPE_ESTATE_SHOW_TIME_IS_OVER_ID: 32,
  NOTICE_TYPE_PROSPECT_IS_NOT_INTERESTED_ID: 33,
  NOTICE_TYPE_LANDLORD_MOVED_PROSPECT_TO_TOP_ID: 34,
  NOTICE_TYPE_PROSPECT_HOUSEHOLD_INVITATION_ACCEPTED_ID: 35,
  NOTICE_TYPE_PROSPECT_HOUSEHOLD_DISCONNECTED_ID: 36,
  NOTICE_TYPE_VISIT_DELAY_LANDLORD_ID: 37, // visit delayed
  NOTICE_TYPE_CANCEL_VISIT_LANDLORD_ID: 38,
  NOTICE_TYPE_PROSPECT_ARRIVED_ID: 39,
  NOTICE_TYPE_PROSPECT_INVITE_REMINDER_ID: 40,
  NOTICE_TYPE_PROSPECT_PROPERTY_DEACTIVATED_ID: 41,
  NOTICE_TYPE_PROSPECT_SUPER_MATCH_ID: 42,
  NOTICE_TYPE_LANDLORD_SENT_TASK_MESSAGE_ID: 43,
  NOTICE_TYPE_TENANT_SENT_TASK_MESSAGE_ID: 44,
  NOTICE_TYPE_LANDLORD_DEACTIVATE_IN_TWO_DAYS_ID: 45,
  NOTICE_TYPE_LANDLORD_DEACTIVATE_NOW_ID: 46,
  NOTICE_TYPE_PROSPECT_INFORMED_LANDLORD_DEACTIVATED_ID: 47,
  NOTICE_TYPE_TENANT_DISCONNECTION_ID: 48,
  NOTICE_TYPE_LANDLORD_FOLLOWUP_PROSPECT_ID: 49,
  NOTICE_TYPE_PROSPECT_FOLLOWUP_LANDLORD_ID: 50,
  NOTICE_TYPE_LANDLORD_UPDATE_SLOT_ID: 51, // landlord updated timeslot
  NOTICE_TYPE_PROSPECT_KNOCK_PROPERTY_EXPIRED_ID: 52,
  NOTICE_TYPE_PROSPECT_TASK_RESOLVED_ID: 53,
  NOTICE_TYPE_PROSPECT_DEACTIVATED_ID: 54,

  TIMESLOT_STATUS_BOOK: 'new',
  TIMESLOT_STATUS_PRE_CONFIRM: 'pre',
  TIMESLOT_STATUS_CONFIRM: 'confirm',
  TIMESLOT_STATUS_REJECT: 'reject',
  TIMESLOT_STATUS_DELAY: 'delay',
  TIMESLOT_STATUS_COME: 'come',

  VISIT_MAX_ALLOWED_FOLLOWUPS: 3,

  MIN_TIME_SLOT: 5,

  NO_UNPAID_RENTAL: 1,
  YES_UNPAID_RENTAL: 2,
  NO_ANSWER_UNPAID_RENTAL: 3,

  NO_INSOLVENCY: 1,
  YES_INSOLVENCY: 2,
  NO_ANSWER_INSOLVENCY: 3,

  NO_CLEAN_PROCEDURE: 1,
  YES_CLEAN_PROCEDURE: 2,
  NO_ANSWER_CLEAN_PROCEDURE: 3,

  NO_INCOME_SEIZURE: 1,
  YES_INCOME_SEIZURE: 2,
  NO_ANSWER_INCOME_SEIZURE: 3,

  MONTHLY_PAYMENT: 1,
  YEARLY_PAYMENT: 2,

  BASIC_MEMBER: 1,
  PENDING_PREMIUM_MEMBER: 2,
  PREMIUM_MEMBER: 3,

  PROPERTY_MANAGE_REQUEST: 1,
  PROPERTY_MANAGE_ALLOWED: 2,

  // this has to be stored in database later.
  YEARLY_DISCOUNT_RATE: 0.1,

  BUDDY_STATUS_PENDING: 1,
  BUDDY_STATUS_ACCEPTED: 2,
  BUDDY_STATUS_REMOVED: 3,

  TENANT_MATCH_FIELDS: [
    'id',
    'coord',
    'net_rent',
    'area',
    'cover',
    'street',
    'city',
    'zip',
    'rooms_number',
    'floor',
    'number_floors',
    'house_number',
    'status',
    'match',
    'rent_per_sqm',
    'net_rent',
    'extra_costs',
    'budget',
    'updated_at',
    'share',
    'like',
    'dislike',
    'visit_status',
    'delay',
    'estate_status',
    'date',
    'visit_start_date',
    'visit_end_date',
    'email',
    'firstname',
    'secondname',
    'phone',
    'avatar',
    'sex',
    'address',
    'user_id',
    'available_date',
    'vacant_date',
    'others',
    'full_address',
    'deposit',
    'energy_efficiency',
    'heating_type',
    'firing',
    'construction_year',
    'house_type',
    'apt_type',
    'options',
    'stp_garage',
    'energy_proof',
    'energy_proof_original_file',
    'isoline',
    'is_new_tenant_transfer',
    'transfer_budget',
    'rent_end_at',
    'knocked_at',
  ],

  SMS_VERIFY_PREFIX: 'confirm_household_account',
  SMS_MEMBER_PHONE_VERIFY_PREFIX: 'confirm_member_phone_account',
  INVITE_OUTSIDE_TENANT: 'invite_outside_breeze',

  LOG_TYPE_OPEN_APP: 'open_app',
  LOG_TYPE_SIGN_UP: 'sign_up',
  LOG_TYPE_SIGN_IN: 'sign_in',
  LOG_TYPE_PUBLISHED_PROPERTY: 'published_property',
  LOG_TYPE_PROPERTIES_IMPORTED: 'properties_imported',
  LOG_TYPE_INVITED: 'invited',
  LOG_TYPE_GOT_INVITE: 'got_invite',
  LOG_TYPE_SHOWED: 'showed',
  LOG_TYPE_FINAL_MATCH_REQUEST: 'final_match_request',
  LOG_TYPE_FINAL_MATCH_APPROVAL: 'final_match_approval',
  LOG_TYPE_SIGN_IN_FIRST_TIME: 'sign_in_first_time',
  LOG_TYPE_OPEN_APP_FIRST_TIME: 'open_app_first_time',
  LOG_TYPE_SIGN_IN_HIGH_VALUE: 'sign_in_high_value',
  LOG_TYPE_SIGN_IN_LOW_VALUE: 'sign_in_low_value',
  LOG_TYPE_SIGN_IN_INACTIVE: 'sign_in_inactive',
  LOG_TYPE_ACTIVATED_PROFILE: 'activated_profile',
  LOG_TYPE_KNOCKED: 'knocked',
  LOG_TYPE_VISITED: 'visited',

  SIGN_IN_METHOD_GOOGLE: 'google',
  SIGN_IN_METHOD_APPLE: 'apple',
  SIGN_IN_METHOD_EMAIL: 'email',

  SIGN_UP_METHOD_GOOGLE: 'google',
  SIGN_UP_METHOD_APPLE: 'apple',
  SIGN_UP_METHOD_EMAIL: 'email',

  PLAN_FEATURE_COMMON: '',
  PLAN_FEATURE_NEW: 'New',

  VISIBLE_TO_NOBODY: 1,
  VISIBLE_TO_EVERYBODY: 2,
  VISIBLE_TO_SPECIFIC: 3,
  VISIBLE_TO_HOUSEHOLD: 4,

  LETTING_TYPE_LET: 1,
  LETTING_TYPE_VOID: 2,
  LETTING_TYPE_NA: 3,

  LETTING_STATUS_DEFECTED: 1,
  LETTING_STATUS_TERMINATED: 2,
  LETTING_STATUS_NORMAL: 3,
  LETTING_STATUS_CONSTRUCTION_WORKS: 4,
  LETTING_STATUS_STRUCTURAL_VACANCY: 5,
  LETTING_STATUS_FIRST_TIME_USE: 6,
  LETTING_STATUS_VACANCY: 7,

  MINIMUM_SHOW_PERIOD: 5,
  ROOM_CUSTOM_AMENITIES_MAX_COUNT: 3,
  ROOM_CUSTOM_AMENITY_MAX_STRING_LENGTH: 35,
  ROOM_CUSTOM_AMENITIES_EXCEED_MAX_ERROR: 2311252,
  ROOM_CUSTOM_AMENITIES_UPDATE_REORDER_COUNT_NOT_MATCH: 5433122,

  ESTATE_CUSTOM_AMENITIES_MAX_COUNT: 3,
  ESTATE_CUSTOM_AMENITIES_EXCEED_MAX_ERROR: 23551276,
  ESTATE_AMENITIES_UPDATE_REORDER_COUNT_NOT_MATCH: 34338761,
  ESTATE_CUSTOM_AMENITY_MAX_STRING_LENGTH: 35,

  ESTATE_AMENITY_LOCATIONS: ['building', 'apartment', 'outside', 'vicinity', 'kitchen'],

  FILTER_CONSTRAINTS_MATCH_MODES: [
    'startsWith',
    'contains',
    'notContains',
    'endsWith',
    'equals',
    'notEquals',
    'gt',
    'lt',
    'gte',
    'lte',
  ],

  FILTER_CONSTRAINTS_DATE_MATCH_MODES: ['dateIs', 'dateIsNot', 'dateBefore', 'dateAfter'],
  FILTER_CONSTRAINTS_COUNT_MATCH_MODES: ['equals', 'notEquals', 'gt', 'lt', 'gte', 'lte'],

  PREDEFINED_MSG_MULTIPLE_ANSWER_MULTIPLE_CHOICE: 1,
  PREDEFINED_MSG_MULTIPLE_ANSWER_SIGNLE_CHOICE: 2,
  PREDEFINED_MSG_MULTIPLE_ANSWER_CUSTOM_CHOICE: 6,
  PREDEFINED_MSG_OPEN_ENDED: 3,
  PREDEFINED_NOT_A_QUESTION: 4,
  PREDEFINED_LAST: 5,

  URGENCY_LOW: 1,
  URGENCY_NORMAL: 2,
  URGENCY_HIGH: 3,
  URGENCY_SUPER: 4,

  URGENCY_LOW_LABEL: 'Low',
  URGENCY_NORMAL_LABEL: 'Normal',
  URGENCY_HIGH_LABEL: 'High',
  URGENCY_SUPER_LABEL: 'Urgent',

  URGENCIES: [
    {
      label: 'low_notification.message',
      value: 1,
    },
    {
      label: 'normal_notification.message',
      value: 2,
    },
    {
      label: 'high_notification.message',
      value: 3,
    },
    {
      label: 'urgent_notification.message',
      value: 4,
    },
  ],
  TASK_STATUS_NEW: 1,
  TASK_STATUS_INPROGRESS: 2,
  TASK_STATUS_UNRESOLVED: 3,
  TASK_STATUS_RESOLVED: 4,

  BREEZE_BOT_USER: {
    id: 0,
    firstname: 'Breeze',
    secondname: 'Monster',
    avatar: '/img/breezeLogo.png',
  },

  TASK_STATUS_ARCHIVED: 99,
  TASK_STATUS_DRAFT: 100,
  TASK_STATUS_DELETE: 101,

  TASK_STATUS_NEW_LABEL: 'New',
  TASK_STATUS_INPROGRESS_LABEL: 'In Progress',
  TASK_STATUS_UNRESOLVED_LABEL: 'Unresolved',
  TASK_STATUS_RESOLVED_LABEL: 'Resolved',

  ALL_BREEZE: 'All',
  CONNECTED_BREEZE_TEANT_LABEL: 'Connected',
  NOT_CONNECTED_BREEZE_TEANT_LABEL: 'Not Connected',
  PENDING_BREEZE_TEANT_LABEL: 'Pending',

  CHAT_EDIT_STATUS_UNEDITED: 'unedited',
  CHAT_EDIT_STATUS_EDITED: 'edited',
  CHAT_EDIT_STATUS_DELETED: 'deleted',

  CONNECT_PREVIOUS_MESSAGES_LIMIT_PER_PULL: 10,
  CONNECT_MESSAGE_EDITABLE_TIME_LIMIT: 3600, //seconds
  SHOW_ACTIVE_TASKS_COUNT: 3,
  ADULT_MIN_AGE: 18,

  ESTATE_FIELD_FOR_TASK: [
    'coord',
    'street',
    'area',
    'house_number',
    'country',
    'floor',
    'rooms_number',
    'number_floors',
    'city',
    'coord_raw',
    'property_id',
    'address',
  ],
  //whether we deactivate landlord at end of day of his/her deactivation day
  //or at the moment his deactivation arrives.
  DEACTIVATE_LANDLORD_AT_END_OF_DAY: false,
  //list of holidays in Germany
  //FIXME: this should come from a db table or from an external api
  GERMAN_HOLIDAYS: [
    '2022-08-15', //assumption day
    '2022-09-20', //world children day
    '2022-10-03', //reformation day
    '2022-11-01', //all saints day
    '2022-12-25', //christmas
    '2022-12-26', //seconday of christmas
    '2023-01-01', //new year's day
    '2023-01-06', //epiphany
    '2023-03-08', //Weltfrauntag
    '2023-04-07', //Good Friday
    '2023-04-09', //Easter Sunday
    '2023-04-10', //Easter Monday
    '2023-05-01', //Labor day
    '2023-05-29', //Whit Monday
    '2023-06-08', //Corpus Cristi
    '2023-08-15', //Assumption Day
    '2023-09-20', //world children's day
    '2023-10-03', //reformation day
    '2023-11-01', //all saints' day
    '2023-12-25', //christmas
    '2023-12-26', //second day of christmas
  ],
  CHAT_TYPE_MESSAGE: 'message',
  CHAT_TYPE_BOT_MESSAGE: 'chatbot',
  CHAT_TYPE_NOTIFICATION: 'notification',
  CHAT_TYPE_LAST_READ_MARKER: 'last-read-marker',

  DEFECT_TOPICS: [
    {
      key: 'tenant.property.defect_class.Heating.message',
      text: 'Heating',
    },
    {
      key: 'tenant.property.defect_class.Window.message',
      text: 'Window',
    },
    {
      key: 'tenant.property.defect_class.Toilet.message',
      text: 'Toilet',
    },
    {
      key: 'tenant.property.defect_class.Water tap.message',
      text: 'Water tap',
    },
    {
      key: 'tenant.property.defect_class.Electricity.message',
      text: 'Electricity',
    },
    {
      key: 'tenant.property.defect_class.Door.message',
      text: 'Door',
    },
    {
      key: 'tenant.property.defect_class.Unit.message',
      text: 'Unit',
    },
    {
      key: 'tenant.property.defect_class.Bath_Shower.message',
      text: 'Bath Shower',
    },
    {
      key: 'tenant.property.defect_class.Entrance.message',
      text: 'Entrance',
    },
    {
      key: 'tenant.property.defect_class.Outside.message',
      text: 'Outside',
    },
    {
      key: 'tenant.property.defect_class.Kitchen.message',
      text: 'Kitchen',
    },
  ],

  ESTATE_FLOOR_DIRECTION_NA: 1,
  ESTATE_FLOOR_DIRECTION_LEFT: 2,
  ESTATE_FLOOR_DIRECTION_RIGHT: 3,
  ESTATE_FLOOR_DIRECTION_STRAIGHT: 4,
  ESTATE_FLOOR_DIRECTION_STRAIGHT_LEFT: 5,
  ESTATE_FLOOR_DIRECTION_STRAIGHT_RIGHT: 6,

  TENANT_INVITATION_EXPIRATION_DATE: 14, // 2 weeks

  ESTATE_VALID_ADDRESS_LABEL: 'Valid',
  ESTATE_INVALID_ADDRESS_LABEL: 'Error',
  ESTATE_ALL_ADDRESS_LABEL: 'All',

  EMAIL_REG_EXP:
    /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i,
  PHONE_REG_EXP: /^\+[1-9]{1,2}[0-9]{9,11}$/,

  //Date period
  TASK_RESOLVE_HISTORY_PERIOD: 3,

  CONNECT_SERVICE_INDEX: 1,
  MATCH_SERVICE_INDEX: 2,

  PASS_ONBOARDING_STEP_COMPANY: 1,
  PASS_ONBOARDING_STEP_PREFERRED_SERVICES: 2,

  INCOME_NORMAL_TYPE: 'normal',
  INCOME_EXTRA_TYPE: 'extra',

  PROSPECT_ACTOR: 'prospect',
  LANDLORD_ACTOR: 'landlord',

  TEST_ENVIRONMENT: 'test',
  LETTER_GREETING_STYLE: [0, 1, 2, 3, 4],

  INVITATION_LINK_RETRIEVAL_CODE_LENGTH: 6,
  INVITATION_LINK_RETRIEVAL_CODE_CHARACTERS: '0123456789',
  INVITATION_LINK_RETRIEVAL_MAX_TRIES_LIMIT: 10,
  INVITATION_LINK_RETRIEVAL_TRIES_RESET_TIME: 1, //in minutes
  INVITATION_LINK_RETRIEVAL_TRIES_KEY: `userRetrieveInvitationLinkFailedTries`,

  WEBSOCKET_EVENT_ESTATE_VERIED_ADDRESS: 'estate_address_verified',
  WEBSOCKET_EVENT_TASK_MESSAGE_ALL_READ: 'taskMessageRead',
  WEBSOCKET_EVENT_USER_ACTIVATE: 'landlord:activatedAccount',
  WEBSOCKET_EVENT_TENANT_CONNECTED: 'landlord:tenantConnected',

  SET_EMPTY_IP_BASED_USER_INFO_ON_LOGIN: true,

  //MATCH WEB SOCKET
  WEBSOCKET_EVENT_MATCH: 'matchChanged',
  //if address valid from importing estates, websocket will be emitted
  WEBSOCKET_EVENT_VALID_ADDRESS: 'addressValid',
  MATCH_SCORE_GOOD_MATCH: 70,

  IMPORT_TYPE_EXCEL: 'excel',
  IMPORT_ENTITY_ESTATES: 'estates',

  IMPORT_ACTION_IMPORT: 'import',
  IMPORT_ACTION_EXPORT: 'export',
}

module.exports = constants
