export class Base {
  static options = { abortEarly: false, stripUnknown: true }

  get data (): any {
    // @ts-expect-error
    const body = this.ctx.request.all()
    // @ts-expect-error
    return { ...body, ...this.ctx.params }
  }

  get rules (): any {
    return {}
  }
}

// @ts-expect-error hack to enable named import in mixed js and ts mode
Base.Base = Base

module.exports = Base
