<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock, View, Hide } from '@element-plus/icons-vue';
import request from '@/api/request';

const router = useRouter();

const loading = ref(false);
const showPassword = ref(false);

const loginForm = reactive({
  username: '',
  password: '',
  remember: false,
});

const handleLogin = async () => {
  if (!loginForm.username.trim()) {
    ElMessage.warning('请输入用户名');
    return;
  }
  if (!loginForm.password) {
    ElMessage.warning('请输入密码');
    return;
  }

  loading.value = true;
  try {
    const res = await request.post('/auth/login', {
      username: loginForm.username,
      password: loginForm.password,
    });
    localStorage.setItem('token', res.accessToken);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', res.user.username);
    ElMessage.success('登录成功');
    router.push('/');
  } catch {
    ElMessage.error('登录失败，请检查用户名和密码');
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  router.push({ name: 'Register' });
};

const handleForgotPassword = () => {
  ElMessage.info('请联系管理员重置密码');
};

const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleLogin();
  }
};
</script>

<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1" />
      <div class="circle circle-2" />
      <div class="circle circle-3" />
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- Logo 和标题 -->
      <div class="login-header">
        <div class="brand">
          <div class="logo-box">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span class="brand-text">LOOM</span>
        </div>
        <h1 class="login-title">欢迎回来</h1>
        <p class="login-subtitle">登录您的账户以继续使用</p>
      </div>

      <!-- 登录表单 -->
      <div class="login-form" @keypress="handleKeyPress">
        <div class="form-item">
          <label class="form-label">用户名</label>
          <div class="input-wrapper">
            <el-icon class="input-icon">
              <User />
            </el-icon>
            <input
              v-model="loginForm.username"
              type="text"
              class="form-input"
              placeholder="请输入用户名"
              autocomplete="username"
            />
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">密码</label>
          <div class="input-wrapper">
            <el-icon class="input-icon">
              <Lock />
            </el-icon>
            <input
              v-model="loginForm.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
            <el-icon class="toggle-password" @click="showPassword = !showPassword">
              <View v-if="!showPassword" />
              <Hide v-else />
            </el-icon>
          </div>
        </div>

        <div class="form-options">
          <label class="remember-me">
            <input v-model="loginForm.remember" type="checkbox" />
            <span class="checkbox-label">记住我</span>
          </label>
          <a href="javascript:void(0)" class="forgot-link" @click="handleForgotPassword"
            >忘记密码？</a
          >
        </div>

        <button class="login-btn" :class="{ loading }" :disabled="loading" @click="handleLogin">
          <span v-if="!loading">登录</span>
          <span v-else class="loading-text">
            <span class="spinner" />
            登录中...
          </span>
        </button>
      </div>

      <!-- 分隔线 -->
      <div class="divider">
        <span>或</span>
      </div>

      <!-- 注册链接 -->
      <div class="register-link">
        还没有账户？<a href="javascript:void(0)" @click="handleRegister">立即注册</a>
      </div>
    </div>

    <!-- 底部版权 -->
    <div class="footer">
      <p>&copy; 2024 LOOM. All rights reserved.</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-border-light) 0%, var(--color-border) 100%);
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 40px 20px;
}

.bg-decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.5;
}

.circle-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, var(--color-dark) 0%, var(--color-medium) 100%);
  top: -200px;
  right: -100px;
  opacity: 0.1;
}

.circle-2 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #374151 0%, #1F1F1F 100%);
  bottom: -150px;
  left: -100px;
  opacity: 0.1;
}

.circle-3 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, var(--color-success) 0%, #059669 100%);
  top: 50%;
  left: 10%;
  opacity: 0.05;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: 40px;
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.logo-box {
  width: 44px;
  height: 44px;
  background: var(--color-dark);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.brand-text {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-dark);
  letter-spacing: -0.5px;
}

.login-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-dark);
  margin: 0 0 8px;
}

.login-subtitle {
  font-size: var(--font-size-base);
  color: var(--color-medium);
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-dark);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: var(--color-border);
  font-size: 18px;
  z-index: 1;
}

.form-input {
  width: 100%;
  height: 48px;
  padding: 0 44px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-lg);
  color: var(--color-dark);
  background: var(--color-border-light);
  transition: all var(--transition-normal);
  outline: none;
}

.form-input::placeholder {
  color: var(--color-border);
}

.form-input:focus {
  border-color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 0 0 3px rgba(98, 93, 245, 0.08);
}

.toggle-password {
  position: absolute;
  right: 14px;
  color: var(--color-border);
  font-size: 18px;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.toggle-password:hover {
  color: var(--color-medium);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.remember-me input[type='checkbox'] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.checkbox-label {
  font-size: var(--font-size-sm);
  color: var(--color-medium);
}

.forgot-link {
  font-size: var(--font-size-sm);
  color: var(--color-info);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.forgot-link:hover {
  color: var(--color-primary);
}

.login-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary-text);
  cursor: pointer;
  transition: all var(--transition-normal);
  margin-top: 8px;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(98, 93, 245, 0.3);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: var(--color-border);
  font-size: var(--font-size-sm);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.divider span {
  padding: 0 16px;
}

.social-login {
  display: flex;
  gap: 12px;
}

.social-btn {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--color-border-light);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-dark);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.social-btn:hover {
  background: var(--color-border);
  border-color: var(--color-medium);
}

.social-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.social-btn.loading {
  background: var(--color-border);
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.register-link {
  text-align: center;
  margin-top: 24px;
  font-size: var(--font-size-sm);
  color: var(--color-medium);
}

.register-link a {
  color: var(--color-info);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  margin-left: 4px;
}

.register-link a:hover {
  color: var(--color-primary);
}

.footer {
  position: absolute;
  bottom: 20px;
  text-align: center;
}

.footer p {
  font-size: var(--font-size-xs);
  color: var(--color-border);
  margin: 0;
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }

  .social-login {
    flex-direction: column;
  }
}
</style>
