const HttpException = use('App/Exceptions/HttpException')
const { replace, trim } = require('lodash')
const { FILE_LIMIT_LENGTH } = require('./constants')

const exceptions = {
  REQUIRED: 'is a required field',
  MINLENGTH: 'must be at least ${value} characters',
  MAXLENGTH: 'must be at most ${value} characters',
  MAXSIZE: 'must be at most ${value} count',
  SIZE: 'must be ${value} count',
  OPTION: 'must be one of the following values:${value}',
  DATE: 'must be a `YYYY-MM-DD` type',
  BOOLEAN: 'must be true or false',
  STRING: 'must be a string',
  NUMBER: 'must be a number',
  POSITIVE_NUMBER: 'must be a positive number',
  ARRAY: 'must be a `array` type',
  EMAIL: 'must be a valid email',
  MATCH: 'format is wrong',
  USER_UNIQUE: 'User already exists, can be switched',
  USER_NOT_FOUND: 'User not found',
  USER_WRONG_PASSWORD: 'E_PASSWORD_MISMATCH',
  CURRENT_PASSWORD_REQUIRED: 'Change on email requires current password.',
  USER_NOT_EXIST: 'No user exists',
  USER_CLOSED: 'User Account Closed',
  FAILED_UPLOAD_AVATAR: 'Failed to upload avatar',
  INVALID_CONFIRM_CODE: 'Invalid confirmation code. Please try again.',
  NOT_EXIST_WITH_EMAIL: 'User with this email does not exist',
  MEMBER_NOT_EXIST: "Member doesn't exist",
  HOUSEHOLD_NOT_EXIST: "Household doesn't exit",
  SMS_CODE_NOT_VALID: 'Your code invalid any more',
  SMS_CODE_NOT_CORERECT: 'Not Correct',
  WRONG_INVITATION_LINK: 'Wrong invitation link',
  INVALID_USER_ROLE: 'Invalid user role',
  NO_USER_PASSED: 'No User passed',
  USER_NOT_VERIFIED: 'User has not been verified yet',
  CURRENT_PASSWORD_NOT_VERIFIED: 'Current password could not be verified! Please try again',
  FAILED_GET_OWNER: 'Failed to get owner',
  INVALID_TOKEN: 'Invalid token',
  NO_CODE_PASSED: 'No code',
  ACCOUNT_ALREADY_VERIFIED: 'Your account has been already verified',
  INVALID_TIME_RANGE: 'Invalid time range',
  TIME_SLOT_CROSSING_EXISTING: 'Time slot crossing existing',
  TIME_SLOT_NOT_FOUND: 'Time slot not found',
  SHOW_ALREADY_STARTED: 'Show already started',
  ACCOUNT_NOT_VERIFIED_USER_EXIST: 'There are some accounts which have not verified yet',
  IMPORT_ESTATE_INVALID_SHEET: 'Invalid Excel Sheet',
  IMPORT_ESTATE_INVALID_VARIABLE_WARNING: 'Column ${value} is not included on import',
  TOPIC_NOT_FOUND: 'Topic not found',
  ESTATE_NOT_EXISTS: 'Estate not exists',
  SHOULD_BE_AFTER: 'Should be after ${value}',
  SETTINGS_ERROR: 'Internal Settings Error',
  INVALID: 'is invalid',
  MESSAGE_NOT_SAVED: 'Error happened to save message',
  MESSAGE_ATTACHMENT_WRONG_FORMAT: 'Attachments must be an array',
  NO_CONTACT_EXIST: 'Contacts not exists',
  ONLY_ONE_CONTACT_ALLOWED: 'only 1 contact can be added',
  FAILED_UPLOAD_LEASE_CONTRACT: 'Lease contract Not saved',
  ONLY_ONE_FAVORITE_ROOM_ALLOWED: 'Only 1 favourite room is allowed',
  NO_ROOM_EXIST: 'Room not exists',
  NO_ESTATE_EXIST: 'Estate not exists',
  NO_ACTIVE_ESTATE_EXIST: 'Estate is not active yet',
  MARKET_PLACE_CONTACT_EXIST: 'You have already knocked that property',
  MEDIA_NOT_EXIST: 'Media not exists',
  INVALID_IDS: 'ids must be an array of integers',
  NO_IMAGE_EXIST: 'Image not exists',
  NO_FILE_EXIST: 'File not exists',
  INVALID_QR_CODE: 'Invalid QR code',
  ALREADY_USED_QR_CODE: 'Already used QR code',
  EXPIRED_QR_CODE: 'Expired QR code',
  SOME_IMAGE_NOT_EXIST: "Some images don't exist",
  TENANT_EXIST: 'Tenant already exists',
  WRONG_PARAMS: 'Params not correct',
  IMAGE_COUNT_LIMIT: `can upload up to ${FILE_LIMIT_LENGTH}.`,
  FAILED_IMPORT_FILE_UPLOAD: 'import estate faied',
  FAILED_TO_ADD_FILE: 'Failed to upload files',
  INVALID_ROOM: 'Invalid room',
  CURRENT_IMAGE_COUNT: 'Current count',
  FAILED_CREATE_TIME_SLOT: 'Failed to create time slot',
  ONLY_HOUSEHOLD_ADD_MEMBER: 'Please ask your household to add this roommate',
  FAILED_EXTEND_ESTATE: 'Failed to extend dates',
  ALREADY_KNOCKED_ON_THIRD_PARTY: 'You already knocked on this estate',
  CANNOT_KNOCK_ON_DISLIKED_ESTATE: 'You cannot knock on an estate you disliked',
  THIRD_PARTY_OFFER_NOT_FOUND: 'Third party offer not found',
  MEMBER_INVITATION_CANCELED: 'your invitation has been cancelled',
  UPLOAD_EXCEL_PROGRESS: 'Previous excel is in progress',
  WRONG_PROSPECT_CODE: 'Wrong prospect code',
  NOT_FOUND_OUTSIDE_INVITAION: 'Invitation No found',
  LAT_LON_NOT_PROVIDED: 'Coord info not provided',
  NO_TASK_FOUND: 'Task not found',
  NO_PROSPECT_KNOCK: "you haven't knocked that property",
  IS_CURRENTLY_PUBLISHED_IN_MARKET_PLACE: 'Please wait for a while before you can re-publish',
  NO_PRODUCTS_EXIST: 'Products Not found',
  SUBSCRIPTION_FAILED: 'failed to create subscription',
  UNSECURE_PROFILE_SHARE: "Please don't share your profile",
  ERROR_SUBSCRIPTION_NOT_CREATED: 'Not subscribed plan yet',
  ERROR_PRICE_PLAN_CONFIGURATION: 'Price plan misconfiguration',
  ERROR_PROPERTY_AREADY_PUBLISHED: 'property already published. You cannot republish it.',
  ERROR_PROPERTY_AVAILABLE_DURATION: 'Available duration not configured',
  ERROR_PROPERTY_UNDER_REVIEW: 'Estate is under review. Kindly wait.',
  ERROR_PROPERTY_ALREADY_RENTED: "Estate already rented. You can't publish it",
  ERROR_PROPERTY_INVALID_STATUS: 'Invalid status to publish property',
  ERROR_PROPERTY_NOT_PUBLISHED: 'Estate has not published yet',
}

