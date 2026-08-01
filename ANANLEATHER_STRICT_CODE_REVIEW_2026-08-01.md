# ANANLEATHER WORKS — STRICT FULL-STACK CODE REVIEW

**Ngày rà soát:** 01/08/2026  
**Phạm vi:** Frontend, Backend, MongoDB schema/query, Docker/Compose, cấu hình, dependency, artifact build và tài liệu vận hành trong workspace local  
**Quy chuẩn:** .huh/SkillFE.md, .huh/SkillBE.md, .huh/code_review.rule.md  
**Hình thức:** Một báo cáo hợp nhất gồm Technical Summary và Critical Risk Report  
**Phán quyết:** **REQUEST CHANGES ❌ — STOP-SHIP / BLOCK MERGE / BLOCK DEPLOY**

> Đây là đánh giá phòng thủ trên dự án/local server do chủ dự án sở hữu. Không truy cập MongoDB, R2 hoặc hệ thống bên ngoài bằng credential tìm thấy. Kiểm chứng khai thác chỉ được thực hiện trên tiến trình local tạm thời.

---

# PHẦN I — TECHNICAL SUMMARY

## 1. Kết luận điều hành

Dự án **chưa đủ điều kiện triển khai, merge hoặc tiếp tục chứa dữ liệu khách hàng thật**. Các vấn đề nghiêm trọng không đứng riêng lẻ mà ghép thành chuỗi tấn công hoàn chỉnh:

1. Người lạ có thể tự đăng ký tài khoản.
2. Backend không có authorization theo role/permission/resource.
3. Frontend lại fail-open và mặc định mọi tài khoản có wildcard permission.
4. Route stream công khai có path traversal trên Windows và đã đọc được file ngoài thư mục upload.
5. Hệ thống chấp nhận URL/path ảnh tùy ý, mở đường SSRF, local-file read và UNC/SMB access qua PDF.
6. Secret đang dùng xuất hiện trong workspace/tài liệu và có thể bị đóng vào Docker image.
7. Schema dữ liệu đã đổi lớn nhưng không có migration; thao tác xóa nhiều collection không có transaction.

Chỉ riêng P0-04 đã đủ để dừng hệ thống public. Khi kết hợp P0-01, P0-02 và P0-05, mức ảnh hưởng có thể mở rộng đến giả mạo token, đọc/sửa/xóa PII, truy cập file local, dò dịch vụ nội bộ và mất dữ liệu.

## 2. Thống kê phạm vi và mức độ

### Phạm vi đã rà

- 88 file TypeScript/TSX/CSS trong frontend/src và backend/src, khoảng 8.998 dòng.
- Backend: 37 file TypeScript, 20 route, 3 model, 6 service, 3 validation.
- Frontend: 28 TSX, 59 TS/TSX tổng hợp; các luồng auth, customer, repair order, dashboard, upload và PDF.
- MongoDB: toàn bộ model và 38 vị trí gọi DB, index runtime, transaction, migration và contract FE/BE.
- Dockerfile, docker-compose.yml, package manifests/lockfiles, env example, env local, README, logs và dist artifact.
- Hai HTML prototype ở root cũng được rà về inline CSS, external asset và hardcode.

### Tổng hợp finding

| Mức độ | Số cụm finding | Ý nghĩa |
|---|---:|---|
| P0 — Critical | 8 | Block deploy/merge ngay |
| P1 — High | 22 | Bắt buộc sửa trước release |
| P2 — Medium | 10 | Nợ kỹ thuật/rủi ro bảo trì đáng kể |
| P3 — Low | 4 | Convention và hygiene |

Số trên là **cụm rủi ro**, không phải số dòng vi phạm. Một cụm có thể chứa nhiều lỗi cùng nguyên nhân hoặc cùng biện pháp khắc phục.

## 3. Scorecard

| Tiêu chí theo form | Điểm /10 | Nhận xét |
|---|---:|---|
| Tính năng / logic | 3.5 | Có nhiều lỗi kỳ báo cáo, trạng thái, ngày tháng, create flow và contract |
| Hiệu suất | 2.5 | Query toàn bộ dữ liệu, refetch liên tục, xử lý ảnh/PDF không giới hạn |
| Bảo mật | 0.5 | Lộ secret, no-auth traversal, self-register, no-authz, SSRF/local read |
| Code Quality | 2.0 | Monolith, any, dead code, inline CSS, lint/test gate hỏng |
| Git / Release Hygiene | 0.5 | Không có metadata Git để xác minh; secret/artifact/lockfile/image hygiene không đạt |
| **Tổng thể** | **1.8 / 10** | **Không được phát hành** |

Điểm theo khu vực:

| Khu vực | Điểm |
|---|---:|
| Frontend | 2.8 / 10 |
| Backend | 2.3 / 10 |
| Database / Infrastructure | 1.4 / 10 |

## 4. Hành động khẩn cấp trong 0–24 giờ

Thứ tự dưới đây là bắt buộc; không nên bắt đầu bằng refactor giao diện:

1. **Tắt public exposure hoặc chặn route stream ngay tại reverse proxy**, sau đó đưa route vào authenticate + authorization.
2. **Rotate toàn bộ credential**: MongoDB, JWT, cookie secret, R2 account/access/secret; revoke session/token hiện tại.
3. **Đóng endpoint đăng ký công khai** và vô hiệu mọi tài khoản bootstrap/default chưa được đổi credential.
4. **Tạm tắt PDF/image resolution từ URL/path tùy ý**; chỉ chấp nhận object key do server sinh.
5. **Snapshot và kiểm kê DB trước mọi deploy tiếp theo**; không chạy schema mới trên dữ liệu hiện hữu khi chưa có migration dry-run và rollback.
6. **Ngăn phát hành Docker image hiện tại**; coi mọi image/layer đã build từ Dockerfile hiện tại là có khả năng chứa secret, logs và source.
7. **Bảo toàn chứng cứ vận hành**: lưu audit log cần thiết ở nơi hạn chế quyền, nhưng không tiếp tục ship logs chứa PII trong image/repo.

