/**
 * 4S店销售CRM — AirScript API 代理
 *
 * 多维表: 4S店销售CRM.dbt
 * 表: 门店信息(1), 联系人(3), 合同产品(4), 跟进记录(5), 商机(6)
 *
 * 使用说明:
 * 1. 粘贴到 WPS 多维表 AirScript 编辑器
 * 2. 获取脚本令牌: 多维表 → 管理脚本 → 脚本令牌
 * 3. 获取 Webhook 链接: 脚本右键 → 复制 WebHook 链接
 */

// ============ 表ID映射 ============
var SHEETS = {
  STORE: 1,
  CONTACT: 3,
  CONTRACT: 4,
  FOLLOWUP: 5,
  OPPORTUNITY: 6,
};

// ============ 辅助函数 ============

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

function getRecordById(sheetId, recordId) {
  var records = getAllRecords(sheetId);
  for (var i = 0; i < records.length; i++) {
    if (String(records[i].id) === String(recordId)) return records[i];
  }
  return null;
}

function normalizeDate(d) {
  if (!d) return "";
  var s = String(d);
  return s.replace(/\//g, "-");
}

function todayStr() {
  var d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}

function successResponse(data, message) {
  return { success: true, data: data, message: message || "success" };
}

function errorResponse(message, code) {
  return { success: false, error: message || "Internal error", code: code || 500 };
}

// ============ 门店 API ============

function handleStoreList(params) {
  var records = getAllRecords(SHEETS.STORE);
  var result = [];
  var keyword = params.keyword || "";
  var brand = params.brand || "";
  var status = params.status || "";
  var page = parseInt(params.page) || 1;
  var pageSize = parseInt(params.pageSize) || 20;

  for (var i = 0; i < records.length; i++) {
    var f = records[i].fields || {};
    if (keyword && f["门店名称"].indexOf(keyword) === -1 && f["地区"].indexOf(keyword) === -1) continue;
    if (brand && f["主营品牌"].indexOf(brand) === -1) continue;
    if (status && f["合作状态"] !== status) continue;
    result.push({
      id: records[i].id,
      name: f["门店名称"] || "",
      group: f["所属集团"] || "",
      brand: f["主营品牌"] || "",
      region: f["地区"] || "",
      address: f["详细地址"] || "",
      status: f["合作状态"] || "未签约",
      created_at: normalizeDate(f["创建时间"] || ""),
    });
  }

  result.sort(function(a, b) { return b.created_at.localeCompare(a.created_at); });
  var total = result.length;
  var totalPages = Math.ceil(total / pageSize);
  var start = (page - 1) * pageSize;
  var pageRecords = result.slice(start, start + pageSize);

  return successResponse({
    items: pageRecords,
    pagination: { page: page, pageSize: pageSize, total: total, totalPages: totalPages }
  });
}

function handleStoreDetail(params) {
  if (!params.recordId) return errorResponse("缺少 recordId", 400);
  var record = getRecordById(SHEETS.STORE, params.recordId);
  if (!record) return errorResponse("门店不存在", 404);
  var f = record.fields || {};

  // 获取关联联系人
  var allContacts = getAllRecords(SHEETS.CONTACT);
  var contacts = [];
  for (var i = 0; i < allContacts.length; i++) {
    if (allContacts[i].fields["门店ID"] === String(params.recordId)) {
      contacts.push({
        id: allContacts[i].id,
        name: allContacts[i].fields["姓名"] || "",
        title: allContacts[i].fields["职务"] || "",
        phone: allContacts[i].fields["电话"] || "",
        wechat: allContacts[i].fields["微信"] || "",
        role: allContacts[i].fields["决策角色"] || "",
      });
    }
  }

  // 获取关联合同
  var allContracts = getAllRecords(SHEETS.CONTRACT);
  var contracts = [];
  for (var i = 0; i < allContracts.length; i++) {
    if (allContracts[i].fields["门店ID"] === String(params.recordId)) {
      contracts.push({
        id: allContracts[i].id,
        name: allContracts[i].fields["产品名称"] || "",
        type: allContracts[i].fields["签约产品类型"] || "",
        amount: allContracts[i].fields["合同金额"] || 0,
        start_date: normalizeDate(allContracts[i].fields["服务开始时间"] || ""),
        end_date: normalizeDate(allContracts[i].fields["服务结束时间"] || ""),
        payment: allContracts[i].fields["付款状态"] || "",
        alert: allContracts[i].fields["预警状态"] || "正常",
      });
    }
  }

  // 获取跟进记录
  var allFollowups = getAllRecords(SHEETS.FOLLOWUP);
  var followups = [];
  for (var i = 0; i < allFollowups.length; i++) {
    if (allFollowups[i].fields["门店ID"] === String(params.recordId)) {
      followups.push({
        id: allFollowups[i].id,
        topic: allFollowups[i].fields["跟进主题"] || "",
        type: allFollowups[i].fields["跟进形式"] || "",
        contact_name: allFollowups[i].fields["联系人姓名"] || "",
        notes: allFollowups[i].fields["沟通要点"] || "",
        next_date: normalizeDate(allFollowups[i].fields["下一次跟进时间"] || ""),
        created_at: normalizeDate(allFollowups[i].fields["创建时间"] || ""),
      });
    }
  }

  return successResponse({
    store: {
      id: record.id,
      name: f["门店名称"] || "",
      group: f["所属集团"] || "",
      brand: f["主营品牌"] || "",
      region: f["地区"] || "",
      address: f["详细地址"] || "",
      status: f["合作状态"] || "未签约",
      created_at: normalizeDate(f["创建时间"] || ""),
    },
    contacts: contacts,
    contracts: contracts,
    followups: followups,
  });
}

function handleStoreCreate(params) {
  if (!params.name) return errorResponse("门店名称不能为空", 400);
  var now = todayStr();
  var response = Application.Record.CreateRecords({
    SheetId: SHEETS.STORE,
    Records: [{
      fields: {
        "门店名称": params.name.trim(),
        "所属集团": params.group || "",
        "主营品牌": params.brand || "",
        "地区": params.region || "",
        "详细地址": params.address || "",
        "合作状态": params.status || "未签约",
        "创建时间": now,
        "更新时间": now,
      }
    }]
  });
  var created = Array.isArray(response) ? response[0] : response;
  if (created && created.id) return successResponse({ id: created.id }, "门店创建成功");
  return errorResponse("创建门店失败", 500);
}

function handleStoreUpdate(params) {
  if (!params.recordId) return errorResponse("缺少 recordId", 400);
  
  // 先读取完整记录，合并字段
  var record = getRecordById(SHEETS.STORE, params.recordId);
  if (!record) return errorResponse("门店不存在", 404);
  var allFields = {};
  var origFields = record.fields || {};
  for (var k in origFields) { allFields[k] = origFields[k]; }
  allFields["更新时间"] = todayStr();
  if (params.name !== undefined) allFields["门店名称"] = params.name;
  if (params.group !== undefined) allFields["所属集团"] = params.group;
  if (params.brand !== undefined) allFields["主营品牌"] = params.brand;
  if (params.region !== undefined) allFields["地区"] = params.region;
  if (params.address !== undefined) allFields["详细地址"] = params.address;
  if (params.status !== undefined) allFields["合作状态"] = params.status;
  
  try {
    Application.Record.UpdateRecords({
      SheetId: SHEETS.STORE,
      Records: [{ id: params.recordId, fields: allFields }]
    });
    return successResponse({ id: params.recordId }, "门店更新成功");
  } catch (e) {
    return errorResponse("更新门店失败：" + String(e), 500);
  }
}

// ============ 联系人 API ============

function handleContactList(params) {
  var records = getAllRecords(SHEETS.CONTACT);
  var result = [];
  for (var i = 0; i < records.length; i++) {
    var f = records[i].fields || {};
    result.push({
      id: records[i].id,
      name: f["姓名"] || "",
      store_id: f["门店ID"] || "",
      store_name: f["门店名称"] || "",
      title: f["职务"] || "",
      phone: f["电话"] || "",
      wechat: f["微信"] || "",
      role: f["决策角色"] || "",
      preferences: f["个人喜好"] || "",
    });
  }
  return successResponse({ items: result });
}

function handleContactCreate(params) {
  if (!params.name) return errorResponse("姓名不能为空", 400);
  var response = Application.Record.CreateRecords({
    SheetId: SHEETS.CONTACT,
    Records: [{
      fields: {
        "姓名": params.name.trim(),
        "门店ID": params.store_id || "",
        "门店名称": params.store_name || "",
        "职务": params.title || "",
        "电话": params.phone || "",
        "微信": params.wechat || "",
        "决策角色": params.role || "",
        "个人喜好": params.preferences || "",
        "创建时间": todayStr(),
      }
    }]
  });
  var created = Array.isArray(response) ? response[0] : response;
  if (created && created.id) return successResponse({ id: created.id }, "联系人创建成功");
  return errorResponse("创建联系人失败", 500);
}

function handleContactUpdate(params) {
  if (!params.recordId) return errorResponse("缺少 recordId", 400);
  
  var record = getRecordById(SHEETS.CONTACT, params.recordId);
  if (!record) return errorResponse("联系人不存在", 404);
  var allFields = {};
  var origFields = record.fields || {};
  for (var k in origFields) { allFields[k] = origFields[k]; }
  if (params.name !== undefined) allFields["姓名"] = params.name;
  if (params.title !== undefined) allFields["职务"] = params.title;
  if (params.phone !== undefined) allFields["电话"] = params.phone;
  if (params.wechat !== undefined) allFields["微信"] = params.wechat;
  if (params.role !== undefined) allFields["决策角色"] = params.role;
  if (params.preferences !== undefined) allFields["个人喜好"] = params.preferences;
  
  try {
    Application.Record.UpdateRecords({
      SheetId: SHEETS.CONTACT,
      Records: [{ id: params.recordId, fields: allFields }]
    });
    return successResponse({ id: params.recordId }, "联系人更新成功");
  } catch (e) {
    return errorResponse("更新联系人失败：" + String(e), 500);
  }
}

function handleContactDelete(params) {
  if (!params.recordId) return errorResponse("缺少 recordId", 400);
  Application.Record.DeleteRecords({ SheetId: SHEETS.CONTACT, RecordIds: [params.recordId] });
  return successResponse({ id: params.recordId }, "联系人已删除");
}

// ============ 合同 API ============

function handleContractList(params) {
  var records = getAllRecords(SHEETS.CONTRACT);
  var result = [];
  for (var i = 0; i < records.length; i++) {
    var f = records[i].fields || {};
    result.push({
      id: records[i].id,
      name: f["产品名称"] || "",
      store_id: f["门店ID"] || "",
      store_name: f["门店名称"] || "",
      type: f["签约产品类型"] || "",
      amount: f["合同金额"] || 0,
      start_date: normalizeDate(f["服务开始时间"] || ""),
      end_date: normalizeDate(f["服务结束时间"] || ""),
      payment: f["付款状态"] || "",
      alert: f["预警状态"] || "正常",
    });
  }
  return successResponse({ items: result });
}

function handleContractCreate(params) {
  if (!params.name) return errorResponse("产品名称不能为空", 400);
  var response = Application.Record.CreateRecords({
    SheetId: SHEETS.CONTRACT,
    Records: [{
      fields: {
        "产品名称": params.name.trim(),
        "门店ID": params.store_id || "",
        "门店名称": params.store_name || "",
        "签约产品类型": params.type || "其他",
        "合同金额": params.amount || 0,
        "服务开始时间": params.start_date || "",
        "服务结束时间": params.end_date || "",
        "付款状态": params.payment || "账期",
        "预警状态": "正常",
        "创建时间": todayStr(),
      }
    }]
  });
  var created = Array.isArray(response) ? response[0] : response;
  return successResponse({ id: created.id }, "合同创建成功");
}

// ============ 跟进记录 API ============

function handleFollowupList(params) {
  var records = getAllRecords(SHEETS.FOLLOWUP);
  var result = [];
  var storeId = params.store_id || "";
  for (var i = 0; i < records.length; i++) {
    var f = records[i].fields || {};
    if (storeId && f["门店ID"] !== storeId) continue;
    result.push({
      id: records[i].id,
      topic: f["跟进主题"] || "",
      store_id: f["门店ID"] || "",
      store_name: f["门店名称"] || "",
      type: f["跟进形式"] || "",
      contact_name: f["联系人姓名"] || "",
      notes: f["沟通要点"] || "",
      next_date: normalizeDate(f["下一次跟进时间"] || ""),
      created_at: normalizeDate(f["创建时间"] || ""),
    });
  }
  result.sort(function(a, b) { return b.created_at.localeCompare(a.created_at); });
  return successResponse({ items: result });
}

function handleFollowupCreate(params) {
  if (!params.topic) return errorResponse("跟进主题不能为空", 400);
  var response = Application.Record.CreateRecords({
    SheetId: SHEETS.FOLLOWUP,
    Records: [{
      fields: {
        "跟进主题": params.topic.trim(),
        "门店ID": params.store_id || "",
        "门店名称": params.store_name || "",
        "跟进形式": params.type || "电话",
        "联系人姓名": params.contact_name || "",
        "沟通要点": params.notes || "",
        "下一次跟进时间": params.next_date || "",
        "创建时间": todayStr(),
      }
    }]
  });
  var created = Array.isArray(response) ? response[0] : response;
  return successResponse({ id: created.id }, "跟进记录创建成功");
}

// ============ 商机 API ============

function handleOpportunityList(params) {
  var records = getAllRecords(SHEETS.OPPORTUNITY);
  var result = [];
  var stage = params.stage || "";
  for (var i = 0; i < records.length; i++) {
    var f = records[i].fields || {};
    if (stage && f["阶段"] !== stage) continue;
    result.push({
      id: records[i].id,
      name: f["商机名称"] || "",
      store_id: f["门店ID"] || "",
      store_name: f["门店名称"] || "",
      amount: f["预计金额"] || 0,
      stage: f["阶段"] || "初步触达",
    });
  }
  return successResponse({ items: result });
}

function handleOpportunityCreate(params) {
  if (!params.name) return errorResponse("商机名称不能为空", 400);
  var response = Application.Record.CreateRecords({
    SheetId: SHEETS.OPPORTUNITY,
    Records: [{
      fields: {
        "商机名称": params.name.trim(),
        "门店ID": params.store_id || "",
        "门店名称": params.store_name || "",
        "预计金额": params.amount || 0,
        "阶段": params.stage || "初步触达",
        "创建时间": todayStr(),
      }
    }]
  });
  var created = Array.isArray(response) ? response[0] : response;
  return successResponse({ id: created.id }, "商机创建成功");
}

function handleOpportunityDetail(params) {
  if (!params.recordId) return errorResponse("缺少 recordId", 400);
  var record = getRecordById(SHEETS.OPPORTUNITY, params.recordId);
  if (!record) return errorResponse("商机不存在", 404);
  var f = record.fields || {};
  
  // 获取关联门店信息
  var storeInfo = null;
  if (f["门店ID"]) {
    var storeRecord = getRecordById(SHEETS.STORE, f["门店ID"]);
    if (storeRecord) {
      var sf = storeRecord.fields || {};
      storeInfo = {
        id: storeRecord.id,
        name: sf["门店名称"] || "",
        brand: sf["主营品牌"] || "",
        region: sf["地区"] || "",
        address: sf["详细地址"] || "",
        status: sf["合作状态"] || "",
      };
    }
  }

  return successResponse({
    id: record.id,
    name: f["商机名称"] || "",
    store_id: f["门店ID"] || "",
    store_name: f["门店名称"] || "",
    amount: f["预计金额"] || 0,
    stage: f["阶段"] || "初步触达",
    created_at: normalizeDate(f["创建时间"] || ""),
    store: storeInfo,
  });
}

function handleOpportunityUpdate(params) {
  if (!params.recordId) return errorResponse("缺少 recordId", 400);

  // 先读取完整记录，合并字段
  var record = getRecordById(SHEETS.OPPORTUNITY, params.recordId);
  if (!record) return errorResponse("商机不存在", 404);
  
  var allFields = {};
  var origFields = record.fields || {};
  for (var k in origFields) {
    allFields[k] = origFields[k];
  }
  if (params.stage !== undefined) allFields["阶段"] = params.stage;
  if (params.amount !== undefined) allFields["预计金额"] = params.amount;
  if (params.name !== undefined) allFields["商机名称"] = params.name;

  // 方式A: 用 record.id (GetRecords 返回的原始ID)
  try {
    var resultA = Application.Record.UpdateRecords({
      SheetId: SHEETS.OPPORTUNITY,
      Records: [{ id: record.id, fields: allFields }]
    });
    return successResponse({
      id: params.recordId,
      method: "A",
      recordIdType: typeof record.id,
      recordId: String(record.id),
      apiResult: JSON.stringify(resultA)
    }, "商机更新完成");
  } catch (eA) {
    // 方式B: 用 params.recordId (前端传过来的ID)
    try {
      var resultB = Application.Record.UpdateRecords({
        SheetId: SHEETS.OPPORTUNITY,
        Records: [{ id: params.recordId, fields: allFields }]
      });
      return successResponse({
        id: params.recordId,
        method: "B",
        apiResult: JSON.stringify(resultB)
      }, "商机更新完成");
    } catch (eB) {
      return errorResponse("更新失败 A:" + String(eA) + " | B:" + String(eB), 500);
    }
  }
}

// ============ 首页统计 API ============

function handleDashboard() {
  var now = new Date();
  var monthStart = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0") + "-01";

  // 本月拜访次数
  var allFollowups = getAllRecords(SHEETS.FOLLOWUP);
  var monthVisits = 0;
  var todayTasks = [];
  for (var i = 0; i < allFollowups.length; i++) {
    var f = allFollowups[i].fields || {};
    if (f["创建时间"] && String(f["创建时间"]) >= monthStart) monthVisits++;
    // 今日待办：下一次跟进时间 = 今天
    var nextDate = normalizeDate(f["下一次跟进时间"] || "");
    if (nextDate === todayStr()) {
      todayTasks.push({
        type: "followup",
        topic: f["跟进主题"] || "",
        store_name: f["门店名称"] || "",
        contact_name: f["联系人姓名"] || "",
      });
    }
  }

  // 本月到期续约数
  var allContracts = getAllRecords(SHEETS.CONTRACT);
  var monthRenewals = 0;
  var monthEnd = now.getFullYear() + "-" + String(now.getMonth()+1).padStart(2,"0") + "-31";
  for (var i = 0; i < allContracts.length; i++) {
    var f = allContracts[i].fields || {};
    var endDate = normalizeDate(f["服务结束时间"] || "");
    if (endDate >= monthStart && endDate <= monthEnd) monthRenewals++;
    // 到期预警任务
    if (f["预警状态"] && f["预警状态"] !== "正常") {
      todayTasks.push({
        type: "renewal",
        contract_name: f["产品名称"] || "",
        store_name: f["门店名称"] || "",
        alert: f["预警状态"] || "",
        end_date: endDate,
      });
    }
  }

  // 推进中商机总额
  var allOpps = getAllRecords(SHEETS.OPPORTUNITY);
  var totalDeal = 0;
  for (var i = 0; i < allOpps.length; i++) {
    var f = allOpps[i].fields || {};
    if (f["阶段"] !== "服务交付") {
      totalDeal += Number(f["预计金额"] || 0);
    }
  }

  // 今日待办中的到期续约任务
  todayTasks.sort(function(a, b) { return (a.type > b.type) ? 1 : -1; });

  return successResponse({
    monthVisits: monthVisits,
    monthRenewals: monthRenewals,
    totalDeal: totalDeal,
    todayTasks: todayTasks,
  });
}

// ============ 主入口 ============

function main() {
  var argvB = (Context && Context.argv && Context.argv.b) ? Context.argv.b : [];
  var action = argvB.length > 0 ? argvB[0] : "";
  var paramsStr = argvB.length > 1 ? argvB[1] : "{}";
  var params = {};
  try { params = JSON.parse(paramsStr); } catch (e) { params = {}; }

  switch (action) {
    // 门店
    case "storeList":      return handleStoreList(params);
    case "storeDetail":    return handleStoreDetail(params);
    case "storeCreate":    return handleStoreCreate(params);
    case "storeUpdate":    return handleStoreUpdate(params);
    // 联系人
    case "contactList":    return handleContactList(params);
    case "contactCreate":  return handleContactCreate(params);
    case "contactUpdate":  return handleContactUpdate(params);
    case "contactDelete":  return handleContactDelete(params);
    // 合同
    case "contractList":   return handleContractList(params);
    case "contractCreate": return handleContractCreate(params);
    // 跟进
    case "followupList":   return handleFollowupList(params);
    case "followupCreate": return handleFollowupCreate(params);
    // 商机
    case "opportunityList":     return handleOpportunityList(params);
    case "opportunityDetail":  return handleOpportunityDetail(params);
    case "opportunityCreate":  return handleOpportunityCreate(params);
    case "opportunityUpdate":  return handleOpportunityUpdate(params);
    // 首页
    case "dashboard":      return handleDashboard();
    // 健康检查
    case "ping":           return successResponse("pong", "服务正常");
    default:               return errorResponse("Unknown action: " + action, 400);
  }
}

try {
  return main();
} catch (e) {
  return errorResponse("脚本异常: " + String(e), 500);
}