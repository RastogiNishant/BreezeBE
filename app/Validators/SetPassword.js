"use strict";

const yup = require("yup");
const Base = require("./Base");

class SetPassword extends Base {
  static schema = () =>
    yup.object().shape({
      code: yup.string().uppercase().min(6).required(),
      password: yup.string().trim().min(6).max(36).required(),
      email: yup.string().email().lowercase().required(),
    });
}

module.exports = SetPassword;
