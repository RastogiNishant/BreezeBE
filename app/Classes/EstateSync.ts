'use_strict'

import { ENVIRONMENT } from '@App/constants'
import { EstateWithDetails } from './EstateTypes'
import { EstateSyncHelper } from './EstateSyncHelper'
import axios, { AxiosInstance } from 'axios'

export type FetchResponse =
  Promise<{
    success: false
    data?: any
  } | {
    success: true
    data: any
  }>

export class EstateSync {
  fetcher: AxiosInstance

  // @refactor apiKey should rather be the credentials with targetId and apiKey
  constructor (private readonly apiKey = '') {
    this.fetcher = axios.create({
      baseURL: 'https://api.estatesync.com'
    })
    this.fetcher.defaults.headers.common.Authorization = `Bearer ${this.apiKey}`
  }

  generateEstateData ({ type = 'apartmentRent', estate, contactId }: { type?: string, estate: EstateWithDetails, contactId: string }, isBuilding = false): {
    type: string
    fields: ReturnType<typeof EstateSyncHelper['convertDataToEstateSyncFormat']>
    attachments: ReturnType<typeof EstateSyncHelper['composeAttachments']>
    externalId: string
    contactId: string
  } {
    // replace / with - for estate sync
    let externalId = `Breeze-${estate.property_id.split('/').join('-')}`

    // external id must match ^[a-zA-Z0-9/_#+:@\s\-]+$
    if (!/^[a-zA-Z0-9/_#+:@\s-]+$/.test(externalId)) {
      externalId = `Breeze-${estate.id}`
    }

    const body = {
      type,
      fields: EstateSyncHelper.convertDataToEstateSyncFormat(estate, isBuilding),
      attachments: EstateSyncHelper.composeAttachments(estate),
      externalId,
      contactId
    }

    // mark the external id with the env if not prod
    if (process.env.NODE_ENV !== ENVIRONMENT.PROD) {
      body.externalId = `${externalId}-#${process.env.NODE_ENV ?? 'TNT'}`
    }

    return body
  }

  async postEstate ({ type = 'apartmentRent', estate, contactId = '' }: { type: string, estate: EstateWithDetails, contactId: string }, isBuilding = false): FetchResponse {
    try {
      const body = this.generateEstateData({ type, estate, contactId }, isBuilding)
      const ret = await this.fetcher.post('/properties', body, { timeout: 5000 })
      return {
        success: true,
        data: ret.data
      }
    } catch (err) {
      // @todo handle errors properly with sentry / httpexception
      // await require('../Service/MailService').sendEmailToOhneMakler(
      //   'EstateSync.postEstate: ERROR ' + JSON.stringify(err),
      //   'barudo@gmail.com'
      // )
      return {
        success: false,
        data: err?.response?.data
      }
    }
  }

  async updateEstate ({
    type = 'apartmentRent',
    estate,
    contactId,
    propertyId,
    titleOverride,
    descriptionOverride,
    locationDescriptionOverride,
    furnishingDescriptionOverride
  }: {
    type?: string
    estate: EstateWithDetails
    contactId: string
    propertyId: string
    titleOverride?: string
    descriptionOverride?: string
    locationDescriptionOverride?: string
    furnishingDescriptionOverride?: string
  }): FetchResponse {
    try {
      // ignore the externalId, it cannot be set on update
      const { externalId: _, ...body } = this.generateEstateData({ type, estate, contactId })
      body.fields.title = titleOverride ?? body.fields.title
      body.fields.description = descriptionOverride ?? body.fields.description
      body.fields.locationDescription = locationDescriptionOverride ?? body.fields.locationDescription
      body.fields.furnishingDescription = furnishingDescriptionOverride ?? body.fields.furnishingDescription

      // @todo remove this once we have taken the descriptions from gewobag data directly
      // if (estate.id === 4058) {
      //   body.fields.title = "Erstbezug in Spandau mit Teilgewerblicher Nutzung!"
      //   body.fields.description = "Für die Anmietung der Wohnung ist eine teilgewerbliche Nutzung vorgegeben. Hierfür benötigen wir von Ihnen, zu den üblichen Bewerbungsunterlagen, eine gültige Gewerbeanmeldung.\nDie gut geschnittene Neubauwohnung mit teilgewerblicher Nutzung befindet sich in neuer und gepflegter Wohnanlage. Der offen  gehaltene Wohn- und Küchenbereich lässt vielfältige Gestaltungsmöglichkeiten zu. Alle Wohnungen verfügen über zentrale  Warmwasserversorgung, Fußbodenheizung, hochwertigen Bodenbelag und ein Duschbad. Das Haus am Maselakekanal verfügt über keine Mieterkeller, allerdings befindet sich in jeder Wohnung eine Abstellnische mit Platz zum Verstauen."
      //   body.fields.locationDescription = "Im Spandauer Ortsteil Hakenfelde wurde direkt am Maselakekanal ein Wohngebäude errichtet. Sie liegt in ruhiger in ruhiger und  schöner Wasserlage, sowie an einer öffentlichen Grünfläche, die neu gestaltet wird. Die ruhige Umgebung wird durch die  unmittelbare Nähe zum Havelufer geprägt. Der Ortsteil Hakenfelde liegt nördlich der Spandauer Altstadt an der Oberhavel.  Mehrere Fahrradwege führen entlang des Havelufers bis in die Altstadt Spandau. Hakenfelde ist mit dem Bus gut an die  Spandauer Altstadt angebunden."
      //   body.fields.furnishingDescription = "Fernheizung/Zentralheizung, Fern-/Zentralwarmwasserversorgung, Wärmetauscher, Glasfaserleitung, Barrierearme Wohnungsgestaltung"
      // }

      // if (estate.id === 4057) {
      //   body.fields.title = "Geräumige Neubauwohnung mit Fußbodenheizung und Terrasse sucht Nachmieter ab sofort"
      //   body.fields.description = "Willkommen in dieser wunderschönen und hellen Wohnung nahe dem Landschaftspark Gehrensee. Diese Neubauwohnung (Zweitbezug) lässt kaum Wünsche offen und präsentiert sich mit strapazierfähigen Vinylboden in Holzoptik, Fußbodenheizung, hochwertigen Fenstern und einem modern gefliesten Bad. Erfreuen Sie sich an der Terrasse, die viel Platz zum Entspannen bietet. Der offen gehaltene Wohn- und Küchenbereich lässt vielfältige Gestaltungsmöglichkeiten zu. Es wird ein Nachmieter ab sofort gesucht."
      //   body.fields.locationDescription = "Der Stadtteil Falkenberg liegt zwischen Ahrensfelder Chaussee und dem renaturierten Gehrensee, er gehört zu dem Stadtbezirk Berlin-Lichtenberg. Falkenberg zeichnet sich durch seinen ländlichen Charakter aus. Das Gebiet ist durchzogen von mehreren kleinen Gewässern und viel Grün. Die S-Bahnstation Ahrensfelde erreichen Sie in ca. 15 Gehminuten. Für die Nahversorgung ist im näheren Umfeld gesorgt."
      //   body.fields.furnishingDescription = "bodengleiche Dusche, Rückkanalfähiger Breitbandkabelanschluss, Fliesenboden, Warmwasser zentral Fernwärme Dritte, Kunststoff-Bodenbelag, Steinboden, Schallschutzfenster, Fußbodenheizung, Barrierearme Wohnungsgestaltung"
      //   body.fields.miscellaneousDescription = "Hinweis zu Ihrem Schutz: Personen, die im Auftrag der Gewobag tätig sind, dürfen keine Provision von Ihnen verlangen.\nAnbieter\nEigentümer/Vermieter oder Verwalter des jeweiligen Mietobjekts ist Gewobag Wohnungsbau-Aktien- gesellschaft Berlin. Die Gewobag MB Mieterberatungsgesellschaft mbH übernimmt den Vermietungsservice für diese Gesellschaft. Weitere Informationen finden Sie unter www.gewobag.de/datenschutz."
      // }

      // if (estate.id === 4056) {
      //   body.fields.title = "Geräumige Neubauwohnung mit Fußbodenheizung und Terrasse sucht Nachmieter ab sofort"
      //   body.fields.description = "Willkommen in dieser wunderschönen und hellen Wohnung nahe dem Landschaftspark Gehrensee. Diese Neubauwohnung (Zweitbezug) lässt kaum Wünsche offen und präsentiert sich mit strapazierfähigen Vinylboden in Holzoptik, Fußbodenheizung, hochwertigen Fenstern und einem modern gefliesten Bad. Erfreuen Sie sich an der Terrasse, die viel Platz zum Entspannen bietet. Der offen gehaltene Wohn- und Küchenbereich lässt vielfältige Gestaltungsmöglichkeiten zu. Es wird ein Nachmieter ab sofort gesucht."
      //   body.fields.locationDescription = "Der Stadtteil Falkenberg liegt zwischen Ahrensfelder Chaussee und dem renaturierten Gehrensee, er gehört zu dem Stadtbezirk Berlin-Lichtenberg. Falkenberg zeichnet sich durch seinen ländlichen Charakter aus. Das Gebiet ist durchzogen von mehreren kleinen Gewässern und viel Grün. Die S-Bahnstation Ahrensfelde erreichen Sie in ca. 15 Gehminuten. Für die Nahversorgung ist im näheren Umfeld gesorgt."
      //   body.fields.furnishingDescription = "bodengleiche Dusche, Rückkanalfähiger Breitbandkabelanschluss, Fliesenboden, Warmwasser zentral Fernwärme Dritte, Kunststoff-Bodenbelag, Steinboden, Schallschutzfenster, Fußbodenheizung, Barrierearme Wohnungsgestaltung"
      //   body.fields.miscellaneousDescription = "Hinweis zu Ihrem Schutz: Personen, die im Auftrag der Gewobag tätig sind, dürfen keine Provision von Ihnen verlangen."
      // }

      const ret = await this.fetcher.put(`/properties/${propertyId}`, body, {
        timeout: 5000
      })
      return {
        success: true,
        data: ret.data
      }
    } catch (err) {
      // @todo handle errors properly with sentry / httpexception
      return {
        success: false,
        data: err?.response?.data
      }
    }
  }

  async publishEstate ({ propertyId, targetId }): FetchResponse {
    try {
      const ret = await this.fetcher.post(
        '/listings',
        { propertyId, targetId },
        { timeout: 5000 }
      )
      return {
        success: true,
        data: ret.data
      }
    } catch (err) {
      // @todo handle errors properly with sentry / httpexception
      return {
        success: false,
        data: err?.response?.data
      }
    }
  }

  async post (type: string, data: any): FetchResponse {
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
      return {
        success: false
      }
    }
    try {
      const ret = await this.fetcher.post(`/${type}`, data, { timeout: 5000 })
      return {
        success: true,
        data: ret.data
      }
    } catch (err) {
      // @todo handle errors properly with sentry / httpexception
      return {
        success: false,
        data: err?.response?.data
      }
    }
  }

