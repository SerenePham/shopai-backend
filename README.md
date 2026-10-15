# 🛒 ShopAI Backend API (NestJS + Prisma + JWT + Gemini AI)

Hệ thống Backend phục vụ ứng dụng thương mại điện tử di động **ShopAI (React Native)**. Dự án được xây dựng theo kiến trúc Enterprise chuẩn mực của NestJS (Controller – Service – Module – Repository Pattern), sử dụng **Prisma ORM** với **SQLite**, hệ thống xác thực bảo mật bằng **JWT Authentication & Passport Guard**, tích hợp **Vệ sĩ AI Gemini Proxy** giấu API Key an toàn trên máy chủ, và tự động sinh tài liệu chuẩn quốc tế với **Swagger / OpenAPI**.

---

## 📋 Mục lục
1. [Tính năng cốt lõi](#-tính-năng-cốt-lõi)
2. [Cài đặt & Khởi chạy](#-cài-đặt--khởi-chạy)
3. [Tài liệu API Swagger](#-tài-liệu-api-swagger)
4. [Chi tiết các API chức năng](#-chi-tiết-các-api-chức-năng)
   - [1. Trạng thái hệ thống (Health Check)](#1-trạng-thái-hệ-thống-health-check)
   - [2. Xác thực & Tài khoản (Auth)](#2-xác-thực--tài-khoản-auth)
   - [3. Danh mục sản phẩm (Products)](#3-danh-mục-sản-phẩm-products)
   - [4. Đơn hàng & Thanh toán (Orders)](#4-đơn-hàng--thanh-toán-orders)
   - [5. Trợ lý ảo (AI Chat Proxy)](#5-trợ-lý-ảo-ai-chat-proxy)
5. [Hướng dẫn kiểm thử nhanh bằng cURL](#-hướng-dẫn-kiểm-thử-nhanh-bằng-curl)
6. [Cấu trúc mã nguồn](#-cấu-trúc-mã-nguồn)

---

## 🚀 Tính năng cốt lõi

* **Kiến trúc Enterprise chuẩn**: Tách biệt rõ ràng Controller (Tiếp tân), Service (Nghiệp vụ), Module (Đóng gói) và Repository Pattern (Lưu trữ).
* **Bảo mật dữ liệu đầu vào**: Kích hoạt `ValidationPipe` toàn cục với `class-validator` và `class-transformer` để chặn lọc dữ liệu bẩn và loại bỏ các trường không hợp lệ.
* **Cơ sở dữ liệu bền vững**: Quản lý dữ liệu qua **Prisma ORM (SQLite)**, dữ liệu đơn hàng và tài khoản không bị mất khi restart server.
* **Xác thực JWT thật**: Mật khẩu được mã hóa an toàn bằng **bcrypt** (salt rounds 10), cấp token JWT chứa payload chuẩn (`sub`, `email`), bảo vệ endpoint Orders bằng `JwtAuthGuard`.
* **Chống gian lận đơn hàng (Anti-Tampering)**: Server tự động tra cứu giá thật từ kho dữ liệu và tính lại tổng tiền `serverTotal`. Nếu lệch với giá client gửi lên sẽ ném mã lỗi `400 Bad Request`.
* **Vệ sĩ AI (Gemini Proxy)**: Ẩn hoàn toàn `GEMINI_API_KEY` ở Backend, App di động chỉ gửi tin nhắn lên server qua `/api/ai/chat`.

---

## 🛠 Cài đặt & Khởi chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Cấu hình biến môi trường
Sao chép file cấu hình mẫu và điền các thông số cần thiết:
```bash
cp .env.example .env
```
Nội dung file `.env`:
```env
PORT=3000
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
JWT_SECRET=shopai_jwt_super_secret_key_2026_xyz
JWT_EXPIRES_IN=7d
DATABASE_URL="file:./dev.db"
```

### 3. Đồng bộ Database & Khởi tạo dữ liệu mẫu (Seed)
```bash
# Tạo cấu trúc bảng SQLite và sinh Prisma Client
npx prisma migrate dev --name init

# Nạp tài khoản demo và 20 sản phẩm khởi tạo
npx prisma db seed
```
> **Tài khoản demo mặc định:**
> * Email: `demo@shopai.com`
> * Mật khẩu: `123456`

### 4. Khởi chạy Server
```bash
# Chế độ phát triển (Watch mode - tự động reload khi sửa code)
npm run start:dev

# Chế độ Production
npm run build
npm run start:prod
```
Server sẽ chạy tại: `http://0.0.0.0:3000` (cho phép cả localhost và IP mạng LAN truy cập).

---

## 📖 Tài liệu API Swagger

Tài liệu Swagger UI tương tác trực tiếp được tích hợp sẵn:
* **Đường dẫn truy cập:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
* **Xác thực:** Bạn có thể bấm nút **Authorize** ở góc trên bên phải, nhập `accessToken` nhận được từ API đăng nhập để thử nghiệm trực tiếp các API được bảo vệ (`/api/orders`).

---

## 📡 Chi tiết các API chức năng

### 1. Trạng thái hệ thống (Health Check)
Dùng để kiểm tra xem server có đang hoạt động hay không (phục vụ đèn báo "Server Online" trên App Mobile).

* **`GET /api/health`**
  * **Mô tả:** Kiểm tra kết nối máy chủ.
  * **Headers:** Không yêu cầu.
  * **Response (200 OK):**
    ```json
    {
      "status": "ok",
      "timestamp": "2026-10-15T08:00:00.000Z"
    }
    ```

---

### 2. Xác thực & Tài khoản (Auth)

* **`POST /api/auth/register`**
  * **Mô tả:** Đăng ký tài khoản người dùng mới. Mật khẩu được mã hóa tự động bằng bcrypt trước khi lưu DB.
  * **Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "password123",
      "name": "Nguyễn Văn A"
    }
    ```
  * **Response thành công (201 Created):**
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "uuid-cua-user",
        "email": "user@example.com",
        "name": "Nguyễn Văn A"
      }
    }
    ```
  * **Response lỗi:**
    * `400 Bad Request`: Email sai định dạng, mật khẩu < 6 ký tự.
    * `409 Conflict`: Email đã tồn tại trong hệ thống (`"Email đã được đăng ký"`).

* **`POST /api/auth/login`**
  * **Mô tả:** Đăng nhập bằng email và mật khẩu, trả về `accessToken` JWT.
  * **Body:**
    ```json
    {
      "email": "demo@shopai.com",
      "password": "123456"
    }
    ```
  * **Response thành công (200 OK):**
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "uuid-cua-user",
        "email": "demo@shopai.com",
        "name": "Học viên Demo"
      }
    }
    ```
  * **Response lỗi:**
    * `401 Unauthorized`: `"Email hoặc mật khẩu không đúng"`.

---

### 3. Danh mục sản phẩm (Products)

* **`GET /api/products`**
  * **Mô tả:** Lấy danh sách 20 sản phẩm mẫu (danh mục công nghệ) với ID và giá tiền ổn định.
  * **Response (200 OK):**
    ```json
    [
      {
        "id": "backend_prod_0",
        "name": "Sản phẩm từ NestJS Server 0",
        "price": 1000000,
        "image": "https://picsum.photos/id/200/400/400"
      },
      ...
    ]
    ```

* **`GET /api/products/:id`**
  * **Mô tả:** Lấy thông tin chi tiết của một sản phẩm theo ID.
  * **Response thành công (200 OK):**
    ```json
    {
      "id": "backend_prod_1",
      "name": "Sản phẩm từ NestJS Server 1",
      "price": 1010000,
      "image": "https://picsum.photos/id/201/400/400"
    }
    ```
  * **Response lỗi (404 Not Found):**
    ```json
    {
      "statusCode": 404,
      "message": "Không tìm thấy sản phẩm có id = invalid_id",
      "error": "Not Found"
    }
    ```

* **`POST /api/products`**
  * **Mô tả:** Demo kiểm soát dữ liệu đầu vào thông qua `CreateProductDto`.
  * **Body mẫu:**
    ```json
    {
      "name": "Bàn phím cơ không dây",
      "price": 1500000,
      "image": "https://example.com/keyboard.jpg"
    }
    ```
  * **Response lỗi nếu dữ liệu không hợp lệ (400 Bad Request):**
    ```json
    {
      "statusCode": 400,
      "message": [
        "Tên sản phẩm không được để trống",
        "Giá sản phẩm không được âm",
        "Ảnh sản phẩm phải là một URL hợp lệ"
      ],
      "error": "Bad Request"
    }
    ```

---

### 4. Đơn hàng & Thanh toán (Orders)
> **Lưu ý:** Tất cả các endpoint trong nhóm này đều yêu cầu Header:  
> `Authorization: Bearer <accessToken>`

* **`POST /api/orders`**
  * **Mô tả:** Tạo đơn hàng mới. Server tự tính toán lại tổng tiền dựa trên giá gốc của từng sản phẩm trong kho.
  * **Body:**
    ```json
    {
      "items": [
        { "productId": "backend_prod_0", "quantity": 2 },
        { "productId": "backend_prod_1", "quantity": 1 }
      ],
      "total": 3010000
    }
    ```
  * **Response thành công (201 Created):**
    ```json
    {
      "id": "ORD-1735689600000",
      "userId": "uuid-cua-user",
      "total": 3010000,
      "status": "PENDING",
      "createdAt": "2026-10-15T08:00:00.000Z",
      "items": [
        {
          "id": "item-uuid-1",
          "orderId": "ORD-1735689600000",
          "productId": "backend_prod_0",
          "quantity": 2,
          "price": 1000000
        },
        ...
      ]
    }
    ```
  * **Response lỗi:**
    * `401 Unauthorized`: Chưa truyền token hoặc token không hợp lệ/hết hạn.
    * `400 Bad Request`: Tổng tiền gửi lên không khớp với giá server tính toán (`"Tổng tiền không khớp. Server tính 3010000, Client gửi 1000. Vui lòng tải lại giỏ hàng."`).

* **`GET /api/orders`**
  * **Mô tả:** Lấy danh sách toàn bộ đơn hàng của chính người dùng đang đăng nhập (sắp xếp mới nhất lên đầu).
  * **Response (200 OK):** Danh sách mảng các đơn hàng.

* **`GET /api/orders/:id`**
  * **Mô tả:** Xem chi tiết hóa đơn theo mã đơn hàng `orderId`.
  * **Response (200 OK):** Chi tiết đơn hàng và các mặt hàng trong đơn.
  * **Response lỗi (404 Not Found):** Nếu không tìm thấy đơn hoặc đơn không thuộc về user hiện tại.

* **`POST /api/orders/:id/pay`**
  * **Mô tả:** Giả lập thanh toán đơn hàng, cập nhật trạng thái từ `PENDING` sang `PAID` (Idempotent - gọi nhiều lần khi đã `PAID` không gây lỗi).
  * **Response (200 OK):**
    ```json
    {
      "id": "ORD-1735689600000",
      "status": "PAID",
      ...
    }
    ```

---

### 5. Trợ lý ảo (AI Chat Proxy)

* **`POST /api/ai/chat`**
  * **Mô tả:** Proxy gọi Gemini AI (mô hình `gemini-1.5-flash`) kèm ngữ cảnh lịch sử trò chuyện. Đảm bảo an toàn tuyệt đối không lộ API Key ra ngoài phía Mobile.
  * **Body:**
    ```json
    {
      "message": "Shop có những tai nghe nào tốt dưới 2 triệu?",
      "history": [
        { "role": "user", "text": "Xin chào" },
        { "role": "model", "text": "Chào bạn! Mình có thể giúp gì cho bạn?" }
      ]
    }
    ```
  * **Response (200 OK):**
    ```json
    {
      "reply": "Chào bạn! Dưới 2 triệu bạn có thể tham khảo tai nghe Sony CH520 hoặc Soundpeats Air4 rất tốt nhé."
    }
    ```

---

## 🧪 Hướng dẫn kiểm thử nhanh bằng cURL

### 1. Đăng nhập lấy Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@shopai.com","password":"123456"}'
```

### 2. Đặt hàng kèm Bearer Token
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN_O_BUOC_1>" \
  -d '{"items":[{"productId":"backend_prod_0","quantity":1}],"total":1000000}'
```

### 3. Xem danh sách đơn hàng của bạn
```bash
curl -X GET http://localhost:3000/api/orders \
  -H "Authorization: Bearer <ACCESS_TOKEN_O_BUOC_1>"
```

### 4. Giả lập thanh toán đơn hàng
```bash
curl -X POST http://localhost:3000/api/orders/<ORDER_ID>/pay \
  -H "Authorization: Bearer <ACCESS_TOKEN_O_BUOC_1>"
```

### 5. Hỏi đáp với trợ lý AI
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Tư vấn cho mình chuột công thái học"}'
```

---

## 📂 Cấu trúc mã nguồn

```text
shopai-backend/
├── prisma/
│   ├── dev.db                  # Database SQLite cục bộ (được gitignore)
│   ├── schema.prisma           # Định nghĩa cấu trúc các bảng DB (User, Product, Order, OrderItem)
│   └── seed.ts                 # Script nạp dữ liệu mẫu
├── src/
│   ├── main.ts                 # Entrypoint: Pipe, CORS, Swagger, Helmet, Listen 0.0.0.0
│   ├── app.module.ts           # Root Module liên kết các feature modules
│   ├── health.controller.ts    # API kiểm tra trạng thái sống của Server
│   ├── ai/                     # Module Vệ sĩ AI (Proxy Gemini)
│   │   ├── ai.controller.ts
│   │   ├── ai.module.ts
│   │   └── ai.service.ts
│   ├── auth/                   # Module xác thực người dùng (JWT + Passport)
│   │   ├── dto/                # LoginDto, RegisterDto
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── jwt-auth.guard.ts
│   ├── order/                  # Module quản lý đơn hàng & thanh toán
│   │   ├── dto/                # CreateOrderDto, OrderItemDto
│   │   ├── order.controller.ts
│   │   ├── order.module.ts
│   │   ├── order.repository.ts # Repository Pattern giao tiếp Prisma
│   │   └── order.service.ts    # Tính tiền chống gian lận & xử lý nghiệp vụ
│   ├── prisma/                 # Module kết nối Prisma ORM toàn cục (@Global)
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   └── product/                # Module quản lý sản phẩm
│       ├── dto/                # CreateProductDto
│       ├── product.controller.ts
│       ├── product.module.ts
│       └── product.service.ts
├── .env.example                # File mẫu biến môi trường (cam kết lên Git)
├── package.json
└── tsconfig.json
```
