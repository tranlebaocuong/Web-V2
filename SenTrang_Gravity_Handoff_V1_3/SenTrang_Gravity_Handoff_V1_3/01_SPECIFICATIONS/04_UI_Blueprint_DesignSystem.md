# SEN TRẮNG — UI Implementation Blueprint V1.3

## 1. Design direction AC

**A + C:** hiện đại, tối giản, giao diện thư viện học tập. Ưu tiên trải nghiệm Huynh trưởng tìm bài nhanh và đọc bài thoải mái. Giữ cảm hứng hoa sen/áo Lam tinh tế, **không** dùng hình/logo chính thức chưa được cung cấp làm asset giả.

### Design tokens

| Token | Giá trị |
|---|---|
| primary | `#176B4A` |
| secondary | `#345E88` |
| background | `#F8F7F2` |
| surface | `#FFFFFF` |
| accent | `#D4AD69` |
| ink | `#24352E` |
| font family | Be Vietnam Pro, system sans fallback |
| max container | 1200 px |
| max reader | 740 px |
| header desktop/mobile | 72/60 px |
| spacing | 4, 8, 12, 16, 24, 32, 48 px |
| card radius/button radius | 16/12 px |
| hit target | >=44×44 px |
| desktop / tablet / mobile | >=1024 / 768-1023 / <768 px |
| QA viewports | 1440 / 834 / 390 px |

Typography: H1 36/27 px desktop/mobile; H2 28/23; H3 21/19; app body 16/15; lesson body 18/17 with line-height ~1.75; caption 13/12. Text contrast must pass accessible checks; tokens are base palette, not permission to use every color on every background.

### Shared components

`GlobalHeader`, `MobileNav`, `Footer`, `SearchBar`, `Breadcrumb`, `LevelCard`, `CategoryCard`, `LessonCard`, `FilterPanel`, `ReaderTOC`, `ReaderToolbar`, `SourceInfo`, `Pagination`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `AdminSidebar`, `LessonEditor`, `MediaPicker`, `ConfirmDialog`, `Toast`.

Reusable states: default, hover, focus-visible, disabled when relevant, loading, empty and error. 150–250 ms subtle animations, honor reduced motion.

## 2. UI-01 — Trang chủ `/`

**Desktop 1440**: max1200 container; 72px header, logo on left, navigation right; hero above fold with heading, short description and centered SearchBar max700 px; four LevelCard row; explanatory section and footer. **Mobile 390**: 60px header; logo/menu; hero short, search full width; two-column level cards; vertical footer.

Interactions: Enter / Search submit `q` to `/tim-kiem?q=...`; clicking any level navigates to level. Empty search displays suggestion UI or asks for term, not a blank result query.

## 3. UI-02 — Ngành Đồng `/thu-vien/nganh-dong`

Intro + four LevelCard in Master Data order (32/38/41/45 catalog entries, not necessarily published count). Desktop 4 columns, mobile 2 with one-column fallback. Card entire click target. Do not fake learning progress.

## 4. UI-03 — Bậc `/thu-vien/nganh-dong/[level]`

Level selector + title + four cards: `Tổng quan`, `Phật pháp`, `Hoạt động Thanh niên`, `Văn nghệ`. `Tổng quan` aggregates from the 3 real categories; no 4th DB category. Desktop 4 columns, tablet/mobile 2. Switching level synchronously updates title and associated content; route is canonical source of state.

## 5. UI-04 — Danh sách bài `/thu-vien/nganh-dong/[level]/[category]`

Desktop: 240px sidebar (other categories) + main list; heading/category count, local filter by title, lesson cards sorted `sequence`, optional pagination. Mobile: filters collapsed, list in one column, tap target full card. Empty state supports clearing filter. Public only published lessons; catalog counts must specify whether counting all vs published.

## 6. UI-05 — Chi tiết bài `/bai-hoc/[slug]`

Desktop: sticky TOC left, reading width ≤740; breadcrumb, H1 title, source metadata, article content, previous/next, copy-link. Mobile: one reading column, TOC in accessible drawer, toolbar near heading. Reader font size 15–23 px, default desktop18/mobile17; white/paper modes (`#FFFFFF`/`#F5F0E4`). Persist reader preferences in local browser (not account). Reader TOC generated from article headings; sticky header must not obscure anchored heading. Responsive images preserve aspect ratio and have alt. **No public PDF view or download.**

## 7. UI-06 — Tìm kiếm `/tim-kiem?q=...`

Desktop: left filter sidebar and ranked search results; mobile: filter drawer. Search accent-insensitive, sort title-first, label each result by level/category. Query and filter state reflected in URL for share/back navigation. No-result suggestion + clear filters. If no verified summary, show title and category without fabricated descriptions.

## 8. UI-07 — Admin `/admin`

Desktop ~240px nav sidebar and data table; mobile drawer and card rows. Dashboard counts; lessons (create/edit/draft/publish/hide), media, sources, site settings. Lesson form: title, level, category, sequence, source, slug, content-block editor, images, preview, save, publish. Rich text allowed: headings, paragraphs, lists, emphasis and images; reject arbitrary HTML/style overrides. Unsaved changes guard, autosave optional and not required. API response confirmation before toast success; `409` conflict dialogue.

## 9. Routes and navigation

| Screen | Route |
|---|---|
| UI-01 Home | `/` |
| UI-02 Branch | `/thu-vien/nganh-dong` |
| UI-03 Level | `/thu-vien/nganh-dong/[level]` |
| UI-04 Category lesson listing | `/thu-vien/nganh-dong/[level]/[category]` |
| UI-05 Lesson reader | `/bai-hoc/[slug]` |
| UI-06 Search | `/tim-kiem` |
| UI-07 Admin | `/admin` |

Secondary informational page `/gioi-thieu` may reuse public layout. Auth library may define additional internal auth routes.

## 10. A11y / technical fidelity

Tab and screenreader semantics, correct input labels, aria-expanded for drawers, escape to close, logical headings, visible focus, alt images, no color-only signal; keyboard navigation for all actions. Test layout 390, 834 and 1440, long Vietnamese headings, empty and error states. Use server render for public lesson SEO, optimize images and keep dynamic editor admin-only.

## 11. UI handoff boundaries

Wireframes are descriptive blueprints, **not** approved pixel-perfect Figma screens or final logo artwork. Gravity should implement this design system consistently and should not fabricate branding assets, copyrighted images or official GĐPT insignia. Ask for approved logo/graphics if needed; until then use a neutral text + simple abstract mark.
