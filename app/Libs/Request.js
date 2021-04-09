const { URL, format } = require('url')
const bent = require('bent')
const { each } = require('lodash')

class Request {
  constructor(rootUrl) {
    this.rootUrl = rootUrl
  }

  /**
   *
   */
  static getUri(url, params) {
    const u = new URL(url)
    each(params, (v, n) => {
      u.searchParams.set(n, v)
    })
    u.pathname = u.pathname.replace(/\/\//g, '/')

    return format(u)
  }

  /**
   *
   */
  async send({ url, data, headers = {}, method = 'GET', type = 'json', status = [202, 201, 200] }) {
    // console.log({ url, data, headers, method, type, status })
    if (method === 'GET') {
      url = this.constructor.getUri(`${this.rootUrl}/${url}`, data)
      data = {}
    } else {
      url = this.constructor.getUri(`${this.rootUrl}/${url}`, {})
    }

    return bent(
      method,
      type,
      status
    )(url, data).catch((e) => {
      console.log(e)
      throw e
    })
  }
}

module.exports = Request
