const Route = use('Route')

export const prefixAll = (prefix: string, routes: Array<any>) => {
  routes.forEach((route) => route.prefix(prefix))
}

export enum HTTP_METHODS {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  PATCH = 'patch',
  DELETE = 'delete'
}

export type Routes = {
  [path: string]: RouteConfig
}

export type RouteConfig = {
  [key in HTTP_METHODS]?: {
    controller: any,
    middleware?: string[]
  }
}

/**
 * Register the routes into the adonis Route config
 * @param routes
 * @param prefix
 * @returns
 */
export const generateAdonisRoutes = (routes: Routes, prefix = '') => {
  return Object.keys(routes).map((path: string) => {
    return Object.keys(routes[path]).map((method: HTTP_METHODS) => {
      const { controller, middleware } = routes[path][method]
      const route = Route[method](`${prefix}${path}`, controller)
      middleware && route.middleware(middleware)
      return route
    })
  })
}

/**
 * add middleware to all the routes
 * @returns modified routes object
 */
export const addMiddlewareToRoutes = (routes: Routes, middleware: string[]) => {
  Object.keys(routes).forEach((path: string) => {
    Object.keys(routes[path]).forEach((method: HTTP_METHODS) => {
      routes[path][method].middleware = [...middleware, ...(routes[path][method].middleware || [])]
    })
  })

  return routes
}

export const mergeRoutes = (routeA: Routes, routeB: Routes) => {
  const result = {}

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
