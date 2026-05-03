<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock, Message, View, Hide } from '@element-plus/icons-vue';
import request from '@/api/request';

const router = useRouter();

const loading = ref(false);
const showPassword = ref(false);

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const handleRegister = async () => {
  if (!registerForm.username.trim()) {
    ElMessage.warning('请输入用户名');
    return;
  }
  if (!registerForm.email.trim()) {
    ElMessage.warning('请输入邮箱');
    return;
  }
  if (!registerForm.password) {
    ElMessage.warning('请输入密码');
    return;
  }
  if (registerForm.password !== registerForm.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致');
    return;
  }
  if (registerForm.password.length < 6) {
    ElMessage.warning('密码长度至少6位');
    return;
  }

  loading.value = true;
  try {
    const res = await request.post('/auth/register', {
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password,
    });
    localStorage.setItem('token', res.accessToken);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', res.user.username);
    ElMessage.success('注册成功');
    router.push('/');
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.message || '注册失败');
  } finally {
    loading.value = false;
  }
};

const handleBack = () => {
  router.push({ name: 'Login' });
};

const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleRegister();
  }
};
</script>

<template>
  <div class="register-page">
    <div class="bg-decoration">
      <div class="circle circle-1" />
      <div class="circle circle-2" />
      <div class="circle circle-3" />
    </div>

    <div class="register-card">
      <div class="register-header">
        <div class="brand">
          <div class="logo-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span class="brand-text">LOOM</span>
        </div>
        <h1 class="register-title">创建账户</h1>
        <p class="register-subtitle">加入我们，开始您的智能体之旅</p>
      </div>

      <div class="register-form" @keypress="handleKeyPress">
        <div class="form-item">
          <label class="form-label">用户名</label>
          <div class="input-wrapper">
            <el-icon class="input-icon"><User /></el-icon>
            <input
              v-model="registerForm.username"
              type="text"
              class="form-input"
              placeholder="请输入用户名"
              autocomplete="username"
            />
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">邮箱</label>
          <div class="input-wrapper">
            <el-icon class="input-icon"><Message /></el-icon>
            <input
              v-model="registerForm.email"
              type="email"
              class="form-input"
              placeholder="请输入邮箱"
              autocomplete="email"
            />
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">密码</label>
          <div class="input-wrapper">
            <el-icon class="input-icon"><Lock /></el-icon>
            <input
              v-model="registerForm.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="请输入密码（至少6位）"
              autocomplete="new-password"
            />
            <el-icon class="toggle-password" @click="showPassword = !showPassword">
              <View v-if="!showPassword" />
              <Hide v-else />
            </el-icon>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">确认密码</label>
          <div class="input-wrapper">
            <el-icon class="input-icon"><Lock /></el-icon>
            <input
              v-model="registerForm.confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              placeholder="请再次输入密码"
              autocomplete="new-password"
            />
          </div>
        </div>

        <button
          class="register-btn"
          :class="{ loading }"
          :disabled="loading"
          @click="handleRegister"
        >
          <span v-if="!loading">注册</span>
          <span v-else class="loading-text">
            <span class="spinner" />
            注册中...
          </span>
        </button>
      </div>

      <div class="back-link">
        <a href="javascript:void(0)" @click="handleBack">已有账户？返回登录</a>
      </div>
    </div>

    <div class="footer">
      <p>&copy; 2024 LOOM. All rights reserved.</p>
    </div>
  </div>
</template>

<style scoped>
.register-page {
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

.register-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  padding: 40px;
  position: relative;
  z-index: 1;
}

.register-header {
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

.register-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-dark);
  margin: 0 0 8px;
}

.register-subtitle {
  font-size: var(--font-size-base);
  color: var(--color-medium);
  margin: 0;
}

.register-form {
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

.register-btn {
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

.register-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(98, 93, 245, 0.3);
}

.register-btn:active:not(:disabled) {
  transform: translateY(0);
}

.register-btn:disabled {
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

.back-link {
  text-align: center;
  margin-top: 24px;
  font-size: var(--font-size-sm);
  color: var(--color-medium);
}

.back-link a {
  color: var(--color-info);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
}

.back-link a:hover {
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
</style>