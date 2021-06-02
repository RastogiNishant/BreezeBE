'use strict'

const Schema = use('Schema')
const Database = use('Database')

const trigger = `
  CREATE OR REPLACE FUNCTION trigger_set_timestamp()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
`

const attachTriggerMatches = `
  CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();
`
const attachTriggerLikes = `
  CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON likes
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();
`

const dropTriggerMatches = `DROP TRIGGER IF EXISTS set_timestamp ON matches`
const dropTriggerLikes = `DROP TRIGGER IF EXISTS set_timestamp ON likes`

class MatchesSchema extends Schema {
  up() {
    this.table('matches', (table) => {
      // alter table
      table.integer('order_tenant').unsigned().defaultTo(100000)
      table.integer('order_lord').unsigned().defaultTo(100000)
      table.timestamp('updated_at').defaultTo(Database.fn.now())
    })

    this.table('likes', (table) => {
      table.timestamp('updated_at').defaultTo(Database.fn.now())
    })

    this.schedule(async (trx) => {
      await Database.raw(trigger).transacting(trx)
      await Database.raw(dropTriggerLikes).transacting(trx)
      await Database.raw(dropTriggerMatches).transacting(trx)
      await Database.raw(attachTriggerMatches).transacting(trx)
      await Database.raw(attachTriggerLikes).transacting(trx)
    })
  }

  down() {
    this.schedule(async (trx) => {
      await Database.raw(dropTriggerLikes).transacting(trx)
      await Database.raw(dropTriggerMatches).transacting(trx)
    })

    this.table('matches', (table) => {
      table.dropColumn('order_tenant')
      table.dropColumn('order_lord')
      table.dropColumn('updated_at')
    })

    this.table('likes', (table) => {
      table.dropColumn('updated_at')
    })
  }
}

module.exports = MatchesSchema
