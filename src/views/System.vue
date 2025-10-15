<template>
  <div class="admin-system page">
    <el-card shadow="hover" class="card">
      <template #header>
        <div class="card-header">系统管理（管理员）</div>
      </template>

      <div class="grid">
        <el-card shadow="never" class="panel">
          <template #header><div class="panel-title">用户与权限</div></template>
          <div class="panel-body">
            <el-button type="primary" size="small">新建管理员</el-button>
            <el-button size="small">查看全部用户</el-button>
          </div>
        </el-card>

        <el-card shadow="never" class="panel">
          <template #header><div class="panel-title">系统参数</div></template>
          <div class="panel-body">
            <el-button size="small">安全策略</el-button>
            <el-button size="small">JWT 设置</el-button>
          </div>
        </el-card>

        <el-card shadow="never" class="panel">
          <template #header><div class="panel-title">审计与日志</div></template>
          <div class="panel-body">
            <el-button size="small">登录日志</el-button>
            <el-button size="small">操作审计</el-button>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// 可按需补充实际功能
</script>

<style scoped>
.page {
  width: 100%;
  max-width: 1304px;
  margin: 0 auto;
}
.card {
  width: 100%;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}
.panel .panel-title {
  font-weight: 600;
}
.panel .panel-body {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
