const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Đường dẫn tới file dữ liệu đã có
const dataFilePath = path.join(__dirname, 'data_khuyennong', 'website_data.json');

// Hàm lấy nội dung chi tiết từ một URL
async function scrapeArticleDetails(url) {
  try {
    console.log(`Đang scrape dữ liệu từ: ${url}`);
    const { data } = await axios.get(url, {
      timeout: 10000, // Timeout 10 giây
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
    
    // Trích xuất nội dung chính
    let content = '';
    
    // Thử các selector phổ biến cho nội dung bài viết
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
    
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        // Loại bỏ script và style tags
        element.find('script, style').remove();
        content = element.text().trim();
        if (content.length > 50) { // Chỉ lấy nếu có đủ nội dung
          break;
        }
      }
    }
    
    // Nếu không tìm thấy với các selector trên, lấy nội dung từ body và loại bỏ header/footer
    if (content.length < 50) {
      $('header, footer, nav, .header, .footer, .nav, .menu').remove();
      content = $('.container, .content, .main, #main, [class*="main"]').text().trim();
    }
    
    // Giới hạn độ dài nội dung để tránh quá lớn
    if (content.length > 2000) {
      content = content.substring(0, 2000) + '...';
    }
    
    // Trích xuất ngày đăng (nếu có)
    let date = '';
    const dateSelectors = [
      '.date',
      '.publish-date',
      '.post-date',
      '.created-date',
      '[class*="date"]',
      'time'
    ];
    
    for (const selector of dateSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        date = element.text().trim();
        if (date) break;
      }
    }
    
    // Trích xuất tác giả (nếu có)
    let author = '';
    const authorSelectors = [
      '.author',
      '.writer',
      '[class*="author"]',
      '[rel="author"]'
    ];
    
    for (const selector of authorSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        author = element.text().trim();
        if (author) break;
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

// Hàm cập nhật dữ liệu với thông tin chi tiết từ các liên kết
async function enhanceDataWithDetails() {
  try {
    // Đọc dữ liệu hiện có
    const existingData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    
    console.log('Bắt đầu scrape chi tiết các bài viết...');
    
    // Duyệt qua từng section và article để lấy thông tin chi tiết
    for (const section of existingData.sections) {
      console.log(`Đang xử lý section: ${section.name} (${section.articles.length} bài viết)`);
      
      // Giới hạn số lượng bài viết để tránh timeout
      const articlesToProcess = section.articles.slice(0, 10);
      
      for (const article of articlesToProcess) {
        if (article.link && article.link.startsWith('http')) {
          // Lấy thông tin chi tiết từ liên kết
          const details = await scrapeArticleDetails(article.link);
          
          // Cập nhật thông tin chi tiết vào article
          article.details = {
            title: details.title,
            content: details.content,
            date: details.date,
            author: details.author
          };
          
          // Thêm một khoảng delay nhỏ giữa các request
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    // Lưu lại dữ liệu đã cập nhật
    fs.writeFileSync(dataFilePath, JSON.stringify(existingData, null, 2), 'utf8');
    console.log('Đã cập nhật dữ liệu chi tiết vào file website_data.json');
    
  } catch (error) {
    console.error('Lỗi khi cập nhật dữ liệu:', error.message);
  }
}

// Chạy hàm cập nhật dữ liệu
enhanceDataWithDetails();