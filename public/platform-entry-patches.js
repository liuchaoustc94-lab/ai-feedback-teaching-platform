(function patchCameraBasedModuleEntries() {
  'use strict';

  const legacyExampleRows = [
    { sid: 'DEMO-001', cls: '示例班级', date: '2026-09-01', stage: '正式', fn: 'F1.1', result: '278 ms', cond: '简单' },
    { sid: 'DEMO-001', cls: '示例班级', date: '2026-09-01', stage: '正式', fn: 'F2.1', result: '2.8 cm', cond: '睁眼' },
    { sid: 'DEMO-001', cls: '示例班级', date: '2026-09-01', stage: '正式', fn: 'F4.1', result: '92°', cond: '关节点轨迹' },
  ];

  function installLegacySampleDataOverride() {
    if (typeof window.seedClassData !== 'function') return false;
    if (window.seedClassData.__aiftSampleData === true) return true;

    const sampleData = function seedClassDataForPlatform() {
      return legacyExampleRows.map((row) => ({ ...row }));
    };
    sampleData.__aiftSampleData = true;
    window.seedClassData = sampleData;
    return true;
  }

  installLegacySampleDataOverride();

  const cameraModules = new Map([
    ['F2.1', '单腿站立平衡测试'],
    ['F2.2', '重心轨迹可视化'],
    ['F2.3', '姿态控制评估'],
    ['F4.1', '关节点轨迹分析'],
    ['F4.2', '动作稳定性分析'],
  ]);

  function moduleCodeFromText(text) {
    const match = String(text || '').match(/F[24]\.[123]/);
    return match ? match[0] : null;
  }

  function decorateButton(button, code) {
    if (button.dataset.posePatched === code) return;
    button.dataset.posePatched = code;
    button.type = 'button';
    button.title = '打开实时姿态识别与分析';
    button.setAttribute('aria-label', `${code} ${cameraModules.get(code)}，打开实时姿态识别与分析`);

    const badges = Array.from(button.querySelectorAll('*')).filter((node) => {
      return (node.textContent || '').trim() === '第二期';
    });
    badges.forEach((badge) => {
      badge.textContent = '实时检测';
    });

    button.addEventListener('click', function openPoseAnalysis(event) {
      event.preventDefault();
      event.stopPropagation();
      window.location.href = `/pose-analysis?lesson=${encodeURIComponent(code)}`;
    }, true);
  }

  function patch() {
    document.querySelectorAll('button.fnrow').forEach((button) => {
      const code = moduleCodeFromText(button.innerText || button.textContent);
      if (code && cameraModules.has(code)) {
        decorateButton(button, code);
      }
    });

    document.querySelectorAll('.datacard').forEach((card) => {
      const text = card.innerText || card.textContent || '';
      if (!text.includes('我的训练档案') || card.dataset.archivePatched === 'true') return;

      card.dataset.archivePatched = 'true';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', '进入我的训练档案');
      card.title = '进入真实本地训练档案';
      card.addEventListener('click', function openTrainingArchive(event) {
        event.preventDefault();
        event.stopPropagation();
        window.location.href = '/training-archive';
      }, true);
      card.addEventListener('keydown', function openTrainingArchiveByKey(event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        window.location.href = '/training-archive';
      });
    });
  }

  document.addEventListener('click', function delegateTrainingArchive(event) {
    const card = event.target && event.target.closest ? event.target.closest('.datacard') : null;
    if (!card || !(card.innerText || card.textContent || '').includes('我的训练档案')) return;
    event.preventDefault();
    event.stopPropagation();
    window.location.href = '/training-archive';
  }, true);

  document.addEventListener('keydown', function delegateTrainingArchiveKey(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target && event.target.closest ? event.target.closest('.datacard') : null;
    if (!card || !(card.innerText || card.textContent || '').includes('我的训练档案')) return;
    event.preventDefault();
    window.location.href = '/training-archive';
  }, true);

  patch();
  const observer = new MutationObserver(patch);
  observer.observe(document, { childList: true, subtree: true });
  window.addEventListener('load', patch);
  setTimeout(patch, 500);
  setTimeout(patch, 1500);
})();
