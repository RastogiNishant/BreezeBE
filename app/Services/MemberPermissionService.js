const MemberPermission = use('App/Models/MemberPermission')
class MemberPermissionService {
  static async createMemberPermission(memberId, userId, trx = null) {
    const isExist = await this.isExistPermission(memberId, userId)
    if (!isExist) {
      await MemberPermission.createItem(
        {
          member_id: memberId,
          user_id: userId
        },
        trx
      )
    }
  }

  static async getMemberPermission(memberId) {
    return await MemberPermission.query()
      .select(['member_id', 'user_id'])
      .where('member_id', memberId)
      .fetch()
  }

  static async isExistPermission(memberId, userId) {
    const memberPermission = await MemberPermission.query()
      .where('member_id', memberId)
      .where('user_id', userId)
      .first()

    return !!memberPermission
  }

  static async deletePermission(memberId, trx = null) {
    if (trx) {
      await MemberPermission.query().where('member_id', memberId).delete().transacting(trx)
    } else {
      await MemberPermission.query().where('member_id', memberId).delete()
    }
    return true
  }

  static async deletePermissionByUser(userId, trx = null) {
    if (trx) {
      await MemberPermission.query().where('user_id', userId).delete().transacting(trx)
    } else {
      await MemberPermission.query().where('user_id', userId).delete()
    }

    return true
  }
}

module.exports = MemberPermissionService
