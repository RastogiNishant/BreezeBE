"use strict";

const yup = require("yup");

const Base = require("./Base");

class UpdateContact extends Base {
  static schema = () => {
    return yup.object().shape({
      email: yup.string().email().lowercase().max(255),
      full_name: yup.string().min(2).max(255),
      phone: yup.string().matches(/^\+[0-9]{10,20}$/),
      region: yup.string().max(255),
    });
  };
}

module.exports = UpdateContact;
