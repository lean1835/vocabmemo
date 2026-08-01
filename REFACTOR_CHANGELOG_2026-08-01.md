# ANANLEATHER WORKS — REFACTOR & HARDENING CHANGELOG

**Ngày thực hiện:** 01/08/2026  
**Nguồn đối chiếu:** `ANANLEATHER_STRICT_CODE_REVIEW_2026-08-01.md`  
**Phạm vi:** frontend, backend, contract API, MongoDB access, image/PDF storage, Docker, dependency và CI  
**Nguyên tắc:** sửa theo hướng phòng thủ; giữ nguyên mục đích website và dữ liệu hiện hữu; không truy cập hay thử nghiệm trên hệ thống bên ngoài.

Workspace không có metadata `.git`, nên phần “bản cũ” được đối chiếu với bằng chứng/baseline đã chụp trong strict review, không phải diff commit có thể truy ngược lịch sử.

## 1. Kết luận hiện tại

Các đường lỗi nguy hiểm có thể sửa ở source đã được đóng: đăng ký công khai, route ảnh không auth, path traversal, SSRF/local-file read, quyền fail-open, token client-readable, create/cascade không transaction, stale dist, CORS phản chiếu, production localhost, PDF fallback sai và lifecycle ảnh gây orphan/xóa nhầm.

Website vẫn giữ đúng luồng nghiệp vụ cũ:

- Nhân sự nội bộ đăng nhập.
- Quản lý khách hàng theo số điện thoại.
- Tạo, sửa, theo dõi và xóa phiếu sửa chữa.
- Quản lý ảnh trước/sau sửa.
- Xem dashboard theo trạng thái/kỳ.
- Xuất PDF theo phiếu hoặc theo khách hàng.

Không có migration, drop/rename collection hoặc đổi tên field. `users`, `customers`, `repairorders` và schema Customer/RepairOrder hiện hữu vẫn là nguồn dữ liệu chuẩn.

Phán quyết release vẫn là **CONDITIONAL / CHƯA ĐƯỢC TỰ ĐỘNG COI LÀ APPROVED**, vì các việc vận hành không thể chứng minh chỉ bằng local source vẫn còn: rotate/revoke credential thật, test bản sao MongoDB/R2, backup-restore drill, Render native smoke test và browser E2E. Docker không thuộc release gate vì target deploy thực tế là Render native.

## 2. So sánh tổng quan bản cũ và bản hiện tại

| Hạng mục | Bản cũ theo strict review | Bản hiện tại |
|---|---|---|
| Auth | JWT trả cho JS, lưu localStorage, refresh giả, bearer/cookie trộn lẫn | Cookie ký `HttpOnly`, `SameSite=Strict`, cookie-only cho web; JSON không chứa JWT; `/auth/me` là nguồn phiên |
| Đăng ký | Public self-register và tự phát token | Chỉ bootstrap DB trống bằng token one-time; mặc định đóng |
| Authorization | Route nhạy cảm thiếu authz; FE fail-open | Backend capability default-deny trên từng route; FE render action/menu theo permission, anonymous deny |
| CORS/CSRF | Phản chiếu origin khi credentials bật | Exact allowlist, reject hostile Origin, cookie Strict và credentialed same-origin |
| Ảnh | Public stream, traversal, URL/path tùy ý, SSRF/local/UNC read | Stream bắt buộc auth+capability; chỉ canonical object key/trusted legacy reference; decode/re-encode ảnh; giới hạn kích thước |
| Lifecycle ảnh | Orphan, cleanup race, có thể xóa blob dùng chung | Cleanup ảnh tạm; rollback upload; chỉ xóa khi không còn phiếu tham chiếu; concurrency tối đa 4 |
| Customer + order | Có thể tạo customer nhưng lỗi order để lại dữ liệu nửa vời | MongoDB transaction nguyên tử, không fallback standalone |
| Cascade delete | Xóa customer/orders không transaction | Transaction; cleanup blob sau khi kiểm tra reference còn lại |
| Date/report | UTC/local trộn lẫn, kỳ/revenue/completedAt sai | Date-only theo `Asia/Ho_Chi_Minh`; due >= received; revenue và completedAt có quy tắc ổn định |
| FE reliability | Conditional hook, stale lookup PII, API error giả empty | Hook hợp lệ; abort/sequence lookup; loading/error/empty tách biệt; Error Boundary |
| PDF | Raw fetch/Bearer sai, hardcode `/api`, fallback báo cáo thiếu | RTK Query + cookie/base URL; lỗi được báo; không fallback sai; font Unicode portable |
| Autosave | Stale write và full refetch mỗi ô | Cache optimistic, queue/rollback có kiểm soát; không reload toàn customer group mỗi ô |
| CSS/theme | Runtime `<style>`, class Tailwind không tồn tại, màu lặp | Không runtime style block; không invalid Tailwind class đã biết; brand token tập trung; chỉ giữ style zoom động |
| Package/release | npm/Yarn trộn, lint hỏng, không test/CI | npm + lockfile duy nhất; format/type/lint/test/build/audit scripts; CI có clean install |
| Docker | Copy-all, có nguy cơ mang `.env`/log/source, chạy root | Multi-stage, `.dockerignore`, production deps + dist, non-root, read-only, cap drop, resource limit, readiness |
| Mongo indexes | Duplicate unique index, autoIndex production | Một named unique index/business key; `autoIndex: false` ở production |

