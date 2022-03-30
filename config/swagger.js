'use strict'

module.exports = {
  enable: true,
  specUrl: '/swagger.json',

  options: {
    swaggerDefinition: {
      info: {
        title: 'Breeze Backend API',
        description: 'Breeze backend API documentation.',
        version: '2.0.0',
      },
      openapi: '3.0.0',
      basePath: '/',
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Dev Local server',
        },
        {
          url: 'https://api-dev.breeze4me.de',
          description: 'Development Server',
        },
        {
          url: 'https://api-staging.breeze4me.de',
          description: 'Staging Server',
        },
        {
          url: 'https://api.breeze4me.de',
          description: 'Production Server',
        },
      ],
      tags: [
        {
          name: 'Accounts',
          description:
            'All about authentication, information about Landlords, Tenants/Prospects, etc.',
        },
        {
          name: 'Landlords',
          description: 'All about the Landlord User',
        },
        {
          name: 'Prospects',
          description: 'All about the prospects',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    apis: ['docs/**/*.yml', 'start/routes.js'],
  },
}