## 5. Release gate bắt buộc

Không được chuyển phán quyết sang APPROVED cho đến khi:

- P0 = 0 và P1 = 0.
- Có bằng chứng rotation/revocation, không chỉ sửa README.
- Test hồi quy chứng minh traversal bị chặn trên cả Windows và Linux.
- Backend có authorization default-deny và test resource scope cho từng mutation/read nhạy cảm.
- Migration schema có version, backup, dry-run, reconciliation và rollback đã thử trên bản sao dữ liệu.
- Customer cascade và create customer/order chạy trong transaction.
- DB chỉ lưu image object key ổn định; SSRF/local path bị loại bỏ.
- Lint, typecheck, unit/integration test, dependency audit và clean production build đều chạy từ clean install trong CI.
- Docker runtime image không chứa .env, logs, uploads, source, dev dependency hoặc host node_modules; container chạy non-root.
- Readiness phản ánh kết nối DB và graceful shutdown đã được kiểm chứng.

---

# PHẦN II — CRITICAL RISK REPORT

## P0-01 — Secret thật bị lộ và có thể được đóng vào Docker image

**Bằng chứng**

- D:\Projects\AnanLeather Works\README.md:83-85 chứa Mongo URI và secret ở dạng plaintext.
- D:\Projects\AnanLeather Works\backend\.env:2-10 chứa Mongo/JWT/cookie/R2 credential không phải placeholder.
- So sánh SHA-256 cục bộ, không xuất giá trị secret, xác nhận JWT secret trong README trùng chính xác JWT secret hiện tại trong backend/.env.
- D:\Projects\AnanLeather Works\backend\src\common\config\environment.ts:8-9 có fallback secret đã biết và ứng dụng vẫn chạy khi thiếu env.
- D:\Projects\AnanLeather Works\backend\Dockerfile:6 dùng ADD toàn context; dòng 13 copy toàn builder sang runtime.
- Không có .dockerignore hoặc .gitignore trong snapshot.

**Tác động**

- Có thể giả JWT, truy cập DB/R2, đọc/xóa PII và object.
- Xóa secret khỏi file hiện tại không loại secret khỏi image layer, registry artifact, backup hoặc lịch sử VCS.
- HMAC JWT đang verify mà không pin algorithms/issuer/audience và không bắt buộc expiry cho token đã được tự ký bằng secret lộ.

**Yêu cầu sửa**

- Rotate/revoke ngay tất cả credential và token.
- Xóa fallback secret; startup production phải fail-fast khi thiếu hoặc dùng secret yếu.
- Purge secret khỏi lịch sử VCS, image registry, artifact, cache CI và tài liệu.
- Thêm .dockerignore/.gitignore phù hợp; dùng secret manager hoặc runtime mount.
- JWT phải pin thuật toán, issuer, audience, expiry ngắn; bổ sung tokenVersion/revocation khi cần.

## P0-02 — Public register + không authorization + RBAC frontend fail-open

**Bằng chứng**

- D:\Projects\AnanLeather Works\backend\src\modules\auth\auth.route.ts:10 mở register không cần auth.
- D:\Projects\AnanLeather Works\backend\src\modules\auth\auth.service.ts:56-74 tạo user active và phát token ngay.
- D:\Projects\AnanLeather Works\backend\src\modules\auth\auth.model.ts:4-10 không có role/permission.
- Customer/repair-order routes chỉ dùng authenticate, không có owner/org/tenant/permission guard.
- D:\Projects\AnanLeather Works\frontend\src\hooks\usePermission.ts:8-19 đọc sai response shape, fallback wildcard permission và luôn trả scope all.
- AccessControl không được dùng để bảo vệ action; backend cũng không enforce nên ẩn/hiện nút ở FE không thể là biện pháp bảo mật.

**Tác động**

Người chưa được cấp quyền có thể tự tạo tài khoản rồi đọc toàn bộ PII, upload/export PDF, sửa và xóa customer/order bất kỳ.

**Yêu cầu sửa**

- Đóng register public; dùng invite/admin bootstrap một lần.
- Thiết kế role/permission/resource scope ở backend theo default-deny.
- Mọi query phải lọc ownerId/orgId/tenantId từ security context, không nhận scope từ client.
- FE phải fail-closed khi loading/error/thiếu permissions; bỏ wildcard fallback.
- Viết matrix test anonymous/user/manager/admin cho từng route và từng resource không thuộc scope.

## P0-03 — Tài khoản quản trị mặc định có credential cố định

**Bằng chứng**

- D:\Projects\AnanLeather Works\backend\src\server.ts:18 luôn gọi seed khi startup.
- D:\Projects\AnanLeather Works\backend\src\common\services\seed.service.ts:12-20 hardcode credential quản trị và ghi credential ra log.
- D:\Projects\AnanLeather Works\README.md:116-119 công khai credential bootstrap.

**Tác động**

Mỗi DB trống, restore lỗi hoặc môi trường mới có thể lập tức xuất hiện tài khoản takeover đã biết.

**Yêu cầu sửa**

- Gỡ seed credential khỏi startup production.
- Bootstrap một lần bằng secret ngẫu nhiên ngoài image; bắt đổi mật khẩu và vô hiệu bootstrap sau khi dùng.
- Audit tất cả môi trường/DB từng chạy seed; khóa hoặc xóa tài khoản chưa được đổi.
- Không ghi password/token/secret ra log.

