let t=0;function e(){this.listeners={}}function s(){this.listeners={},this.stdin=new e,this.stdout=new e,this.stderr=new e}e.prototype.on=function(t,e){this.listeners[t]||(this.listeners[t]=[]),this.listeners[t].push(e)},e.prototype.emit=function(t,...e){this.listeners[t]&&this.listeners[t].forEach(t=>t(...e))},s.prototype.on=function(t,e){this.listeners[t]||(this.listeners[t]=[]),this.listeners[t].push(e)},s.prototype.emit=function(t,...e){this.listeners[t]&&this.listeners[t].forEach(t=>t(...e))};let n=[];function a(t){n.push(`[${new Date().toLocaleTimeString()}] ${t}`)}async function i(e){a(`exec: ${e}`);try{var s;let{errno:n,stdout:i,stderr:l}=await (void 0===s&&(s={}),new Promise((n,a)=>{let i=`exec_callback_${Date.now()}_${t++}`;function l(t){delete window[t]}window[i]=(t,e,s)=>{n({errno:t,stdout:e,stderr:s}),l(i)};try{ksu.exec(e,JSON.stringify(s),i)}catch(t){a(t),l(i)}})),d=(i||"").trim(),r=(l||"").trim();return a(`  errno=${n} out=${d.substring(0,100)}`),{out:d,err:r,ok:0===n,errno:n}}catch(t){return a(`  exception: ${t.message}`),{out:"",err:t.message,ok:!1,errno:-1}}}function l(t,e,s){return t?`<span class="badge badge-ok">${e||"OK"}</span>`:`<span class="badge badge-fail">${s||"FAIL"}</span>`}window.toggleDebug=function(){let t=document.getElementById("debug");"none"!==t.style.display&&t.style.display?t.style.display="none":(t.style.display="block",t.textContent=n.join("\n")||"No logs yet")};let d=null;async function r(){try{let t=await i("cat /sys/class/backlight/panel0-backlight/brightness"),e=document.getElementById("live-dbv"),s=document.getElementById("live-bar");if(!e)return;let n=parseInt(t.out)||0,a=parseInt(e.dataset.max)||1,l=Math.round(n/a*100);e.textContent=n,document.getElementById("live-pct").textContent=`DBV / ${a} (${l}%)`,s.style.width=l+"%"}catch(t){}}async function o(){let t=document.getElementById("detail-content");t.innerHTML='<div style="text-align:center;color:var(--text2);padding:16px">Loading...</div>';try{let e=(await i("mount | grep my_product/vendor/etc || true")).out.split("\n").filter(t=>t.length>0),s=await i("head -20 /my_product/vendor/etc/display_brightness_config_P_3.xml"),n=s.out.match(/max="(\d+)"/)?.[1]||"?",a=await i("grep global_brightness_limit /my_product/vendor/etc/display_brightness_app_list.xml"),d=a.out.match(/nit="(\d+)"/)?.[1]||"?",r=[];for(let t of["2","3","4","5","6","7"]){let e=await i(`sed -n '/<method id="${t}">/,/<\\/method>/p' /my_product/vendor/etc/display_brightness_app_list.xml | grep '<switch>'`),s=e.out.match(/<switch>(\d)<\/switch>/)?.[1]||"?";r.push({id:t,sw:s})}let o=(await i("sed -n '/<feature name=\"HdrGeneric\"/,/<\\/feature>/p' /my_product/vendor/etc/multimedia_display_feature_config.xml | grep -c supportApp || echo 0")).out||"?",c="4674"===n,u=0===parseInt(o),p=r.every(t=>"0"===t.sw),v={2:"视频类",3:"短视频",4:"游戏类",5:"骑手 (饿了么)",6:"骑手 (美团)",7:"地图类"},g="";g+=`
      <div class="card">
        <div class="card-title">\u4FEE\u6539\u72B6\u6001</div>
        <div class="row">
          <span class="label">\u4EAE\u5EA6\u4E0A\u9650 (4674)</span>
          <span class="value">${l(c,n,n)}</span>
        </div>
        <div class="row">
          <span class="label">\u5168\u5C40\u4EAE\u5EA6\u9650\u5236 (1600 nit)</span>
          <span class="value">${l("1600"===d,d+" nit",d+" nit")}</span>
        </div>
        <div class="row">
          <span class="label">HDR \u767D\u540D\u5355\u5DF2\u6E05\u7A7A</span>
          <span class="value">${l(u,"已清空",o+" 个应用")}</span>
        </div>
        <div class="row">
          <span class="label">\u964D\u4EAE\u7B56\u7565 2~7</span>
          <span class="value">${l(p,"全部关闭","部分开启")}</span>
        </div>
      </div><div class="card"><div class="card-title">降亮策略明细</div>`,r.forEach(t=>{let e="0"===t.sw;g+=`<div class="row">
        <span class="label">\u7B56\u7565 ${t.id} (${v[t.id]||"?"})</span>
        <span class="value">${"?"===t.sw?'<span class="badge badge-warn">?</span>':l(e,"已关闭","开启")}</span>
      </div>`}),g+=`</div>
      <div class="card">
        <div class="card-title">\u6302\u8F7D\u6587\u4EF6 (${e.length})</div>`,0===e.length?g+=`<div class="row"><span class="label">\u672A\u68C0\u6D4B\u5230\u6302\u8F7D</span>${l(!1,"","无")}</div>`:e.forEach(t=>{let e=(t.match(/on\s+(\S+)/)?.[1]||t).split("/").pop();g+=`<div class="row">
          <span class="label" style="font-size:12px;word-break:break-all">${e}</span>
          <span class="value">${l(!0,"已挂载")}</span>
        </div>`}),t.innerHTML=g+="</div>"}catch(e){t.innerHTML=`<div style="color:var(--red);padding:12px">Error: ${e.message}</div>`}}async function c(){document.getElementById("error").style.display="none",a("--- init ---");try{let[t,e,s,n]=await Promise.all([i("cat /sys/class/backlight/panel0-backlight/brightness"),i("cat /sys/class/backlight/panel0-backlight/max_brightness"),i("settings get system screen_brightness_mode"),i("settings get system screen_brightness")]),l=parseInt(t.out)||0,o=parseInt(e.out)||1,c=Math.round(l/o*100),u="1"===s.out,p="";p+=`
      <div class="card">
        <div class="card-title">\u5F53\u524D\u4EAE\u5EA6</div>
        <div class="big-num" id="live-dbv" data-max="${o}">${l}</div>
        <div class="big-label" id="live-pct">DBV / ${o} (${c}%)</div>
        <div class="brightness-bar">
          <div class="brightness-fill" id="live-bar" style="width:${c}%"></div>
        </div>
        <div style="margin-top:12px">
          <div class="row">
            <span class="label">\u4EAE\u5EA6\u6A21\u5F0F</span>
            <span class="value">${u?"自动":"手动"}</span>
          </div>
          <div class="row">
            <span class="label">Settings \u4EAE\u5EA6\u503C</span>
            <span class="value">${n.out}</span>
          </div>
        </div>
      </div>
      <div class="card detail-toggle" onclick="toggleDetail()">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:14px">\u8BE6\u7EC6\u4FE1\u606F</span>
          <span id="detail-arrow" style="font-size:12px;color:var(--text2)">\u25BC</span>
        </div>
      </div>
      <div id="detail-section" style="display:none">
        <div id="detail-content"></div>
      </div>`,document.getElementById("content").innerHTML=p,d||(d=setInterval(r,1e3)),a("--- init done ---")}catch(s){var t;let e;a(`FATAL: ${s.message}
${s.stack}`),t=`\u52A0\u8F7D\u5931\u8D25: ${s.message}`,(e=document.getElementById("error")).textContent=t,e.style.display="block",document.getElementById("loading").textContent="加载失败"}}window.toggleDetail=function(){let t=document.getElementById("detail-section"),e=document.getElementById("detail-arrow");"none"!==t.style.display&&t.style.display?(t.style.display="none",e.textContent="▼"):(t.style.display="block",e.textContent="▲",o())},window.refresh=function(){d&&(clearInterval(d),d=null),document.getElementById("content").innerHTML='<div class="loading">加载中...</div>',c()},a("script loaded"),c();