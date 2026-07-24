/**
 * CRM 客户管理系统 — AirScript API 代理
 *
 * 多维表: CRM客户管理.dbt
 * 表名: 数据表
 * 字段: 客户名称, 邮箱, 电话, 公司, 状态, 备注, 创建时间, 更新时间
 *
 * 使用说明:
 * 1. 将此脚本粘贴到 WPS 多维表的 AirScript 编辑器中
 * 2. 获取脚本令牌: 多维表 → 管理脚本 → 脚本令牌
 * 3. 获取 Webhook 链接: 脚本右键 → 复制 WebHook 链接
 */

// ============ 配置 ============
var TABLE_NAME = "数据表";

// ============ 辅助函数 ============

function getTableId(tableName) {
  var sheets = Application.Sheet.GetSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].name === tableName) return sheets[i].id;
  }
  throw new Error("找不到表: " + tableName);
}

function getAllRecords(sheetId) {
  var offset = null, allRecords = [];
  do {
    var response = Application.Record.GetRecords({
      SheetId: sheetId, PageSize: 1000, Offset: offset
    });
    if (!response || !response.records) break;
    for (var i = 0; i < response.records.length; i++) {
      allRecords.push(response.records[i]);
    }
    offset = response.offset;
  } while (offset);
  return allRecords;
}

