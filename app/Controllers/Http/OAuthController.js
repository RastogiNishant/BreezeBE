'use strict'

class OAuthController {
  /**
   *
   */
  async googleAuth({ ally }) {
    await ally.driver('google').redirect()
  }

  /**
   *
   */
  async googleAuthConfirm({ ally, auth }) {
    try {
      const authUser = await ally.driver('google').getUser()
      console.log(authUser)
    } catch (e) {
      console.log(e)
    }

    return ''
  }
}

module.exports = OAuthController
