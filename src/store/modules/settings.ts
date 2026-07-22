import defaultSettings from '@/settings'
import { useDark, useToggle } from '@vueuse/core'
import { useDynamicTitle } from '@/utils/dynamicTitle'
import { handleThemeStyle } from '@/utils/theme'

const isDark = useDark()
const toggleDark = useToggle(isDark)

const { sideTheme, showSettings, navType, tagsView, tagsViewPersist, tagsIcon, tagsViewStyle, fixedHeader, sidebarLogo, dynamicTitle, footerVisible, footerContent } = defaultSettings

const storageSetting = JSON.parse(localStorage.getItem('layout-setting') || '{}') || {} 
export const LAYOUT_DESIGN_VERSION = 'roadbook-shell-20260722'

/**
 * 旧版布局设置会把深色若依侧栏保存在浏览器中，仅修改默认值无法生效。
 * 设计版本变化时只迁移框架视觉相关配置，后续用户仍可在布局设置中自行调整。
 */
if (storageSetting.designVersion !== LAYOUT_DESIGN_VERSION) {
  Object.assign(storageSetting, {
    designVersion: LAYOUT_DESIGN_VERSION,
    theme: '#5B7CFA',
    sideTheme: 'theme-light',
    navType: 1,
    tagsView: false,
    sidebarLogo: true
  })
  localStorage.setItem('layout-setting', JSON.stringify(storageSetting))
}

interface SettingsState {
  title: string
  theme: string
  sideTheme: string
  showSettings: boolean
  navType: number
  tagsView: boolean
  tagsViewPersist: boolean
  tagsViewStyle: string
  tagsIcon: boolean
  fixedHeader: boolean
  sidebarLogo: boolean
  dynamicTitle: boolean
  footerVisible: boolean
  footerContent: string
  isDark: boolean
}

const useSettingsStore = defineStore(
  'settings',
  {
    state: (): SettingsState => ({
      title: '',
      theme: storageSetting.theme || '#409EFF',
      sideTheme: storageSetting.sideTheme || sideTheme,
      showSettings: showSettings,
      navType: storageSetting.navType === undefined ? navType : storageSetting.navType,
      tagsView: storageSetting.tagsView === undefined ? tagsView : storageSetting.tagsView,
      tagsViewPersist: storageSetting.tagsViewPersist === undefined ? tagsViewPersist : storageSetting.tagsViewPersist,
      tagsIcon: storageSetting.tagsIcon === undefined ? tagsIcon : storageSetting.tagsIcon,
      tagsViewStyle: storageSetting.tagsViewStyle === undefined ? tagsViewStyle : storageSetting.tagsViewStyle,
      fixedHeader: storageSetting.fixedHeader === undefined ? fixedHeader : storageSetting.fixedHeader,
      sidebarLogo: storageSetting.sidebarLogo === undefined ? sidebarLogo : storageSetting.sidebarLogo,
      dynamicTitle: storageSetting.dynamicTitle === undefined ? dynamicTitle : storageSetting.dynamicTitle,
      footerVisible: storageSetting.footerVisible === undefined ? footerVisible : storageSetting.footerVisible,
      footerContent: footerContent,
      isDark: isDark.value
    }),
    actions: {
      // 修改布局设置
      changeSetting(data: { key: string; value: any }) {
        const { key, value } = data
        if (this.hasOwnProperty(key)) {
          (this as any)[key] = value
        }
      },
      // 设置网页标题
      setTitle(title: string) {
        this.title = title
        useDynamicTitle()
      },
      // 切换暗黑模式
      toggleTheme() {
        this.isDark = !this.isDark
        toggleDark()
        nextTick(() => {
          handleThemeStyle(this.theme)
        })
      }
    }
  })

export default useSettingsStore
