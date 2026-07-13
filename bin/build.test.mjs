// bin/build.test.mjs — build.mjs 핵심 로직(파서·렌더러·profile 해석·패키지 생성)의 불변식 테스트.
// CLI 표면(--profile 인자 처리 등)은 얇은 glue라 여기서 다루지 않는다.
//
// 실행: node --test bin/build.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseYaml, render, build } from './build.mjs';

const kitRoot = fileURLToPath(new URL('..', import.meta.url));
const tmp = (t, prefix) => {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
};

// ── parseYaml ───────────────────────────────────────────────────────────

test('parseYaml: 중첩 맵·스칼라 리스트·주석을 처리한다', () => {
  const src = [
    '# 전체 줄 주석',
    'kit:',
    '  name: my-kit',
    '  version: 1',
    'items:',
    '  include:',
    '    - a/b.md   # 인라인 주석',
    '    - c/d.md',
    'flags:',
    '  on: true',
    '  off: false',
    '  none: null',
    '  empty_list: []',
    '  empty_map: {}',
    '  quoted: "hello world"',
  ].join('\n');
  assert.deepEqual(parseYaml(src), {
    kit: { name: 'my-kit', version: 1 },
    items: { include: ['a/b.md', 'c/d.md'] },
    flags: { on: true, off: false, none: null, empty_list: [], empty_map: {}, quoted: 'hello world' },
  });
});

test('parseYaml: 값 없는 키는 자식이 없으면 null로 남는다', () => {
  assert.deepEqual(parseYaml('a:\nb: 1'), { a: null, b: 1 });
});

test('parseYaml: 값 안의 콜론은 키 구분자로 오인하지 않는다', () => {
  assert.deepEqual(parseYaml('url: https://example.com/x'), { url: 'https://example.com/x' });
});

test('parseYaml: 블록 스칼라(|)는 주석·빈 줄 포함 원문을 보존한다', () => {
  const src = ['cmd: |', '  npm test   # 테스트', '', '  npm run build', 'next: 1'].join('\n');
  assert.deepEqual(parseYaml(src), {
    cmd: 'npm test   # 테스트\n\nnpm run build\n',
    next: 1,
  });
});

test('parseYaml: 내용 없는 블록 스칼라는 빈 문자열이다', () => {
  assert.deepEqual(parseYaml('cmd: |\nnext: 1'), { cmd: '', next: 1 });
});

test('parseYaml: 실제 agent-kit.yml을 스키마 그대로 읽는다', () => {
  const manifest = parseYaml(readFileSync(join(kitRoot, 'agent-kit.yml'), 'utf8'));
  assert.equal(manifest.kit.name, 'my-agents-kit');
  assert.equal(manifest.targets['claude-code'].enabled, true);
  assert.equal(manifest.targets.codex.hooks_dir, null);
  assert.equal(manifest.context.include.length, 5);
  assert.equal(manifest.context.include[0], 'context/base.md');
  assert.equal(manifest.skills.include.length, 5);
  assert.equal(manifest.hooks.length, 3);
  assert.deepEqual(Object.keys(manifest.profiles), ['default', 'node']);
});

test('parseYaml: 실제 profiles/node.yml — commands 시드를 블록 스칼라로 읽는다', () => {
  const preset = parseYaml(readFileSync(join(kitRoot, 'profiles/node.yml'), 'utf8'));
  assert.equal(preset.profile.name, 'node');
  assert.ok(preset.commands.includes('npm test'));
  assert.ok(preset.commands.includes('# 테스트'), '블록 스칼라 안의 #은 주석으로 잘리지 않는다');
});

// ── render ──────────────────────────────────────────────────────────────

test('render: 변수를 치환하고 hbs 주석을 제거한다', () => {
  const out = render('{{!-- 주석 --}}\n# {{name}} v{{ver}}\n', { name: 'kit', ver: 1 });
  assert.equal(out, '# kit v1\n');
});

test('render: 값 없는 변수는 조용히 넘어가지 않고 throw 한다', () => {
  assert.throws(() => render('{{missing}}', {}), /missing/);
});

test('render: each는 배열을 선언 순서대로 이어붙인다', () => {
  const out = render('{{#each items}}\n{{{this}}}\n{{/each}}\n끝', { items: ['A\n', 'B\n'] });
  assert.equal(out, 'A\n\nB\n\n끝');
});

test('render: each 대상이 배열이 아니면 throw 한다', () => {
  assert.throws(() => render('{{#each items}}\n{{{this}}}\n{{/each}}\n', {}), /items/);
});

test('render: 삽입된 조각 본문은 템플릿으로 재해석하지 않는다 (회귀)', () => {
  // 조각이 {{kit_version}} 같은 표기를 "문서화"해도 치환·에러 없이 원문 보존돼야 한다.
  const frag = '예시: {{kit_version}} 와 {{unknown_var}} 는 그대로.\n';
  const out = render('{{kit_version}}\n{{#each context}}\n{{{this}}}\n{{/each}}\n', {
    kit_version: 'REAL',
    context: [frag],
  });
  assert.ok(out.startsWith('REAL\n'), '템플릿 자체의 변수는 치환된다');
  assert.ok(out.includes(frag.trim()), '조각 안의 표기는 원문 그대로 남는다');
});

// ── build ───────────────────────────────────────────────────────────────

