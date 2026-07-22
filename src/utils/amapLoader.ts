import { amapRuntimeConfig, setupAmapSecurityConfig } from '@/config/amap'

let amapLoadTask: Promise<any> | undefined

/**
 * 按需加载高德 JavaScript API。密钥从运行环境读取，加载失败会主动结束等待，
 * 避免网络或密钥异常时地图区域一直停留在无进度的加载状态。
 */
export function loadAmap(): Promise<any> {
  if (window.AMap) return Promise.resolve(window.AMap)
  if (amapLoadTask) return amapLoadTask
  if (!amapRuntimeConfig.key) return Promise.reject(new Error('未配置高德地图 JavaScript API Key'))

  setupAmapSecurityConfig()
  amapLoadTask = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('amap-js-api') as HTMLScriptElement | null
    if (existingScript) existingScript.remove()
    const script = document.createElement('script')
    let timeoutId = 0

    const cleanup = (): void => {
      window.clearTimeout(timeoutId)
      script.onload = null
      script.onerror = null
    }
    script.onload = () => {
      cleanup()
      if (window.AMap) resolve(window.AMap)
      else reject(new Error('高德地图脚本已加载，但运行对象不可用'))
    }
    script.onerror = () => {
      cleanup()
      script.remove()
      amapLoadTask = undefined
      reject(new Error('高德地图脚本加载失败'))
    }
    timeoutId = window.setTimeout(() => {
      cleanup()
      script.remove()
      amapLoadTask = undefined
      reject(new Error('高德地图脚本加载超时'))
    }, 15000)

    script.id = 'amap-js-api'
    script.async = true
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(amapRuntimeConfig.key)}&plugin=AMap.Scale`
    document.head.appendChild(script)
  })
  return amapLoadTask
}