## 3. Luồng nghiệp vụ sau refactor

### 3.1 Đăng nhập và phân quyền

```text
Login form
  -> POST /api/auth/login
  -> rate limit theo IP + username
  -> kiểm tra user active/password
  -> server đặt signed HttpOnly cookie
  -> response chỉ trả public user, không trả JWT
  -> GET /api/auth/me
  -> backend gắn capability
  -> FE render route/menu/action theo capability
```

Khác bản cũ: browser không còn đọc/lưu/gửi bearer token. Route backend tự kiểm tra quyền; ẩn nút trên FE chỉ là lớp UX, không phải lớp bảo mật chính.

### 3.2 Tạo khách hàng và phiếu sửa chữa

```text
Nhập phone
  -> debounce + hủy lookup cũ
  -> lấy đúng customer hiện tại hoặc chuẩn bị customer mới
  -> upload/re-encode ảnh tạm
  -> validate date/amount/list/image key
  -> MongoDB transaction: upsert/find customer + create repair order
  -> commit
  -> FE cập nhật kết quả
```

Nếu upload hoặc create thất bại, FE gọi cleanup object tạm. Nếu transaction lỗi, không để lại customer/order nửa vời. DB phải là Atlas/replica set như README; không có fallback làm mất tính nguyên tử.

### 3.3 Sửa/xóa phiếu và ảnh

```text
Sửa phiếu
  -> validate patch whitelist
  -> lưu order
  -> so sánh image key cũ/mới
  -> kiểm tra toàn bộ RepairOrder còn tham chiếu
  -> chỉ xóa blob không còn reference

Xóa customer
  -> transaction xóa orders + customer
  -> sau commit, cleanup từng blob có bounded concurrency
  -> giữ blob nếu order khác vẫn tham chiếu
```

Khác bản cũ: URL legacy hợp lệ vẫn đọc được để không phá dữ liệu cũ, nhưng record mới lưu object key ổn định. URL ngoài allowlist, `file:`, UNC, data URL, traversal và extension không hợp lệ bị từ chối.

### 3.4 Báo cáo và PDF

```text
Chọn tháng + năm
  -> FE giữ đúng kỳ đang xem
  -> BE đổi sang biên ngày Việt Nam
  -> query/report theo kỳ
  -> PDF lấy ảnh bằng object key nội bộ
  -> font: env override -> DejaVu Linux -> Windows fallback
  -> trả PDF authenticated, không fallback sang tài liệu khác
```

## 4. Chi tiết chỉnh sửa theo batch

### Batch 1 — Backend security và data integrity

#### 1.1 Auth/bootstrap/capability

**File chính:** `auth.controller.ts`, `auth.service.ts`, `auth.route.ts`, `auth.validation.ts`, `auth.middleware.ts`, `bootstrap.middleware.ts`, `capability.middleware.ts`, `capabilities.ts`, `seed.service.ts`.

