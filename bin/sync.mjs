#!/usr/bin/env node
// bin/sync.mjs — agent-kit.yml을 읽어 다운스트림 프로젝트에 도구별 지시문 파일을 생성한다.
//
// MVP 범위: context.include의 조각들을 templates/*.hbs로 렌더해
//           각 target의 instructions 파일(AGENTS.md·CLAUDE.md)을 생성한다.
//           skills · hooks · profiles · overrides는 아직 처리하지 않는다.
//
// 의존성 없음: YAML 파서와 템플릿 렌더러 모두 아래의 최소 구현을 쓴다.
//
// 사용법:
//   node <kit>/bin/sync.mjs                # 현재 디렉토리(프로젝트 루트)에 생성
//   node <kit>/bin/sync.mjs --out <dir>    # 지정 디렉토리에 생성
//
// 테스트: node --test bin/sync.test.mjs  (파서·렌더러·keep 보존 불변식)
//
// 계약:
//   - 생성 주석은 템플릿 자체가 담고 있다(templates/*.hbs 상단 참조).
//   - kit:keep 마커(<!-- kit:keep:<name>:start/end -->) 사이의 기존 내용은 재생성 시 보존한다.
//   - project_name은 대상 디렉토리 이름에서 얻는다.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── 최소 YAML 파서 ──────────────────────────────────────────────────────
// agent-kit.yml이 쓰는 부분집합만 지원: 들여쓰기 중첩 맵, 스칼라 리스트('- '),
// 주석(#), 인라인 []·{}. 블록 스칼라(|)·앵커·인라인 컬렉션 등은 미지원 —
// manifest가 그 문법을 쓰게 되면 이 파서를 함께 확장한다.
// 값 안의 ' # '는 주석으로 잘리므로 manifest 값에 #을 쓰지 않는다.
export function parseYaml(src) {
  const root = {};
  const stack = [{ indent: -1, container: root, key: null }];
  const node = (frame, kind) => {
    if (frame.key === null) return frame.container;
    frame.container[frame.key] ??= kind === 'list' ? [] : {};
    return frame.container[frame.key];
  };
  for (const raw of src.split('\n')) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const line = raw.replace(/\s+#.*$/, '');
    if (!line.trim()) continue;
    const indent = line.match(/^ */)[0].length;
    const text = line.trim();
    while (indent <= stack[stack.length - 1].indent) stack.pop();
    const top = stack[stack.length - 1];
    if (text.startsWith('- ')) {
      node(top, 'list').push(scalar(text.slice(2)));
    } else {
      const sep = text.indexOf(':');
      if (sep === -1) throw new Error(`YAML 파싱 실패: "${text}"`);
      const key = text.slice(0, sep).trim();
      const value = text.slice(sep + 1).trim();
      const map = node(top, 'map');
      if (value === '') {
        map[key] ??= null; // 자식 줄이 채운다 — 자식이 없으면 null로 남는다
        stack.push({ indent, container: map, key });
      } else {
        map[key] = scalar(value);
      }
    }
  }
  return root;
}
const scalar = (v) =>
  v === 'true' ? true
  : v === 'false' ? false
  : v === 'null' ? null
  : v === '[]' ? []
  : v === '{}' ? {}
  : /^-?\d+$/.test(v) ? Number(v)
  : v.replace(/^(['"])(.*)\1$/, '$2');

// ── 최소 템플릿 렌더러 ──────────────────────────────────────────────────
// templates/*.hbs가 쓰는 문법만 지원:
//   {{!-- 주석 --}}(출력에서 제거) · {{변수}} · {{#each 목록}} … {{{this}}} … {{/each}}
export function render(template, data) {
  let out = template.replace(/\{\{!--[\s\S]*?--\}\}\r?\n?/g, '');
  // 변수 치환을 each 전개보다 먼저 한다 — 삽입된 조각 본문이 템플릿으로 재해석되지
  // 않게(handlebars와 동일: {{{this}}}로 넣은 내용은 재파싱하지 않는다).
  // lookaround는 {{{this}}}가 변수로 오인 매칭되는 것을 막는다.
  out = out.replace(/(?<!\{)\{\{(\w+)\}\}(?!\})/g, (_, key) => {
    if (!(key in data)) throw new Error(`템플릿 변수 {{${key}}}에 값이 없다`);
    return String(data[key]);
  });
  out = out.replace(
    /\{\{#each (\w+)\}\}\r?\n([\s\S]*?)\{\{\/each\}\}\r?\n?/g,
    (_, key, body) => {
      const items = data[key];
      if (!Array.isArray(items)) throw new Error(`템플릿의 {{#each ${key}}}에 해당하는 배열이 없다`);
      return items.map((item) => body.replaceAll('{{{this}}}', item)).join('');
    },
  );
  return out;
}

// ── kit:keep 영역 보존 ──────────────────────────────────────────────────
// 재생성 시, 기존 파일에 같은 이름의 keep 영역이 있으면 그 영역(마커 포함)을 그대로 쓴다.
const KEEP_RE = /<!-- kit:keep:([\w-]+):start -->[\s\S]*?<!-- kit:keep:\1:end -->/g;
export function preserveKeepRegions(next, prev) {
  const saved = new Map();
  for (const m of prev.matchAll(KEEP_RE)) saved.set(m[1], m[0]);
  return next.replace(KEEP_RE, (region, name) => saved.get(name) ?? region);
}

// ── 실행 (직접 실행일 때만 — 테스트는 위 함수들을 import만 한다) ────────
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const args = process.argv.slice(2);
  const outFlag = args.indexOf('--out');
  if (outFlag !== -1 && !args[outFlag + 1]) {
    console.error('중단: --out에 대상 디렉토리 경로가 필요하다.');
    process.exit(1);
  }
  const outDir = resolve(outFlag !== -1 ? args[outFlag + 1] : process.cwd());

  if (outDir === kitRoot) {
    console.error('중단: kit repo 자신에는 생성하지 않는다 — 대상 프로젝트에서 실행하거나 --out <dir>를 지정하라.');
    process.exit(1);
  }

  const manifest = parseYaml(readFileSync(join(kitRoot, 'agent-kit.yml'), 'utf8'));
  const include = manifest.context?.include ?? [];
  const data = {
    project_name: basename(outDir),
    context: include.map((p) => readFileSync(join(kitRoot, p), 'utf8')),
  };

  mkdirSync(outDir, { recursive: true });
  for (const [name, target] of Object.entries(manifest.targets ?? {})) {
    if (!target?.enabled) { console.log(`- ${name}: 건너뜀 (enabled: false)`); continue; }
    if (!target.instructions) { console.log(`- ${name}: 건너뜀 (instructions 미지정)`); continue; }
    const templatePath = join(kitRoot, 'templates', `${basename(target.instructions)}.hbs`);
    if (!existsSync(templatePath)) { console.log(`- ${name}: 건너뜀 (템플릿 없음: ${templatePath})`); continue; }
    let output = render(readFileSync(templatePath, 'utf8'), data);
    const dest = join(outDir, target.instructions);
    if (existsSync(dest)) output = preserveKeepRegions(output, readFileSync(dest, 'utf8'));
    writeFileSync(dest, output);
    console.log(`✓ ${name}: ${target.instructions} 생성`);
  }
}
