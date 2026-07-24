# CRM 客户管理系统 — WPS 多维表版

架构：Cloudflare Pages（前端）+ WPS 多维表（数据库）

## 项目结构

```
crm-app-dbsheet/
├── airscript-crm.js              ← AirScript 脚本（粘贴到多维表）
├── plan.md                       ← 多维表结构设计
├── frontend/                     ← Cloudflare Pages 前端
│   ├── src/
│   │   ├── App.tsx               ← 主组件
│   │   ├── App.css               ← 全局样式
│   │   ├── api.ts                ← API 服务层（调用 AirScript）
│   │   ├── types.ts              ← 类型定义
│   │   ├── main.tsx              ← 入口
│   │   └── components/
│   │       ├── CustomerForm.tsx  ← 创建/编辑表单
│   │       └── CustomerDetail.tsx← 客户详情
│   ├── functions/api/airscript/[[path]].js  ← Pages Functions 代理
│   ├── public/_redirects         ← SPA 路由重定向
│   ├── .env.example              ← 环境变量示例
│   ├── vite.config.ts            ← Vite 配置（含代理）
│   ├── tsconfig.json
│   └── package.json
```

## 部署步骤

### 1. 配置 AirScript

1. 打开 WPS 多维表「CRM客户管理.dbt」
2. 进入 AirScript 编辑器
3. 粘贴 `airscript-crm.js` 的全部内容
4. 保存脚本
5. 获取脚本令牌：多维表 → 管理脚本 → 脚本令牌 → 复制 Token
6. 获取 Webhook 链接：脚本列表 → 右键脚本 → 复制 WebHook 链接

### 2. 配置前端环境变量

```bash
cd frontend
cp .env.example .env
# 编辑 .env 填入实际值：
#   VITE_AIRSCRIPT_URL = 上一步的 Webhook 链接
#   VITE_AIRSCRIPT_TOKEN = 上一步的脚本令牌
```

### 3. 本地开发

```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:5173
```

### 4. 部署到 Cloudflare Pages

```bash
cd frontend

# 创建 Pages 项目（首次）
npx wrangler pages project create crm-dbsheet --production-branch main

# 部署
npm run build
npx wrangler pages deploy dist --project-name crm-dbsheet
```

在 Cloudflare Pages Dashboard 中设置环境变量：
- `VITE_AIRSCRIPT_URL` = Webhook 链接
- `VITE_AIRSCRIPT_TOKEN` = 脚本令牌

## API 接口

所有请求通过 `/api/airscript` 前缀代理到 WPS AirScript：

| Action | 参数 | 说明 |
|--------|------|------|
| ping | 无 | 健康检查 |
| getList | { keyword, status, page, pageSize } | 客户列表 |
| getRecord | { recordId } | 客户详情 |
| addRecord | { name, email, phone, company, status, notes } | 创建客户 |
| updateRecord | { recordId, name, email, ... } | 更新客户 |
| deleteRecord | { recordId } | 删除客户 |
| getStats | 无 | 统计信息 |

## 多维表结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| 客户名称 | SingleLineText | 主字段 |
| 邮箱 | SingleLineText | |
| 电话 | SingleLineText | |
| 公司 | SingleLineText | |
| 状态 | SingleSelect | 合作中 / 已暂停 / 潜在客户 |
| 备注 | MultiLineText | |
| 创建时间 | Date | |
| 更新时间 | Date | |