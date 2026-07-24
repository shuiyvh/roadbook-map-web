import auth from '@/plugins/auth'
import router, { constantRoutes, dynamicRoutes } from '@/router'
import { getRouters } from '@/api/menu'
import Layout from '@/layout/index.vue'
import ParentView from '@/components/ParentView/index.vue'
import InnerLink from '@/layout/components/InnerLink/index.vue'

// 匹配views里面所有的.vue文件
const modules = import.meta.glob('./../../views/**/*.vue')

const usePermissionStore = defineStore(
  'permission',
  {
    state: () => ({
      routes: [] as any[],
      addRoutes: [] as any[],
      defaultRoutes: [] as any[],
      topbarRouters: [] as any[],
      sidebarRouters: [] as any[]
    }),
    actions: {
      setRoutes(routes: any[]) {
        this.addRoutes = routes
        this.routes = constantRoutes.concat(routes)
      },
      setDefaultRoutes(routes: any[]) {
        this.defaultRoutes = constantRoutes.concat(routes)
      },
      setTopbarRoutes(routes: any[]) {
        this.topbarRouters = routes
      },
      setSidebarRouters(routes: any[]) {
        this.sidebarRouters = routes
      },
      generateRoutes(roles?: any[]): Promise<any[]> {
        return new Promise(resolve => {
          // 向后端请求路由数据
          getRouters().then(res => {
            const sdata = JSON.parse(JSON.stringify(res.data))
            const rdata = JSON.parse(JSON.stringify(res.data))
            const defaultData = JSON.parse(JSON.stringify(res.data))
            const sidebarRoutes = filterAsyncRouter(sdata)
            /*
             * 大屏由前端常量路由 /screen 独立承载。后端菜单只负责在后台侧边栏展示入口，
             * 不能再次注册为 Layout 子路由，否则从菜单进入时会套用后台导航和标签栏。
             */
            const rewriteRoutes = filterAsyncRouter(removeStandaloneScreenRoute(rdata), false, true)
            const defaultRoutes = filterAsyncRouter(defaultData)
            const asyncRoutes = filterDynamicRoutes(dynamicRoutes)
            asyncRoutes.forEach(route => { router.addRoute(route) })
            this.setRoutes(rewriteRoutes)
            this.setSidebarRouters(constantRoutes.concat(sidebarRoutes))
            this.setDefaultRoutes(sidebarRoutes)
            this.setTopbarRoutes(defaultRoutes)
            resolve(rewriteRoutes)
          })
        })
      }
    }
  })

/**
 * 从待注册的动态路由中移除大屏菜单及其空壳父路由。
 * 侧边栏使用独立的数据副本，因此菜单仍会正常展示并跳转到顶级 /screen。
 */
function removeStandaloneScreenRoute(routes: any[]): any[] {
  return routes.reduce((filteredRoutes: any[], route: any) => {
    if (route.component === 'screen/index') {
      return filteredRoutes
    }

    if (Array.isArray(route.children) && route.children.length > 0) {
      route.children = removeStandaloneScreenRoute(route.children)
      if (route.children.length === 0) {
        return filteredRoutes
      }
    }

    filteredRoutes.push(route)
    return filteredRoutes
  }, [])
}

// 遍历后台传来的路由字符串，转换为组件对象
function filterAsyncRouter(asyncRouterMap: any[], lastRouter = false, type = false) {
  return asyncRouterMap.filter(route => {
    if (type && route.children) {
      route.children = filterChildren(route.children)
    }
    if (route.component) {
      // Layout ParentView 组件特殊处理
      if (route.component === 'Layout') {
        route.component = Layout
      } else if (route.component === 'ParentView') {
        route.component = ParentView
      } else if (route.component === 'InnerLink') {
        route.component = InnerLink
      } else {
        route.component = loadView(route.component)
      }
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, route, type)
    } else {
      delete route['children']
      delete route['redirect']
    }
    return true
  })
}

function filterChildren(childrenMap: any[], lastRouter: any = false) {
  var children: any[] = []
  childrenMap.forEach(el => {
    el.path = lastRouter ? lastRouter.path + '/' + el.path : el.path
    if (el.children && el.children.length && el.component === 'ParentView') {
      children = children.concat(filterChildren(el.children, el))
    } else {
      children.push(el)
    }
  })
  return children
}

// 动态路由遍历，验证是否具备权限
export function filterDynamicRoutes(routes: any[]): any[] {
  const res: any[] = []
  routes.forEach(route => {
    if (route.permissions) {
      if (auth.hasPermiOr(route.permissions)) {
        res.push(route)
      }
    } else if (route.roles) {
      if (auth.hasRoleOr(route.roles)) {
        res.push(route)
      }
    }
  })
  return res
}

export const loadView = (view: string): any => {
  let res
  for (const path in modules) {
    const dir = path.split('views/')[1].split('.vue')[0]
    if (dir === view) {
      res = () => modules[path]()
    }
  }
  return res
}

export default usePermissionStore
