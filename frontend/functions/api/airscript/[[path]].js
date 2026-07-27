/**
 * Cloudflare Pages Function — AirScript 代理
 */
var TARGET = "https://www.kdocs.cn";

async function proxyRequest(context) {
  var request = context.request;
  var url = new URL(request.url);
  var proxyPath = url.pathname.replace(/^\/api\/airscript/, "");
  var targetUrl = TARGET + proxyPath + url.search;
  var headers = new Headers(request.headers);
  headers.set("Host", "www.kdocs.cn");
  headers.set("Origin", "https://www.kdocs.cn");
  headers.set("Referer", "https://www.kdocs.cn/");
  try {
    var resp = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
    });
    var respHeaders = new Headers(resp.headers);
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.delete("Content-Encoding");
    return new Response(resp.body, { status: resp.status, headers: respHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: "Proxy error" }),
      { status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
}

export async function onRequest(context) { return proxyRequest(context); }
export async function onRequestPost(context) { return proxyRequest(context); }
export async function onRequestOptions() {
  return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, AirScript-Token", "Access-Control-Max-Age": "86400" } });
}