'use strict'

module.exports = {
  enable: true,
  specUrl: '/swagger.json',

  options: {
    swaggerDefinition: {
      info: {
        title: 'Breeze Backend API',
        description:
          'Breeze backend API documentation.\n\nNotes to Developers/Testers: Login first, copy data.token, then paste to Authorize.',
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
          url: 'http://13.213.41.87:3000/',
          description: 'Temporary api dev for import export excel',
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
          name: 'Authentication',
          description: 'All about authentication',
        },
        {
          name: 'User Account',
          description:
            'All about authentication, information about Landlords, Tenants/Prospects, etc.',
        },
        {
          name: 'Landlord Estates',
          description: `All about the Landlord's Estates`,
        },
        {
          name: 'Landlord Estate Timeslots',
          description: `Landlord Estate Timeslots`,
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