- Cũ: public register, default seed có credential cố định, token trả cho JS, route thiếu authorization.
- Mới: bootstrap one-time mặc định tắt; dev seed opt-in; JWT pin HS256/issuer/audience/expiry; signed HttpOnly Strict cookie; không trả token JSON; từng route yêu cầu capability cụ thể.
- Khắc phục: P0-02, P0-03, phần code của P0-01, P1-02 và authorization fail-open.
- Tương thích: mọi user active hiện hữu được map thành `internal_staff`; không thêm role field vào DB vì schema hiện tại được yêu cầu giữ nguyên.

#### 1.2 CORS, rate limit, input và error surface

**File chính:** `app.ts`, `environment.ts`, `rateLimiter.middleware.ts`, `validate.middleware.ts`, các file `*.validation.ts`, `error.middleware.ts`, `phoneUtils.ts`.

- Cũ: credentialed CORS phản chiếu origin; limiter một bucket dễ bypass/memory growth; body/query/params lỏng; raw RegExp.
- Mới: allowlist exact origin; production bắt buộc HTTPS origin; limiter IP + account, TTL và hard cap; body 2 MB; Joi whitelist/limit; phone normalize; regex escape; safe security headers.
- Khắc phục: P1-01, P1-03, P1-04, P1-10 và phần P2-08.
- Tương thích: response thành công chính giữ nguyên; input không hợp lệ trước đây bị chấp nhận nay trả lỗi 4xx rõ ràng.

#### 1.3 Image/storage/PDF boundary

**File chính:** `r2.service.ts`, `imageCleanup.service.ts`, `pdf.service.ts`, `pdfFont.ts`, repair-order route/controller/service.

- Cũ: public path stream; path traversal Windows; arbitrary URL/local/UNC fetch; MIME dựa client; orphan/xóa nhầm ảnh; font PDF phụ thuộc Windows.
- Mới: auth stream; canonical key; trusted legacy resolver; Sharp decode/re-encode + pixel/byte/count limit; partial upload rollback; reference-aware cleanup; Unicode font resolver portable.
- Khắc phục: P0-04, P0-05, P0-08, P1-06 và hardcode font P2-04.
- Tương thích: URL legacy thuộc API/R2 domain cấu hình vẫn được normalize; dữ liệu mới dùng object key.

#### 1.4 Transaction và report correctness

**File chính:** `repairOrder.service.ts`, `customer.service.ts`, `timezone.ts`, repair-order/customer controllers.

- Cũ: create/cascade có partial state; dueAt có thể trước receivedAt; revenue/kỳ/completedAt sai.
- Mới: transaction bắt buộc; date-only Việt Nam; completedAt chỉ tạo khi chuyển sang hoàn thành và không bị ghi lại vô cớ; amount/status/list được validate; mutation có safe audit metadata, không log PII/value.
- Khắc phục: P0-07, P1-05, P1-07, phần P1-08, P1-09 và P1-12.
- Tương thích: không đổi collection/field; `totalAmount`, `tasks`, `replacementMaterials`, status tiếng Việt giữ nguyên ý nghĩa.

#### 1.5 Runtime/index/build hygiene

**File chính:** `server.ts`, các model, `package.json`, `tsconfig.json`.

- Cũ: health không phản ánh DB; shutdown không graceful; duplicate index; production auto index; stale dist model.
- Mới: `/live` và DB readiness `/health`; graceful shutdown; named index duy nhất; production tắt autoIndex; clean-before-build và số JS build khớp source TS.
- Khắc phục: P0-06 artifact drift, P1-19/P1-22 runtime và P2-09.
- Tương thích: không tự tạo/drop/rebuild index production; operator phải kiểm tra index hiện hữu trước deploy.

### Batch 2 — Frontend reliability, auth và business flow

#### 2.1 Session/permission/error handling

**File chính:** `baseApi.ts`, `authApi.ts`, `AuthProvider.tsx`, `authContext.ts`, `usePermission.ts`, `permissionPolicy.ts`, `AccessControl.tsx`, router/layout/ErrorBoundary.

