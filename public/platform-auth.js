(function installPlatformAuthBridge() {
  'use strict';

  var moduleByFunction = {
    'F1.1': 'information-processing',
    'F1.2': 'information-processing',
    'F2.1': 'sensory-proprioception',
    'F2.2': 'sensory-proprioception',
    'F2.3': 'sensory-proprioception',
    'F3.1': 'attention-allocation',
    'F4.1': 'motor-coordination',
    'F4.2': 'motor-coordination',
    'F5.1': 'feedback-motor-learning',
    'F5.2': 'feedback-motor-learning',
    'F5.3': 'feedback-motor-learning'
  };
  var labels = {
    'information-processing': '信息加工',
    'sensory-proprioception': '感觉系统与本体感觉',
    'attention-allocation': '注意力分配',
    'motor-coordination': '动作协调与控制',
    'feedback-motor-learning': '反馈与运动学习',
    'data-center': '数据中心',
    'training-archive': '我的训练档案'
  };
  var state = { payload: null, csrfToken: '', ready: false, syncing: {} };

  var bridgeStyleCss = [
    '#aift-auth-gate{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:rgba(19,74,52,.98);color:#fff;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
    '#aift-auth-gate .box{max-width:380px;padding:28px;text-align:center;border:1px solid rgba(255,255,255,.2);border-radius:16px;background:rgba(0,0,0,.12)}',
    '#aift-auth-gate .hint{margin-top:8px;color:rgba(255,255,255,.7);font-size:12px}',
    '#aift-user-menu{position:relative;z-index:1000;display:flex;align-items:center;flex:none;margin-left:12px}',
    '#aift-user-menu.aift-user-menu-floating{position:fixed;right:22px;top:14px;z-index:99999;margin-left:0}',
    '#aift-user-menu-trigger{appearance:none;-webkit-appearance:none;display:flex;align-items:center;gap:8px;min-height:44px;max-width:min(48vw,310px);padding:6px 10px;border:1px solid rgba(221,230,235,.9);border-radius:12px;background:#0f2146;color:#fff;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.12);font:500 13px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:left}',
    '#aift-user-menu-trigger:hover{background:#172e5b}',
    '#aift-user-menu-trigger:focus-visible{outline:2px solid #78c6bc;outline-offset:2px}',
    '.aift-user-avatar{display:grid;place-items:center;width:30px;height:30px;flex:none;border-radius:50%;background:#0fa4a0;color:#fff}',
    '.aift-user-avatar .aift-ui-icon{width:16px;height:16px}',
    '.aift-user-name{min-width:0;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.aift-user-status{display:inline-flex;align-items:center;gap:4px;flex:none;padding:5px 8px;border-radius:6px;background:#effbdc;color:#55a32d;font-size:11px;font-weight:700;white-space:nowrap}',
    '.aift-user-status-dot{width:6px;height:6px;border-radius:50%;background:#55a32d}',
    '#aift-user-caret{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;flex:none;color:rgba(255,255,255,.72);transition:transform .18s}',
    '#aift-user-caret .aift-ui-icon{width:14px;height:14px}',
    '#aift-user-menu-panel{position:absolute;right:0;top:calc(100% + 10px);z-index:1001;width:255px;overflow:hidden;padding:6px;border:1px solid #e4e9ee;border-radius:16px;background:#fff;color:#17202f;box-shadow:0 18px 48px rgba(15,33,70,.2);font:14px/1.35 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
    '#aift-user-menu-panel[hidden]{display:none}',
    '#aift-user-menu-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 12px}',
    '#aift-user-menu-identity{display:flex;flex-direction:column;min-width:0}',
    '#aift-user-menu-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#1b2430;font-weight:600}',
    '#aift-user-menu-role{margin-top:3px;color:#8a939d;font-size:12px}',
    '#aift-user-menu-username{flex:none;padding:5px 8px;border-radius:6px;background:#edf5ff;color:#2775d3;font-size:12px;font-weight:500}',
    '#aift-user-menu-divider{height:1px;margin:0 4px;background:#e8ebef}',
    '#aift-user-menu-panel a,#aift-user-menu-panel button{display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;border:0;border-radius:12px;background:transparent;color:#343b45;cursor:pointer;font:inherit;text-align:left;text-decoration:none}',
    '#aift-user-menu-panel a:hover,#aift-user-menu-panel button:hover{background:#f4f7fa}',
    '#aift-user-menu-panel button{margin:0}',
    '.aift-menu-icon{display:block;width:18px;height:18px;flex:none;object-fit:contain;opacity:.82}',
    '@media (max-width:760px){.aift-user-name{max-width:105px}.aift-user-status{display:none}#aift-user-menu-panel{right:-8px}}'
  ].join('');

  function ensureBridgeStyle() {
    if (document.getElementById('aift-auth-bridge-style')) return;
    var style = document.createElement('style');
    style.id = 'aift-auth-bridge-style';
    style.textContent = bridgeStyleCss;
    var target = document.head || document.documentElement || document.body;
    if (target) target.appendChild(style);
  }

  function ensureAuthGate() {
    if (state.ready || document.getElementById('aift-auth-gate')) return;
    var gate = document.createElement('div');
    gate.id = 'aift-auth-gate';
    gate.innerHTML = '<div class="box"><div>正在验证账号与模块权限…</div><div class="hint">摄像头仅在权限验证完成后启动</div></div>';
    var target = document.body || document.documentElement;
    if (target) target.appendChild(gate);
  }

  function addGate() {
    ensureBridgeStyle();
    ensureAuthGate();
  }

  function textOf(node) {
    return String(node && (node.innerText || node.textContent) || '');
  }

  function codeOf(text) {
    var match = text.match(/F[1-5]\.\d/);
    return match ? match[0] : null;
  }

  function moduleAllowed(moduleKey) {
    return !!state.payload && (state.payload.isAdmin || (state.payload.modules || []).indexOf(moduleKey) >= 0);
  }

  function showMessage(message) {
    var existing = document.getElementById('aift-bridge-message');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'aift-bridge-message';
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:100001;padding:10px 16px;border-radius:9px;background:#111;color:#fff;font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.2)';
    document.body.appendChild(toast);
    setTimeout(function () { if (toast.parentNode) toast.remove(); }, 3000);
  }

  function makeSpan(className, value) {
    var span = document.createElement('span');
    span.className = className;
    if (value !== undefined) span.textContent = value;
    return span;
  }

  function makeIcon(className, fileName) {
    var icon = document.createElement('img');
    icon.className = className;
    icon.src = '/icons/' + fileName;
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }

  function setUserMenuOpen(open) {
    var panel = document.getElementById('aift-user-menu-panel');
    var trigger = document.getElementById('aift-user-menu-trigger');
    var caret = document.getElementById('aift-user-caret');
    if (!panel || !trigger) return;
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (caret) caret.style.transform = open ? 'rotate(180deg)' : '';
  }

  function logoutAndSwitch() {
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: state.csrfToken ? { 'X-CSRF-Token': state.csrfToken } : {}
    }).then(function (response) {
      if (!response.ok && response.status !== 401) throw new Error('logout-' + response.status);
      var next = (window.location.pathname || '/') + (window.location.search || '');
      window.location.href = '/login?next=' + encodeURIComponent(next);
    }).catch(function () {
      showMessage('退出登录失败，请稍后重试');
    });
  }

  function createMenuLink(href, label, iconName) {
    var link = document.createElement('a');
    link.href = href;
    link.setAttribute('role', 'menuitem');
    link.appendChild(makeIcon('aift-menu-icon', iconName));
    link.appendChild(document.createTextNode(label));
    link.addEventListener('click', function () { setUserMenuOpen(false); });
    return link;
  }

  function buildUserMenu() {
    var user = state.payload && state.payload.user || {};
    var displayName = user.displayName || user.username || '当前用户';
    var username = user.username || '';
    var isAdmin = !!(state.payload && (state.payload.isAdmin || user.role === 'admin'));
    var wrapper = document.createElement('div');
    wrapper.id = 'aift-user-menu';
    wrapper.className = 'aift-user-menu';
    wrapper.dataset.aiftUserKey = String(user.id || username) + ':' + (isAdmin ? 'admin' : 'student');

    var trigger = document.createElement('button');
    trigger.id = 'aift-user-menu-trigger';
    trigger.type = 'button';
    trigger.setAttribute('aria-label', '打开用户菜单');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'menu');
    var avatar = makeSpan('aift-user-avatar');
    avatar.appendChild(makeIcon('aift-ui-icon', 'user-round.svg'));
    trigger.appendChild(avatar);
    trigger.appendChild(makeSpan('aift-user-name', displayName));
    var status = makeSpan('aift-user-status');
    status.appendChild(makeSpan('aift-user-status-dot'));
    status.appendChild(document.createTextNode('后端正常'));
    trigger.appendChild(status);
    var caret = makeSpan('aift-user-caret');
    caret.id = 'aift-user-caret';
    caret.appendChild(makeIcon('aift-ui-icon', 'chevron-down.svg'));
    trigger.appendChild(caret);

    var panel = document.createElement('div');
    panel.id = 'aift-user-menu-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'menu');
    panel.setAttribute('aria-label', '用户菜单');
    var head = document.createElement('div');
    head.id = 'aift-user-menu-head';
    var identity = document.createElement('div');
    identity.id = 'aift-user-menu-identity';
    identity.appendChild(makeSpan('aift-user-menu-name', displayName));
    identity.appendChild(makeSpan('aift-user-menu-role', isAdmin ? '管理员' : '学生用户'));
    head.appendChild(identity);
    if (username) head.appendChild(makeSpan('aift-user-menu-username', username));
    panel.appendChild(head);
    panel.appendChild(makeSpan('', ''));
    panel.lastChild.id = 'aift-user-menu-divider';
    if (isAdmin) panel.appendChild(createMenuLink('/admin/users', '用户管理', 'settings.svg'));
    panel.appendChild(createMenuLink('/change-password', '修改密码', 'lock-keyhole.svg'));
    var switchButton = document.createElement('button');
    switchButton.type = 'button';
    switchButton.setAttribute('role', 'menuitem');
    switchButton.appendChild(makeIcon('aift-menu-icon', 'log-out.svg'));
    switchButton.appendChild(document.createTextNode('退出登录并切换用户'));
    switchButton.addEventListener('click', function (event) {
      event.preventDefault();
      setUserMenuOpen(false);
      logoutAndSwitch();
    });
    panel.appendChild(switchButton);

    trigger.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      var currentPanel = document.getElementById('aift-user-menu-panel');
      setUserMenuOpen(!!currentPanel && currentPanel.hidden);
    });
    wrapper.appendChild(trigger);
    wrapper.appendChild(panel);
    return wrapper;
  }

  function ensureUserMenu() {
    if (!state.ready || !state.payload) return;
    var oldShortcut = document.getElementById('aift-admin-shortcut');
    if (oldShortcut) oldShortcut.remove();
    var user = state.payload.user || {};
    var isAdmin = !!(state.payload.isAdmin || user.role === 'admin');
    var userKey = String(user.id || user.username || '') + ':' + (isAdmin ? 'admin' : 'student');
    var menu = document.getElementById('aift-user-menu');
    if (!menu || menu.dataset.aiftUserKey !== userKey) {
      if (menu) menu.remove();
      menu = buildUserMenu();
    }
    var topbar = document.querySelector('.topbar');
    var host = topbar || document.body;
    if (menu.parentNode !== host) host.appendChild(menu);
    menu.classList.toggle('aift-user-menu-floating', !topbar);
  }

  function hideIfUnauthorized(node, moduleKey) {
    if (!node || !moduleKey) return;
    var allowed = moduleAllowed(moduleKey);
    node.hidden = !allowed;
    node.setAttribute('aria-hidden', allowed ? 'false' : 'true');
    if (!allowed) node.style.display = 'none';
    else if (node.dataset.aiftHidden === 'true') node.style.display = '';
    node.dataset.aiftHidden = allowed ? 'false' : 'true';
  }

  function applyVisibility() {
    ensureBridgeStyle();
    if (!state.ready) {
      ensureAuthGate();
      return;
    }
    document.querySelectorAll('.fnrow, button.fnrow, [data-function-code]').forEach(function (node) {
      var code = node.dataset.functionCode || codeOf(textOf(node));
      hideIfUnauthorized(node, code && moduleByFunction[code]);
    });
    document.querySelectorAll('.modcard, .datacard, a, button').forEach(function (node) {
      var text = textOf(node);
      var moduleKey = null;
      if (text.indexOf('我的训练档案') >= 0) moduleKey = 'training-archive';
      else if (text.indexOf('数据中心') >= 0 || text.indexOf('实验记录与数据导出') >= 0) moduleKey = 'data-center';
      else if (text.indexOf('信息加工') >= 0) moduleKey = 'information-processing';
      else if (text.indexOf('感觉系统与本体感觉') >= 0) moduleKey = 'sensory-proprioception';
      else if (text.indexOf('注意力分配') >= 0 || text.indexOf('注意分配') >= 0) moduleKey = 'attention-allocation';
      else if (text.indexOf('动作协调与控制') >= 0) moduleKey = 'motor-coordination';
      else if (text.indexOf('反馈与运动学习') >= 0) moduleKey = 'feedback-motor-learning';
      if (moduleKey && (node.classList.contains('modcard') || node.classList.contains('datacard') || node.dataset.aiftModule)) {
        hideIfUnauthorized(node, moduleKey);
      }
    });
    ensureUserMenu();
  }

  function scheduleTopbarPlacement() {
    if (!state.payload) return;
    var attempts = 0;
    var timer = setInterval(function () {
      attempts += 1;
      applyVisibility();
      if (attempts >= 20) clearInterval(timer);
    }, 500);
  }

  function routeForNode(node) {
    var text = textOf(node);
    if (text.indexOf('我的训练档案') >= 0) return '/training-archive';
    if (text.indexOf('数据中心') >= 0 || text.indexOf('实验记录与数据导出') >= 0) return '/data-center';
    return null;
  }

  function blockUnauthorizedClick(event) {
    if (!state.ready) return;
    var node = event.target && event.target.closest ? event.target.closest('.fnrow, .modcard, .datacard, [data-function-code]') : null;
    if (!node) return;
    var route = routeForNode(node);
    var code = node.dataset.functionCode || codeOf(textOf(node));
    var moduleKey = route === '/training-archive' ? 'training-archive' : route === '/data-center' ? 'data-center' : code && moduleByFunction[code];
    if (moduleKey && !moduleAllowed(moduleKey)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showMessage('当前账号没有“' + (labels[moduleKey] || moduleKey) + '”权限');
      return;
    }
    if (route && (node.classList.contains('datacard') || textOf(node).indexOf('数据中心') >= 0)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href = route;
    }
  }

  function redact(value, depth) {
    if (depth > 5 || value === null || value === undefined) return value;
    if (Array.isArray(value)) return value.slice(0, 500).map(function (item) { return redact(item, depth + 1); });
    if (typeof value !== 'object') return value;
    var result = {};
    Object.keys(value).forEach(function (key) {
      if (/raw.?video|video.?blob|data.?url|image.?data|base64|video.?frame|raw.?frame/i.test(key)) return;
      result[key] = redact(value[key], depth + 1);
    });
    return result;
  }

  function syncStoredResults(raw) {
    if (!state.ready || !raw || !state.csrfToken) return;
    var parsed;
    try { parsed = JSON.parse(raw); } catch (_) { return; }
    if (!Array.isArray(parsed)) return;
    parsed.forEach(function (item, index) {
      if (!item || typeof item !== 'object') return;
      var functionCode = item.functionCode || item.moduleCode || item.code || codeOf(JSON.stringify(item));
      var moduleKey = functionCode && moduleByFunction[functionCode];
      if (!functionCode || !moduleKey || !moduleAllowed(moduleKey)) return;
      var clientId = 'platform-' + String(item.id || item.recordId || (functionCode + '-' + (item.timestamp || item.endTime || index)));
      if (state.syncing[clientId]) return;
      state.syncing[clientId] = true;
      var metrics = redact(item.metrics || item.metric || item.data || {}, 0);
      var report = redact(item.report || item.summary || {}, 0);
      fetch('/api/training-records', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken },
        body: JSON.stringify({
          clientId: clientId,
          moduleKey: moduleKey,
          functionCode: functionCode,
          moduleTitle: item.moduleTitle || item.title || functionCode,
          occurredAt: item.timestamp || item.endTime || Date.now(),
          stage: item.stage || '正式',
          condition: item.condition || '',
          result: typeof item.result === 'string' ? item.result : (item.result ? JSON.stringify(redact(item.result, 0)) : ''),
          duration: Number(item.duration || 0),
          metrics: metrics,
          report: report
        })
      }).then(function (response) {
        if (response.status === 401) {
          window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname);
        }
      }).catch(function () {
        showMessage('训练记录暂未同步，请保持网络连接后重试');
      });
    });
  }

  function installResultSync() {
    if (!window.Storage || !Storage.prototype || Storage.prototype.__aiftWrapped) return;
    var originalSetItem = Storage.prototype.setItem;
    var wrapped = function (key, value) {
      var result = originalSetItem.call(this, key, value);
      if (key === 'aift_results_v1') syncStoredResults(value);
      return result;
    };
    wrapped.__aiftWrapped = true;
    Storage.prototype.__aiftWrapped = true;
    Storage.prototype.setItem = wrapped;
    try { syncStoredResults(window.localStorage.getItem('aift_results_v1')); } catch (_) { /* private mode */ }
  }

  function loadAuth() {
    fetch('/api/auth/me', { credentials: 'include' }).then(function (response) {
      if (response.status === 401) {
        window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname + window.location.search);
        return null;
      }
      if (!response.ok) throw new Error('auth-' + response.status);
      return response.json();
    }).then(function (payload) {
      if (!payload) return;
      state.payload = payload;
      state.csrfToken = payload.csrfToken || '';
      state.ready = true;
      var gate = document.getElementById('aift-auth-gate');
      if (gate) gate.remove();
      installResultSync();
      applyVisibility();
      scheduleTopbarPlacement();
    }).catch(function () {
      var gate = document.getElementById('aift-auth-gate');
      if (gate) gate.innerHTML = '<div class="box"><div>账号验证失败</div><div class="hint">请返回登录页后重试</div></div>';
      setTimeout(function () { window.location.href = '/login?next=' + encodeURIComponent(window.location.pathname); }, 1200);
    });
  }

  addGate();
  document.addEventListener('click', blockUnauthorizedClick, true);
  document.addEventListener('click', function (event) {
    var menu = document.getElementById('aift-user-menu');
    if (menu && !menu.contains(event.target)) setUserMenuOpen(false);
  }, true);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setUserMenuOpen(false);
    if (event.key === 'Enter' || event.key === ' ') blockUnauthorizedClick(event);
  }, true);
  var observer = new MutationObserver(function () { applyVisibility(); });
  observer.observe(document, { childList: true, subtree: true });
  loadAuth();
})();
