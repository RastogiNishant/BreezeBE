'use strict'

module.exports = {
  enable: true,
  specUrl: '/swagger.json',

  options: {
    swaggerDefinition: {
      info: {
        title: 'Breeze',
        version: '1.0.0',
      },

      basePath: '/',
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          bearerFormat: 'JWT',
        },
      },
    },
    apis: [
      'docs/**/*.yml',
      'start/routes.js',
    ],
  },
}
