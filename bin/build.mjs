#!/usr/bin/env node
// bin/build.mjs — agent-kit.yml을 읽어 공통 원본을 도구별 완성 패키지로 dist/에 생성한다.
//
// 패키지 배포 모델 (DESIGN.md 결정 로그 2026-07-13):
//   - 이 스크립트는 kit 밖(사용자 프로젝트)에 아무것도 쓰지 않는다 — 산출물은 <kit>/dist 뿐.
//   - 설치·업데이트는 사용자가 dist 내용을 프로젝트에 직접 복사한다(전체 교체 권장).
//   - 부분 업데이트·병합·보존(kit:keep)은 지원하지 않는다 — 프로젝트 수정분은 git으로 관리.
//
// 의존성 없음: YAML 파서와 템플릿 렌더러 모두 아래의 최소 구현을 쓴다.
//
// 사용법:
//   node bin/build.mjs                  # dist/ 에 default profile로 생성
//   node bin/build.mjs --profile node   # agent-kit.yml에 등록된 profile로 생성
//
// 테스트: node --test bin/build.test.mjs  (파서·렌더러·profile 해석·패키지 생성)

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, cpSync, copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── 최소 YAML 파서 ──────────────────────────────────────────────────────
// agent-kit.yml·profiles/*.yml이 쓰는 부분집합만 지원: 들여쓰기 중첩 맵,
// 스칼라 리스트('- '), 주석(#), 인라인 []·{}, 블록 스칼라(|).
// 앵커·list-of-maps 등은 미지원 — manifest가 그 문법을 쓰게 되면 함께 확장한다.
// 값 안의 ' # '는 주석으로 잘리므로 manifest 값에 #을 쓰지 않는다(블록 스칼라 안은 예외 — 원문 보존).
export function parseYaml(src) {
  const lines = src.split('\n');
  const root = {};
  const stack = [{ indent: -1, container: root, key: null }];
  const node = (frame, kind) => {
    if (frame.key === null) return frame.container;
    frame.container[frame.key] ??= kind === 'list' ? [] : {};
    return frame.container[frame.key];
  };
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
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
      if (value === '|') {
        // 블록 스칼라: 더 깊이 들여쓴 줄들을 원문 그대로(주석 포함) 모아 문자열로.
        const body = [];
        let blockIndent = null;
        while (i + 1 < lines.length) {
          const next = lines[i + 1];
          if (next.trim()) {
            const ni = next.match(/^ */)[0].length;
            if (ni <= indent) break;
            blockIndent ??= ni;
          }
          body.push(lines[++i]);
        }
        while (body.length && !body[body.length - 1].trim()) body.pop();
        map[key] = body.length
          ? body.map((l) => l.slice(blockIndent)).join('\n') + '\n'
          : '';
      } else if (value === '') {
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

// ── 패키지 생성 ─────────────────────────────────────────────────────────
// manifest의 enabled 된 target마다, 그 target이 선언한 위치(프로젝트 루트 기준
// 상대경로)로 instructions 렌더 + skills·hooks·settings 복사. 반환값은 쓴 파일 목록.
const DEFAULT_COMMANDS = '# 프로젝트 명령어를 여기에 기록한다 (빌드 / 테스트 / 린트 등)';

export function build({ kitRoot, outDir, profile = 'default', version = 'unknown' }) {
  const manifest = parseYaml(readFileSync(join(kitRoot, 'agent-kit.yml'), 'utf8'));

  // profile 해석: 등록된 것만 선택 가능, 생략 필드 = 전역 상속, 명시 = 통째 교체.
  const profilePath = manifest.profiles?.[profile];
  if (!profilePath) throw new Error(`등록되지 않은 profile: "${profile}" — agent-kit.yml의 profiles: 목록 참조`);
  const preset = parseYaml(readFileSync(join(kitRoot, profilePath), 'utf8'));
  const contextInclude = preset.context ?? manifest.context?.include ?? [];
  const skillsInclude = preset.skills ?? manifest.skills?.include ?? [];
  const commands = (preset.commands ?? DEFAULT_COMMANDS).trimEnd();

  const data = {
    kit_version: version,
    commands,
    context: contextInclude.map((p) => readFileSync(join(kitRoot, p), 'utf8')),
  };

  const written = [];
  const emit = (rel, write) => {
    const dest = join(outDir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    write(dest);
    written.push(rel);
  };

  for (const target of Object.values(manifest.targets ?? {})) {
    if (!target?.enabled) continue;
    if (target.instructions) {
      const templatePath = join(kitRoot, 'templates', `${basename(target.instructions)}.hbs`);
      if (!existsSync(templatePath)) throw new Error(`템플릿 없음: ${templatePath}`);
      const template = readFileSync(templatePath, 'utf8');
      emit(target.instructions, (dest) => writeFileSync(dest, render(template, data)));
    }
    if (target.skills_dir) {
      for (const skill of skillsInclude) {
        emit(join(target.skills_dir, basename(skill)), (dest) =>
          cpSync(join(kitRoot, skill), dest, { recursive: true }));
      }
    }
    if (target.hooks_dir) {
      for (const hook of manifest.hooks ?? []) {
        emit(join(target.hooks_dir, basename(hook)), (dest) => copyFileSync(join(kitRoot, hook), dest));
      }
    }
    if (target.settings) {
      // settings 원본은 templates/<파일명> (예: templates/settings.json — Claude 배선+권한)
      emit(target.settings, (dest) => copyFileSync(join(kitRoot, 'templates', basename(target.settings)), dest));
    }
  }
  return written;
}

// ── 실행 (직접 실행일 때만 — 테스트는 위 함수들을 import만 한다) ────────
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const args = process.argv.slice(2);
  const profileFlag = args.indexOf('--profile');
  if (profileFlag !== -1 && !args[profileFlag + 1]) {
    console.error('중단: --profile에 profile 이름이 필요하다 (예: --profile node).');
    process.exit(1);
  }
  const profile = profileFlag !== -1 ? args[profileFlag + 1] : 'default';

  let version = 'unknown';
  try {
    version = execSync('git describe --tags --always --dirty', {
      cwd: kitRoot, stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
  } catch { /* git 없이 받은 사본 등 — 스탬프만 unknown으로 남긴다 */ }

  // dist/는 kit 소유 산출물 — 이전 빌드 잔재가 남지 않게 통째로 재생성한다.
  const outDir = join(kitRoot, 'dist');
  rmSync(outDir, { recursive: true, force: true });

  const written = build({ kitRoot, outDir, profile, version });
  console.log(`my-agents-kit ${version} → dist/ (profile: ${profile}, 파일 ${written.length}개)`);
  for (const rel of written) console.log(`  ${rel}`);
  console.log('\n설치: 대상 프로젝트 루트에서 아래를 실행 (기존 동명 파일은 덮어쓴다 — git diff로 확인·복원)');
  console.log(`  cp -r '${outDir}/.' .`);
}
