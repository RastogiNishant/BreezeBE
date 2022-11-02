const HttpException = use('App/Exceptions/HttpException')
const { replace, trim } = require('lodash')

const exceptions = {
  REQUIRED: 'is a required field',
  MINLENGTH: 'must be at least ${value} characters',
  MAXLENGTH: 'must be at most ${value} characters',
  OPTION: 'must be one of the following values:${value}',
  DATE: 'must be a `YYYY-MM-DD` type',
  BOOLEAN: 'must be true or false',
  NUMBER: 'must be a number',
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
  INVALID_CONFIRM_CODE: 'Invalid confirmation code',
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
}

const exceptionKeys = {
  REQUIRED: 'REQUIRED',
  MINLENGTH: 'MINLENGTH',
  MAXLENGTH: 'MAXLENGTH',
  OPTION: 'OPTION',
  DATE: 'DATE',
  NUMBER: 'NUMBER',
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
  INVALID_TIME_RANGE: 'INVALID_TIME_RANGE',
  TIME_SLOT_CROSSING_EXISTING: 'TIME_SLOT_CROSSING_EXISTING',
  TIME_SLOT_NOT_FOUND: 'TIME_SLOT_NOT_FOUND',
  SHOW_ALREADY_STARTED: 'SHOW_ALREADY_STARTED',
}
const getExceptionMessage = (name, command, value = null) => {
  if (!exceptions[command]) {
    throw new HttpException(`message for ${command} is not defined`)
  }

  return trim(`${name || ''} ${replace(exceptions[command], '${value}', value)}`)
}

module.exports = {
  exceptions,
  exceptionKeys,
  getExceptionMessage,
}
