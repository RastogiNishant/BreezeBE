const { isString, isNil } = require('lodash')
const fetch = require('node-fetch')
const Env = use('Env')
const MAUTIC_API_URL = Env.get('MAUTIC_API_URL')
const MAUTIC_AUTH_TOKEN = Env.get('MAUTIC_AUTH_TOKEN')
const LANDLORD_WELCOME_SEGMENT_ID = Env.get('LANDLORD_WELCOME_SEGMENT_ID')
const TENANT_WELCOME_SEGMENT_ID = Env.get('TENANT_WELCOME_SEGMENT_ID')
const User = use('App/Models/User')
const Company = use('App/Models/Company')
const {
  ROLE_LANDLORD,
  ROLE_USER,
  STATUS_ACTIVE,
  USER_ACTIVATION_STATUS_ACTIVATED,
} = require('../constants')

const checkLandlordProfileStatus = ({ contactPoints, name, stockSize, type }) => {
  const contactPointsFilled = Array.isArray(contactPoints) && contactPoints.length > 0
  const nameFilled = isString(name) && name.length > 0
  const stockSizeFilled = isString(stockSize) && stockSize.length > 0
  const typeFilled = !isNil(type)

  return contactPointsFilled && nameFilled && stockSizeFilled && typeFilled
}

const getCity = (address) => {
  if (!address) return null
  const arr = address.split(',')
  if (!arr[arr.length - 2]) return null
  return arr[arr.length - 2].replace(/[0-9]/g, '').trim()
}

const getCountry = (address) => {
  if (!address) return null
  const arr = address.split(',')
  if (!arr[arr.length - 1]) return null
  return arr[arr.length - 1].replace(/[0-9]/g, '').trim()
}

const getUserData = async (user, mauticPrevData) => {
  let body = {
    firstname: user.firstname,
    lastname: user.secondname,
    email: user.email,
    phone: user.phone,
    role: user.role,
    signup_date: user.created_at,
  }

  if (user.status === STATUS_ACTIVE) {
    body.email_verification_date = mauticPrevData.email_verification_date || new Date()
  }
  if (user.role === ROLE_LANDLORD) {
    let company = await Company.query().where('user_id', user.id).first()
    if (company) {
      body.city = getCity(company.address)
      body.country = getCountry(company.address)
      body.address = company.address
      body.company = company.name

      const companyContacts = await company.contacts().fetch()

      if (companyContacts) {
        const profileStatus = checkLandlordProfileStatus({
          name: company.name,
          contactPoints: companyContacts.rows,
          stockSize: company.size,
          type: company.type,
        })
        if (profileStatus) {
          // landload profile is activated.
          body.activated_profile_date = mauticPrevData.activated_profile_date || new Date()
        } else {
          // profile not activated any more
          body.activated_profile_date = null
        }
      } else {
        // profile not activated any more
        body.activated_profile_date = null
      }
    } else {
      body.city = ''
      body.country = ''
      body.address = ''
      body.company = ''
      // profile not activated any more
      body.activated_profile_date = null
    }

    if (user.activation_status === USER_ACTIVATION_STATUS_ACTIVATED) {
      body.admin_approval_date = mauticPrevData.admin_approval_date || new Date()
    }
  } else {
    const tenant = await user.tenant().fetch()
    if (tenant) {
      body.city = getCity(tenant.address)
      body.country = getCountry(tenant.address)
      body.address = tenant.address
      if (tenant.status === STATUS_ACTIVE) {
        body.activated_profile_date = mauticPrevData.activated_profile_date || new Date()
      }
    } else {
      body.city = ''
      body.country = ''
      body.address = ''
    }
  }

  return body
}

