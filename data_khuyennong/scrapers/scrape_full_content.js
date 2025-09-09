const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Đường dẫn tới file dữ liệu đã có
const dataFilePath = path.join(__dirname, 'data_khuyennong', 'website_data.json');

// Hàm lấy nội dung chi tiết đầy đủ từ một URL
async function scrapeFullArticleContent(url) {
  try {
    console.log(`Đang scrape dữ liệu từ: ${url}`);
    const { data } = await axios.get(url, {
      timeout: 15000, // Timeout 15 giây
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    
    // Trích xuất tiêu đề bài viết
    const title = $('title').text().trim() || 
                  $('h1').first().text().trim() || 
                  $('h2').first().text().trim() || 
                  'Không có tiêu đề';
    
    // Trích xuất nội dung chính (đầy đủ)
    let content = '';
    
    // Các selector phổ biến cho nội dung bài viết
    const contentSelectors = [
      '.news-content',
      '.article-content',
      '.post-content',
      '.content-detail',
      '.detail-content',
      '.news-detail',
      '.body',
      '.content',
      '#content',
      '[class*="content"]',
      '[class*="article"]',
      '[class*="news"]'
    ];
    
    // Thử tìm nội dung theo các selector
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        // Loại bỏ script, style, và các phần tử không cần thiết
        element.find('script, style, nav, header, footer, .header, .footer, .menu, .sidebar').remove();
        content = element.text().trim();
        if (content.length > 100) { // Chỉ lấy nếu có đủ nội dung
          break;
        }
      }
    }
    
    // Nếu không tìm thấy với các selector trên, thử cách tiếp cận khác
    if (content.length < 100) {
      // Loại bỏ các phần tử không cần thiết khỏi toàn bộ trang
      $('script, style, nav, header, footer, .header, .footer, .menu, .sidebar, .breadcrumb, .ads, .advertisement').remove();
      
      // Thử lấy nội dung từ các container phổ biến
      const containers = $('.container, .content, .main, #main, [class*="main"], [class*="content"], [class*="article"], [class*="post"]');
      containers.each((i, elem) => {
        const text = $(elem).text().trim();
        if (text.length > content.length) {
          content = text;
        }
      });
    }
    
    // Nếu vẫn không có nội dung, lấy từ body
    if (content.length < 100) {
      $('script, style, nav, header, footer, .header, .footer, .menu, .sidebar').remove();
      content = $('body').text().trim();
    }
    
    // Xử lý xuống dòng và khoảng trắng
    content = content.replace(/\n\s*\n/g, '\n\n').trim();
    
    // Trích xuất ngày đăng (nếu có)
    let date = '';
    const dateSelectors = [
      '.date',
      '.publish-date',
      '.post-date',
      '.created-date',
      '[class*="date"]',
      'time',
      '.time'
    ];
    
    for (const selector of dateSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        date = element.text().trim();
        if (date && !date.includes('|') && date.length < 50) break; // Tránh lấy nhầm các thông tin khác
      }
    }
    
    // Trích xuất tác giả (nếu có)
    let author = '';
    const authorSelectors = [
      '.author',
      '.writer',
      '[class*="author"]',
      '[rel="author"]',
      '.posted-by'
    ];
    
    for (const selector of authorSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        author = element.text().trim();
        if (author && !author.includes('http') && author.length < 100) break; // Tránh lấy nhầm liên kết
      }
    }
    
    return {
      title,
      url,
      content: content || 'Không thể trích xuất nội dung',
      date: date || 'Không có ngày',
      author: author || 'Không có tác giả'
    };
    
  } catch (error) {
    console.error(`Lỗi khi scrape ${url}: ${error.message}`);
    return {
      title: 'Lỗi khi lấy dữ liệu',
      url,
      content: `Lỗi: ${error.message}`,
      date: 'Không có ngày',
      author: 'Không có tác giả'
    };
  }
}

// Hàm cập nhật dữ liệu với nội dung đầy đủ
async function updateWithFullContent() {
  try {
    // Đọc dữ liệu hiện có
    const existingData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    
    console.log('Bắt đầu scrape nội dung đầy đủ các bài viết...');
    
    let totalArticles = 0;
    let processedArticles = 0;
    
    // Đếm tổng số bài viết
    for (const section of existingData.sections) {
      totalArticles += section.articles.length;
    }
    
    console.log(`Tổng số bài viết cần xử lý: ${totalArticles}`);
    
    // Duyệt qua từng section và article để lấy nội dung đầy đủ
    for (const section of existingData.sections) {
      console.log(`Đang xử lý section: ${section.name} (${section.articles.length} bài viết)`);
      
      for (const article of section.articles) {
        // Chỉ xử lý các bài viết có link hợp lệ
        if (article.link && article.link.startsWith('http') && !article.link.includes('javascript')) {
          // Lấy nội dung đầy đủ từ liên kết
          const fullContent = await scrapeFullArticleContent(article.link);
          
          // Cập nhật thông tin chi tiết vào article
          article.fullDetails = {
            title: fullContent.title,
            content: fullContent.content,
            date: fullContent.date,
            author: fullContent.author
          };
          
          processedArticles++;
          console.log(`Đã xử lý: ${processedArticles}/${totalArticles}`);
          
          // Thêm một khoảng delay nhỏ giữa các request để tránh bị block
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
    
    // Lưu lại dữ liệu đã cập nhật
    fs.writeFileSync(dataFilePath, JSON.stringify(existingData, null, 2), 'utf8');
    console.log('Đã cập nhật nội dung đầy đủ vào file website_data.json');
    
  } catch (error) {
    console.error('Lỗi khi cập nhật dữ liệu:', error.message);
  }
}

// Chạy hàm cập nhật dữ liệu
updateWithFullContent();