# Hướng dẫn Repository

## Cấu trúc Dự án & Tổ chức Module
- Monorepo được quản lý bởi Turborepo và Bun.
- Ứng dụng: `apps/web` (Next.js 15, React 19). Thư mục chính: `src/app` (routes), `src/components` (UI + shared), `src/lib` (utils).
- Backend: `packages/backend` (Convex). Code trong `packages/backend/convex`.
- Cấu hình: `turbo.json`, `bunfig.toml`, `.oxlintrc.json`.
- Ví dụ Env: `apps/web/.env.example`.

## Lệnh Xây dựng, Kiểm thử và Phát triển
- `bun install` — cài đặt các phụ thuộc của workspace.
- `bun dev` — khởi động tất cả các ứng dụng qua Turborepo.
- `bun dev:web` — chỉ chạy ứng dụng Next.js.
- `bun dev:server` — chỉ chạy backend Convex.
- `bun dev:setup` — cấu hình Convex cục bộ/đám mây (có hướng dẫn), đặt URL.
- `bun build` — xây dựng tất cả các workspace.
- `bun check` — chạy oxlint.
- `bun check-types` — kiểm tra kiểu TypeScript trên tất cả các workspace.

## Phong cách Lập trình & Quy ước Đặt tên
- Ngôn ngữ: TypeScript (chế độ nghiêm ngặt được bật trong `apps/web/tsconfig.json`).
- Thụt lề: tab.
- Tên file: kebab-case (ví dụ: `mode-toggle.tsx`, `layout.shared.tsx`).
- Xuất: ưu tiên xuất có tên (ví dụ: `export { Button }`).
- React: components trong `src/components`; primitives trong `src/components/ui`; pages trong `src/app`.
- Utilities trong `src/lib`; giữ nguyên và có kiểu.
- Linting: sử dụng oxlint (`bun check`) trước khi commit.

## Hướng dẫn Kiểm thử
- Chưa có trình chạy kiểm thử được cấu hình. Nếu thêm kiểm thử:
  - Đặt các bài kiểm thử đơn vị gần nguồn hoặc trong `__tests__`.
  - Đặt tên: `*.test.ts`/`*.test.tsx`.
  - Ưu tiên Vitest cho kiểm thử đơn vị và Playwright cho e2e.

## Hướng dẫn Commit & Pull Request
- Sử dụng Conventional Commits (ví dụ: `feat:`, `fix:`, `chore:`) và thì hiện tại.
- PR phải bao gồm:
  - Mô tả rõ ràng và các vấn đề được liên kết.
  - Ảnh chụp màn hình/GIF cho các thay đổi UI (web).
  - Xác nhận rằng `bun check` và `bun check-types` đã chạy thành công.
 - Ghi chú về cập nhật tài liệu trong `apps/web/content` nếu áp dụng.

## Bảo mật & Cấu hình
- Không bao giờ commit các thông tin bí mật. Sao chép `apps/web/.env.example` thành `.env.local` và đặt `NEXT_PUBLIC_CONVEX_URL` (hoặc chạy `bun dev:setup`).
- Ưu tiên nhập workspace (ví dụ: `@/lib/utils`). Tránh các đường dẫn tương đối sâu.

## Ghi chú cho Agent
- Phạm vi: toàn bộ repo. Làm theo hướng dẫn này cho phong cách và cấu trúc.
- Giữ các thay đổi tối thiểu, tập trung và nhất quán với các mẫu hiện có.