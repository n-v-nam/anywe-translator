# Anywe Translator

Ứng dụng dịch nhanh cho macOS bằng Electron JS
Có thể dịch nhanh chóng ở mọi ứng dụng khác bằng các hiện Popup ngay tại ứng dụng đó, thay cho việc chuyển tab qua lại (ChatGPT hoặc Google Dịch)
Dịch văn bản nhanh chóng và chính xác bằng OpenAI API.

## ✨ Tính năng

### 🌐 Dịch thuật
- **Dịch nhanh bằng phím tắt**: Copy text và bấm `Cmd+Option+T` để dịch ngay
- **Tự động nhận diện ngôn ngữ**: App tự động phát hiện ngôn ngữ nguồn
- **Đa ngôn ngữ**: Hỗ trợ dịch sang Vietnamese, English, Japanese
- **Hai chế độ dịch**:
  - **Dịch nghĩa** (mặc định): Dịch nhanh, ngắn gọn
  - **Dịch chi tiết**: Dịch kèm giải thích ngữ pháp, cụm từ và ghi chú sử dụng
- **Chọn model AI**: 
  - `gpt-4.1-nano`: Nhanh, tiết kiệm
  - `gpt-4.1-mini`: Chính xác hơn

### 🔊 Text-to-Speech
- **Đọc văn bản**: Đọc cả text gốc và bản dịch
- **Tùy chỉnh giọng đọc**: Chọn voice, tốc độ, pitch, volume cho từng ngôn ngữ
- **Nghe thử**: Test giọng đọc với text mẫu trước khi sử dụng

### 🎨 Giao diện
- **UI hiện đại**: Thiết kế glassmorphism, phù hợp với macOS
- **Popup thông minh**: Hiển thị gần con trỏ chuột, không làm gián đoạn công việc
- **Hiển thị trên fullscreen**: Popup có thể hiển thị trên các ứng dụng fullscreen
- **Resizable window**: Có thể điều chỉnh kích thước cửa sổ
- **Điều chỉnh độ trong suốt**: Tùy chỉnh opacity từ 30% đến 100%

### ⚙️ Cài đặt
- **Launch at startup**: Tự động khởi động cùng macOS
- **Chạy ở background**: Ẩn khỏi dock, chỉ hiển thị icon trên menu bar
- **Lưu preferences**: Tự động lưu các cài đặt (model, ngôn ngữ, voice, opacity...)

## 🚀 Cài đặt

### Yêu cầu
- macOS >= 12 (Monterey)
- Node.js >= 18
- OpenAI API Key

### Cài đặt từ source

1. **Clone repository**
```bash
git clone <repository-url>
cd cris-translator/mac-translator
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Cấu hình API Key**
Tạo file `.env` trong thư mục `mac-translator`:
```env
OPENAI_API_KEY=your_api_key_here
```

4. **Chạy app**
```bash
npm start
```

### Build app

```bash
npm run build
```

File `.dmg` sẽ được tạo trong thư mục `dist/`.

## 📖 Hướng dẫn sử dụng

### Dịch nhanh

1. **Copy text** cần dịch vào clipboard (`Cmd+C`)
2. **Bấm phím tắt** `Cmd+Option+T`
3. Popup sẽ hiển thị với text đã được ghi vào input field
4. App tự động dịch và hiển thị kết quả

### Dịch thủ công

1. Click vào **icon trên menu bar** → chọn "Show Dialog"
2. Nhập hoặc paste text vào ô Input
3. Chọn chế độ dịch (Dịch nghĩa / Dịch chi tiết)
4. Click nút **Translate** hoặc bấm `Cmd+Enter`

### Sử dụng Text-to-Speech

1. Sau khi có text (gốc hoặc dịch), click nút **🔊** bên cạnh
2. App sẽ đọc text bằng giọng đã cấu hình
3. Click lại để dừng

### Cài đặt Voice

1. Click nút **⚙** (Settings) trên header
2. Mở phần **Voice Settings**
3. Chọn ngôn ngữ cần cấu hình
4. Tùy chỉnh:
   - **Voice**: Chọn giọng đọc
   - **Speed**: Tốc độ đọc (0.5x - 2.0x)
   - **Pitch**: Độ cao giọng (0.5 - 2.0)
   - **Volume**: Âm lượng (10% - 100%)
5. Click **▶** để nghe thử
6. Cài đặt được lưu tự động

## ⌨️ Phím tắt

| Phím tắt | Chức năng |
|----------|-----------|
| `Cmd+Option+T` | Dịch nhanh (đọc text từ clipboard) |
| `Cmd+Shift+Q` | Thoát app |
| `Cmd+Enter` | Dịch text trong input field |
| `Escape` | Đóng settings panel |

## 🎯 Menu Bar

Click vào icon trên menu bar để mở menu:
- **Show Dialog**: Mở cửa sổ dịch
- **Dịch nhanh**: Dịch text từ clipboard
- **Exit**: Thoát app

## ⚙️ Cài đặt nâng cao

### Window Settings
- **Opacity**: Điều chỉnh độ trong suốt của popup (30% - 100%)

### General Settings
- **Launch at startup**: Tự động khởi động app khi đăng nhập vào macOS

### Voice Settings
Cấu hình giọng đọc riêng cho từng ngôn ngữ:
- Vietnamese (vi-VN)
- English (en-US)
- Japanese (ja-JP)

Mỗi ngôn ngữ có thể cấu hình:
- Voice name
- Speed (tốc độ)
- Pitch (độ cao)
- Volume (âm lượng)

## 🏗️ Cấu trúc dự án

```
mac-translator/
├── main.js              # Main process (Electron)
├── preload.cjs          # Preload script (IPC bridge)
├── package.json         # Dependencies và build config
├── .env                 # API key (không commit)
├── assets/
│   └── iconTemplate.png # Icon cho menu bar
├── renderer/
│   ├── index.html       # UI structure
│   ├── renderer.js      # UI logic
│   └── style.css        # Styles
└── utils/
    └── translator.js    # OpenAI API integration
```

## 🔧 Công nghệ

- **Electron**: Framework để build desktop app
- **OpenAI API**: GPT-4.1 models cho dịch thuật
- **Web Speech API**: Text-to-speech
- **electron-store**: Lưu trữ preferences
- **dotenv**: Quản lý environment variables

## 🔒 Bảo mật

- API key được lưu trong file `.env`, không commit vào git
- Không lưu trữ lịch sử dịch
- Không thu thập dữ liệu người dùng
- Tất cả requests được gửi trực tiếp đến OpenAI API

## 📝 Lưu ý

- Cần có **quyền Accessibility** để app hoạt động tốt trên macOS
- Đảm bảo có **OpenAI API Key** hợp lệ
- App chạy ở background, không hiển thị trong dock
- Icon trên menu bar luôn hiển thị khi app đang chạy

## 🐛 Troubleshooting

### App không hiển thị trên menu bar
- Kiểm tra xem app có đang chạy không (Activity Monitor)
- Restart app

### Phím tắt không hoạt động
- Kiểm tra xem phím tắt có bị trùng với app khác không
- Restart app để đăng ký lại phím tắt

### Không dịch được
- Kiểm tra file `.env` có đúng API key không
- Kiểm tra kết nối internet
- Xem console log để biết lỗi chi tiết

### Popup không hiển thị trên fullscreen
- Cấp quyền Accessibility trong System Settings > Privacy & Security > Accessibility
- Thêm app vào danh sách allowed apps

## 📄 License

MIT

## 👤 Author

namcris