function normalizeDate(d) {
  if (!d) return "";
  return String(d).replace(/\//g, "-");
}

function successResponse(data, message) {
  return { success: true, data: data, message: message || "success" };
}

function errorResponse(message, code) {
  return { success: false, error: message || "Internal error", code: code || 500 };
}

// 映射状态: 前端传 active/inactive/lead → 多维表存 合作中/已暂停/潜在客户
var STATUS_MAP_TO_STORE = {
  "active": "合作中",
  "inactive": "已暂停",
  "lead": "潜在客户"
};

// 映射状态: 多维表读 合作中/已暂停/潜在客户 → 前端用 active/inactive/lead
var STATUS_MAP_TO_FRONT = {
  "合作中": "active",
  "已暂停": "inactive",
  "潜在客户": "lead"
};

// ============ API Handlers ============

/**
 * ping — 健康检查
 */
function handlePing() {
  return successResponse("pong", "服务正常");
}

/**
 * getList — 查询客户列表（支持搜索、筛选、分页）
 * params: { keyword, status, page, pageSize }
 */
function handleGetList(params) {
  var sheetId = getTableId(TABLE_NAME);
  var records = getAllRecords(sheetId);
  var result = [];
  var keyword = params.keyword || "";
  var statusFilter = params.status || "";
  var page = parseInt(params.page) || 1;
  var pageSize = parseInt(params.pageSize) || 20;

  for (var i = 0; i < records.length; i++) {
    var fields = records[i].fields || {};
    var name = fields["客户名称"] || "";
    var email = fields["邮箱"] || "";
    var company = fields["公司"] || "";
    var phone = fields["电话"] || "";
    var statusVal = fields["状态"] || "";
    var statusKey = STATUS_MAP_TO_FRONT[statusVal] || "active";

    // 搜索筛选
    if (keyword) {
      if (name.indexOf(keyword) === -1 && email.indexOf(keyword) === -1 &&
          company.indexOf(keyword) === -1 && phone.indexOf(keyword) === -1) {
        continue;
      }
    }
    // 状态筛选
    if (statusFilter && statusKey !== statusFilter) continue;

    result.push({
      id: records[i].id,
      name: name,
      email: email,
      phone: phone,
      company: company,
      status: statusKey,
      statusLabel: statusVal,
      notes: fields["备注"] || "",
      created_at: normalizeDate(fields["创建时间"] || ""),
      updated_at: normalizeDate(fields["更新时间"] || ""),
    });
  }

  // 排序（按创建时间倒序）
  result.sort(function(a, b) { return b.created_at.localeCompare(a.created_at); });

  var total = result.length;
  var totalPages = Math.ceil(total / pageSize);
  var start = (page - 1) * pageSize;
  var pageRecords = result.slice(start, start + pageSize);

  return successResponse({
    customers: pageRecords,
    pagination: { page: page, pageSize: pageSize, total: total, totalPages: totalPages }
  }, "查询成功");
}

/**
 * getRecord — 获取单个客户
 * params: { recordId }
 */
function handleGetRecord(params) {
  if (!params.recordId) return errorResponse("缺少 recordId", 400);
  var sheetId = getTableId(TABLE_NAME);

  var response = Application.Record.GetRecord({
    SheetId: sheetId,
    RecordId: params.recordId
  });
  if (!response || !response.record) {
    return errorResponse("客户不存在", 404);
  }
  var fields = response.record.fields || {};
  var statusVal = fields["状态"] || "";
  var customer = {
    id: response.record.id,
    name: fields["客户名称"] || "",
    email: fields["邮箱"] || "",
    phone: fields["电话"] || "",
    company: fields["公司"] || "",
    status: STATUS_MAP_TO_FRONT[statusVal] || "active",
    statusLabel: statusVal,
    notes: fields["备注"] || "",
    created_at: normalizeDate(fields["创建时间"] || ""),
    updated_at: normalizeDate(fields["更新时间"] || ""),
  };
  return successResponse({ customer: customer }, "获取成功");
}

/**
 * addRecord — 创建客户
 * params: { name, email, phone, company, status, notes }
 */
function handleAddRecord(params) {
  if (!params.name || params.name.trim() === "") {
    return errorResponse("客户名称不能为空", 400);
  }
  var sheetId = getTableId(TABLE_NAME);
  var now = new Date();
  var dateStr = now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0");

  var statusLabel = STATUS_MAP_TO_STORE[params.status] || "合作中";

  var response = Application.Record.CreateRecords({
    SheetId: sheetId,
    Records: [{
      fields: {
        "客户名称": params.name.trim(),
        "邮箱": params.email || "",
        "电话": params.phone || "",
        "公司": params.company || "",
        "状态": statusLabel,
        "备注": params.notes || "",
        "创建时间": dateStr,
        "更新时间": dateStr,
      }
    }]
  });

  var created = Array.isArray(response) ? response[0] : response;
  if (created && created.id) {
    return successResponse({ id: created.id }, "创建成功");
  }
  return errorResponse("创建记录失败", 500);
}

/**
 * updateRecord — 更新客户
 * params: { recordId, name, email, phone, company, status, notes }
 */
function handleUpdateRecord(params) {
  if (!params.recordId) return errorResponse("缺少 recordId", 400);
  var sheetId = getTableId(TABLE_NAME);
  var now = new Date();
  var dateStr = now.getFullYear() + "-" +
    String(now.getMonth() + 1).padStart(2, "0") + "-" +
    String(now.getDate()).padStart(2, "0");

  var updateFields = {};
  if (params.name !== undefined) updateFields["客户名称"] = params.name;
  if (params.email !== undefined) updateFields["邮箱"] = params.email;
  if (params.phone !== undefined) updateFields["电话"] = params.phone;
  if (params.company !== undefined) updateFields["公司"] = params.company;
  if (params.status !== undefined) {
    updateFields["状态"] = STATUS_MAP_TO_STORE[params.status] || "合作中";
  }
  if (params.notes !== undefined) updateFields["备注"] = params.notes;
  updateFields["更新时间"] = dateStr;

  response = Application.Record.UpdateRecords({
    SheetId: sheetId,
    Records: [{ id: params.recordId, fields: updateFields }]
  });

  return successResponse({ id: params.recordId }, "更新成功");
}

/**
 * deleteRecord — 删除客户
 * params: { recordId }
 */
function handleDeleteRecord(params) {
  if (!params.recordId) return errorResponse("缺少 recordId", 400);
  var sheetId = getTableId(TABLE_NAME);

  Application.Record.DeleteRecords({
    SheetId: sheetId,
    RecordIds: [params.recordId]
  });

  return successResponse({ id: params.recordId }, "删除成功");
}

/**
 * getStats — 获取统计
 */
function handleGetStats() {
  var sheetId = getTableId(TABLE_NAME);
  var records = getAllRecords(sheetId);
  var total = records.length;
  var statusCount = {};

  for (var i = 0; i < records.length; i++) {
    var fields = records[i].fields || {};
    var statusVal = fields["状态"] || "合作中";
    if (statusCount[statusVal] === undefined) statusCount[statusVal] = 0;
    statusCount[statusVal]++;
  }

  var byStatus = [];
  for (var key in statusCount) {
    var frontKey = STATUS_MAP_TO_FRONT[key] || key;
    byStatus.push({ status: frontKey, label: key, count: statusCount[key] });
  }

  // 最近5条
  records.sort(function(a, b) {
    var da = (a.fields["创建时间"] || "");
    var db = (b.fields["创建时间"] || "");
    return db.localeCompare(da);
  });
  var recent = [];
  for (var i = 0; i < Math.min(5, records.length); i++) {
    var f = records[i].fields || {};
    recent.push({
      name: f["客户名称"] || "",
      company: f["公司"] || "",
      status: STATUS_MAP_TO_FRONT[f["状态"] || ""] || "active",
    });
  }

  return successResponse({
    total: total,
    byStatus: byStatus,
    recentCustomers: recent,
  }, "统计成功");
}

// ============ 主入口 ============

function main() {
  var argvB = (Context && Context.argv && Context.argv.b) ? Context.argv.b : [];
  var action = argvB.length > 0 ? argvB[0] : "";
  var paramsStr = argvB.length > 1 ? argvB[1] : "{}";
  var params = {};
  try { params = JSON.parse(paramsStr); } catch (e) { params = {}; }

  switch (action) {
    case "ping":         return handlePing();
    case "getList":      return handleGetList(params);
    case "getRecord":    return handleGetRecord(params);
    case "addRecord":    return handleAddRecord(params);
    case "updateRecord": return handleUpdateRecord(params);
    case "deleteRecord": return handleDeleteRecord(params);
    case "getStats":     return handleGetStats();
    default:             return errorResponse("Unknown action: " + action, 400);
  }
}

return main();