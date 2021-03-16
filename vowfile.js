'use strict'

const ace = require('@adonisjs/ace')
const Promise = require('bluebird')

module.exports = (cli, runner) => {
  runner.before(async () => {
    const Database = use('Database')
    const clearDB = async () => {
      const tables = (
        await Database.raw(
          `select 'DROP TABLE IF EXISTS "' || tablename || '" CASCADE ;' as query from pg_tables where schemaname = 'public';`
        )
      ).rows
      await Promise.all(tables.map((i) => Database.raw(i.query)))
    }
    const clearAll = async () => {
      let times = 0
      try {
        await clearDB()
      } catch (e) {
        times += 1
        if (times > 5) {
          throw new Error('Pre run attempts expire')
        }
        await clearAll()
      }
    }

    // await clearAll()
    // await ace.call('migration:run', {}, { silent: true })

    use('Adonis/Src/Server').listen(process.env.HOST, process.env.PORT)
  })

  runner.after(async () => {
    use('Adonis/Src/Server').getInstance().close()
    // await ace.call('migration:reset', {}, { silent: true })

    const Redis = use('Redis')
    await Redis.flushall()
  })
}
