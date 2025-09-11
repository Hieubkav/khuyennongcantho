# Hướng dẫn chi tiết về Fumadocs cho AI Agents

## Tổng quan về Fumadocs

Fumadocs là một **framework documentation linh hoạt, ít "magic"** được xây dựng trên Next.js App Router và có thể mở rộng sang các React runtime khác. Kiến trúc modular của nó cung cấp mọi thứ cần thiết để chuyển đổi Markdown/MDX, OpenAPI schemas, TypeScript declarations và thậm chí Python doc-strings thành các trang tài liệu hoặc blog đẹp mắt, có thể tìm kiếm.

### Ý tưởng cốt lõi

1. **Ít trừu tượng hóa, nhiều kiểm soát** - Làm việc trực tiếp với React, MDX và file-system primitives thay vì các lớp CMS mờ ám
2. **Tính modular** - Hệ sinh thái được chia thành các package chuyên biệt
3. **Authoring tập trung vào nội dung** - Viết trang bằng Markdown/MDX, tổ chức bằng collections
4. **UI có thể tùy chỉnh, responsive** - Thiết kế mặc định nhưng khuyến khích tùy chỉnh sâu
5. **Khả năng mở rộng qua Source API** - Tích hợp filesystem, CMS hoặc remote schema riêng
6. **Hỗ trợ đa framework** - Có thể sử dụng với React Router, TanStack Start
7. **Tùy chọn hiệu suất** - Static generation hoặc Async Mode

## Các sản phẩm chính

### Fumadocs CLI

* Giao diện dòng lệnh để bootstrap projects
* Cài đặt hoặc extract UI components
* Tùy chỉnh themes và tạo file trees
* **Lệnh quan trọng** : `npx @fumadocs/cli customise`

### Fumadocs Core

* Thư viện runtime headless
* Cung cấp Source API, navigation helpers
* Middleware quốc tế hóa
* React hooks/components generic
* Framework-agnostic qua `FrameworkProvider`

### Fumadocs MDX

* Content source và webpack/turbopack loader chính thức
* Chuyển đổi Markdown/MDX thành typed JavaScript modules
* Build-time hoặc on-demand compilation
* Front-matter validation
* Custom Remark/Rehype pipelines
* **Async Mode** cho dự án lớn

 **Phiên bản hiện tại** : Fumadocs MDX (v10)

* **v9** : Legacy với loader đơn giản, map object duy nhất
* **v10** : Collections, `source.config.ts`, Turbopack compatibility

### Fumadocs UI

* Component library với Tailwind CSS + Radix UI
* Design system có thể theme-able
* Layout primitives, mobile-first navigation
* CLI-driven customiser như Shadcn UI

### Fumadocs OpenAPI

* Generator chuyển đổi OpenAPI 3.x schemas thành MDX
* Interactive playgrounds
* Type-safe helpers cho request/response examples
* **Phiên bản hiện tại** : Fumadocs OpenAPI (v9)

### Fumadocs TypeScript

* Extract TypeScript interface/type definitions
* Render thành human-readable tables trong MDX

### Fumadocs Python

* Experimental package parse Python doc-strings
* Chuyển đổi thành MDX

## Thuật ngữ quan trọng

### Collection

* Nhóm logic được định nghĩa trong `source.config.ts`
* Trỏ đến thư mục Markdown/MDX files
* Kết hợp Zod-style schema và MDX compilation options

### source.config.ts

* File cấu hình project-level
* Đăng ký một hoặc nhiều collections
* Content directories, schemas và MDX/Remark/Rehype options

### Page Tree

* Cấu trúc dữ liệu phân cấp đại diện cho mọi item có thể navigate
* Cung cấp năng lượng cho sidebars, breadcrumbs và search

### Frontmatter

* YAML hoặc JSON metadata block ở đầu Markdown/MDX files
* Ví dụ: `title`, `description`, `icon`, `full`

### meta.json (Meta File)

* File cấu hình folder-local
* Tùy chỉnh folder metadata (title, icon) và child ordering

## Lỗi thường gặp khi tạo MDX và cách khắc phục

### 1. Lỗi Frontmatter không hợp lệ

**Lỗi phổ biến:**

```
---title: My Pagedescription: This is a descriptionicon: homefull: true---
```

**Khắc phục:**

* Đảm bảo YAML syntax chính xác
* Sử dụng quotes cho special characters
* Kiểm tra indentation

**Ví dụ đúng:**

```
---title: "My Page Title"description: "This is a comprehensive description"icon: "home"full: true---# My Page Content
```

### 2. Lỗi Code Block không đóng đúng cách

**Lỗi phổ biến:**