## P0-04 — Path traversal công khai đọc file ngoài thư mục upload trên Windows

**Bằng chứng mã nguồn**

- D:\Projects\AnanLeather Works\backend\src\modules\repair-orders\repairOrder.route.ts:33-36 đặt stream route trước authenticate.
- D:\Projects\AnanLeather Works\backend\src\modules\repair-orders\repairOrder.controller.ts:129-139 chỉ thay dấu slash xuôi, không loại backslash, rồi path.join với input.

**Kiểm chứng local**

- Gửi request vào tiến trình local tạm thời với encoded backslash traversal hướng tới .env.
- Endpoint trả HTTP 200, 623 byte, content-type bị gắn sai là image/jpeg.
- SHA-256 response trùng chính xác file backend/.env; nội dung secret không được xuất trong quá trình báo cáo.
- Không có request tới host bên ngoài.

**Tác động**

Trên máy Windows hiện tại, anonymous user có thể đọc file mà process có quyền truy cập, bao gồm cấu hình và secret. Đây là vulnerability production trực tiếp, không phải giả thuyết.

**Yêu cầu sửa**

- Chặn route ngay, đặt authn/authz trước stream.
- Chỉ nhận immutable object identifier theo allowlist regex; không nhận path.
- Dùng path.resolve, xác minh kết quả nằm bên trong uploads root bằng phép so sánh path đã canonicalize.
- Từ chối slash, backslash, dot-segment, drive letter, UNC prefix và encoded/double-encoded variant.
- Thêm test Windows/Linux cho ..%5C, ..%2F, double encoding, absolute path và symlink/junction.
- Không dùng content-type cố định; lấy metadata do server lưu và thêm nosniff.

## P0-05 — SSRF, local-file read và UNC/SMB access qua image/PDF

**Bằng chứng**

- D:\Projects\AnanLeather Works\backend\src\modules\repair-orders\repairOrder.validation.ts:27-28,41-42 cho image field dạng Joi.any.
- D:\Projects\AnanLeather Works\backend\src\modules\repair-orders\repairOrder.service.ts:192-197,279-287 lưu chuỗi do client gửi.
- D:\Projects\AnanLeather Works\backend\src\common\services\r2.service.ts:126-145 đọc path local; dòng 164-173 fetch URL bất kỳ.
- D:\Projects\AnanLeather Works\backend\src\common\services\pdf.service.ts:39-97 lặp lại local read/fetch; nhiều ảnh được tải đồng thời và buffer.

**Tác động**

- Server có thể bị ép gọi loopback, private network, cloud metadata hoặc host sau redirect/DNS rebinding.
- Windows UNC path có thể gây SMB authentication ra ngoài.
- Response ảnh hợp lệ có thể bị nhúng vào PDF trả lại attacker.
- Response không giới hạn kích thước tạo memory exhaustion.

**Yêu cầu sửa**

- DB chỉ lưu object key do server sinh từ upload đã xác thực và gắn với order.
- Không chấp nhận URL/path tùy ý từ client.
- Nếu nghiệp vụ bắt buộc remote fetch: allowlist hostname/scheme/port; resolve DNS rồi chặn loopback/private/link-local/reserved; kiểm tra lại sau redirect; cap byte, MIME và dimensions; timeout xuyên suốt body; bounded concurrency.
- Tắt UNC/file path và mọi fallback đọc filesystem ngoài upload root.

## P0-06 — Thay đổi schema lớn nhưng không có migration; dist chứa artifact schema cũ

**Bằng chứng**

- D:\Projects\AnanLeather Works\README.md:65-71 và các model cũ trong backend\dist\models mô tả 5 collection, field code/paidAmount/createdBy, trạng thái Đã giao và collections task/image riêng.
- D:\Projects\AnanLeather Works\backend\src\modules\repair-orders\repairOrder.model.ts:6-41 hiện nhúng task/image dạng string và bỏ nhiều field.
- Logs cho thấy code/schema cũ từng chạy.
- Không có migration directory, schema version, backup/restore script, reconciliation hay rollback.
- Build backend không clean dist; còn nhiều JavaScript artifact cũ ngoài cây src hiện tại.

**Tác động**

Task, image, paid amount, audit và trạng thái cũ có thể biến mất khỏi response mới hoặc bị ghi đè sai. Báo cáo tài chính có thể sai mà không phát lỗi.

**Yêu cầu sửa**

- Dừng deploy; snapshot DB và object storage.
- Thống kê/checksum collection, field, status và orphan trước migration.
- Viết migration versioned, idempotent, dry-run, backup, rollback và post-migration reconciliation.
- Chạy trên bản sao dữ liệu trước; sign-off nghiệp vụ cho paidAmount/status/task/image.
- Clean dist trước build và chỉ ship artifact sinh từ source hiện tại.

## P0-07 — Xóa customer/orders không transaction, có thể mất dữ liệu

**Bằng chứng**

- D:\Projects\AnanLeather Works\backend\src\modules\customers\customer.service.ts:98-105 xóa orders trước rồi mới xóa customer.
- Toàn bộ repo không có startSession hoặc withTransaction.
- Service còn đọc toàn bộ orders vào memory nhưng không sử dụng.

**Tác động**

- Bước xóa customer lỗi sau deleteMany làm orders mất nhưng customer còn.
- Order tạo xen giữa hai bước có thể thành orphan.
- Media liên quan không được xóa/reconcile, trái với thông báo xóa toàn bộ dữ liệu.

**Yêu cầu sửa**

- Mongo transaction bắt buộc, truyền session cho mọi query.
- Cân nhắc soft-delete + retention + audit log cho dữ liệu khách hàng.
- Blob cleanup dùng outbox/compensating job; không giả định DB transaction bao trùm object storage.
- Test failure injection tại từng bước và concurrent create/delete.

