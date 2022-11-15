'use strict'

const { test, before, after } = use('Test/Suite')('Unread Messages Count Unit Test')
const { faker } = require('@faker-js/faker')
const { CHAT_EDIT_STATUS_DELETED, CHAT_TYPE_LAST_READ_MARKER } = require('../../app/constants')
const Database = use('Database')

const User = use('App/Models/User')
const Estate = use('App/Models/Estate')
const Chat = use('App/Models/Chat')

const { ROLE_LANDLORD, ROLE_USER } = use('App/constants')

const { sleep } = require('../../app/excepions')

let TestLandlord
let TenantUser
let task

faker.locale = 'de'

const testCorrectEstate = {
  street: faker.address.street(),
  house_number: faker.random.numeric(2),
  zip: faker.address.zipCode(),
  city: faker.address.city(),
  country: 'Germany',
}
let taskId

before(async () => {
  TestLandlord = await User.query()
    .where('role', ROLE_LANDLORD)
    .where('email', 'it@bits.ventures')
    .first()
  TenantUser = await User.query()
    .where('role', ROLE_USER)
    .where('email', 'it@bits.ventures')
    .first()
  testCorrectEstate.user_id = TestLandlord.id
  const estate = await Estate.createItem(testCorrectEstate)
  testCorrectEstate.id = estate.id
  const content = {
    estate_id: testCorrectEstate.id,
    tenant_id: TenantUser.id,
    creator_role: ROLE_LANDLORD,
  }
  task = await Database.table('tasks').insert(content).returning('id')
  taskId = task[0]
})

const ChatService = use('App/Services/ChatService')

after(async () => {
  //Cleanup
  await Database.table('chats').where('task_id', taskId).delete()
  await Database.table('tasks').where('id', taskId).delete()
  await Database.table('estates').where('id', testCorrectEstate.id).delete()
})

test(`When task is created by landlord and landlord sent several messages
the number of messages sent by landlord should be the unread messages for
tenant`, async ({ assert }) => {
  const messageCount = faker.datatype.number({
    min: 5,
    max: 10,
  })
  for (let count = 0; count < messageCount; count++) {
    await ChatService.save(faker.hacker.phrase(), TestLandlord.id, taskId)
  }
  // L L L
  const unreadMessagesCount = await ChatService.getUnreadMessagesCount(taskId, TenantUser.id)
  assert.equal(messageCount, unreadMessagesCount)
})

test(`Unread Messages Count for landlord should be zero because he's the last sender.`, async ({
  assert,
}) => {
  // L L L
  const unreadMessagesCount = await ChatService.getUnreadMessagesCount(taskId, TestLandlord.id)
  assert.equal(unreadMessagesCount, 0)
})

test(`When tenant send markLastRead, his unread messages should be zero.`, async ({ assert }) => {
  // L L L TM
  await ChatService.markLastRead(TenantUser.id, taskId)
  const readTaskMarkers = (
    await Chat.query()
      .where({
        type: CHAT_TYPE_LAST_READ_MARKER,
        sender_id: TenantUser.id,
        task_id: taskId,
      })
      .fetch()
  ).rows
  assert.isDefined(readTaskMarkers)
  assert.equal(readTaskMarkers.length, 1)
  const unreadMessagesCount = await ChatService.getUnreadMessagesCount(taskId, TenantUser.id)
  assert.equal(unreadMessagesCount, 0, 'Tenant marked read so he should have zero unread.')
})

test(`Since tenant has not sent a message, landlord will still have zero unread messages.`, async ({
  assert,
}) => {
  // L L L TM
  const unreadMessagesCount = await ChatService.getUnreadMessagesCount(taskId, TestLandlord.id)
  assert.equal(unreadMessagesCount, 0, 'tenant did not send message yet so still 0')
})

test(`Tenant send messages, tenant should have 0 unread messages, while landlord will have this unread count`, async ({
  assert,
}) => {
  // L L L TM T T

  assert.isDefined(taskId)
  //await Chat.query().where('task_id', taskId).delete()

  const messageCount = faker.datatype.number({
    min: 5,
    max: 10,
  })

  for (let count = 0; count < messageCount; count++) {
    //tenant sent several messages...
    await sleep(800)
    let task = await ChatService.save(faker.hacker.phrase(), TenantUser.id, taskId)
    assert.isDefined(task.id)
  }
  let unreadMessagesCount = await ChatService.getUnreadMessagesCount(taskId, TenantUser.id)

  assert.equal(
    unreadMessagesCount,
    0,
    'Tenant sent messages so he should not have an unread message.'
  )

  unreadMessagesCount = await ChatService.getUnreadMessagesCount(taskId, TestLandlord.id)
  assert.equal(
    unreadMessagesCount,
    messageCount,
    `Tenant sent messages so landlord expects to see unread messages equal to how many tenant sent.`
  )
}).timeout(0)

test('Landlord has sent a message before, tenant sent messages then he marklastReadMarker', async ({
  assert,
}) => {
  await ChatService.markLastRead(TestLandlord.id, taskId)
  const unreadMessagesCount = await ChatService.getUnreadMessagesCount(taskId, TestLandlord.id)
  assert.equal(unreadMessagesCount, 0)
})
