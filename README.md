# 📝 VocabMemo — AI-Powered English Vocabulary Notebook

VocabMemo là một ứng dụng ghi chú từ vựng tiếng Anh cá nhân hóa thế hệ mới, tích hợp Gemini AI và hệ thống Caching hiệu năng cao. Được thiết kế với giao diện **Glassmorphism** tối giản và hiện đại, VocabMemo hướng tới trải nghiệm học tập và ghi chú siêu tốc (productivity-focused), giúp học viên nhanh chóng lưu lại mọi thuật ngữ, cụm từ hoặc câu tiếng Anh trong quá trình làm việc và học tập.

---

## ✨ Tính Năng Nổi Bật

1. **Hiệu Năng Phản Hồi Siêu Tốc Chuẩn Senior (< 100ms):**
   - **Asynchronous Background Processing:** Tách biệt hoàn toàn luồng ghi nhận dữ liệu chính và luồng xử lý AI. Khi thêm từ mới, Backend lưu bản ghi giữ chỗ tạm thời và phản hồi về client ngay lập tức trong **dưới 100ms** (bao gồm cập nhật chuỗi streak học tập tức thì).
   - **Background Worker:** Gemini AI được gọi xử lý bất đồng bộ dưới nền, tự động phân tích nghĩa, phát âm IPA, ví dụ và cập nhật ngược lại vào database khi hoàn tất mà không chặn luồng xử lý chính.
   - **Emergency Fallback:** Cơ chế chống lỗi bền bỉ tự động áp dụng chế độ dịch nghĩa offline cục bộ (Local Fallback) khi Gemini API gặp sự cố hoặc hết hạn mức, tránh treo màn hình tải vô hạn.

2. **Giao Diện Trải Nghiệm Người Dùng Cao Cấp (Premium UX):**
   - **Khóa ô nhập liệu thông minh:** Thẻ tải lớn nguyên bản ("AI is Analyzing...") hiển thị đè lên thanh nhập liệu trong suốt thời gian AI chạy nền nhờ cơ chế tự động polling nhẹ mỗi 1.5 giây, tự động khôi phục thanh nhập liệu khi hoàn thành.
   - **Timeline Dashboard gọn gàng:** Tự động gom nhóm các từ vựng theo dòng thời gian (*Hôm nay*, *Hôm qua*...) tạo cảm giác như một cuốn sổ tay thực thụ. Chỉ hiển thị các từ đã phân tích hoàn chỉnh dưới danh sách để đảm bảo tính mỹ quan cao nhất.

3. **Cơ chế AI Caching thông minh (VocabCache):**
   - Bộ nhớ đệm MongoDB lưu trữ kết quả phân tích AI dùng chung cho toàn hệ thống.
   - **Lần đầu tiên phân tích (Cache Miss):** Thực hiện phân tích AI ngầm.
   - **Các lần sau (Cache Hit):** Trả dữ liệu lập tức từ cache (tốn `< 50ms`, tiết kiệm **100% chi phí và thời gian gọi Gemini API**).

4. **UK/US Dual Pronunciation:**
   - Cung cấp đồng thời phiên âm IPA giọng Anh-Anh và Anh-Mỹ đi kèm nút loa phát âm TTS độc lập cho từng giọng bản xứ.

---

## 🛠️ Công Nghệ Sử Dụng (MERN Stack)

* **Backend:** Node.js 20 + Express 5 + TypeScript + MongoDB (Mongoose Compound Indexes & Aggregation Pipeline) + Joi + Winston + Gemini AI Node SDK.
* **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v3 + Ant Design v6 + Redux Toolkit & RTK Query Services.

---

## 🚀 Hướng Dẫn Khởi Chạy Dự Án (Local Setup)

### 📌 Yêu cầu hệ thống (Prerequisites)
- **Node.js** v20.x hoặc mới hơn.
- **Yarn** package manager.
- **MongoDB** đang chạy trên máy local tại cổng mặc định `27017` hoặc URL kết nối MongoDB Atlas Cloud.

