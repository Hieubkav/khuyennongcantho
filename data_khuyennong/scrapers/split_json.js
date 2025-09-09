const fs = require('fs');
const path = require('path');

// Đường dẫn tới file dữ liệu lớn
const largeDataFilePath = path.join(__dirname, 'data_khuyennong', 'website_data.json');

// Hàm chia nhỏ file JSON
function splitJsonFile() {
  try {
    // Đọc file dữ liệu lớn
    const data = JSON.parse(fs.readFileSync(largeDataFilePath, 'utf8'));
    
    // Tạo thư mục để lưu các file chia nhỏ
    const splitDir = path.join(__dirname, 'data_khuyennong', 'split_data');
    if (!fs.existsSync(splitDir)) {
      fs.mkdirSync(splitDir);
    }
    
    // Chia nhỏ dữ liệu theo section
    data.sections.forEach((section, index) => {
      // Tạo file riêng cho mỗi section
      const sectionFileName = `section_${index + 1}_${section.name.replace(/[/\\\\:*?\"<>|]/g, '_')}.json`;
      const sectionFilePath = path.join(splitDir, sectionFileName);
      
      // Tạo đối tượng section riêng
      const sectionData = {
        sectionName: section.name,
        articles: section.articles
      };
      
      // Ghi dữ liệu section vào file riêng
      fs.writeFileSync(sectionFilePath, JSON.stringify(sectionData, null, 2), 'utf8');
      console.log(`Đã tạo file: ${sectionFileName}`);
    });
    
    // Tạo file metadata chứa thông tin cơ bản
    const metadata = {
      title: data.title,
      description: data.description,
      keywords: data.keywords,
      totalSections: data.sections.length,
      sectionsList: data.sections.map((section, index) => ({
        id: index + 1,
        name: section.name,
        articleCount: section.articles.length
      }))
    };
    
    const metadataFilePath = path.join(splitDir, 'metadata.json');
    fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2), 'utf8');
    console.log('Đã tạo file metadata.json');
    
    console.log('Hoàn thành chia nhỏ file dữ liệu!');
    console.log(`Các file đã được lưu trong thư mục: ${splitDir}`);
    
  } catch (error) {
    console.error('Lỗi khi chia nhỏ file:', error.message);
  }
}

// Chạy hàm chia nhỏ file
splitJsonFile();