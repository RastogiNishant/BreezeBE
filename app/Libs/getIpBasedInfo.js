const axios = require('axios')
const { has, pick } = require('lodash')
const ipAddressJs = require('ipaddr.js')

const getIpBasedInfo = async (ip, accessKey = null) => {
  if (!isPublicIp(ip)) {
    return false
  }
  const ipstackEndpoint = 'http://api.ipstack.com'
  accessKey = accessKey || process.env.IPSTACK_API_ACCESS_KEY
  if (!accessKey) {
    console.error('IPSTACK_API_ACCESS_KEY must be set in .env')
    return false
  }
  const url = `${ipstackEndpoint}/${ip}?access_key=${accessKey}`
  try {
    let { data } = await axios.get(url)
    if (!has(data, 'error')) {
      data = pick(data, ['country_code', 'country_name', 'city', 'zip', 'latitude', 'longitude'])
      return data
    }
    return false
  } catch (err) {
    console.error('ipstack error', err.message)
    return false
  }
}

const isPublicIp = (ip) => {
  return ipAddressJs.parse(ip).range() === 'unicast'
}

module.exports = {
  getIpBasedInfo,
  isPublicIp,
}
