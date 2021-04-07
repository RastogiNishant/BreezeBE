'use strict'

class Base {
  static options = { abortEarly: false, stripUnknown: true }

  get data() {
    const body = this.ctx.request.all()

    return { ...body, ...this.ctx.params }
  }

  get rules() {
    return {}
  }
}

module.exports = Base