  async put (type: string, data, id = ''): FetchResponse {
    const possibleTypes = [
      'account/credentials/immobilienscout-24',
      'account/credentials/immobilienscout-24-sandbox',
      'properties',
      'listings',
      'contacts'
    ]
    if (!possibleTypes.includes(type)) {
      return {
        success: false
      }
    }
    try {
      const ret = await this.fetcher.put(`/${type}${id.length > 0 ? '/' + id : ''}`, data)
      return {
        success: true,
        data: ret.data
      }
    } catch (err) {
      // @todo handle errors properly with sentry / httpexception
      return {
        success: false,
        data: err?.response?.data
      }
    }
  }

  async get (type = 'properties', id = ''): FetchResponse {
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
      return {
        success: false
      }
    }
    try {
      const ret = await this.fetcher.get(`/${type}${id.length > 0 ? '/' + id : ''}`)
      return {
        success: true,
        data: ret?.data
      }
    } catch (err) {
      // @todo handle errors properly with sentry / httpexception
      return {
        success: false,
        data: err?.response?.data
      }
    }
  }

  async delete (id: string, type = 'properties'): FetchResponse {
    const possibleTypes = ['properties', 'targets', 'listings', 'contacts', 'requests', 'webhooks']
    if (!possibleTypes.includes(type)) {
      return {
        success: false
      }
    }
    if (id === undefined) {
      return {
        success: false
      }
    }

    try {
      const ret = await this.fetcher.delete(`/${type}${id.length > 0 ? '/' + id : ''}`)
      if (ret?.status === 200) {
        return {
          success: true,
          data: ret.data
        }
      }
      return {
        success: false
      }
    } catch (err) {
      // @todo handle errors properly with sentry / httpexception
      return {
        success: false,
        data: err?.response?.data
      }
    }
  }
}

// node-compatibility
module.exports = {
  ...EstateSync,
  EstateSync
}
