'use strict'

const { ServiceProvider } = require('@adonisjs/fold')
const express = require("express");
const crypto = require("crypto");
require("body-parser-xml")(express);
const Zendesk = require('.')

const SIGNING_SECRET = process.env.ZENDESK_JWT_KEY;

// Always sha256
const SIGNING_SECRET_ALGORITHM = "sha256";

class ZendeskProvider extends ServiceProvider {
  register() {
    // this.app.use(
    //   express.json({
    //     verify: storeRawBody,
    //   })
    // );
    // function storeRawBody(req, res, buf) {
    //   if (buf && buf.length) {
    //     req.rawBody = buf.toString("utf8");
    //   }
    // }    
    // this.app.use(express.urlencoded({ verify: storeRawBody, extended: true }));
    // this.app.use(express.xml({ verify: storeRawBody }));
    
    this.app.singleton('Zendesk', () => {
      return new Zendesk()
    })
  }

}

module.exports = ZendeskProvider