## P0-08 — Local-upload fallback âm thầm làm mất ảnh khi recreate container

**Bằng chứng**

- D:\Projects\AnanLeather Works\backend\src\common\services\r2.service.ts:14,84-90 tự fallback local nếu thiếu bất kỳ R2 config.
- D:\Projects\AnanLeather Works\backend\docker-compose.yml không mount persistent volume cho uploads/logs.

**Tác động**

API có thể báo upload thành công nhưng image nằm trong writable layer. Restart/redeploy/recreate container có thể xóa vĩnh viễn ảnh khách hàng.

**Yêu cầu sửa**

- Production phải fail-fast nếu object storage không sẵn sàng.
- Nếu local storage là yêu cầu hợp lệ: volume bền vững, backup/restore test, quota và monitoring.
- Readiness phải phản ánh dependency storage cần thiết.

---

# PHẦN III — P1 HIGH FINDINGS

## P1-01 — CORS phản chiếu mọi origin khi bật credentials

**Vị trí:** D:\Projects\AnanLeather Works\backend\src\app.ts:10-15  
**Rủi ro:** Hostile same-site subdomain hoặc cấu hình cookie/bearer thay đổi có thể biến thành cross-origin data access/CSRF.  
**Sửa:** allowlist origin chính xác theo environment, reject Origin null/unknown, CSRF token cho cookie mutation, test preflight.

## P1-02 — Vòng đời auth không nhất quán, JWT bị lưu client-readable

**Vị trí:** frontend\src\contexts\AuthProvider.tsx:20-32; frontend\src\stores\baseApi.ts:7-8,48-79; backend auth service/middleware.  
**Rủi ro:** JWT 7 ngày nằm trong localStorage dù đã có HttpOnly cookie; XSS/supply-chain compromise lấy được token. FE gọi refresh-token endpoint không tồn tại, logout không revocation.  
**Sửa:** chọn một chiến lược cookie HttpOnly + CSRF hoặc bearer ngắn hạn; bỏ token localStorage; triển khai refresh rotation/reuse detection hoặc xóa flow giả; tokenVersion/revoke khi logout/reset.

## P1-03 — Rate limit và chuỗi DoS bộ nhớ/CPU không đủ

**Vị trí:** backend\src\common\middlewares\rateLimiter.middleware.ts:9-44; backend\src\app.ts:16-19; repairOrder.route.ts:20-29; r2.service.ts; pdf.service.ts.  
**Rủi ro:** Map process-local không TTL cleanup, không trust proxy đúng, dễ khóa chung IP hoặc bị bypass; body 20 MB parse trước auth; upload 15 MB chạy Sharp nhiều lần; image array/PDF response không cap.  
**Sửa:** Redis limiter theo IP+identity với TTL, global và resource quota; body limit theo route; streaming, byte/dimension/item cap; bounded concurrency và worker queue cho PDF.

## P1-04 — Validation create/update/query không bảo vệ invariant

**Vị trí:** customer.route.ts:12; customer.service.ts:64-81; repairOrder.validation.ts; phoneUtils.ts.  
**Rủi ro:** Customer PATCH không Joi và thiếu runValidators; tên rỗng/phone rác có thể lưu; phone normalize có thể ra chuỗi vô nghĩa; array/string/amount không max; payload lỗi thường thành 500.  
**Sửa:** schema dùng chung cho create/update; runValidators true; validate E.164/quy tắc VN sau normalize; cap length/count/amount; map CastError/MulterError/Joi/malformed JSON về 4xx.

## P1-05 — Race/orphan khi tạo customer và order

**Vị trí:** backend\src\modules\repair-orders\repairOrder.service.ts:168-224.  
**Rủi ro:** findOne → Customer.create → RepairOrder.create không atomic. Hai request cùng phone có thể duplicate; order fail để lại customer mồ côi.  
**Sửa:** transaction + atomic upsert với setOnInsert; xử lý E11000 bằng reread; idempotency key cho create.

## P1-06 — Lifecycle ảnh không nhất quán, race và orphan object

**Vị trí:** r2.service.ts:67-114,186-203; repairOrder.service.ts:279-287,503-511; CustomerRepairExcelTable.tsx:1145-1192,1406-1451; NewRepairOrderModal.tsx:137-165,192-196.  
**Rủi ro:** main/thumbnail upload không compensation; xóa order/customer không xóa blob; cancel/remove không cleanup; hai upload FE có thể ghi đè state; có luồng lưu object key, luồng khác lưu presigned URL hết hạn. Local resolver còn trả route path không tồn tại.  
**Sửa:** image metadata với pending/committed, stable object key duy nhất, resolver tập trung khi đọc, outbox cleanup/reconciliation, functional state update và bounded concurrency.

## P1-07 — Revenue và kỳ báo cáo sai logic

**Vị trí:** repairOrder.service.ts:35-49,345-377,435-476.  
**Rủi ro:** revenue cộng đơn hủy/chưa hoàn thành; customer group cộng sai trạng thái; thiếu month/year lại trả toàn lịch sử nhưng gắn nhãn tháng hiện tại.  
**Sửa:** định nghĩa doanh thu được nghiệp vụ ký duyệt; validate month/year bắt buộc theo cặp; test status × receivedAt × completedAt × canceledAt ở biên tháng.

## P1-08 — completedAt bị ghi lại và state transition không kiểm soát

**Vị trí:** repairOrder.service.ts:199-208,257-263.  
**Rủi ro:** PATCH lại trạng thái hoàn thành làm đổi lịch sử; create completed dùng receivedAt; mọi transition đều hợp lệ. Báo cáo tháng có thể dịch chuyển khi chỉ chỉnh record.  
**Sửa:** finite-state transition table; chỉ set completedAt khi lần đầu chuyển vào completed; giữ immutable audit; validate transition và optimistic concurrency.

