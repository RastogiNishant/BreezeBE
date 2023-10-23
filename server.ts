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
import * as http from 'node:http'
import * as fs from 'node:fs'
import * as https from 'node:https'

import 'newrelic'
import { Ignitor } from '@adonisjs/ignitor'
import * as AdonisFold from '@adonisjs/fold'

// TODO: change hardcoded cert paths
const key = '/home/ubuntu/cert/privkey.pem'
const cert = '/home/ubuntu/cert/fullchain.pem'

let httpsListener:
  | ((handler: http.RequestListener) => ReturnType<typeof https.createServer>)
  | null = null

if (fs.existsSync(key)) {
  httpsListener = (handler) => {
    return https.createServer(
      {
        key: fs.readFileSync(key),
        cert: fs.readFileSync(cert)
      },
      handler
    )
  }
}

new Ignitor(AdonisFold)
  .appRoot(__dirname)
  .wsServer() // boot the WebSocket server
  .fireHttpServer(httpsListener)
  .catch(console.error)
