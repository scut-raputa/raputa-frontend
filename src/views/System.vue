<template>
  <div class="admin-system page">
    <section class="page-head">
      <div>
        <h2>系统管理</h2>
        <p>{{ hospitalName }} / {{ adminName }}</p>
      </div>
      <el-tag type="success" effect="light">管理员视角</el-tag>
    </section>

    <section class="summary-grid">
      <div v-for="item in summaryItems" :key="item.label" class="summary-item">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </section>

    <section class="panel-grid">
      <div class="panel">
        <div class="panel-title">
          <el-icon><Lock /></el-icon>
          <span>身份与会话</span>
        </div>
        <dl class="status-list">
          <div>
            <dt>登录态</dt>
            <dd>HttpOnly Cookie</dd>
          </div>
          <div>
            <dt>前端保存</dt>
            <dd>仅内存用户信息</dd>
          </div>
          <div>
            <dt>API 访问</dt>
            <dd>服务端认证校验</dd>
          </div>
        </dl>
      </div>

      <div class="panel">
        <div class="panel-title">
          <el-icon><Cpu /></el-icon>
          <span>设备注册治理</span>
        </div>
        <dl class="status-list">
          <div>
            <dt>设备身份</dt>
            <dd>硬件标识优先</dd>
          </div>
          <div>
            <dt>当前 IP</dt>
            <dd>发现服务自动更新</dd>
          </div>
          <div>
            <dt>占用冲突</dt>
            <dd>会话锁控制</dd>
          </div>
        </dl>
      </div>

      <div class="panel">
        <div class="panel-title">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据口径</span>
        </div>
        <dl class="status-list">
          <div>
            <dt>检测患者数</dt>
            <dd>按日期去重患者</dd>
          </div>
          <div>
            <dt>科室占比</dt>
            <dd>检测快照优先</dd>
          </div>
          <div>
            <dt>设备时长</dt>
            <dd>采集会话起止时间</dd>
          </div>
        </dl>
      </div>
    </section>

    <section class="admin-workbench">
      <div class="section-title">管理入口</div>
      <div class="action-grid">
        <div v-for="item in actionItems" :key="item.label" class="action-card">
          <div>
            <h3>{{ item.label }}</h3>
            <p>{{ item.desc }}</p>
          </div>
          <el-button type="primary" size="small" plain @click="go(item.routeName)">
            进入处理
          </el-button>
        </div>
      </div>
    </section>

    <section class="settings-panel">
      <div class="section-title">当前系统策略</div>
      <dl class="policy-list">
        <div v-for="item in policyItems" :key="item.label">
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Cpu, DataAnalysis, Lock } from '@element-plus/icons-vue'
import { getUser } from '@/utils/auth'

const router = useRouter()
const user = computed(() => getUser())
const hospitalName = computed(() => user.value?.hospitalName || '未绑定医院')
const adminName = computed(() => user.value?.username || '管理员')

const summaryItems = computed(() => [
  { label: '权限角色', value: user.value?.role === 'ADMIN' ? '系统管理员' : '科室用户' },
  { label: '账号状态', value: user.value?.enabled ? '启用' : '未启用' },
  { label: '登录 IP', value: user.value?.lastLoginIp || '-' },
  { label: '最近登录', value: formatDateTime(user.value?.lastLoginAt) },
])

const actionItems = [
  {
    label: '科室、医生与设备',
    desc: '维护设备资产、硬件标识、负责人和科室医生信息。',
    routeName: 'DashboardDepartment',
  },
  {
    label: '模型运行态',
    desc: '查看推理服务、模型加载、模型可用性和最近错误。',
    routeName: 'DashboardModel',
  },
  {
    label: '患者与检测数据',
    desc: '处理患者建档、预约、检测记录和数据导出。',
    routeName: 'DashboardPatient',
  },
  {
    label: '统计口径核查',
    desc: '核对每日患者数、科室占比和设备使用时长。',
    routeName: 'DashboardStats',
  },
]

const policyItems = [
  { label: '患者隐私展示', value: '列表隐藏身份证，使用出生日期展示' },
  { label: '身份证校验', value: '前后端校验大陆身份证，校对性别' },
  { label: '报告申请科室', value: '优先取患者档案科室' },
  { label: '设备识别策略', value: '硬件标识优先，IP 仅作当前地址' },
  { label: '会话保存方式', value: 'HttpOnly Cookie，前端不保存 token' },
  { label: '系统配置持久化', value: '待接入后端配置表后开放保存' },
]

function go(routeName: string) {
  router.push({ name: routeName })
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '-'
  return iso.slice(0, 19).replace('T', ' ')
}
</script>

<style scoped>
.page {
  width: 100%;
  max-width: 1304px;
  margin: 0 auto;
}
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.page-head h2 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 650;
}
.page-head p {
  margin: 0;
  color: #667085;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.summary-item {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 14px 16px;
  background: #fff;
}
.summary-item span {
  display: block;
  margin-bottom: 8px;
  color: #667085;
  font-size: 13px;
}
.summary-item strong {
  display: block;
  color: #1f2937;
  font-size: 18px;
  font-weight: 650;
  word-break: break-all;
}
.panel-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
.panel {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 18px;
  background: #fff;
}
.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: #1f2937;
  font-weight: 650;
}
.status-list {
  margin: 0;
}
.status-list div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-top: 1px solid #eef0f3;
}
.status-list div:first-child {
  border-top: 0;
}
.status-list dt,
.status-list dd {
  margin: 0;
}
.status-list dt {
  color: #667085;
}
.status-list dd {
  color: #1f2937;
  font-weight: 600;
  text-align: right;
}
.admin-workbench,
.settings-panel {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 18px;
  background: #fff;
  margin-bottom: 16px;
}
.section-title {
  margin-bottom: 14px;
  color: #1f2937;
  font-size: 16px;
  font-weight: 650;
}
.action-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.action-card {
  min-height: 132px;
  border: 1px solid #eef0f3;
  border-radius: 6px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
}
.action-card h3 {
  margin: 0 0 8px;
  font-size: 15px;
  color: #1f2937;
}
.action-card p {
  margin: 0;
  color: #667085;
  font-size: 13px;
  line-height: 1.5;
}
.policy-list {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
}
.policy-list div {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 11px 0;
  border-top: 1px solid #eef0f3;
}
.policy-list div:nth-child(-n + 2) {
  border-top: 0;
}
.policy-list dt,
.policy-list dd {
  margin: 0;
}
.policy-list dt {
  color: #667085;
}
.policy-list dd {
  color: #1f2937;
  font-weight: 600;
  text-align: right;
}
@media (max-width: 1100px) {
  .summary-grid,
  .panel-grid,
  .action-grid,
  .policy-list {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 720px) {
  .summary-grid,
  .panel-grid,
  .action-grid,
  .policy-list {
    grid-template-columns: 1fr;
  }
  .policy-list div:nth-child(-n + 2) {
    border-top: 1px solid #eef0f3;
  }
  .policy-list div:first-child {
    border-top: 0;
  }
}
</style>