- Cũ: localStorage token, refresh giả, Bearer `null`, permission fail-open, lỗi render có thể trắng trang.
- Mới: cookie session + `/auth/me`; cleanup token legacy nhưng không đọc/gửi lại; permission exact/default-deny; Error Boundary; API 401 làm invalidation phiên đúng ngữ cảnh; local FE gọi `/api` qua Vite proxy để cookie Strict luôn cùng site.
- Khắc phục: P1-02 và phần FE của P0-02/P1-16.

#### 2.2 Form/date/create flow

**File chính:** `NewRepairOrderModal.tsx`, `RepairOrdersPage.tsx`, `dateUtils.ts`, `formUtils.ts`, customer forms.

- Cũ: conditional hook; phone race giữ PII cũ; hardcode year 2025–2027; create sai kỳ; due < received; form helper dùng `any`.
- Mới: hook luôn gọi đúng thứ tự; abort + sequence lookup; reset dependent state; dynamic year options; date-only; một nút tạo phiếu luôn khả dụng theo quyền; helper generic/unknown.
- Khắc phục: P1-13, P1-14, P1-15, P2-04 và P2-10.

#### 2.3 Image/PDF/autosave/cache

**File chính:** `repairOrderApi.ts`, `CustomerRepairExcelTable.tsx`, `imageReference.ts`, `imageUtils.ts`.

- Cũ: lưu URL không ổn định; raw PDF fetch sai auth/base URL; fallback tài liệu sai; full refetch sau mỗi cell; upload failure để orphan.
- Mới: objectKey contract; authenticated stream; typed upload response; PDF RTK Query; optimistic cache/rollback; cleanup upload tạm; loading/error/empty riêng.
- Khắc phục: P1-06, P1-16, P1-18 và contract drift P1-12.

#### 2.4 CSS/theme/a11y/bundle/dependency

**File chính:** Tailwind config, `index.css`, `theme.ts`, theme provider, dashboard/chart, status/UI components, `vite.config.ts`, package manifests.

- Cũ: runtime style injection, invalid Tailwind selectors, Google Font request, brand colors lặp, zoom bị khóa, circular/manual chunk và dependency chết.
- Mới: design tokens; runtime `<style>` = 0; invalid class đã biết = 0; system font; viewport cho phép zoom; chart có semantic/keyboard support; route chunks không circular warning; dead axios/socket/crypto/class/icon dependencies được gỡ.
- Khắc phục: P2-03, P2-04, P2-05, phần P2-06/P2-07 và P3-03.
- Tương thích: một inline `style={{ zoom }}` động còn giữ vì đó là giá trị runtime phục vụ thao tác bảng, không phải CSS tĩnh/hardcode.

### Batch 3 — Infrastructure, dependency và release gates

#### 3.1 npm, formatting và CI

**File chính:** `package.json`, lockfiles, ESLint/Prettier config, `.github/workflows/ci.yml`.

- Cũ: npm/Yarn trộn; Docker dùng package manager khác; ESLint không chạy; 0 test; format fail diện rộng.
- Mới: npm duy nhất; `npm ci`; clean/typecheck/lint/test/format/audit/build scripts; CI pin action commit + Node 24.18; backend/frontend/container jobs.
- Khắc phục: P1-21, P3-02 và P3-03.

#### 3.2 Container/repository hygiene

**File chính:** `.gitignore`, `.dockerignore`, `Dockerfile`, `docker-compose.yml`, README và env examples.

- Cũ: copy toàn context; có thể ship `.env`, log, upload, source/dev deps; chạy root; health giả; local upload dễ mất.
- Mới: multi-stage/digest-pinned image; chỉ production deps + dist; non-root; read-only; no-new-privileges; drop capabilities; volume/limit/health; R2 bắt buộc production; secrets chỉ qua env runtime.
- Khắc phục: P0-01 containment, P0-08, P1-19 và P3-04 release context.
- Prototype HTML ở root được giữ làm tài liệu người dùng nhưng không nằm trong backend Docker context/runtime.

### Batch 4 — Regression và verification

