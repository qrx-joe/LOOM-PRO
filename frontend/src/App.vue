<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <RouterView />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans SC', 'HarmonyOS Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background-color: var(--color-border-light);
}

#app {
  height: 100vh;
  width: 100vw;
}
</style>
