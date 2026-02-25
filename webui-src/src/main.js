import { exec, toast } from 'kernelsu';

const debugLog = [];
function log(msg) {
  debugLog.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function showError(msg) {
  const el = document.getElementById('error');
  el.textContent = msg;
  el.style.display = 'block';
}

window.toggleDebug = function () {
  const el = document.getElementById('debug');
  if (el.style.display === 'none' || !el.style.display) {
    el.style.display = 'block';
    el.textContent = debugLog.join('\n') || 'No logs yet';
  } else {
    el.style.display = 'none';
  }
};

async function run(cmd) {
  log(`exec: ${cmd}`);
  try {
    const { errno, stdout, stderr } = await exec(cmd);
    const out = (stdout || '').trim();
    const err = (stderr || '').trim();
    log(`  errno=${errno} out=${out.substring(0, 100)}`);
    return { out, err, ok: errno === 0, errno };
  } catch (e) {
    log(`  exception: ${e.message}`);
    return { out: '', err: e.message, ok: false, errno: -1 };
  }
}

function badge(ok, okText, failText) {
  return ok
    ? `<span class="badge badge-ok">${okText || 'OK'}</span>`
    : `<span class="badge badge-fail">${failText || 'FAIL'}</span>`;
}

function badgeWarn(text) {
  return `<span class="badge badge-warn">${text}</span>`;
}

// --- Live brightness polling (1s) ---
let liveTimer = null;

async function updateBrightness() {
  try {
    const r = await run('cat /sys/class/backlight/panel0-backlight/brightness');
    const el = document.getElementById('live-dbv');
    const bar = document.getElementById('live-bar');
    if (!el) return;
    const cur = parseInt(r.out) || 0;
    const max = parseInt(el.dataset.max) || 1;
    const pct = Math.round((cur / max) * 100);
    el.textContent = cur;
    document.getElementById('live-pct').textContent = `DBV / ${max} (${pct}%)`;
    bar.style.width = pct + '%';
  } catch (_) {}
}

function startLive() {
  if (liveTimer) return;
  liveTimer = setInterval(updateBrightness, 1000);
}

function stopLive() {
  if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
}

// --- Detail section toggle ---
window.toggleDetail = function () {
  const el = document.getElementById('detail-section');
  const arrow = document.getElementById('detail-arrow');
  if (el.style.display === 'none' || !el.style.display) {
    el.style.display = 'block';
    arrow.textContent = '\u25B2';
    loadDetail();
  } else {
    el.style.display = 'none';
    arrow.textContent = '\u25BC';
  }
};

async function loadDetail() {
  const container = document.getElementById('detail-content');
  container.innerHTML = '<div style="text-align:center;color:var(--text2);padding:16px">Loading...</div>';

  try {
    // Mount status
    const mountResult = await run('mount | grep my_product/vendor/etc || true');
    const mountedFiles = mountResult.out.split('\n').filter(l => l.length > 0);

    // Brightness config max
    const brtResult = await run('head -20 /my_product/vendor/etc/display_brightness_config_P_3.xml');
    const brtConfigMax = brtResult.out.match(/max="(\d+)"/)?.[1] || '?';

    // Global brightness limit
    const limitResult = await run('grep global_brightness_limit /my_product/vendor/etc/display_brightness_app_list.xml');
    const globalLimit = limitResult.out.match(/nit="(\d+)"/)?.[1] || '?';

    // Method switches
    const methodResults = [];
    for (const id of ['2', '3', '4', '5', '6', '7']) {
      const r = await run(
        `sed -n '/<method id="${id}">/,/<\\/method>/p' /my_product/vendor/etc/display_brightness_app_list.xml | grep '<switch>'`
      );
      const sw = r.out.match(/<switch>(\d)<\/switch>/)?.[1] || '?';
      methodResults.push({ id, sw });
    }

    // HdrGeneric supportApp count
    const hdrResult = await run(
      "sed -n '/<feature name=\"HdrGeneric\"/,/<\\/feature>/p' /my_product/vendor/etc/multimedia_display_feature_config.xml | grep -c supportApp || echo 0"
    );
    const hdrCount = hdrResult.out || '?';

    // Build detail HTML
    const maxOk = brtConfigMax === '4674';
    const limitOk = globalLimit === '1600';
    const hdrOk = parseInt(hdrCount) === 0;
    const allMethodsOff = methodResults.every(m => m.sw === '0');

    const methodNames = {
      '2': '\u89C6\u9891\u7C7B',
      '3': '\u77ED\u89C6\u9891',
      '4': '\u6E38\u620F\u7C7B',
      '5': '\u9A91\u624B (\u997F\u4E86\u4E48)',
      '6': '\u9A91\u624B (\u7F8E\u56E2)',
      '7': '\u5730\u56FE\u7C7B',
    };

    let html = '';

    // Modification status
    html += `
      <div class="card">
        <div class="card-title">\u4FEE\u6539\u72B6\u6001</div>
        <div class="row">
          <span class="label">\u4EAE\u5EA6\u4E0A\u9650 (4674)</span>
          <span class="value">${badge(maxOk, brtConfigMax, brtConfigMax)}</span>
        </div>
        <div class="row">
          <span class="label">\u5168\u5C40\u4EAE\u5EA6\u9650\u5236 (1600 nit)</span>
          <span class="value">${badge(limitOk, globalLimit + ' nit', globalLimit + ' nit')}</span>
        </div>
        <div class="row">
          <span class="label">HDR \u767D\u540D\u5355\u5DF2\u6E05\u7A7A</span>
          <span class="value">${badge(hdrOk, '\u5DF2\u6E05\u7A7A', hdrCount + ' \u4E2A\u5E94\u7528')}</span>
        </div>
        <div class="row">
          <span class="label">\u964D\u4EAE\u7B56\u7565 2~7</span>
          <span class="value">${badge(allMethodsOff, '\u5168\u90E8\u5173\u95ED', '\u90E8\u5206\u5F00\u542F')}</span>
        </div>
      </div>`;

    // Method detail
    html += `<div class="card"><div class="card-title">\u964D\u4EAE\u7B56\u7565\u660E\u7EC6</div>`;
    methodResults.forEach(m => {
      const off = m.sw === '0';
      html += `<div class="row">
        <span class="label">\u7B56\u7565 ${m.id} (${methodNames[m.id] || '?'})</span>
        <span class="value">${m.sw === '?' ? badgeWarn('?') : badge(off, '\u5DF2\u5173\u95ED', '\u5F00\u542F')}</span>
      </div>`;
    });
    html += `</div>`;

    // Mount info
    html += `
      <div class="card">
        <div class="card-title">\u6302\u8F7D\u6587\u4EF6 (${mountedFiles.length})</div>`;
    if (mountedFiles.length === 0) {
      html += `<div class="row"><span class="label">\u672A\u68C0\u6D4B\u5230\u6302\u8F7D</span>${badge(false, '', '\u65E0')}</div>`;
    } else {
      mountedFiles.forEach(line => {
        const file = line.match(/on\s+(\S+)/)?.[1] || line;
        const name = file.split('/').pop();
        html += `<div class="row">
          <span class="label" style="font-size:12px;word-break:break-all">${name}</span>
          <span class="value">${badge(true, '\u5DF2\u6302\u8F7D')}</span>
        </div>`;
      });
    }
    html += `</div>`;

    container.innerHTML = html;

  } catch (e) {
    container.innerHTML = `<div style="color:var(--red);padding:12px">Error: ${e.message}</div>`;
  }
}

// --- Initial load ---
async function init() {
  document.getElementById('error').style.display = 'none';
  log('--- init ---');

  try {
    const [curBrt, maxBrt, autoBrt, settingsBrt] = await Promise.all([
      run('cat /sys/class/backlight/panel0-backlight/brightness'),
      run('cat /sys/class/backlight/panel0-backlight/max_brightness'),
      run('settings get system screen_brightness_mode'),
      run('settings get system screen_brightness'),
    ]);

    const curNum = parseInt(curBrt.out) || 0;
    const maxNum = parseInt(maxBrt.out) || 1;
    const pct = Math.round((curNum / maxNum) * 100);
    const isAutoMode = autoBrt.out === '1';

    let html = '';

    // Live brightness card
    html += `
      <div class="card">
        <div class="card-title">\u5F53\u524D\u4EAE\u5EA6</div>
        <div class="big-num" id="live-dbv" data-max="${maxNum}">${curNum}</div>
        <div class="big-label" id="live-pct">DBV / ${maxNum} (${pct}%)</div>
        <div class="brightness-bar">
          <div class="brightness-fill" id="live-bar" style="width:${pct}%"></div>
        </div>
        <div style="margin-top:12px">
          <div class="row">
            <span class="label">\u4EAE\u5EA6\u6A21\u5F0F</span>
            <span class="value">${isAutoMode ? '\u81EA\u52A8' : '\u624B\u52A8'}</span>
          </div>
          <div class="row">
            <span class="label">Settings \u4EAE\u5EA6\u503C</span>
            <span class="value">${settingsBrt.out}</span>
          </div>
        </div>
      </div>`;

    // Collapsible detail
    html += `
      <div class="card detail-toggle" onclick="toggleDetail()">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:14px">\u8BE6\u7EC6\u4FE1\u606F</span>
          <span id="detail-arrow" style="font-size:12px;color:var(--text2)">\u25BC</span>
        </div>
      </div>
      <div id="detail-section" style="display:none">
        <div id="detail-content"></div>
      </div>`;

    document.getElementById('content').innerHTML = html;

    // Start live polling
    startLive();

    log('--- init done ---');

  } catch (e) {
    log(`FATAL: ${e.message}\n${e.stack}`);
    showError(`\u52A0\u8F7D\u5931\u8D25: ${e.message}`);
    document.getElementById('loading').textContent = '\u52A0\u8F7D\u5931\u8D25';
  }
}

window.refresh = function () {
  stopLive();
  document.getElementById('content').innerHTML = '<div class="loading">\u52A0\u8F7D\u4E2D...</div>';
  init();
};

log('script loaded');
init();
