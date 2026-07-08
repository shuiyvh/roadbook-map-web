<template>
  <div class="login">
    <div class="login-brand">
      <p class="brand-label">Roadbook Map</p>
      <h1>摩旅与旅游智能路书</h1>
      <p>登录后进入路书地图工作台，管理路线、点位、推荐、分享与出行打卡流程。</p>
    </div>

    <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
      <h2 class="title">账号登录</h2>
      <el-form-item prop="username">
        <el-input
          v-model="loginForm.username"
          type="text"
          size="large"
          auto-complete="off"
          placeholder="账号"
        >
          <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          size="large"
          auto-complete="off"
          placeholder="密码"
          @keyup.enter="handleLogin"
        >
          <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
        </el-input>
      </el-form-item>
      <el-form-item v-if="captchaEnabled" prop="code">
        <div class="captcha-row">
          <el-input
            v-model="loginForm.code"
            size="large"
            auto-complete="off"
            placeholder="验证码"
            @keyup.enter="handleLogin"
          >
            <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
          </el-input>
          <button type="button" class="login-code" @click="getCode">
            <img :src="codeUrl" class="login-code-img" alt="验证码" />
          </button>
        </div>
      </el-form-item>
      <div class="login-options">
        <el-checkbox v-model="loginForm.rememberMe">记住密码</el-checkbox>
        <router-link v-if="register" class="link-type" :to="'/register'">立即注册</router-link>
      </div>
      <el-form-item class="submit-row">
        <el-button
          :loading="loading"
          size="large"
          type="primary"
          class="submit-button"
          @click.prevent="handleLogin"
        >
          <span v-if="!loading">登录</span>
          <span v-else>登录中...</span>
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { getCodeImg } from "@/api/login"
import Cookies from "js-cookie"
import { encrypt, decrypt } from "@/utils/jsencrypt"
import useUserStore from '@/store/modules/user'
import type { CaptchaInfoResult } from '@/types/api/login'
import type { LoginForm } from '@/types/api/login'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const { proxy } = getCurrentInstance()

const loginForm = ref<LoginForm>({
  username: "admin",
  password: "admin123",
  rememberMe: false,
  code: "",
  uuid: ""
})

const loginRules = {
  username: [{ required: true, trigger: "blur", message: "请输入账号" }],
  password: [{ required: true, trigger: "blur", message: "请输入密码" }],
  code: [{ required: true, trigger: "change", message: "请输入验证码" }]
}

const codeUrl = ref("")
const loading = ref(false)
// 后端未关闭验证码时，登录前必须带上 uuid 和验证码。
const captchaEnabled = ref(true)
const register = ref(false)
const redirect = ref<string | undefined>(undefined)

watch(route, (newRoute: any) => {
  redirect.value = (newRoute.query && newRoute.query.redirect) as string | undefined
}, { immediate: true })

function handleLogin(): void {
  proxy.$refs.loginRef.validate((valid: boolean) => {
    if (valid) {
      loading.value = true
      if (loginForm.value.rememberMe) {
        Cookies.set("username", loginForm.value.username, { expires: 30 })
        Cookies.set("password", encrypt(loginForm.value.password), { expires: 30 })
        Cookies.set("rememberMe", loginForm.value.rememberMe, { expires: 30 })
      } else {
        Cookies.remove("username")
        Cookies.remove("password")
        Cookies.remove("rememberMe")
      }
      userStore.login(loginForm.value).then(() => {
        const query = route.query
        const otherQueryParams = Object.keys(query).reduce((acc: Record<string, any>, cur) => {
          if (cur !== "redirect") {
            acc[cur] = query[cur]
          }
          return acc
        }, {})
        router.push({ path: redirect.value || "/", query: otherQueryParams })
      }).catch(() => {
        loading.value = false
        if (captchaEnabled.value) {
          getCode()
        }
      })
    }
  })
}

function getCode(): void {
  getCodeImg().then((res: CaptchaInfoResult) => {
    captchaEnabled.value = res.captchaEnabled === undefined ? true : res.captchaEnabled
    if (captchaEnabled.value) {
      codeUrl.value = "data:image/gif;base64," + res.img
      loginForm.value.uuid = res.uuid
    }
  })
}

function getCookie(): void {
  const username = Cookies.get("username")
  const password = Cookies.get("password")
  const rememberMe = Cookies.get("rememberMe")
  loginForm.value = {
    username: username === undefined ? loginForm.value.username : username,
    password: password === undefined ? loginForm.value.password : decrypt(password),
    rememberMe: rememberMe === undefined ? false : Boolean(rememberMe)
  }
}

getCode()
getCookie()
</script>

<style lang='scss' scoped>
.login {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  align-items: center;
  gap: 48px;
  min-height: 100%;
  padding: 48px 8vw;
  background:
    linear-gradient(90deg, rgba(12, 19, 32, 0.84), rgba(12, 19, 32, 0.3)),
    url("../assets/images/login-background.jpg");
  background-size: cover;
  background-position: center;
}

.login-brand {
  max-width: 620px;
  color: #ffffff;

  h1 {
    margin: 12px 0 18px;
    font-size: 42px;
    line-height: 1.18;
    font-weight: 800;
  }

  p {
    max-width: 560px;
    margin: 0;
    color: rgba(255, 255, 255, 0.82);
    font-size: 16px;
    line-height: 1.8;
  }
}

.brand-label {
  color: #93c5fd !important;
  font-size: 14px !important;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.title {
  margin: 0 0 24px;
  color: #111827;
  font-size: 22px;
  font-weight: 700;
}

.login-form {
  width: 100%;
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(14px);

  .el-input {
    height: 42px;

    input {
      height: 42px;
    }
  }

  .input-icon {
    width: 14px;
    height: 41px;
  }
}

.captcha-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 116px;
  gap: 12px;
  width: 100%;
}

.login-code {
  height: 42px;
  padding: 0;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #ffffff;
  cursor: pointer;
  overflow: hidden;
}

.login-code-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.login-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 22px;
}

.submit-row {
  margin-bottom: 0;
}

.submit-button {
  width: 100%;
}

html.dark .login {
  .login-form {
    border-color: rgba(75, 85, 99, 0.8);
    background: rgba(17, 24, 39, 0.92);
  }

  .title {
    color: #e5e7eb;
  }
}

@media (max-width: 900px) {
  .login {
    grid-template-columns: 1fr;
    gap: 28px;
    padding: 32px 20px;
  }

  .login-brand h1 {
    font-size: 32px;
  }
}
</style>
