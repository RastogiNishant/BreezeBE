'use strict'

const Schema = use('Schema')
const Permission = use('Permission')
const Role = use('Role')

class AdminRoleSchema extends Schema {
  up() {
    let roleAdmin
    this.schedule(async (trx) => {
      roleAdmin = new Role()
      roleAdmin.name = 'Admin'
      roleAdmin.slug = 'admin'
      roleAdmin.description = 'Manage administration privileges'
      await roleAdmin.save(trx)

      const updateUsersPermission = new Permission()
      updateUsersPermission.slug = 'update_permission'
      updateUsersPermission.name = 'Update User Permissions'
      updateUsersPermission.description = 'Update User Permissions'
      await updateUsersPermission.save(trx)

      roleAdmin.permissions().attach([updateUsersPermission.id])
    })
  }

  down() {}
}

module.exports = AdminRoleSchema
