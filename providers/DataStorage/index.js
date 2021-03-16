'use strict'

class Storage {
  constructor(Redis) {
    this.redis = Redis
  }

  async getItem(key, prefix = '') {
    try {
      const data = await this.redis.get(`${prefix}_${key}`)
      return JSON.parse(data)
    } catch (e) {
      console.log(e)
    }

    return null
  }

  async remove(key, prefix = '') {
    await this.redis.del(`${prefix}_${key}`)
  }

  async setItem(key, data, prefix = '', options = {}) {
    await this.redis.set(`${prefix}_${key}`, JSON.stringify(data))
    if (!options.expire) {
      options.expire = 3600
    }

    if (options.expire > 0) {
      await this.redis.expire(`${prefix}_${key}`, options.expire)
    }

    return true
  }

  async clearItem(key, prefix = '') {
    return this.redis.del(`${prefix}_${key}`)
  }

  async getScore(score_id) {
    return this.getItem(score_id, 'score')
  }

  async setScore(score_id, data) {
    return this.setItem(score_id, data, 'score')
  }
}

module.exports = Storage