**Backend regression:** traversal/SSRF/local read, trusted legacy image, shared-image cleanup/concurrency, timezone date-only, anonymous stream, bootstrap register, hostile Origin, cookie không lộ JWT, bearer-only bị từ chối, duplicate index.

**Frontend contract regression:** date-only, permission default-deny/legacy mapping và object-key image resolution.

Kết quả cuối được ghi tại mục 6 sau khi chạy lại suite trên source đã hợp nhất.

## 5. Đối chiếu finding của bản review

| Nhóm | Trạng thái hiện tại | Ghi chú |
|---|---|---|
| P0-01 secret | **Code containment xong / vận hành còn mở** | `.env` bị ignore và loại Docker; vẫn phải rotate Mongo/JWT/cookie/R2 thật và revoke session ngoài source |
| P0-02 register/authz | **Đã sửa** | Bootstrap đóng mặc định; route capability default-deny |
| P0-03 default admin | **Đã sửa** | Seed opt-in dev, không password mặc định trong source/README |
| P0-04 traversal | **Đã sửa + test** | Stream authenticated, canonical key only |
| P0-05 SSRF/local/UNC | **Đã sửa + test** | Không fetch/read arbitrary reference |
| P0-06 schema/dist drift | **Đã khép phần source** | Không đổi schema; clean build loại stale artifacts; không cần migration cho refactor này |
| P0-07 transaction | **Đã sửa** | Create và customer cascade dùng Mongo transaction |
| P0-08 ephemeral image | **Đã sửa cho production** | Production bắt buộc R2; local upload chỉ development |
| P1 auth/CORS/validation/date/PDF/FE | **Đã sửa phần code** | Có regression gate cho các contract trọng yếu |
| P1-08 transition policy | **Một phần** | completedAt đúng; UI vẫn cho phép nhân sự sửa status để bảo toàn quy trình hiệu chỉnh cũ |
| P1-11 query scale | **Còn nợ có chủ đích** | Customer spreadsheet vẫn cần toàn bộ group; chưa pagination/virtualization vì thiếu E2E và quy tắc UX dữ liệu lớn |
| P1-20 FE advisory | **Gate có ngoại lệ hẹp** | RSC advisory chỉ allowlist khi app vẫn là BrowserRouter SPA, không dùng RSC; phải nâng major trước khi bật RSC |
| P1-22 recovery | **Vận hành còn mở** | Source có readiness/shutdown; backup/PITR/restore drill cần làm trên hạ tầng thật |
| P2-01 monolith | **Còn một phần** | image cleanup/font/contract đã tách; bảng spreadsheet và PDF service vẫn lớn, cần browser E2E trước khi chia tiếp |
| P2-02 any/contract | **Đã khép explicit any** | Explicit TypeScript `any` = 0 ở FE/BE; 10 token chữ `any` backend còn lại chỉ là key message Joi `any.required`; boundary động dùng `unknown` + guard |
| P2-03 inline CSS | **Đạt có điều kiện** | Runtime/static inline CSS đã bỏ; chỉ giữ zoom động hợp lệ |
| P2-04 hardcode | **Cải thiện mạnh** | Mã màu FE TS/TSX 208 → 7 và cả 7 nằm trong một token object; year/env/business/font/status palette đã tập trung |
| P2-05 invalid Tailwind | **Đã sửa** | Không còn các class bị review nêu |
| P2-06 accessibility | **Cải thiện, chưa chứng nhận** | Zoom/semantic/chart keyboard sửa; chưa chạy axe/screen reader E2E |
| P2-07 bundle | **Cải thiện** | Không circular warning, largest chunk dưới default warning; chưa có browser performance budget theo dữ liệu lớn |
| P2-08 HTTP/error | **Cải thiện** | Safe error/header/readiness/MIME; CSP/TLS tiếp tục cấu hình ở reverse proxy |
| P2-09 indexes | **Đã sửa + test** | Named index duy nhất, autoIndex production off |
| P2-10 create UX | **Đã sửa** | Create action nhất quán và validation rõ |
| P3-01 inline import | **Giữ nguyên đạt** | React.lazy route imports là hợp lệ |
| P3-02/P3-03 | **Đã sửa** | Format gate và dependency/package-manager hygiene |
| P3-04 prototypes | **Cô lập khỏi runtime** | Không xóa tài liệu người dùng, không ship trong backend image |

