/**
 * Capture Proof Service - Uses Puppeteer to render delivery card HTML and capture a pixel-accurate screenshot.
 * Returns PNG buffer for the delivery proof image.
 */

import puppeteer from 'puppeteer';
import { logError, LOG_CATEGORIES } from '../utils/criticalLogger.js';

function getDeliveryCardHtml(payload) {
  const stop = payload.stop || {};
  const opts = payload.options || {};
  const stopNo = stop.Stop_No ?? stop.stop_order ?? 1;
  const deliveryName = stop.Delivery_Name || stop.delivery_name || 'Unknown Delivery';
  const location = stop.Location || stop.location || 'Location not specified';
  const packages = stop.Packages ?? stop.packages ?? '';
  const deliveryNote = stop.delivery_note || '';

  const preDeliveryUploaded = !!opts.preDeliveryUploaded;
  const marked = !!opts.marked;
  const photoUploaded = !!opts.photoUploaded;
  const locationUpdated = !!opts.locationUpdated;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=420, initial-scale=1">
  <style>
    *{box-sizing:border-box}
    body{background:#f3f4f6;padding:16px;min-width:380px;margin:0;font-family:system-ui,sans-serif;font-size:14px}
    #delivery-proof-card{width:100%;max-width:420px;margin:0 auto;background:#fff;border-radius:12px;padding:20px;box-shadow:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1);border:1px solid #e5e7eb}
    .flex{display:flex}
    .items-start{align-items:flex-start}
    .justify-between{justify-content:space-between}
    .gap-2{gap:8px}
    .gap-3{gap:12px}
    .gap-4{gap:16px}
    .gap-1\\.5{gap:6px}
    .mb-2{margin-bottom:8px}
    .mb-3{margin-bottom:12px}
    .mt-4{margin-top:16px}
    .min-w-0{min-width:0}
    .flex-1{flex:1 1 0}
    .flex-shrink-0{flex-shrink:0}
    .items-center{align-items:center}
    .justify-center{justify-content:center}
    .mb-1{margin-bottom:4px}
    .mb-0\\.5{margin-bottom:2px}
    .-mt-1{margin-top:-4px}
    .py-2{padding-top:8px;padding-bottom:8px}
    .px-2\\.5{padding-left:10px;padding-right:10px}
    .text-blue-700{color:#1d4ed8}
    .shadow-sm{box-shadow:0 1px 2px 0 rgba(0,0,0,.05)}
    .rounded-full{border-radius:9999px}
    .rounded-lg{border-radius:8px}
    .rounded-xl{border-radius:12px}
    .rounded-br{border-bottom-right-radius:6px}
    .w-12{width:48px}
    .h-12{height:48px}
    .w-4{width:16px}
    .h-4{height:16px}
    .w-5{width:20px}
    .h-5{height:20px}
    .w-3{width:12px}
    .h-3{height:12px}
    .p-2\\.5{padding:10px}
    .p-3{padding:12px}
    .px-3{padding-left:12px;padding-right:12px}
    .py-1\\.5{padding-top:6px;padding-bottom:6px}
    .px-4{padding-left:16px;padding-right:16px}
    .py-2\\.5{padding-top:10px;padding-bottom:10px}
    .py-3{padding-top:12px;padding-bottom:12px}
    .text-base{font-size:16px}
    .text-sm{font-size:14px}
    .text-xs{font-size:12px}
    .font-bold{font-weight:700}
    .font-semibold{font-weight:600}
    .text-white{color:#fff}
    .text-gray-400{color:#9ca3af}
    .text-gray-600{color:#4b5563}
    .text-gray-900{color:#111827}
    .text-yellow-800{color:#854d0e}
    .text-yellow-900{color:#713f12}
    .bg-white{background:#fff}
    .bg-gray-50{background:#f9fafb}
    .bg-blue-500{background:#3b82f6}
    .bg-blue-600{background:#2563eb}
    .bg-blue-100{background:#dbeafe}
    .bg-green-600{background:#16a34a}
    .bg-amber-600{background:#d97706}
    .bg-yellow-50{background:#fefce8}
    .bg-yellow-500{background:#eab308}
    .bg-purple-600{background:#9333ea}
    .bg-gray-600{background:#4b5563}
    .border{border-width:1px}
    .border-gray-200{border-color:#e5e7eb}
    .border-yellow-300{border-color:#fde047}
    .shadow-md{box-shadow:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1)}
    .truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .grid{display:grid}
    .grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
    .bg-gradient-to-br{background-image:linear-gradient(to bottom right,#3b82f6,#2563eb)}
    .bg-gradient-to-r{background-image:linear-gradient(to right,#fefce8,#fef3c7)}
    .line-clamp-1{overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical}
  </style>
</head>
<body>
  <div id="delivery-proof-card">
    <div class="flex items-start justify-between mb-2 gap-3">
      <div class="flex items-start gap-4 flex-1 min-w-0">
        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-md">${stopNo}</div>
        <div class="flex-1 min-w-0">
          <h6 class="text-gray-900 font-bold text-base mb-1 truncate">${escapeHtml(deliveryName)}</h6>
          <p class="text-gray-600 text-sm truncate flex items-center gap-1">
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span class="truncate">${escapeHtml(location)}</span>
          </p>
        </div>
      </div>
      ${packages ? `<span class="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-bold rounded-full flex-shrink-0">${escapeHtml(String(packages))} pkg</span>` : ''}
    </div>

    ${deliveryNote ? `
    <div class="mb-3 py-2 px-2.5 sm:px-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-lg shadow-sm -mt-1">
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <div class="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-yellow-900 font-semibold text-xs sm:text-sm mb-0.5">Delivery Note</p>
          <p class="text-yellow-800 text-xs sm:text-sm line-clamp-1">${escapeHtml(deliveryNote)}</p>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="mt-4">
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <div class="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold shadow-md text-xs sm:text-sm ${preDeliveryUploaded ? 'bg-green-600 text-white' : 'bg-amber-600 text-white'}">
          ${preDeliveryUploaded ? '<svg class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg><span class="truncate">Pre-uploaded</span>' : '<svg class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span class="truncate">Pre-delivery</span>'}
        </div>
        <div class="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-green-600 text-white rounded-lg sm:rounded-xl font-semibold shadow-md text-xs sm:text-sm">
          <svg class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span class="truncate">Map</span>
        </div>
        <div class="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold shadow-md text-xs sm:text-sm ${marked ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}">
          <svg class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          <span class="truncate">${marked ? 'Marked' : 'Mark'}</span>
        </div>
        <div class="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold shadow-md text-xs sm:text-sm ${photoUploaded ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}">
          <svg class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
          <span class="truncate">${photoUploaded ? 'Uploaded' : 'Photo'}</span>
        </div>
        <div class="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold shadow-md text-xs sm:text-sm ${locationUpdated ? 'bg-green-600 text-white' : 'bg-purple-600 text-white'}">
          <svg class="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span class="truncate">${locationUpdated ? 'Located' : 'Location'}</span>
        </div>
        <div class="flex items-center justify-center p-2.5 sm:p-3 bg-gray-600 text-white rounded-lg sm:rounded-xl font-semibold shadow-md">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 13v4a2 2 0 01-2 2H7a2 2 0 01-2-2v-4M14 9v4"/></svg>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  if (str == null) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let browserInstance = null;

async function getBrowser() {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }
  browserInstance = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  return browserInstance;
}

/**
 * Capture delivery proof card as PNG using Puppeteer.
 * @param {Object} payload - { stop: { Stop_No, Delivery_Name, Location, Packages, delivery_note }, options: { preDeliveryUploaded, marked, photoUploaded, locationUpdated } }
 * @returns {Promise<Buffer>} PNG image buffer
 */
export async function captureDeliveryProof(payload) {
  let page;
  try {
    const html = getDeliveryCardHtml(payload);
    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setViewport({ width: 440, height: 600, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 5000 });
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => setTimeout(r, 100))));

    const card = await page.$('#delivery-proof-card');
    if (!card) {
      throw new Error('Delivery proof card element not found');
    }

    const buffer = await card.screenshot({
      type: 'png',
      omitBackground: false,
    });

    return buffer;
  } catch (err) {
    logError(LOG_CATEGORIES.SYSTEM, 'Capture proof failed', {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (_) {}
    }
  }
}
