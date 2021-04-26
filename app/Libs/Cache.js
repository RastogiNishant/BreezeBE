const moment = require('moment')
const { isString, reduce, sortBy, toString, isEmpty } = require('lodash')

const Cache = use('Cache')

/**
 *
 */
const getKey = (data, prefix = '') => {
  if (isString(data) || isEmpty(data)) {
    return `${prefix}_${toString(data)}`
  }

  const dataStr = sortBy(
    reduce(data, (n, v, k) => [...n, { k, v: toString(v) }], []),
    'k'
  )
    .map((i) => `${i.k}:${i.v}`)
    .join('_')

  return `${prefix}_${dataStr}`
}

/**
 *
 */
const remember = (key, cb, ttl = null, tags = []) => {
  let cache = Cache
  if (!isEmpty(tags)) {
    cache = Cache.tags(tags)
  }

  if (!ttl) {
    return cache.remember(key, 2529000, cb)
  }

  return cache.remember(key, moment().add(ttl, 's').toDate(), cb)
}

module.exports = {
  Cache,
  remember,
  getKey,
}
