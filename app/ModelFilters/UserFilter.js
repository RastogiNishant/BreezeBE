'use strict'

const BaseModelFilter = use('App/ModelFilters/BaseModelFilter')

class UserFilter extends BaseModelFilter {
  id(value) {
    return this.where('users.id', +value)
  }

  status(value) {
    const statuses = ['active', 'deleted', 'block']
    if (!statuses.includes(value)) {
      return this
    }

    switch (value) {
      case 'active':
        this.whereNot('users.deleted', true)
        this.whereNot('users.block', true)
        break
      case 'deleted':
        this.where('users.deleted', true)
        break
      case 'block':
        this.where('users.block', true)
        break
    }
  }

  email(value) {
    this.whereRaw('users.email LIKE ?', [`${value}%`])
  }

  username(value) {
    this.whereRaw('users.username LIKE ?', [`${value}%`])
  }
}

module.exports = UserFilter
