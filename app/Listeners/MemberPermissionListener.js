'use strict'

const MemberPermissionService = use('App/Services/MemberPermissionService')

const MemberPermissionListener = (exports = module.exports = {})

MemberPermissionListener.createMemberPermission = async (memberId, userId) => {
  await MemberPermissionService.createMemberPermission(memberId, userId)
}
