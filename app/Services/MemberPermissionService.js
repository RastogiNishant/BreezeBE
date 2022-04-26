const MemberPermission = use('App/Models/MemberPermission')
class MemberPermissionService {
  static async createMemberPermission(member_id, user_id, trx = null) {
    const isExist = await this.isExistPermission(member_id, user_id)
    if (!isExist) {
      await MemberPermission.createItem(
        {
          member_id: member_id,
          user_id: user_id,
        },
        trx
      )
    }
  }
  static async getMemberPermission(member_id) {
    return await MemberPermission.query()
      .select(['member_id', 'user_id'])
      .where('member_id', member_id)
      .fetch()
  }

  static async isExistPermission(member_id, user_id) {
    const memberPermission = await MemberPermission.query()
      .where('member_id', member_id)
      .where('user_id', user_id)
      .first()
    if (memberPermission) {
      return true
    }
    return false
  }

  static async deletePermission(member_id, trans = null) {
    try {
      await MemberPermission.query().where('member_id', member_id).delete(trans)
      return true
    } catch (e) {
      return e
    }
  }
}

module.exports = MemberPermissionService