## P1-09 — Timezone FE/BE không nhất quán

**Vị trí:** repairOrder.model.ts:11-16; repairOrder.service.ts:20-45,346-351,400-407; pdf.service.ts:16-20; NewRepairOrderModal.tsx:177-178; CustomerRepairExcelTable.tsx:1333-1435; NewCustomerModal.tsx:22.  
**Rủi ro:** FE toISOString đổi midnight Việt Nam thành ngày UTC trước; BE group dùng Asia/Ho_Chi_Minh nhưng boundary theo timezone process; Alpine thường UTC. Đơn ngày đầu/cuối tháng bị xếp sai kỳ.  
**Sửa:** contract rõ date-only và instant; thư viện timezone dùng chung; TZ runtime; query boundary tạo theo Asia/Ho_Chi_Minh; test 00:00/23:59 và DST-independent VN.

## P1-10 — Raw RegExp, query và pagination không validate/cap

**Vị trí:** repairOrder.service.ts:99-120,353-377; controller.ts:18-23,91-97.  
**Rủi ro:** regex lỗi gây 500, pattern ác ý gây scan/ReDoS; page/limit/month/year/status/customerId không được kiểm soát. Invalid customerId có thể rơi về filter rỗng và trả toàn bộ dữ liệu.  
**Sửa:** Joi cho query, max limit, reject invalid ObjectId, escape regex hoặc dùng text/search index, timeout/budget cho search.

## P1-11 — Query/index không scale

**Vị trí:** repairOrder.service.ts:12-75,345-476; customer.service.ts:28-34; customerApi.ts:10-19; CustomerPage.tsx:17-47.  
**Rủi ro:** dashboard chạy nhiều count tuần tự; không có index phù hợp cho receivedAt/createdAt/status; group tải toàn bộ customer và orders vào RAM; FE tải toàn bộ PII rồi lọc client-side.  
**Sửa:** server-side cursor pagination/projection/lean; gộp dashboard bằng facet/parallel độc lập; thiết kế index dựa explain executionStats; không trả field PII không cần thiết.

## P1-12 — Audit, financial field và FE/BE contract drift

**Vị trí:** repairOrder.service.ts:223; repairOrder.model.ts:6-37; repairOrderApi.ts:6; DashboardPage.tsx:409.  
**Rủi ro:** service truyền createdBy nhưng Mongoose drop vì schema thiếu; FE chờ code trong create response và render order.code nhưng BE hiện không có; totalAmount được client quyết định. Audit và tài chính không đáng tin.  
**Sửa:** version OpenAPI/schema contract; server tính amount từ authoritative inputs; thêm createdBy/updatedBy/version; contract test FE/BE.

## P1-13 — Rules of Hooks làm Dashboard có thể crash trắng

**Vị trí:** D:\Projects\AnanLeather Works\frontend\src\modules\dashboard\pages\DashboardPage.tsx:19-29.  
**Rủi ro:** component return trước hai useState khi data rỗng; khi data đổi empty ↔ non-empty, React báo rendered more/fewer hooks. Không có ErrorBoundary.  
**Sửa:** gọi hook vô điều kiện trước return; thêm component/route ErrorBoundary; regression test transition dữ liệu.

## P1-14 — Lookup phone race có thể gán PII khách A cho khách B

**Vị trí:** NewRepairOrderModal.tsx:94-117.  
**Rủi ro:** chỉ debounce timer, không abort in-flight hoặc đối chiếu phone; response cũ ghi đè form mới; not-found/error không clear fullName/customerNote. State task cũng không reset đầy đủ khi mở phiên mới.  
**Sửa:** AbortController/request-id guard; clear mọi field phụ thuộc ngay khi phone đổi/not-found; reset toàn bộ draft khi modal mở/đóng; test out-of-order response.

## P1-15 — Create flow sai kỳ và API error bị giả thành empty state

**Vị trí:** RepairOrdersPage.tsx:43-53,168-262; NewRepairOrderModal.tsx:76-92; CustomerRepairExcelTable.tsx:1346-1435; CustomerPage.tsx:17-20,204-208.  
**Rủi ro:** selected month/year không được truyền; quick-add dùng receivedAt hôm nay nhưng dueAt theo kỳ đang xem, có thể dueAt < receivedAt; lỗi mạng/500 hiển thị như không có dữ liệu và mời tạo mới.  
**Sửa:** date defaults theo kỳ chọn; validate dueAt >= receivedAt; tách loading/error/empty; chặn mutation từ empty state giả; nút create luôn có vị trí rõ và permission.

## P1-16 — PDF download dùng sai auth/base URL và fallback báo cáo không đầy đủ

**Vị trí:** CustomerRepairExcelTable.tsx:1593-1619.  
**Rủi ro:** code đọc accessToken nhưng login lưu token; gửi Bearer null; hardcode /api thay vì VITE_API_URL; khi group PDF lỗi âm thầm tải PDF order đầu tiên nhưng đặt tên như báo cáo khách hàng. Có thể tạo báo cáo tài chính thiếu dữ liệu mà người dùng không biết.  
**Sửa:** download blob qua base API thống nhất; không tự đọc storage; không fallback semantic khác; lỗi phải hiển thị và audit; integration test same-origin/cross-origin.

## P1-17 — Production bundle đóng cứng localhost

**Vị trí:** frontend\.env:1-2; frontend\src\stores\baseApi.ts:5; frontend\src\configs\axios.ts:4; frontend\vite.config.ts:41.  
**Rủi ro:** bundle hiện chứa http://localhost:5000/api; khi deploy browser gọi máy của người dùng hoặc sai origin.  
**Sửa:** relative same-origin hoặc environment production bắt buộc; fail build khi URL không hợp lệ; không có localhost fallback trong production bundle.

