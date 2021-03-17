class Contact {
  constructor() {
    this.firstname = ''
    this.secondname = ''
    this.title = ''
    this.position = ''
    this.salutation = ''
    this.salutationBrief = ''
    this.address = {
      country: '',
      city: '',
      addressLine1: '',
      addressLine2: '',
      zip: '',
      place: '',
    }
    this.email = ''
    this.tel = ''
    this.personNumber = 0
    this.photo = ''
  }
}

module.exports = Contact
