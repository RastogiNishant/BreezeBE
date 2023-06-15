'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class AddConstraintRemoveMemberFileWhenMemberRemoveSchema extends Schema {
  async up() {
    await Database.raw(`
    ALTER TABLE member_files DROP CONSTRAINT member_files_member_id_foreign;
    ALTER TABLE member_files ADD CONSTRAINT member_files_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;`)
  }

  down() {}
}

module.exports = AddConstraintRemoveMemberFileWhenMemberRemoveSchema
