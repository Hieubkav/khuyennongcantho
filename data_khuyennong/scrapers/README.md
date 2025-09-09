# Thư mục Scrapers

Thư mục này chứa các script để cào dữ liệu từ website https://kndvnn.cantho.vn/

## Các script

1. **scrape_khuyennong.js** - Script ban đầu để cào dữ liệu cơ bản từ trang chủ
2. **scrape_details.js** - Script để cào thông tin chi tiết từ các liên kết bài viết
3. **scrape_full_content.js** - Script để cào toàn bộ nội dung từ các bài viết
4. **split_json.js** - Script để chia nhỏ file dữ liệu lớn thành các phần nhỏ hơn

## Cách sử dụng

1. Chạy `scrape_khuyennong.js` để tạo file dữ liệu ban đầu
2. Chạy `scrape_details.js` để bổ sung thông tin chi tiết cho các bài viết
3. Chạy `scrape_full_content.js` để cào toàn bộ nội dung các bài viết
4. Chạy `split_json.js` nếu file dữ liệu quá lớn cần chia nhỏ

## Yêu cầu

- Node.js hoặc Bun
- Các thư viện: axios, cheerio

## Cài đặt thư viện

```bash
bun add axios cheerio
```

hoặc

```bash
npm install axios cheerio
```