const exceptionCodes = {
  IMAGE_ABSOLUTE_URL_ERROR_CODE: 405,
  SHOW_ALREADY_STARTED_ERROR_CODE: 1000401,
  UPLOAD_EXCEL_PROGRESS_ERROR_CODE: 2000100,
  WRONG_PROSPECT_CODE_ERROR_CODE: 3000100,
  NO_TIME_SLOT_ERROR_CODE: 4000100,
  NOT_FOUND_OUTSIDE_INVITAION_ERROR_CODE: 6000100,
  ERROR_OUTSIDE_PROSPECT_KNOCK_INVALID: 7000100,
  WARNING_UNSECURE_PROFILE_SHARE: 8000100,
  ERROR_SUBSCRIPTION_NOT_CREATED_CODE: 9000100,
  ERROR_PRICE_PLAN_CONFIGURATION_CODE: 9000200,
  ERROR_PROPERTY_AREADY_PUBLISHED_CODE: 9000300,
  ERROR_PROPERTY_AVAILABLE_DURATION_CODE: 9000400,
  ERROR_PROPERTY_UNDER_REVIEW_CODE: 9000500,
  ERROR_PROPERTY_ALREADY_RENTED_CODE: 9000600,
  ERROR_PROPERTY_INVALID_STATUS_CODE: 9000700,
  ERROR_PROPERTY_NOT_PUBLISHED_CODE: 9000800,
}

