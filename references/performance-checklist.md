# Performance Checklist

> **Scope:** 웹 프론트엔드 중심 (Core Web Vitals, 번들 최적화 등). 백엔드 섹션(DB, API, 인프라)은 범용으로 사용 가능하다.

Quick reference checklist for web application performance. Use alongside `skills/code-review-and-quality.md` (Performance axis).

## Core Web Vitals Targets

| Metric | Good | Needs Work | Poor |
|--------|------|------------|------|
| LCP (Largest Contentful Paint) | <= 2.5s | <= 4.0s | > 4.0s |
| INP (Interaction to Next Paint) | <= 200ms | <= 500ms | > 500ms |
| CLS (Cumulative Layout Shift) | <= 0.1 | <= 0.25 | > 0.25 |

## Frontend Checklist

### Images
- [ ] Modern formats (WebP, AVIF)
- [ ] Responsive sizes (`srcset` and `sizes`)
- [ ] Explicit `width` and `height` (prevents CLS)
- [ ] Below-fold: `loading="lazy"`
- [ ] Hero/LCP: `fetchpriority="high"`, no lazy

### JavaScript
- [ ] Bundle < 200KB gzipped (initial load)
- [ ] Code splitting with dynamic `import()`
- [ ] Tree shaking enabled
- [ ] No blocking JS in `<head>` (use `defer`/`async`)
- [ ] `React.memo()` on expensive components
- [ ] `useMemo()`/`useCallback()` only where profiling shows benefit

### CSS
- [ ] Critical CSS inlined or preloaded
- [ ] No render-blocking CSS for non-critical styles
- [ ] Font display: `swap` or `optional`

### Network
- [ ] Static assets: long `max-age` + content hashing
- [ ] API responses cached where appropriate
- [ ] HTTP/2 or HTTP/3 enabled
- [ ] Preconnect for known origins
- [ ] No unnecessary redirects

### Rendering
- [ ] No layout thrashing
- [ ] Animations: `transform` and `opacity` (GPU)
- [ ] Long lists: virtualization (`react-window`)
- [ ] No unnecessary full-page re-renders

## Backend Checklist

### Database
- [ ] No N+1 query patterns
- [ ] Appropriate indexes
- [ ] List endpoints paginated
- [ ] Connection pooling configured
- [ ] Slow query logging enabled

### API
- [ ] Response times < 200ms (p95)
- [ ] No synchronous heavy computation in handlers
- [ ] Bulk operations instead of loops
- [ ] Response compression (gzip/brotli)
- [ ] Appropriate caching (in-memory, Redis, CDN)

### Infrastructure
- [ ] CDN for static assets
- [ ] Server close to users (or edge)
- [ ] Health check endpoint

## Measurement Commands

```bash
# Lighthouse
npx lighthouse http://localhost:3000 --output json --output-path ./lh.json

# Bundle analysis
npx webpack-bundle-analyzer stats.json
# or Vite:
npx vite-bundle-visualizer
```

```javascript
// Web Vitals in code
import { onLCP, onINP, onCLS } from 'web-vitals';
onLCP(console.log);
onINP(console.log);
onCLS(console.log);
```

## Common Anti-Patterns

| Anti-Pattern | Impact | Fix |
|---|---|---|
| N+1 queries | Linear DB load growth | Joins, includes, batch loading |
| Unbounded queries | Memory exhaustion | Always paginate, add LIMIT |
| Missing indexes | Slow reads | Index filtered/sorted columns |
| Layout thrashing | Jank, dropped frames | Batch DOM reads, then writes |
| Unoptimized images | Slow LCP | WebP, responsive, lazy load |
| Large bundles | Slow TTI | Code split, tree shake |
| Blocking main thread | Poor INP | Web Workers, defer work |
| Memory leaks | Growing memory | Clean up listeners, intervals |
