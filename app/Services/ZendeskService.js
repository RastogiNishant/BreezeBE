'use strict'

// const express = require('express')
// const crypto = require('crypto')
// require('body-parser-xml')(express)

// // Signing secret from webhook itself
// const SIGNING_SECRET = process.env.ZENDESK_SIGNING_SECRET
// // Always sha256
// const SIGNING_SECRET_ALGORITHM = 'sha256'

class ZendeskService {
  static isValidSignature(signature, body, timestamp) {
    let hmac = crypto.createHmac(SIGNING_SECRET_ALGORITHM, SIGNING_SECRET)
    let sig = hmac.update(timestamp + body).digest('base64')

    return Buffer.compare(Buffer.from(signature), Buffer.from(sig.toString('base64'))) === 0
  }

  static storeRawBody(req, res, buf) {
    if (buf && buf.length) {
      req.rawBody = buf.toString('utf8')
    }
  }
  static createToken( id, name, email ) {
    const jwt = require('jsonwebtoken'); 
    const payload = {
      name: name,
      email: email,
      external_id: id
    };

    const token = jwt.sign(payload, process.env.ZENDESK_JWT_KEY);    
    return token
  }
}

module.exports = ZendeskService