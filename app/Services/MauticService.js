const fetch = require('node-fetch')
const Env = use('Env')
const MAUTIC_API_URL = Env.get('MAUTIC_API_URL')
const MAUTIC_AUTH_TOKEN = Env.get('MAUTIC_AUTH_TOKEN')
const User = use('App/Models/User')
const Company = use('App/Models/Company')
const { ROLE_LANDLORD } = require('../constants')

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

const getUserData = async (user) => {
  let body = {
    firstname: user.firstname,
    lastname: user.secondname,
    email: user.email,
    phone: user.phone,
    role: user.role,
    signup_date: user.created_at,
  }

  if (user.role === ROLE_LANDLORD && user.company_id) {
    let company = await Company.query().where('id', user.company_id).first()
    if (company) {
      body.city = getCity(company.address)
      body.country = getCountry(company.address)
      body.address = company.address
      body.company = company.name
    } else {
      body.city = ''
      body.country = ''
      body.address = ''
      body.company = ''
    }
  } else {
    const tenant = await user.tenant().fetch()
    if (tenant) {
      body.city = getCity(tenant.address)
      body.country = getCountry(tenant.address)
      body.address = tenant.address
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
    const user = await User.query().where('id', userId).first()
    try {
      const body = JSON.stringify(await getUserData(user))
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
      await user.save()
      console.log(`${user.email} synced with ID = ${user.mautic_id}`)
    } catch (err) {
      console.log('Mautic Sync Failed : User Id = ' + user.id, err)
    }
  }

  static async syncContact(userId, payload = {}) {
    const user = await User.query().where('id', userId).first()
    try {
      const mauticPrevData = await getMauticContact(user.mautic_id)
      const userData = await getUserData(user)
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
      console.log('Mautic Sync Failed : User Id = ' + user.id, err)
    }
  }
}

module.exports = MauticService
