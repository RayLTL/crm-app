/**
 * Cloudflare Pages Function — AirScript API 代理
 *
 * 将前端 /api/airscript/* 请求代理到 WPS AirScript Webhook
 * 开发环境由 vite.config.ts 中的 server.proxy 接管
 * 生产环境由此文件处理
 */
var AIRSCRIPT_TARGET = "https://www.kdocs.cn";

async function proxyRequest(context) {
  var request = context.request;
  var url = new URL(request.url);
  var proxyPath = url.pathname.replace(/^\/api\/airscript/, "");
  var targetUrl = AIRSCRIPT_TARGET + proxyPath + url.search;
  var headers = new Headers(request.headers);
  headers.set("Host", "www.kdocs.cn");
  headers.set("Origin", "https://www.kdocs.cn");
  headers.set("Referer", "https://www.kdocs.cn/");
  headers.delete("Accept-Encoding");
  try {
    var resp = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
    });
    var respHeaders = new Headers(resp.headers);
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    respHeaders.set("Access-Control-Allow-Headers", "Content-Type, AirScript-Token");
    respHeaders.delete("Content-Encoding");
    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: "Proxy error: " + String(err) }),
      { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function onRequest(context) { return proxyRequest(context); }
export async function onRequestPost(context) { return proxyRequest(context); }
export async function onRequestGet(context) { return proxyRequest(context); }
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, AirScript-Token",
      "Access-Control-Max-Age": "86400",
    },
  });
}