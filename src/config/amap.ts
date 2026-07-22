/** 高德地图浏览器端运行配置。 */
export interface AmapRuntimeConfig {
  key: string
  securityJsCode: string
}

export const amapRuntimeConfig: AmapRuntimeConfig = {
  key: import.meta.env.VITE_AMAP_JS_API_KEY || '',
  securityJsCode: import.meta.env.VITE_AMAP_SECURITY_JS_CODE || ''
}

/**
 * 高德 JavaScript API 要求在地图脚本加载前设置安全配置。
 * 实际密钥只存放在被 Git 忽略的 .env.local，业务组件不得重复硬编码。
 */
export function setupAmapSecurityConfig(): void {
  if (!amapRuntimeConfig.securityJsCode) {
    return
  }
  window._AMapSecurityConfig = {
    ...window._AMapSecurityConfig,
    securityJsCode: amapRuntimeConfig.securityJsCode
  }
}
