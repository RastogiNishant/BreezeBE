'use strict'

const { has } = require('lodash')

class QueryParse {
  async handle({ request }, next) {
    const params = request.all()
    if (request.method() !== 'GET') {
      return next()
    }

    ;['filters', 'order'].forEach((i) => {
      if (has(params, i)) {
        try {
          request._all[i] = JSON.parse(params[i])
        } catch (e) {}
      }
    })

    await next()
  }
}

module.exports = QueryParse