## P1-18 — Autosave gây stale write, full refetch và rerender hàng loạt

**Vị trí:** repairOrderApi.ts:54-64; CustomerRepairExcelTable.tsx:945-948,1084-1105,1317-1344.  
**Rủi ro:** mỗi PATCH invalidates toàn LIST; callback phụ thuộc activeItems nên React.memo gần như vô hiệu; concurrent edit/upload dùng snapshot cũ có thể last-write-wins.  
**Sửa:** optimistic cache update theo entity ID, invalidation mục tiêu, stable handlers, version/If-Match phía BE, debounce/queue theo row, virtualization khi dữ liệu lớn.

## P1-19 — Docker/release/runtime không tái lập và không an toàn

**Vị trí:** backend\Dockerfile; backend\docker-compose.yml; backend\src\app.ts:22; backend\src\server.ts.  
**Rủi ro:** Docker dùng Yarn nhưng backend chỉ có package-lock; ADD context chứa host node_modules/native Sharp; runtime copy toàn builder và chạy root; health luôn 200 dù DB chết; không graceful shutdown.  
**Sửa:** một package manager + frozen clean install; multi-stage chỉ copy dist/production modules; non-root, pinned digest, resource/cap hardening; readiness DB/storage; SIGTERM drain và mongoose disconnect.

## P1-20 — Dependency production có advisory High

**Vị trí:** backend\package-lock.json khóa sharp@0.33.5.  
**Rủi ro:** npm audit --omit=dev báo GHSA-f88m-g3jw-g9cj cho Sharp dưới 0.35 trên chính luồng xử lý ảnh không tin cậy. Frontend audit báo React Router RSC advisory, nhưng app là BrowserRouter SPA không dùng RSC/actions nên hiện chưa coi là exploit path xác nhận.  
**Sửa:** nâng Sharp/libvips lên bản đã vá khi khả dụng, cô lập xử lý ảnh, corpus malformed-image test, dependency scan CI; theo dõi React Router advisory theo đúng execution mode.

## P1-21 — Không có test/lint gate đáng tin cậy

**Bằng chứng**

- Backend không có lint/test script hoặc test file.
- Frontend ESLint fail trước khi lint vì eslint config import plugin không được khai báo.
- 0 test file toàn dự án.
- Lỗi Rules of Hooks đã lọt qua.

**Sửa**

- Clean-install CI bắt buộc: format check → ESLint rules-of-hooks/security → typecheck → unit → integration → migration test → build → dependency/container scan.
- Đặt coverage cho authz, path handling, transaction, reporting, timezone và upload/PDF; không chạy coverage hình thức chỉ trên utility.

## P1-22 — Seed/logging/recovery làm sai trạng thái vận hành

**Vị trí:** seed.service.ts:41-145; logger.ts; backend\logs; app.ts health route.  
**Rủi ro:** seed chạy tuần tự, catch rồi nuốt lỗi nên app vẫn healthy với sample data nửa vời; logs chứa số điện thoại, Atlas hostname, ObjectId và absolute path; logs bị đưa vào Docker context; không có bằng chứng backup/restore drill.  
**Sửa:** seed chỉ explicit ở dev/test, transaction/bulkWrite, lỗi startup phải fail; redact PII/secret/URI, max size và central logging; xác nhận PITR/snapshot bằng restore test có RPO/RTO.

---

# PHẦN IV — P2/P3, CẤU TRÚC, HARDCODE, IMPORT VÀ CSS

## P2-01 — Monolith và sai trách nhiệm

- frontend\src\modules\repair-orders\components\CustomerRepairExcelTable.tsx dài 2.074 dòng, gom table rendering, autosave, touch/zoom DOM, image upload, CRUD, PDF và modal.
- backend\src\common\services\pdf.service.ts khoảng 718 dòng.
- backend repairOrder service khoảng 520 dòng.

**Khuyến nghị:** tách theo use-case và boundary: row editor, autosave queue, image manager, PDF client/service, reporting query, state transition service. Không tách file máy móc nếu dependency vẫn vòng.

## P2-02 — any và type/response contract lỏng

- Khoảng 60 occurrence any ở FE và 51 ở BE.
- Response/pagination không nhất quán; image field dùng Joi.any.

**Khuyến nghị:** unknown + type guard, DTO/schema generated, discriminated union cho status/image, contract test.

## P2-03 — Inline CSS và direct DOM style

**Phát hiện**

- 1 runtime style block tại CustomerRepairExcelTable.tsx:1657-1689, inject global CSS khi render.
- 6 style={...}, 2 AntD style props; một số là dynamic/API hợp lệ nhưng các width/icon tĩnh nên chuyển class.
- Imperative style.zoom tại CustomerRepairExcelTable.tsx:782,791 và direct DOM listeners làm component khó kiểm soát.
- Hai HTML prototype ở root chứa style block rất lớn.

**Đánh giá nghiêm ngặt**

- Runtime style block và style tĩnh lặp lại: **vi phạm** quy chuẩn separation/design token.
- Dynamic width/zoom và AntD API style prop: không tự động là lỗi, nhưng phải được cô lập trong hook/component và có fallback tương thích.

**Khuyến nghị:** CSS module/global stylesheet có scope, design tokens, semantic classes; custom hook cho pinch/zoom; tránh inject global style trong component.

## P2-04 — Hardcode UI, business và environment

- 208 mã màu / 71 màu unique trong FE TS/TSX; màu thương hiệu lặp lại thay vì token.
- Year options chỉ 2025–2027 tại RepairOrdersPage.tsx:156-160 và CustomerRepairExcelTable.tsx:1762-1766.
- Có localhost fallback trong nhiều config.
- PDF hardcode font path Windows, hotline, website, địa điểm, fallback name và cách tạo mã chứng từ.
- Giá/preset/status text xuất hiện trực tiếp ở nhiều nơi.

