const UserPremiumPlan = use('App/Models/UserPremiumPlan')
const AppException = use('App/Exceptions/AppException')
const Logger = use('Logger')
const Database = use('Database')
const { isObject, upperCase } = require('lodash')
const iap = require('in-app-purchase')
const { JWT } = require('google-auth-library')
const { google } = require('googleapis')
const moment = require('moment-timezone')
const HttpException = use('App/Exceptions/HttpException')
const { DEVICE_TYPE_ANDROID, DEVICE_TYPE_IOS } = require('../constants')
const UserService = use('App/Services/UserService')

const AppType = {
  ANDROID: DEVICE_TYPE_ANDROID,
  IOS: DEVICE_TYPE_IOS,
}

const EnvironmentType = {
  SANDBOX: 'sandbox',
  PROD: 'prod',
}

const AppService = {
  GOOGLE: 'google',
  APPLE: 'apple',
}
const timeZone = 'Europe/Berlin'

google.options({
  auth: new JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    [process.env.GOOGLE_AUTH_PUBLISHER]
  ),
})

const iapTestMode = process.env.IAP_TEST_MODE === 'true'
const androidPackageName = process.env.ANDROID_PACKAGE_NAME
const androidGoogleApi = google.androidpublisher({ version: 'v3' })

iap.config({
  // If you want to exclude old transaction, set this to true. Default is false:
  appleExcludeOldTransactions: true,
  // this comes from iTunes Connect (You need this to valiate subscriptions):
  applePassword: process.env.APPLE_SHARED_SECRET,

  googleServiceAccount: {
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  },

  /* Configurations all platforms */
  test: iapTestMode, // For Apple and Google Play to force Sandbox validation only
  // verbose: true, // Output debug logs to stdout stream
})

class TenantPremiumPlanService {
  /**
   *
   * @param {*}
   * data : JSON Object [{user_id:user_id, premium_id:premium_id}]
   */

  static async getTenantPremiumPlans(userId, app) {
    return await UserPremiumPlan.query()
      .where('app', app)
      .where('user_id', userId)
      .orderBy('startDate', 'desc')
      .first()
  }

  static async processPurchase(user_id, plan_id, payment_plan, app, receipt, trx = null) {
    try {
      await iap.setup()
      const validationResponse = await iap.validate(receipt)

      if (![AppType.IOS, AppType.ANDROID].includes(app)) {
        throw new HttpException('Your device is not supported!', 400)
      }
      if (app === AppType.IOS && !validationResponse.service === AppService.APPLE) {
        throw new HttpException('Your device is not supported!', 400)
      }
      if (app === AppType.ANDROID && !validationResponse.service === AppService.GOOGLE) {
        throw new HttpException('Your device is not supported!', 400)
      }
      const purchaseData = iap.getPurchaseData(validationResponse)
      const firstPurchaseItem = purchaseData[0]
      const isCancelled = iap.isCanceled(firstPurchaseItem)
      // const isExpired = iap.isExpired(firstPurchaseItem);
      const { productId } = firstPurchaseItem
      const latestReceipt =
        app === AppType.IOS ? validationResponse.latest_receipt : JSON.stringify(receipt)

      const transactionId =
        app === AppType.IOS
          ? firstPurchaseItem.originalTransactionId
          : firstPurchaseItem.transactionId

      console.log(
        'startDate',
        moment.tz(new Date(firstPurchaseItem.originalPurchaseDateMs), timeZone).toISOString()
      )

      const startDate =
        app === AppType.IOS
          ? moment.tz(new Date(firstPurchaseItem.originalPurchaseDateMs), timeZone).toISOString()
          : moment
              .tz(new Date(parseInt(firstPurchaseItem.startTimeMillis, 10)), timeZone)
              .toISOString()
      const endDate =
        app === AppType.IOS
          ? moment.tz(new Date(firstPurchaseItem.expiresDateMs), timeZone).toISOString()
          : moment
              .tz(new Date(new Date(parseInt(firstPurchaseItem.expiryTimeMillis, 10))), timeZone)
              .toISOString()

      // validationResponse contains sandbox: true/false for Apple and Amazon
      // Android we don't know if it has a sandbox account

      let environment = ''
      if (app === AppType.IOS) {
        environment = validationResponse.sandbox ? 'sandbox' : 'production'
      }

      const purchase = {
        user_id: user_id,
        app: app,
        environment: environment,
        productId: productId,
        plan_id: plan_id,
        transactionId: transactionId,
        validationResponse: JSON.stringify(validationResponse),
        latestReceipt: latestReceipt,
        startDate: startDate,
        endDate: endDate,
        isCancelled: isCancelled,
        fake: false,
      }

      let newPurchase = null

      const tenantPremiumPlan = await this.getTenantPremiumPlans(user_id, app)

      if (!tenantPremiumPlan) {
        newPurchase = await UserPremiumPlan.createItem(
          {
            ...purchase,
          },
          trx
        )
      } else {
        newPurchase = await UserPremiumPlan.query()
          .where('user_id', user_id)
          .where('app', app)
          .update({ ...purchase }, trx)
      }

      if (this.checkIfHasSubscription(purchase)) {
        await UserService.updatePaymentPlan(user_id, plan_id, payment_plan, trx)
      } else {
        // he will downgrade to basic plan
        await UserService.updatePaymentPlan(user_id, 1, null, trx)
      }
      // From https://developer.android.com/google/play/billing/billing_library_overview:
      // You must acknowledge all purchases within three days.
      // Failure to properly acknowledge purchases results in those purchases being refunded.
      if (app === AppType.ANDROID && validationResponse.acknowledgementState === 0) {
        await androidGoogleApi.purchases.subscriptions.acknowledge({
          packageName: androidPackageName,
          subscriptionId: productId,
          token: receipt.purchaseToken,
        })
      }
      return newPurchase
    } catch (e) {
      console.log('Purchase Error Here', JSON.stringify(e))
      throw new HttpException(e, 501)
    }
  }

  static async checkIfHasSubscription(subscription) {
    if (!subscription) return false
    if (subscription.isCancelled) return false
    const nowMs = moment.tz(new Date(), timeZone).valueOf()
    return (
      moment.tz(subscription.startDate, timeZone).valueOf() <= nowMs &&
      moment.tz(subscription.endDate, timeZone).valueOf() >= nowMs
    ) // TODO grace period?
  }

  static async getActiveSubscriptions() {
    return (
      await UserPremiumPlan.query()
        .where('endDate', '>=', moment.tz(new Date(), timeZone).format('YYYY-MM-DD'))
        .where('fake', false)
        .orderBy('startDate', 'desc')
        .fetch()
    ).rows
  }

  static async validateAllSubscriptions() {
    console.log('Hello Tenant validateAllSuscriptions')
    const purchases = await TenantPremiumPlanService.getActiveSubscriptions()
    if (!purchases || !purchases.length) return
    purchases.map((purchase) => {
      try {
        if (purchase.app === AppType.IOS) {
          TenantPremiumPlanService.processPurchase(
            purchase.user_id,
            purchase.plan_id,
            purchase.payment_plan,
            purchase.app,
            purchase.latestReceipt
          )
        } else {
          TenantPremiumPlanService.processPurchase(
            purchase.user_id,
            purchase.plan_id,
            purchase.payment_plan,            
            purchase.app,
            JSON.parse(purchase.latestReceipt)
          )
        }
      } catch (e) {
        Logger.error(`Failed to validate subscription ${purchase.id}`)
      }
    })
  }
}

module.exports = TenantPremiumPlanService