---

### 📂 Bước 1: Cấu hình và Chạy Backend API Server

1. **Di chuyển vào thư mục backend:**
   ```bash
   cd backend
   ```

2. **Cài đặt các dependencies:**
   ```bash
   yarn install
   ```

3. **Thiết lập biến môi trường (.env):**
   Tạo tệp tin `backend/.env` (được nhân bản từ `.env.example`) và cập nhật khóa API Gemini của bạn:
   ```env
   PORT=5857
   MONGODB_URI=mongodb://127.0.0.1:27017/vocabmemo
   JWT_PRIVATE_KEY=vocabmemo_jwt_secret_key_super_secure_12345
   GEMINI_API_KEY=khóa_gemini_api_key_của_bạn_ở_đây
   FRONTEND_URL=*
   ```
   *(Bạn có thể tạo Gemini API Key miễn phí từ [Google AI Studio](https://aistudio.google.com/)).*

4. **Khởi chạy API Server ở chế độ dev:**
   ```bash
   yarn dev
   ```
   *API Server sẽ khởi chạy tại: **`http://localhost:5857`**.*
   *Kiểm tra sức khỏe hệ thống: **`http://localhost:5857/health`**.*

---

### 📂 Bước 2: Cấu hình và Chạy Frontend React Client

1. **Di chuyển vào thư mục frontend:**
   ```bash
   cd ../frontend
   ```

2. **Cài đặt các dependencies:**
   ```bash
   yarn install
   ```

3. **Khởi chạy Web Client:**
   ```bash
   yarn dev
   ```
   *Vite Web Server sẽ mở tại: **`http://localhost:3001`** (hoặc cổng 3000).*

---

## ☁️ Hướng Dẫn Deploy Lên Cloud (Railway Deployment)

Dự án đã được cấu hình tối ưu để sẵn sàng deploy trực tiếp lên Railway Cloud chỉ trong vài bước.

### 📌 Cấu hình dịch vụ trên Railway:
1. **Thiết lập thư mục gốc (Root Directory):**
   Trong tab **Settings** của dịch vụ trên Railway, đặt **Root Directory** là `backend`. Railway sẽ tự động di chuyển vào đây, chạy lệnh `yarn build` và khởi chạy máy chủ bằng `yarn start`.
2. **Cấu hình các biến môi trường (Variables):**
   Trong tab **Variables** trên Railway, khai báo các khóa sau:
   - `MONGODB_URI`: Chuỗi kết nối cơ sở dữ liệu MongoDB Atlas của bạn.
   - `GEMINI_API_KEY`: API Key của Google Gemini.
   - `JWT_PRIVATE_KEY`: Một chuỗi ký tự bảo mật dài dùng để mã hóa mã đăng nhập JWT.
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: URL chạy thực tế của Frontend sau khi deploy (hoặc `*` để chấp nhận tất cả nguồn).

---

## 🧪 Quy Trình Thử Nghiệm Nhanh (Local)

1. Mở trình duyệt và truy cập `http://localhost:3001`.
2. Đăng ký một tài khoản mới và đăng nhập.
3. Ở trang Dashboard, hãy dán từ **`accountant`** (kế toán) hoặc **`environment`** vào thanh **"Type something in any language..."** ở trên đầu và nhấn nút gửi.
4. Giao diện tải lớn nguyên bản ("AI is Analyzing") xuất hiện khóa ô nhập để bạn thư giãn trong vài giây.
5. Khi tiến trình ngầm hoàn thành, thẻ tải biến mất và thẻ từ vựng mới được hiển thị trọn vẹn trong danh sách timeline hôm nay cực kỳ sinh động!

---
*Chúc bạn có những trải nghiệm học tập và lập trình tuyệt vời cùng VocabMemo!*