**Khuyến nghị:** environment schema, design token, business config có version, enum/status contract chung, year range sinh từ current/data, PDF branding config theo tenant.

## P2-05 — Tailwind class không tồn tại

Build không sinh selector cho 44 occurrence gồm shadow-2xs, shadow-xs, bg-cream-50, active:scale-98 và margin-0. UI tưởng đã có style nhưng thực tế bị bỏ qua.

**Khuyến nghị:** dùng class hợp lệ theo Tailwind version hoặc khai báo theme/plugin có test snapshot.

## P2-06 — Accessibility không đạt

- frontend\index.html:5 vô hiệu zoom bằng maximum-scale=1,user-scalable=no.
- Nhiều div/span click không role/tabIndex/keyboard handler.
- Chart chủ yếu chỉ hỗ trợ mouse.

**Khuyến nghị:** semantic button/link, keyboard/focus/ARIA, cho phép zoom, axe/Lighthouse gate và test screen reader cho flow chính.

## P2-07 — Bundle và rendering quá nặng

- Initial preload khoảng 1,52 MB raw / 467 KB gzip trước route chunk.
- manualChunks tạo circular vendor ↔ react-vendor; chunkSizeWarningLimit 1000 che budget mặc định.
- Customer page vừa tải toàn bộ dữ liệu vừa giữ nhiều DOM/component nặng.

**Khuyến nghị:** đo per-route budget, bỏ manual split quá rộng, route/component lazy đúng điểm, pagination/virtualization, bundle analyzer trong CI.

## P2-08 — Error handling và hardening HTTP thiếu

- Không map tốt CastError, MulterError, malformed JSON/regex.
- Thiếu security headers/CSP/HSTS/nosniff và compression có kiểm soát.
- Stream content-type cố định.

**Khuyến nghị:** error taxonomy thống nhất, request ID, structured safe error, Helmet/CSP theo deployment, MIME metadata và nosniff.

## P2-09 — Duplicate index và autoIndex production

User và Customer khai báo cùng unique index hai lần; runtime schema.indexes xác nhận duplicate specs. Mongoose không tắt autoIndex production.

**Khuyến nghị:** giữ một explicit named index, quản lý qua migration, tắt autoIndex production và kiểm tra conflict trước deploy.

## P2-10 — Luồng tạo phiếu và form validation khó sử dụng

- NewRepairOrderModal chỉ có entry rõ trong empty state; khi đã có customer group, create flow toàn cục bị ẩn.
- Customer create/update validation khác nhau; DOB không dễ clear; lỗi form bị nhận diện sai.

**Khuyến nghị:** một create flow nhất quán, schema form dùng chung, mutation feedback rõ và permission guard.

## P3-01 — Inline/dynamic import

**Kết quả quan trọng:** không phát hiện inline import sai vị trí trong FE hoặc BE.

