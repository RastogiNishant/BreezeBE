'use strict'

module.exports = {
  enable: true,
  specUrl: '/swagger.json',

  options: {
    swaggerDefinition: {
      info: {
        title: 'Breeze Backend API',
        version: '2.0.0',
      },
      openapi:'3.0.0',
      basePath: '/',
      tags: [
        {
          name: 'Accounts',
          description: 'All about authentication, information about Landlords, Tenants/Prospects, etc.'
        },
        {
          name: 'Landlords',
          description: 'All about the Landlord User'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
    },
    apis: [
      'docs/**/*.yml',
      'start/routes.js',
    ],
  },
}