## 6. Kết quả kiểm chứng cuối

> Số liệu dưới đây được cập nhật sau lượt verification cuối; không thay thế kiểm thử Atlas/R2/Docker/browser thật.

| Gate | Kết quả |
|---|---|
| Backend format | PASS — Prettier |
| Backend typecheck + lint | PASS — 0 error/warning |
| Backend regression | PASS — 11/11 |
| Backend clean build | PASS — 41 source `.ts` / 41 built `.js`, không stale model |
| Backend production audit | PASS — 0 vulnerability |
| Frontend format | PASS — Prettier |
| Frontend typecheck + lint | PASS — 0 error/warning |
| Frontend contract regression | PASS — 3/3 |
| Frontend production build | PASS — 3.071 modules; largest chunk 450,60 kB raw / 147,08 kB gzip; không circular/chunk warning; 0 local API reference trong dist |
| Frontend production audit policy | PASS — không advisory High/Critical ngoài ngoại lệ RSC được scope rõ |
| Dependency tree | PASS — `npm ls --depth=0` sạch ở FE và BE |
| Static debt scan | PASS có ghi chú — explicit `any` 0; runtime style 0; invalid Tailwind 0; token read/write 0; fixed year 0; inline style động 1 |
| Secret containment scan | PASS phần source — 6 secret đang cấu hình không xuất hiện trong first-party source/docs/config được scan |
| Environment validation | PASS cho development, không in secret |
| PDF Unicode smoke | PASS |
| Docker Compose config | PASS; Docker CLI cảnh báo không đọc được user config trong sandbox nhưng exit code 0 |
| Docker image/runtime smoke | N/A cho release — target deploy là Render native; Docker chỉ là tùy chọn |
| Render native smoke | NOT RUN — chưa có URL/service runtime trong workspace |
| MongoDB Atlas/R2 integration | NOT RUN — không dùng credential/hạ tầng thật trong lượt phòng thủ này |
| Browser E2E/axe | NOT RUN — chưa có harness/fixture dữ liệu an toàn |

## 7. Việc bắt buộc trước production

1. Rotate MongoDB, JWT, cookie và R2 credentials từng xuất hiện trong workspace/history; revoke session/token cũ.
2. Snapshot DB, kiểm tra named indexes trên bản sao, chạy transaction/integration và reconciliation trước deploy.
3. Bật backup/PITR rồi thực hiện restore drill; ghi RPO/RTO và người chịu trách nhiệm.
4. Deploy Render native bằng locked build/start commands; smoke-test `/health`, cookie login, CRUD, ảnh và PDF trên URL thật.
5. Chạy browser E2E cho login, customer CRUD, create/update/delete order, upload/remove shared image, PDF và timezone/kỳ.
6. Chạy axe/Lighthouse/screen-reader và test bảng với tập dữ liệu lớn trước khi tách/virtualize monolith.
7. Khi nghiệp vụ chấp nhận thay đổi DB, thêm role/capability hoặc session-version có versioned migration; hiện tại mọi user active được coi là nhân sự nội bộ để giữ DB đúng như yêu cầu.

## 8. Lời khuyên kỹ thuật tiếp theo

- Ưu tiên E2E + fixture/snapshot DB trước khi tách tiếp `CustomerRepairExcelTable`; file lớn là nợ thật nhưng tách mù có thể tạo regression dữ liệu.
- Tách reporting query/PDF layout thành use-case nhỏ sau khi có golden PDF test.
- Nếu chạy nhiều backend instance, chuyển login limiter/audit/session revocation sang Redis hoặc gateway tập trung.
- Thêm pagination/virtualization theo customer group với UX rõ; không tự ý cắt dữ liệu báo cáo.
- Không nâng React Router/RSC hoặc gỡ audit exception nếu chưa kiểm chứng breaking change; ngoại lệ hiện tại chỉ dành cho SPA không RSC.