const exceptionKeys = {
  REQUIRED: 'REQUIRED',
  MINLENGTH: 'MINLENGTH',
  MAXLENGTH: 'MAXLENGTH',
  MAXSIZE: 'MAXSIZE',
  SIZE: 'SIZE',
  OPTION: 'OPTION',
  DATE: 'DATE',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  POSITIVE_NUMBER: 'POSITIVE_NUMBER',
  BOOLEAN: 'BOOLEAN',
  EMAIL: 'EMAIL',
  ARRAY: 'ARRAY',
  MATCH: 'MATCH',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_WRONG_PASSWORD: 'USER_WRONG_PASSWORD',
  CURRENT_PASSWORD_REQUIRED: 'CURRENT_PASSWORD_REQUIRED',
  USER_UNIQUE: 'USER_UNIQUE',
  USER_NOT_EXIST: 'USER_NOT_EXIST',
  USER_CLOSED: 'USER_CLOSED',
  FAILED_UPLOAD_AVATAR: 'FAILED_UPLOAD_AVATAR',
  INVALID_CONFIRM_CODE: 'INVALID_CONFIRM_CODE',
  NOT_EXIST_WITH_EMAIL: 'NOT_EXIST_WITH_EMAIL',
  MEMBER_NOT_EXIST: 'MEMBER_NOT_EXIST',
  HOUSEHOLD_NOT_EXIST: 'HOUSEHOLD_NOT_EXIST',
  SMS_CODE_NOT_VALID: 'SMS_CODE_NOT_VALID',
  SMS_CODE_NOT_CORERECT: 'SMS_CODE_NOT_CORERECT',
  WRONG_INVITATION_LINK: 'WRONG_INVITATION_LINK',
  INVALID_USER_ROLE: 'INVALID_USER_ROLE',
  NO_USER_PASSED: 'NO_USER_PASSED',
  USER_NOT_VERIFIED: 'USER_NOT_VERIFIED',
  CURRENT_PASSWORD_NOT_VERIFIED: 'CURRENT_PASSWORD_NOT_VERIFIED',
  FAILED_GET_OWNER: 'FAILED_GET_OWNER',
  INVALID_TOKEN: 'INVALID_TOKEN',
  NO_CODE_PASSED: 'NO_CODE_PASSED',
  ACCOUNT_ALREADY_VERIFIED: 'ACCOUNT_ALREADY_VERIFIED',
  IMPORT_ESTATE_INVALID_VARIABLE_WARNING: 'IMPORT_ESTATE_INVALID_VARIABLE_WARNING',
  TOPIC_NOT_FOUND: 'TOPIC_NOT_FOUND',
  INVALID_TIME_RANGE: 'INVALID_TIME_RANGE',
  TIME_SLOT_CROSSING_EXISTING: 'TIME_SLOT_CROSSING_EXISTING',
  TIME_SLOT_NOT_FOUND: 'TIME_SLOT_NOT_FOUND',
  SHOW_ALREADY_STARTED: 'SHOW_ALREADY_STARTED',
  ESTATE_NOT_EXISTS: 'ESTATE_NOT_EXISTS',
  SHOULD_BE_AFTER: 'SHOULD_BE_AFTER',
  SETTINGS_ERROR: 'SETTINGS_ERROR',
  INVALID: 'INVALID',
  MESSAGE_NOT_SAVED: 'MESSAGE_NOT_SAVED',
  NO_CONTACT_EXIST: 'NO_CONTACT_EXIST',
  ONLY_ONE_CONTACT_ALLOWED: 'ONLY_ONE_CONTACT_ALLOWED',
  ONLY_ONE_FAVORITE_ROOM_ALLOWED: 'ONLY_ONE_FAVORITE_ROOM_ALLOWED',
  MEDIA_NOT_EXIST: 'MEDIA_NOT_EXIST',
  INVALID_IDS: 'INVALID_IDS',
  NO_ROOM_EXISTS: 'NO_ROOM_EXISTS',
  NO_IMAGE_EXIST: 'NO_IMAGE_EXIST',
  NO_FILE_EXIST: 'NO_FILE_EXIST',
}
const getExceptionMessage = (name, command, value = null) => {
  if (!exceptions[command]) {
    throw new HttpException(`message for ${command} is not defined`)
  }

  return trim(`${name || ''} ${replace(exceptions[command], '${value}', value)}`)
}

const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

module.exports = {
  exceptions,
  exceptionKeys,
  exceptionCodes,
  getExceptionMessage,
  sleep,
}
