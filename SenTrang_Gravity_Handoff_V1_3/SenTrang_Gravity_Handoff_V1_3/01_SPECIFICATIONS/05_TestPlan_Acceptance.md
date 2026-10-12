# SEN TRẮNG — Acceptance Test Plan V1.3

## A. Import và toàn vẹn dữ liệu

- **DATA-01** Import counts = 1 branch, 4 levels, 3 categories, 4 sources, 156 lessons, 156 raw groups.
- **DATA-02** 156 lesson IDs unique; correct exact category ID `hoat-dong-thanh-nien`.
- **DATA-03** Correct distribution by level 32/38/41/45, by categories 54/75/27.
- **DATA-04** Every lesson FK resolves to a valid source, level and category and matching branch/level.
- **DATA-05** Run importer twice; zero duplicates; no reset of manually edited article content.
- **DATA-06** All imported lessons remain DRAFT and not publicly accessible by ID/slug.
- **DATA-07** Import/preview acknowledges raw may contain adjacent article text and missing figures.

## B. User journeys

- **UI-01** Home→Mở Mắt→Phật pháp→list, expected correct level/category.
- **UI-02** Switch to Chân Cứng, content/category counts update, URL consistent.
- **UI-03** Search `hoa sen`, see relevant published results; search `hoa sen` without accent also works against accented titles.
- **UI-04** Filter to level and category; clear filters; empty state.
- **UI-05** Reader displays structured headings/paragraphs/image in order; TOC anchor works.
- **UI-06** Font increase to 23px does not overflow 390px screen; paper mode persists locally.
- **UI-07** Previous/next is correct within same level/category among published lessons.
- **UI-08** Copy-link yields canonical lesson URL. Nonexistent slug yields 404.
- **UI-09** Mobile menu opens and closes via Escape; keyboard focus visible.

## C. Admin and security

- **SEC-01** Public cannot fetch raw contents, drafts, images from private storage or admin API.
- **SEC-02** Unauthenticated mutation returns 401, insufficient role 403.
- **SEC-03** Upload disallowed MIME/oversize → 413/415 or well-defined validation error.
- **SEC-04** Rich text containing scripts/unsafe HTML rejected or safely normalized.
- **SEC-05** Draft→ready→published makes article public only after valid content.
- **SEC-06** Publish without reviewed content/images fails validation.
- **SEC-07** Two stale edit sessions: second save gets HTTP 409; first edit preserved.
- **SEC-08** Hide published article removes public/search access after cache refresh.
- **SEC-09** No links to PDF document download/view in public UI or public API.

## D. Nonfunctional quality

- **NFR-01** Viewports 390, 834, 1440: no unintended horizontal scroll.
- **NFR-02** Text and controls meet contrast/accessibility checks; image alt and labels present.
- **NFR-03** Site map excludes draft/hidden and admin.
- **NFR-04** SEO HTML includes meaningful title, canonical, metadata where available.
- **NFR-05** Observe p75 CWV targets LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 after deploy with field data; lab test beforehand and report any gaps.
- **NFR-06** Verify backup/restore approach and logging excludes secrets and lesson draft data leaks.

## E. Definition of done

No release until P0 functional tests, DATA-01..07, SEC-01..09 and mobile usability pass. Public launch additionally depends on right-to-republish confirmation by owner for internal-print materials. This test plan is a **specification**, not an assertion that implementation tests already ran.
