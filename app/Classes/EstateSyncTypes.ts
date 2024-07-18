import { ESTATE_SYNC_LISTING_STATUS } from '@App/constants'

export interface EstateSyncListing {
  id: number
  estate_id: number
  provider: string // immowelt, immoscout types
  performed_by: number // user id
  status: ESTATE_SYNC_LISTING_STATUS
  estate_sync_property_id: string | null
  estate_sync_listing_id: string | null
  publish_url: string | null
}
