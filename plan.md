# CRM 客户管理系统 — 多维表设计

## 多维表信息
- 文件名: CRM客户管理.dbt
- 文件ID: apXi5NhZD1Mm4EmDT7SRxxovW4TUjKbED
- 表名: 数据表 (Sheet ID: 1)

## 字段结构
| 字段名 | 类型 | 说明 |
|--------|------|------|
| 客户名称 | SingleLineText | 主字段，客户姓名 |
| 邮箱 | SingleLineText | 电子邮箱 |
| 电话 | SingleLineText | 联系电话 |
| 公司 | SingleLineText | 所属公司 |
| 状态 | SingleSelect | 合作中 / 已暂停 / 潜在客户 |
| 备注 | MultiLineText | 备注信息 |
| 创建时间 | Date | 创建日期 |
| 更新时间 | Date | 更新日期 |

## 示例数据
- 张三 (阿里巴巴) - 合作中
- 李四 (腾讯科技) - 合作中
- 王五 (百度在线) - 潜在客户
- 赵六 (字节跳动) - 合作中
- 孙七 (华为技术) - 已暂停
