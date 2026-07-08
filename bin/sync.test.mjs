// bin/sync.test.mjs — sync.mjs 핵심 로직(파서·렌더러·keep 보존)의 불변식 테스트.
// CLI 표면(--out 등)은 용법이 확정되지 않아 여기서 다루지 않는다.
//
// 실행: node --test bin/sync.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseYaml, render, preserveKeepRegions } from './sync.mjs';

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

test('parseYaml: 실제 agent-kit.yml을 스키마 그대로 읽는다', () => {
  const manifest = parseYaml(readFileSync(new URL('../agent-kit.yml', import.meta.url), 'utf8'));
  assert.equal(manifest.kit.name, 'my-agents-kit');
  assert.equal(manifest.targets['claude-code'].enabled, true);
  assert.equal(manifest.targets.codex.hooks_dir, null);
  assert.equal(manifest.context.include.length, 5);
  assert.equal(manifest.context.include[0], 'context/base.md');
  assert.equal(manifest.skills.include.length, 5);
  assert.equal(manifest.hooks.length, 3);
  assert.deepEqual(Object.keys(manifest.profiles), ['default', 'node']);
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
  // 조각이 {{project_name}} 같은 표기를 "문서화"해도 치환·에러 없이 원문 보존돼야 한다.
  const frag = '예시: {{project_name}} 와 {{unknown_var}} 는 그대로.\n';
  const out = render('{{project_name}}\n{{#each context}}\n{{{this}}}\n{{/each}}\n', {
    project_name: 'REAL',
    context: [frag],
  });
  assert.ok(out.startsWith('REAL\n'), '템플릿 자체의 변수는 치환된다');
  assert.ok(out.includes(frag.trim()), '조각 안의 표기는 원문 그대로 남는다');
});

// ── preserveKeepRegions ─────────────────────────────────────────────────

const region = (name, body) =>
  `<!-- kit:keep:${name}:start -->\n${body}\n<!-- kit:keep:${name}:end -->`;

test('preserveKeepRegions: 기존 파일의 keep 영역을 재생성물에 보존한다', () => {
  const next = `머리\n${region('commands', '(기본값)')}\n꼬리`;
  const prev = `옛 머리\n${region('commands', 'npm test')}\n옛 꼬리`;
  const out = preserveKeepRegions(next, prev);
  assert.ok(out.includes('npm test'), '프로젝트가 수정한 내용이 남는다');
  assert.ok(out.startsWith('머리') && out.endsWith('꼬리'), 'keep 밖은 kit 소유 — 새 내용으로 교체된다');
});

test('preserveKeepRegions: 이전 파일에 해당 영역이 없으면 템플릿 기본값을 쓴다', () => {
  const next = region('notes', '(기본값)');
  assert.equal(preserveKeepRegions(next, '영역 없는 파일'), next);
});

test('preserveKeepRegions: 여러 영역은 이름별로 독립 보존된다', () => {
  const next = `${region('commands', 'C기본')}\n${region('notes', 'N기본')}`;
  const prev = `${region('commands', 'C수정')}\n${region('notes', 'N수정')}`;
  const out = preserveKeepRegions(next, prev);
  assert.ok(out.includes('C수정') && out.includes('N수정'));
});

test('preserveKeepRegions: end 마커가 깨진 영역은 무시하고 기본값을 쓴다', () => {
  const next = region('notes', '(기본값)');
  const prev = '<!-- kit:keep:notes:start -->\n수정했지만 end 마커가 없다';
  assert.equal(preserveKeepRegions(next, prev), next);
});