```
```javascriptfunction example() {  return "Hello World";}``
```

**Khắc phục:**

```
```javascriptfunction example() {  return "Hello World";}
```

```
### 3. Lỗi Nested Code Blocks**Lỗi phổ biến:**````mdx```mdx```javascriptconst code = "inside mdx";
```

```

```

**Khắc phục:**

```
````mdx```javascriptconst code = "inside mdx";```````
```

### 4. Lỗi Import Components trong MDX

**Lỗi phổ biến:**

```
import { MyComponent } from './components'<MyComponent prop="value" />
```

**Khắc phục:**

```
import { MyComponent } from './components'# My Title<MyComponent prop="value" />
```

### 5. Lỗi Collection Configuration

**Lỗi trong source.config.ts:**

```
import { defineConfig } from 'fumadocs-mdx/config';export default defineConfig({  collections: [    {      name: 'docs',      dir: './content/docs',      // Thiếu schema validation    }  ]});
```

**Khắc phục:**

```
import { defineConfig } from 'fumadocs-mdx/config';import { z } from 'zod';export default defineConfig({  collections: [    {      name: 'docs',      dir: './content/docs',      schema: z.object({        title: z.string(),        description: z.string().optional(),        icon: z.string().optional(),        full: z.boolean().optional(),      })    }  ]});
```

### 6. Lỗi File Structure và Routing

**Cấu trúc file sai:**

```
content/  docs/    page1.mdx    page2.mdx    folder/      page3.mdx
```

**Cấu trúc file đúng:**

```
content/  docs/    index.mdx          # Homepage    getting-started.mdx    api/      index.mdx        # API section homepage      authentication.mdx      meta.json        # Folder metadata
```

### 7. Lỗi meta.json Configuration

**Lỗi phổ biến:**

```
{  "title": "API Documentation",  "pages": ["authentication", "endpoints"]}
```

**Khắc phục:**

```
{  "title": "API Documentation",  "icon": "api",  "pages": [    "authentication",    "endpoints",    {      "title": "Advanced",      "pages": ["webhooks", "rate-limiting"]    }  ]}
```

### 8. Lỗi Async Mode Configuration

**Khi nào sử dụng Async Mode:**

* Dự án có hơn 1000+ trang MDX
* Dev server start chậm
* Build time quá lâu

**Cấu hình Async Mode:**

```
// next.config.jsimport { createMDX } from 'fumadocs-mdx/next';const withMDX = createMDX({  async: true, // Enable Async Mode});export default withMDX({  // Next.js config});
```

## Best Practices cho AI Agents

### 1. Luôn validate Frontmatter

```
// Sử dụng Zod schema để validateconst pageSchema = z.object({  title: z.string(),  description: z.string().optional(),  icon: z.string().optional(),  full: z.boolean().default(false),});
```

### 2. Sử dụng TypeScript cho type safety

```
import type { InferMetaType, InferPageType } from 'fumadocs-core/source';import { loader } from 'fumadocs-core/source';export const { getPage, getPages, pageTree } = loader({  // configuration});export type Page = InferPageType<typeof getPage>;export type Meta = InferMetaType<typeof getPages>;
```

### 3. Tối ưu hóa performance

* Sử dụng static generation khi có thể
* Enable Async Mode cho dự án lớn
* Implement proper caching strategies

### 4. Error Handling

```
try {  const page = await getPage(['docs', 'api']);  if (!page) {    return notFound();  }  return page;} catch (error) {  console.error('Error loading page:', error);  return notFound();}
```

### 5. SEO Optimization

```
---title: "Complete Guide to API Authentication"description: "Learn how to implement secure API authentication with OAuth 2.0, JWT tokens, and best practices"---# Complete Guide to API AuthenticationThis guide covers everything you need to know about API authentication...
```

## Workflow điển hình

1. **Tạo Next.js project** và cài đặt core + UI packages
2. **Khởi tạo content collections** với `source.config.ts`
3. **Viết Markdown/MDX** với front-matter hoặc generate từ OpenAPI/TypeScript
4. **Chạy CLI** để scaffold và theme UI
5. **Deploy** statically hoặc server components

## Tích hợp và Extensions

* **Shiki** : Syntax highlighting
* **Tailwind CSS** : Styling system
* **Radix UI** : Component primitives
* **OpenAPI Schema** : API documentation
* **TypeScript Compiler API** : Type extraction
* **MDX Compiler** : Content processing

Fumadocs cung cấp một hệ sinh thái hoàn chỉnh cho việc tạo documentation sites hiện đại, với khả năng tùy chỉnh cao và hiệu suất tối ưu.
