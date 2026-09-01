import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('public platform entry patch', () => {
  const html = readFileSync(resolve(process.cwd(), 'public/platform.html'), 'utf8')
  const bridge = readFileSync(resolve(process.cwd(), 'public/platform-auth.js'), 'utf8')
  const entryPatches = readFileSync(resolve(process.cwd(), 'public/platform-entry-patches.js'), 'utf8')

  it('keeps camera-based F2/F4 modules wired to live pose analysis', () => {
    expect(entryPatches).toContain('patchCameraBasedModuleEntries')
    expect(entryPatches).toContain("['F2.1', '单腿站立平衡测试']")
    expect(entryPatches).toContain("['F4.2', '动作稳定性分析']")
    expect(entryPatches).toContain("window.location.href = `/pose-analysis?lesson=${encodeURIComponent(code)}`")
  })

  it('keeps the training archive card wired to the real local archive route', () => {
    expect(entryPatches).toContain('进入我的训练档案')
    expect(entryPatches).toContain("window.location.href = '/training-archive'")
    expect(entryPatches).toContain('delegateTrainingArchive')
  })

  it('loads the authenticated permission bridge before camera interactions', () => {
    expect(html).toMatch(/'<script src="\/platform-auth\.js(?:\?[^"]+)?">'\s*\+\s*entryScriptEnd/)
    expect(bridge).toContain('aift-auth-gate')
    expect(bridge).toContain('syncStoredResults')
    expect(bridge).toContain('X-CSRF-Token')
    expect(bridge).toContain('raw.?video')
  })

  it('places the signed-in user menu in the platform top bar', () => {
    expect(bridge).toContain("document.querySelector('.topbar')")
    expect(bridge).toContain('aift-user-menu-trigger')
    expect(bridge).toContain('后端正常')
    expect(bridge).toContain('退出登录并切换用户')
    expect(bridge).toContain('menu.parentNode !== host')
    expect(bridge).toContain('scheduleTopbarPlacement')
    expect(bridge).toContain('setInterval(function ()')
  })

  it('cache-busts the permission bridge after platform updates', () => {
    expect(html).toMatch(/'<script src="\/platform-auth\.js\?v=[^"]+">'\s*\+\s*entryScriptEnd/)
  })

  it('loads the auth bridge after the legacy app so the user menu survives top-bar rendering', () => {
    const legacyAppMarker = html.indexOf('const legacyAppScript =')
    const authScriptMarker = html.indexOf('const authScript =')

    expect(legacyAppMarker).toBeGreaterThanOrEqual(0)
    expect(authScriptMarker).toBeGreaterThan(legacyAppMarker)
    expect(html).toContain("template = template.replace(/<\\/body>/i, authScript + '</body>')")
  })

  it('keeps auth and navigation patches inside the unpacked template', () => {
    const match = html.match(/<script type="__bundler\/template">\s*(.*?)\s*<\/script>/s)
    expect(match).not.toBeNull()
    const template = JSON.parse(match?.[1] ?? '') as string

    expect(template).toContain('</body>')
    expect(html).toContain('const entryScripts = [')
    expect(html).toMatch(/'<script src="\/platform-entry-patches\.js\?v=[^"]+">'\s*\+\s*entryScriptEnd/)
    expect(html).toMatch(/'<script src="\/platform-auth\.js\?v=[^"]+">'\s*\+\s*entryScriptEnd/)
    expect(html).toContain('const legacyAppScript =')
    expect(html).toContain('template = template.replace(legacyAppScript, entryScripts + legacyAppScript)')
  })

  it('does not let injected script tags terminate the bundler script', () => {
    const entryStart = html.indexOf('const entryScriptEnd =')
    const entryEnd = html.indexOf('const doc =', entryStart)
    expect(entryStart).toBeGreaterThanOrEqual(0)
    expect(entryEnd).toBeGreaterThan(entryStart)

    const entryCode = html.slice(entryStart, entryEnd)
    expect(entryCode).toContain("const entryScriptEnd = '<' + '/script>'")
    expect(entryCode).not.toContain('</script>')
  })

  it('replaces the legacy generated history with a small labelled example set', () => {
    expect(entryPatches).toContain('DEMO-001')
    expect(entryPatches).toContain('示例班级')
    expect(entryPatches).toContain('window.seedClassData')
    expect(entryPatches).toContain('__aiftSampleData')
    expect(html).toContain('const legacyAppScript =')
    expect(html).toContain('template = template.replace(legacyAppScript, entryScripts + legacyAppScript)')
  })
})