const getMauticContact = async (mauticId) => {
  try {
    const response = await fetch(`${MAUTIC_API_URL}/contacts/${mauticId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: MAUTIC_AUTH_TOKEN,
      },
    })
    const data = await response.json()

    return data.contact.fields.all
  } catch (err) {
    return {}
  }
}

class MauticService {
  static async createContact(userId) {
    if (
      (process.env.DEV && process.env.DEV.trim() == 'true') ||
      !MAUTIC_API_URL ||
      !MAUTIC_AUTH_TOKEN
    ) {
      return true
    }
    const user = await User.query().where('id', userId).first()
    try {
      const userData = await getUserData(user)
      // We have addresses with the country name = "Deutschland" in our database
      // But Mautic doesn't accept it, it only accepts English country names
      // TODO: Find a dynamic solution for every country name
      if (userData?.country === 'Deutschland') {
        userData.country = 'Germany'
      }
      const body = JSON.stringify(userData)
      const response = await fetch(`${MAUTIC_API_URL}/contacts/new`, {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
          Authorization: MAUTIC_AUTH_TOKEN,
        },
      })

      const data = await response.json()
      user.mautic_id = data.contact.id
      MauticService.addContactToSegment(user.role, user.mautic_id)
      await user.save()
    } catch (err) {
      //TODO: implement logging here (graylog)
      // console.log('Mautic Sync Failed : User Id = ' + user.id, err)
    }
  }

  static async addContactToSegment(role, contactId) {
    if (
      (process.env.DEV && process.env.DEV.trim() == 'true') ||
      !MAUTIC_API_URL ||
      !MAUTIC_AUTH_TOKEN
    ) {
      return true
    }
    try {
      if (
        (role === ROLE_LANDLORD && !LANDLORD_WELCOME_SEGMENT_ID) ||
        (role === ROLE_USER && !TENANT_WELCOME_SEGMENT_ID)
      ) {
        return true
      }
      const segmentId =
        role === ROLE_LANDLORD ? LANDLORD_WELCOME_SEGMENT_ID : TENANT_WELCOME_SEGMENT_ID

      await fetch(`${MAUTIC_API_URL}/segments/${segmentId}/contact/${contactId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MAUTIC_AUTH_TOKEN,
        },
      })

      //TODO: implement logging here (graylog)
      // console.log(`${contactId} added to segment ${segmentId}`)
    } catch (err) {
      //TODO: implement logging here (graylog)
      // console.log('Mautic segment adding Failed : Contact Id = ' + contactId, err)
    }
  }

  static async addContactToSegment(role, contactId) {
    if (
      (process.env.DEV && process.env.DEV.trim() == 'true') ||
      !MAUTIC_API_URL ||
      !MAUTIC_AUTH_TOKEN
    ) {
      return true
    }
    try {
      if (
        (role === ROLE_LANDLORD && !LANDLORD_WELCOME_SEGMENT_ID) ||
        (role === ROLE_USER && !TENANT_WELCOME_SEGMENT_ID)
      ) {
        return true
      }
      const segmentId =
        role === ROLE_LANDLORD ? LANDLORD_WELCOME_SEGMENT_ID : TENANT_WELCOME_SEGMENT_ID

      await fetch(`${MAUTIC_API_URL}/segments/${segmentId}/contact/${contactId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: MAUTIC_AUTH_TOKEN,
        },
      })
    } catch (err) {
      console.log('Mautic segment adding Failed : Contact Id = ' + contactId, err)
    }
  }

  static async syncContact(userId, payload = {}) {
    if (
      (process.env.DEV && process.env.DEV.trim() == 'true') ||
      !MAUTIC_API_URL ||
      !MAUTIC_AUTH_TOKEN
    ) {
      return true
    }
    const user = await User.query().where('id', userId).first()
    try {
      const mauticPrevData = await getMauticContact(user.mautic_id)
      const userData = await getUserData(user, mauticPrevData)
      const body = {
        ...mauticPrevData,
        ...userData,
        ...payload,
        overwriteWithBlank: false,
      }
      if (payload.invited_count) {
        body.invited_count = mauticPrevData.invited_count ? mauticPrevData.invited_count + 1 : 1
      }
      if (payload.knocked_count) {
        body.knocked_count = mauticPrevData.knocked_count ? mauticPrevData.knocked_count + 1 : 1
      }
      if (payload.showedproperty_count) {
        body.showedproperty_count = mauticPrevData.showedproperty_count
          ? mauticPrevData.showedproperty_count + 1
          : 1
      }
      if (payload.published_property) {
        body.published_property = mauticPrevData.published_property
          ? mauticPrevData.published_property + 1
          : 1
      }
      if (payload.propertiesimported_count) {
        body.propertiesimported_count = mauticPrevData.propertiesimported_count
          ? mauticPrevData.propertiesimported_count + 1
          : 1
      }
      if (payload.finalmatchapproval_count) {
        body.finalmatchapproval_count = mauticPrevData.finalmatchapproval_count
          ? mauticPrevData.finalmatchapproval_count + 1
          : 1
      }
      if (payload.finalmatchrequest_count) {
        body.finalmatchrequest_count = mauticPrevData.finalmatchrequest_count
          ? mauticPrevData.finalmatchrequest_count + 1
          : 1
      }

      await fetch(`${MAUTIC_API_URL}/contacts/${user.mautic_id}/edit`, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          Authorization: MAUTIC_AUTH_TOKEN,
        },
      })
    } catch (err) {
      //TODO: implement logging here (graylog)
      // console.log('Mautic Sync Failed : User Id = ' + user.id, err)
    }
  }
}

module.exports = MauticService
