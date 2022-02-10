'use strict'

const Schema = use('Schema')
const Database = use('Database')

const planSql = `
INSERT INTO "plans" ("name",description,prices,created_at,updated_at) VALUES
	 ('Basic','This is a basic plan',0.00,'2022-01-27 15:09:26.402','2022-01-27 15:09:26.402');
`

class AddBasicPlanSchema extends Schema {
  up() {
    this.schedule(async (trx) => {
      await Database.raw(sql)
    })
  }

  down() {}
}

module.exports = AddBasicPlanSchema