- 6 dynamic import đều nằm ở route-level React.lazy trong AppRouter: phù hợp code splitting.
- Không có import nằm giữa declaration hoặc trong function theo mẫu bị cấm.
- Backend có một cross-module relative import tại customer.service.ts:3, lệch quy ước alias của SkillBE.
- FE có alias @/* trong tsconfig dù SkillFE ưu tiên relative import; chưa thấy lạm dụng trong source.

Không nên tạo finding giả cho React.lazy chỉ vì nó dùng import().

## P3-02 — Format/convention không đạt

- Prettier fail 50/50 file FE và 13 file BE được kiểm tra.
- Phần lớn FE dùng LF trong khi config yêu cầu CRLF; 155 dòng FE dài hơn 120 ký tự.
- Backend .prettierrc dùng tabWidth 2, lệch SkillBE yêu cầu 4.

**Khuyến nghị:** thống nhất config thực tế có thể duy trì; format một commit riêng; CI check không auto-rewrite.

## P3-03 — Package/dependency hygiene

- FE có cả yarn.lock và package-lock.json.
- Backend Docker dùng Yarn nhưng repo chỉ có package-lock.
- Có direct import dayjs nhưng không khai báo direct dependency; một số axios/socket/crypto/icon/class utility có dấu hiệu dead/unused.

**Khuyến nghị:** chọn một package manager đúng chuẩn dự án, clean install, loại dead dependency và khai báo mọi direct import.

## P3-04 — Prototype/static artifact ở root

Phieu_Sua_Chua_AnanLeather_Works.html và Phieu_Sua_Chua_Luxury_Atelier.html có style block hàng trăm dòng, Google Fonts/Unsplash external asset và dữ liệu mẫu giống PII. Nếu chỉ là prototype thì không phải runtime finding, nhưng không nên ship trong production image/public root.

---

# PHẦN V — MA TRẬN THEO YÊU CẦU REVIEW

| Hạng mục người yêu cầu | Kết luận |
|---|---|
| Bảo mật | **Không đạt nghiêm trọng:** secret, traversal, SSRF/local read, self-register, no authz, default credential, CORS/token |
| Hiệu năng | **Không đạt:** all-data query, thiếu pagination/index, full refetch/autosave, PDF/image memory, bundle lớn |
| Lỗi runtime | **Không đạt:** conditional hooks, route resolver sai, refresh endpoint không tồn tại, quality gate hỏng |
| Lỗi logic | **Không đạt:** revenue, period, completedAt, timezone, create flow, PDF fallback, image reference |
| Hardcode | **Không đạt:** secret fallback, credential seed, localhost, year, colors, PDF branding/font/path/status |
| Cấu trúc sai | **Không đạt:** monolith, service quá lớn, contract drift, no migration/test/CI, Docker copy-all |
| Inline import | **Đạt có điều kiện:** không có inline import sai; 6 React.lazy import là hợp lệ |
| Inline CSS | **Không đạt:** runtime style block, static inline styles, imperative DOM style; dynamic style được đánh giá theo ngữ cảnh |
| DB integrity | **Không đạt nghiêm trọng:** không transaction/migration/restore evidence, schema drift, orphan blob |
| Release hygiene | **Không đạt:** secret/artifact trong context, mixed lockfile, stale dist, non-root/readiness thiếu |

---

# PHẦN VI — KẾT QUẢ KIỂM CHỨNG

| Kiểm tra | Kết quả |
|---|---|
| Frontend TypeScript --noEmit | PASS |
| Backend TypeScript --noEmit/build | PASS |
| Frontend direct Vite production build | PASS, nhưng cảnh báo circular chunk và bundle lớn |
| Frontend ESLint | FAIL trước khi lint do thiếu plugin/config dependency |
| Backend lint | FAIL / không có script |
| Frontend/Backend tests | FAIL / không có script hoặc test file; tổng cộng 0 test |
| Frontend Prettier | FAIL 50 file |
| Backend Prettier | FAIL 13 file |
| npm audit backend production | 1 High: Sharp |
| npm audit frontend production | React Router advisory được ghi nhận; execution mode SPA làm giảm tính áp dụng trực tiếp |
| docker compose config --quiet | PASS, có warning version obsolete |
| Docker build/run | Chưa kiểm chứng: Docker daemon local không hoạt động |
| Path traversal local regression probe | Vulnerable, HTTP 200; response hash trùng backend/.env |
| External DB/R2 access | Không thực hiện |

Typecheck/build PASS chỉ chứng minh mã biên dịch; không phủ định lỗi authorization, logic, transaction, runtime hook hoặc security.

---

# PHẦN VII — LỘ TRÌNH KHẮC PHỤC

## Giai đoạn A — Containment, 0–24 giờ

- Chặn public route stream và public register.
- Rotate/revoke tất cả secret/token.
- Vô hiệu default admin/bootstrap.
- Tắt URL/path image resolution và PDF remote fetch.
- Snapshot DB/object inventory; đóng băng deploy và image hiện tại.

## Giai đoạn B — Security/data repair, 1–3 ngày

- Authz default-deny + resource scope backend.
- Canonical object-key-only image model.
- Transaction create/cascade; soft-delete/audit/outbox.
- Fix traversal bằng allowlist + canonical containment.
- CORS/CSRF/token strategy; remove localStorage token.
- Migration inventory/dry-run/reconciliation.

## Giai đoạn C — Correctness/reliability, 1–2 tuần

- Chuẩn hóa timezone/date contract và state machine.
- Sửa revenue/report/period/completedAt.
- Sửa FE hook crash, phone lookup race, empty/error state, PDF download, image state.
- Query validation, pagination, projection, explain-driven indexes.
- Cleanup Docker, readiness, graceful shutdown, log redaction.

## Giai đoạn D — Maintainability/performance, 2–6 tuần

- Tách monolith FE/BE theo use-case.
- Optimistic cache và concurrency/versioning.
- Design token/CSS module, accessibility, bundle budget.
- OpenAPI/DTO contract, unit/integration/e2e.
- CI clean-install gates, dependency/container/secret scanning.
- Backup/restore drill và migration runbook.

---

# PHẦN VIII — LỜI KHUYÊN ƯU TIÊN

1. **Đừng “vá UI permission” trước backend authz.** Mọi quyền quan trọng phải được enforce ở server/query layer.
2. **Đừng chỉ đổi secret trong .env.** Credential đã xuất hiện trong tài liệu và có thể trong image/lịch sử; phải rotate và purge artifact.
3. **Đừng deploy schema mới để “xem có chạy không”.** Phải migration trên bản sao dữ liệu, có checksum và rollback.
4. **Đừng cho PDF tự tải URL/path do client gửi.** Object key do server sinh là boundary đúng.
5. **Đừng tối ưu bằng index theo cảm giác.** Sửa query/pagination trước, sau đó dùng explain executionStats để thiết kế index.
6. **Đừng refactor file 2.074 dòng trong cùng commit sửa P0.** Tách security/data hotfix, migration và refactor thành các thay đổi độc lập có test.
7. **Không coi build xanh là release xanh.** Dự án hiện biên dịch được nhưng vẫn có vulnerability xác minh trực tiếp và nhiều lỗi logic production.

---

# PHẦN IX — GIỚI HẠN VÀ ĐỘ TIN CẬY

- Workspace không có thư mục .git, nên không thể đối chiếu branch/MR diff, tác giả commit, lịch sử secret hoặc xác minh file từng được push.
- Không truy cập DB/R2 thật; không thể xác nhận dữ liệu thực tế, permission cloud, backup Atlas/PITR, bucket policy hoặc secret còn hiệu lực ở provider.
- Docker daemon không chạy nên chưa kiểm chứng image runtime/layer bằng container thực.
- Dependency audit truy vấn registry/advisory hiện hành, không truy cập hệ thống mục tiêu.
- Hai HTML root được xem là artifact/prototype trừ khi chủ dự án xác nhận chúng được publish.

Mọi P0 trong báo cáo dựa trên code path xác định; riêng path traversal đã được tái hiện trên local Windows. Các rủi ro cloud/registry/history được ghi rõ là phạm vi cần điều tra tiếp, không được trình bày như sự cố đã xác nhận.

---

**Phán quyết cuối:** **REQUEST CHANGES ❌**  
**Điều kiện hiện tại:** **Không merge, không deploy, không expose Internet, không nhập thêm dữ liệu khách hàng thật.**
