const Route = use('Route')

export const prefixAll = (prefix: string, routes: any[]): void => {
  routes.forEach((route2) => route2.prefix(prefix))
}

export enum HTTP_METHODS {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  PATCH = 'patch',
  DELETE = 'delete'
}

export interface Routes {
  [path: string]: RouteConfig
}

export type RouteConfig = {
  [key in HTTP_METHODS]?: {
    controller: any
    middleware?: string[]
  }
}

/**
 * Register the routes into the adonis Route config
 * @param routes
 * @param prefix
 * @returns
 */
export const generateAdonisRoutes = (routes: Routes, prefix = ''): void => {
  for (const [path, routeConfig] of Object.entries(routes)) {
    for (const [method, { controller, middleware }] of Object.entries(routeConfig)) {
      const route = Route[method](`${prefix}${path}`, controller)
      if (middleware != null) {
        route.middleware(middleware)
      }
    }
  }
}

function isDefined<T> (arg: T | undefined | null): arg is T {
  return arg !== undefined && arg !== null
}

/**
 * add middleware to all the routes
 * @returns modified routes object
 */
export const addMiddlewareToRoutes = (routes: Routes, middleware: string[]): Routes => {
  for (const [path, route] of Object.entries(routes)) {
    for (const [method, config] of Object.entries(route)) {
      const oldMiddleware = config.middleware
      if (isDefined(oldMiddleware)) {
        routes[path][method] = {
          ...config,
          middleware: [...middleware, ...oldMiddleware]
        }
      } else {
        routes[path][method] = {
          ...config,
          middleware
        }
      }
    }
  }

  return routes
}

export const mergeRoutes = (routeA: Routes, routeB: Routes): Routes => {
  const result: Routes = {}

  Object.keys(routeA).forEach((key) => {
    if (key in routeB) {
      // if key exists in obj2, merge values recursively
      result[key] = {
        ...routeA[key],
        ...routeB[key]
      }
    } else {
      // otherwise, copy key to result
      result[key] = routeA[key]
    }
  })

  Object.keys(routeB).forEach((key) => {
    if (!(key in routeA)) {
      result[key] = routeB[key]
    }
  })

  return result
}
