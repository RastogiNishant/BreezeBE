'use_strict'

import { ENVIRONMENT } from "@App/constants"
import { EstateWithDetails } from "./EstateTypes"
import { EstateSyncAttachment, EstateSyncHelper, EstateSyncProperty } from "./EstateSyncHelper"
import axios, { AxiosInstance } from "axios"


class EstateSync {
  fetcher: AxiosInstance

  constructor(private apiKey = '') {
    this.fetcher = axios.create({
      baseURL: `https://api.estatesync.com`,
    });
    this.fetcher.defaults.headers.common.Authorization = `Bearer ${this.apiKey}`
  }

  composeEstate(estate: EstateWithDetails, isBuilding = false): EstateSyncProperty {
    return EstateSyncHelper.convertDataToEstateSyncFormat(estate, isBuilding)
  }

  composeAttachments(estate: EstateWithDetails): EstateSyncAttachment[] {
    return EstateSyncHelper.composeAttachments(estate)
  }

  generateEstateData({ type = 'apartmentRent', estate, contactId }: { type: string, estate: EstateWithDetails, contactId: string }, isBuilding = false) {
    const body = {
      type,
      fields: this.composeEstate(estate, isBuilding),
      attachments: this.composeAttachments(estate),
      externalId: `Breeze-${estate.property_id}`,
      contactId
    }

    // mark the external id with the env if not prod
    if (process.env.NODE_ENV !== ENVIRONMENT.PROD) {
      body.externalId = `Breeze-${estate.property_id}-[${process.env.NODE_ENV}]`
    }

    return body
  }

  async postEstate({ type = 'apartmentRent', estate, contactId = '' }: { type: string, estate: EstateWithDetails, contactId: string }, isBuilding = false) {
    try {
      const body = this.generateEstateData({ type, estate, contactId }, isBuilding)

      const ret = await this.fetcher.post(`/properties`, body, { timeout: 5000 })
      return {
        success: true,
        data: ret.data
      }
    } catch (err) {
      console.log(err)
      await require('../Service/MailService').sendEmailToOhneMakler(
        `EstateSync.postEstate: ERROR ` + JSON.stringify(err),
        'barudo@gmail.com'
      )
      if (err?.response?.data) {
        return {
          success: false,
          data: err.response.data
        }
      }
      return {
        success: false
      }
    }
  }

  async updateEstate({
    type = 'apartmentRent',
    estate,
    contactId,
    propertyId,
    titleOverride,
    descriptionOverride
  }: { type: string, estate: EstateWithDetails, contactId: string, propertyId: string, titleOverride: string, descriptionOverride: string }) {
    try {
      const fields = this.composeEstate(estate)
      fields.title = titleOverride ?? fields.title
      fields.description = descriptionOverride ?? fields.description

      const body = {
        type,
        fields,
        attachments: this.composeAttachments(estate),
        contactId,
      }
      const ret = await this.fetcher.put(`/properties/${propertyId}`, body, {
        timeout: 5000
      })
      return {
        success: true,
        data: ret.data
      }
    } catch (err) {
      console.log(err)
      return {
        success: false,
        data: err?.response?.data
      }
    }
  }

  async publishEstate({ propertyId, targetId }) {
    try {
      const ret = await this.fetcher.post(
        `/listings`,
        { propertyId, targetId },
        { timeout: 5000 }
      )
      return {
        success: true,
        data: ret.data
      }
    } catch (err) {
      console.log(err)
      return {
        success: false,
        data: err?.response?.data
      }
    }
  }

  async post(type: string, data) {
    const possibleTypes = [
      'account',
      'properties',
      'targets',
      'listings',
      'contacts',
      'requests',
      'webhooks'
    ]
    if (!possibleTypes.includes(type)) {
      return false
    }
    try {
      const ret = await this.fetcher.post(`/${type}`, data, { timeout: 5000 })
      return {
        success: true,
        data: ret.data
      }
    } catch (err) {
      return {
        success: false,
        data: err?.response?.data
      }
    }
  }

  async put(type: string, data, id = '') {
    const possibleTypes = [
      'account/credentials/immobilienscout-24',
      'account/credentials/immobilienscout-24-sandbox',
      'properties',
      'listings',
      'contacts'
    ]
    if (!possibleTypes.includes(type)) {
      return false
    }
    try {
      const ret = await this.fetcher.put(`/${type}${id ? '/' + id : ''}`, data)
      return {
        success: true,
        data: ret.data
      }
    } catch (err) {
      return {
        success: false,
        data: err?.response?.data
      }
    }
  }

  async get(type = 'properties', id = '') {
    const possibleTypes = [
      'account',
      'properties',
      'targets',
      'listings',
      'contacts',
      'requests',
      'webhooks'
    ]
    if (!possibleTypes.includes(type)) {
      return false
    }
    try {
      const ret = await this.fetcher.get(`/${type}${id ? '/' + id : ''}`)
      return {
        success: true,
        data: ret?.data
      }
    } catch (err) {
      console.log(err)
      return {
        success: false,
        data: err?.response?.data
      }
    }
  }

  async delete(id: string, type = 'properties') {
    const possibleTypes = ['properties', 'targets', 'listings', 'contacts', 'requests', 'webhooks']
    if (!possibleTypes.includes(type)) {
      return false
    }
    if (!id) {
      return false
    }

    try {
      const ret = await this.fetcher.delete(`/${type}${id ? '/' + id : ''}`)
      if (ret?.status === 200) {
        return {
          success: true
        }
      }
      return {
        success: false
      }
    } catch (err) {
      console.log(err)
      return {
        success: false,
        message: err?.response?.data
      }
    }
  }
}

module.exports = EstateSync
