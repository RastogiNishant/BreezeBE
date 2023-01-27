'use strict'

const { test } = use('Test/Suite')('Get Ip Based Info')
const validIpV4ToTest = '13.115.182.240'
const validIpV6ToTest = '2001:4860:4860::8888'
const { getIpBasedInfo, isPublicIp } = require('../../app/Libs/getIpBasedInfo')
const privateIps = ['127.0.0.1', '172.16.0.1', '192.168.0.1', '10.10.1.1', '::1']

test('isPublicIp returns false when ip is private', async ({ assert }) => {
  privateIps.map((ip) => {
    assert.isFalse(isPublicIp(ip))
  })
})

test('getIpBasedInfo returns false when ip is private', async ({ assert }) => {
  privateIps.map(async (ip) => {
    let result = await getIpBasedInfo(ip)
    assert.isFalse(result)
  })
})

test('getIpBasedInfo returns false when accesskey is wrong', async ({ assert }) => {
  const result = await getIpBasedInfo(validIpV4ToTest, 'asdf')
  assert.isFalse(result)
})

test('getIpBasedInfo returns information when ipv4 is public', async ({ assert }) => {
  const result = await getIpBasedInfo(validIpV4ToTest)
  assert.isObject(result)
  assert.include(result, { city: 'Tokyo', country_code: 'JP' })
})

test('getIpBasedInfo returns information when ipv6 is public', async ({ assert }) => {
  const result = await getIpBasedInfo(validIpV6ToTest)
  assert.isObject(result)
  assert.include(result, { city: 'Mountain View', country_code: 'US' })
})