test('build: default profile — 패키지 트리 전체를 생성한다', (t) => {
  const out = tmp(t, 'agent-kit-build-');
  const written = build({ kitRoot, outDir: out, version: 'v-test' });

  const agents = readFileSync(join(out, 'AGENTS.md'), 'utf8');
  assert.ok(agents.includes('my-agents-kit v-test'), '버전 스탬프가 박힌다');
  assert.ok(agents.includes('# 프로젝트 명령어를 여기에 기록한다'), 'default는 placeholder 명령어');
  assert.ok(!agents.includes('kit:keep'), 'keep 마커는 폐기됐다');
  assert.ok(!/\{\{[\w#/]/.test(agents), '미치환 템플릿 표기가 남지 않는다');

  const claude = readFileSync(join(out, 'CLAUDE.md'), 'utf8');
  assert.ok(claude.includes('@AGENTS.md'), 'CLAUDE.md는 AGENTS.md import 셔임');
  assert.ok(claude.includes('my-agents-kit v-test'));

  // skills는 양 도구 트리에 동일하게, hooks·settings는 Claude 트리에만(codex는 null)
  assert.ok(existsSync(join(out, '.claude/skills/code-review/SKILL.md')));
  assert.ok(existsSync(join(out, '.agents/skills/code-review/SKILL.md')));
  assert.ok(!existsSync(join(out, '.agents/hooks')));
  assert.equal(
    readFileSync(join(out, '.claude/settings.json'), 'utf8'),
    readFileSync(join(kitRoot, 'templates/settings.json'), 'utf8'),
    'settings는 templates 원본 그대로',
  );

  const hook = join(out, '.claude/hooks/notify.sh');
  assert.ok(existsSync(hook));
  assert.equal(
    statSync(hook).mode & 0o777,
    statSync(join(kitRoot, 'hooks/notify.sh')).mode & 0o777,
    'hook 스크립트의 실행 권한이 보존된다',
  );

  assert.ok(written.includes('AGENTS.md') && written.includes('CLAUDE.md'));
});

test('build: node profile — commands 시드가 명령어 섹션을 채운다', (t) => {
  const out = tmp(t, 'agent-kit-build-node-');
  build({ kitRoot, outDir: out, profile: 'node', version: 'v-test' });
  const agents = readFileSync(join(out, 'AGENTS.md'), 'utf8');
  assert.ok(agents.includes('npm test'), '시드가 렌더된다');
  assert.ok(!agents.includes('프로젝트 명령어를 여기에 기록한다'), 'placeholder는 시드로 교체된다');
});

test('build: 등록되지 않은 profile이면 throw 한다', (t) => {
  assert.throws(
    () => build({ kitRoot, outDir: tmp(t, 'agent-kit-build-x-'), profile: 'nope' }),
    /등록되지 않은 profile/,
  );
});

test('build: profile의 명시 필드는 전역 목록을 통째로 교체한다', (t) => {
  // 최소 fixture kit — 명시=교체(부분 병합 없음) 의미론을 실제 파일 트리로 검증.
  const kit = tmp(t, 'agent-kit-fixture-');
  mkdirSync(join(kit, 'templates'), { recursive: true });
  mkdirSync(join(kit, 'ctx'), { recursive: true });
  mkdirSync(join(kit, 'skills/s1'), { recursive: true });
  mkdirSync(join(kit, 'skills/s2'), { recursive: true });
  writeFileSync(join(kit, 'ctx/a.md'), 'A-내용\n');
  writeFileSync(join(kit, 'ctx/b.md'), 'B-내용\n');
  writeFileSync(join(kit, 'skills/s1/SKILL.md'), 's1\n');
  writeFileSync(join(kit, 'skills/s2/SKILL.md'), 's2\n');
  writeFileSync(join(kit, 'templates/AGENTS.md.hbs'),
    '{{kit_version}}|{{commands}}\n{{#each context}}\n{{{this}}}\n{{/each}}\n');
  writeFileSync(join(kit, 'agent-kit.yml'), [
    'targets:',
    '  tool:',
    '    enabled: true',
    '    instructions: AGENTS.md',
    '    skills_dir: .tool/skills',
    'context:',
    '  include:',
    '    - ctx/a.md',
    '    - ctx/b.md',
    'skills:',
    '  include:',
    '    - skills/s1',
    '    - skills/s2',
    'profiles:',
    '  slim: slim.yml',
    '',
  ].join('\n'));
  writeFileSync(join(kit, 'slim.yml'), [
    'profile:',
    '  name: slim',
    'context:',
    '  - ctx/a.md',
    'skills:',
    '  - skills/s1',
    '',
  ].join('\n'));

  const out = tmp(t, 'agent-kit-fixture-out-');
  build({ kitRoot: kit, outDir: out, profile: 'slim', version: 'v' });
  const agents = readFileSync(join(out, 'AGENTS.md'), 'utf8');
  assert.ok(agents.includes('A-내용') && !agents.includes('B-내용'), 'context 목록이 교체된다');
  assert.ok(existsSync(join(out, '.tool/skills/s1')) && !existsSync(join(out, '.tool/skills/s2')),
    'skills 목록이 교체된다');
});

test('build: enabled=false 인 target은 아무것도 생성하지 않는다', (t) => {
  const kit = tmp(t, 'agent-kit-off-');
  mkdirSync(join(kit, 'templates'), { recursive: true });
  writeFileSync(join(kit, 'templates/AGENTS.md.hbs'), '{{kit_version}}\n');
  writeFileSync(join(kit, 'agent-kit.yml'), [
    'targets:',
    '  tool:',
    '    enabled: false',
    '    instructions: AGENTS.md',
    'profiles:',
    '  default: default.yml',
    '',
  ].join('\n'));
  writeFileSync(join(kit, 'default.yml'), 'profile:\n  name: default\n');
  const out = tmp(t, 'agent-kit-off-out-');
  assert.deepEqual(build({ kitRoot: kit, outDir: out }), []);
  assert.ok(!existsSync(join(out, 'AGENTS.md')));
});
