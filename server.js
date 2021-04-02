'use strict'

/*
|--------------------------------------------------------------------------
| Http server
|--------------------------------------------------------------------------
|
| This file bootstraps Adonisjs to start the HTTP server. You are free to
| customize the process of booting the http server.
|
| """ Loading ace commands """
|     At times you may want to load ace commands when starting the HTTP server.
|     Same can be done by chaining `loadCommands()` method after
|
| """ Preloading files """
|     Also you can preload files by calling `preLoad('path/to/file')` method.
|     Make sure to pass a relative path from the project root.
*/

const { Ignitor } = require('@adonisjs/ignitor')
const https = require('https')
const fs = require('fs')

// TODO: change hardcoded cert paths
const key = '/home/ubuntu/cert/privkey.pem'
const cert = '/home/ubuntu/cert/fullchain.pem'

let handler = null

if (fs.existsSync(key)) {
  handler = (handler) => {
    return https.createServer(
      {
        key: fs.readFileSync(key),
        cert: fs.readFileSync(cert),
      },
      handler
    )
  }
}

new Ignitor(require('@adonisjs/fold'))
  .appRoot(__dirname)
  .fireHttpServer(handler)
  .catch(console.error)
