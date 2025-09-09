const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// URL của trang web cần scrape
const url = 'https://kndvnn.cantho.vn/';

// Hàm lấy nội dung trang web
async function scrapeWebsite() {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    // Tạo đối tượng để lưu trữ dữ liệu
    const scrapedData = {
      title: $('title').text().trim(),
      description: $('meta[name="DESCRIPTION"]').attr('content'),
      keywords: $('meta[name="KEYWORDS"]').attr('content'),
      sections: []
    };
    
    // Lấy thông tin các danh mục chính
    const sections = [];
    
    // Thông tin nổi bật (carousel)
    const tinNoiBat = [];
    $('.carousel-inner .item').each((index, element) => {
      const title = $(element).find('.carousel-caption h5').text().trim();
      const link = $(element).find('a').attr('href');
      const image = $(element).find('img').attr('src');
      
      tinNoiBat.push({
        title,
        link: link ? `https://kndvnn.cantho.vn${link}` : null,
        image: image ? `https://kndvnn.cantho.vn${image}` : null
      });
    });
    
    sections.push({
      name: "Tin nổi bật",
      articles: tinNoiBat
    });
    
    // Tin mới cập nhật
    const tinMoi = [];
    $('.panel-tinmoi .list-group-item').each((index, element) => {
      const title = $(element).find('.media-body p').text().trim();
      const link = $(element).attr('href');
      const image = $(element).find('.media-object').attr('src');
      
      tinMoi.push({
        title,
        link: link ? `https://kndvnn.cantho.vn${link}` : null,
        image: image ? `https://kndvnn.cantho.vn${image}` : null
      });
    });
    
    sections.push({
      name: "Tin mới cập nhật",
      articles: tinMoi
    });
    
    // Các chuyên mục tin tức
    const newsSections = [
      { id: '1', name: 'Tin ngành nông nghiệp và môi trường' },
      { id: '2', name: 'Tin khuyến nông và DVNN các tỉnh, thành' },
      { id: '3', name: 'Tin khuyến nông và dvnn địa bàn TP.CT' },
      { id: '4', name: 'Mô hình khuyến nông, nông nghiệp hiệu quả' },
      { id: '5', name: 'Khoa học kỹ thuật mới và khuyến cáo' },
      { id: '6', name: 'Phổ biến chính sách và kêu gọi đầu tư' },
      { id: '8', name: 'Sản phẩm dịch vụ khuyến nông, nông nghiệp' },
      { id: '9', name: 'Bản tin giá nông sản địa phương' },
      { id: '10', name: 'Sản phẩm chủ lực, OCOP địa phương' },
      { id: '12', name: 'Trang văn nghệ khuyến nông' }
    ];
    
    newsSections.forEach(section => {
      const articles = [];
      $(`#myTabs-${section.id}`).siblings('.row').find('.ct-item-news').each((index, element) => {
        const title = $(element).find('.ct-title').text().trim();
        const link = $(element).attr('href');
        
        articles.push({
          title,
          link: link ? `https://kndvnn.cantho.vn${link}` : null
        });
      });
      
      sections.push({
        name: section.name,
        articles
      });
    });
    
    // Thông báo và sự kiện
    const thongBao = [];
    $('.marqueeThongBao .ct-item-news').each((index, element) => {
      const title = $(element).find('.ct-title').text().trim();
      const link = $(element).attr('href');
      const date = $(element).find('.ct-date').text().trim();
      
      thongBao.push({
        title,
        link: link ? `https://kndvnn.cantho.vn${link}` : null,
        date
      });
    });
    
    sections.push({
      name: "Thông báo và sự kiện",
      articles: thongBao
    });
    
    // Tài liệu kỹ thuật mới
    const taiLieuMoi = [];
    $('.list-files .files-item').each((index, element) => {
      const title = $(element).find('.media-heading').text().trim();
      const link = $(element).find('a').attr('href');
      const date = $(element).find('.files-date').text().trim();
      
      taiLieuMoi.push({
        title,
        link: link ? `https://kndvnn.cantho.vn${link}` : null,
        date
      });
    });
    
    sections.push({
      name: "Tài liệu kỹ thuật mới",
      articles: taiLieuMoi
    });
    
    scrapedData.sections = sections;
    
    // Lưu dữ liệu vào file JSON
    const filePath = path.join(__dirname, 'data_khuyennong', 'website_data.json');
    fs.writeFileSync(filePath, JSON.stringify(scrapedData, null, 2), 'utf8');
    
    console.log('Dữ liệu đã được lưu vào:', filePath);
  } catch (error) {
    console.error('Lỗi khi scrape website:', error.message);
  }
}

// Chạy hàm scrape
scrapeWebsite();