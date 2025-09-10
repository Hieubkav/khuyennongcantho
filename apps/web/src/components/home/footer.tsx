export function Footer() {
  return (
    <footer className="bg-secondary/50 border-t">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div className="md:col-span-2">
            <h3 className="font-bold text-lg text-primary mb-3">TRUNG TÂM KHUYẾN NÔNG VÀ DỊCH VỤ NÔNG NGHIỆP</h3>
            <p className="text-muted-foreground"><strong>Địa chỉ:</strong> Số 5, đường A3, KDC Hưng Phú 1, P. Hưng Phú, Q. Cái Răng, TP. Cần Thơ</p>
            <p className="text-muted-foreground"><strong>Điện thoại:</strong> 0292 3890 888</p>
            <p className="text-muted-foreground"><strong>Email:</strong> ttkn@cantho.gov.vn</p>
          </div>
          <div>
            <h3 className="font-bold text-lg text-primary mb-3">Liên kết nhanh</h3>
            <ul className="space-y-2">
              <li><span className="text-muted-foreground hover:text-primary transition-colors cursor-default">Tin nổi bật</span></li>
              <li><span className="text-muted-foreground hover:text-primary transition-colors cursor-default">Kỹ thuật mới</span></li>
              <li><span className="text-muted-foreground hover:text-primary transition-colors cursor-default">Giá nông sản</span></li>
              <li><span className="text-muted-foreground hover:text-primary transition-colors cursor-default">Sản phẩm OCOP</span></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg text-primary mb-3">Chịu trách nhiệm</h3>
            <p className="text-muted-foreground">Bà: <strong>Phạm Thị Minh Nguyệt</strong></p>
            <p className="text-muted-foreground">Chức vụ: Giám đốc</p>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Trung tâm Khuyến nông và DVNN Cần Thơ. Thiết kế và phát triển phục vụ trình diễn.</p>
        </div>
      </div>
    </footer>
  );
}

