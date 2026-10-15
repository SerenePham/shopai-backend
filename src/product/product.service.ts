import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ProductService {
  // Kho dữ liệu tạm, sinh MỘT LẦN lúc Service được khởi tạo (thay vì sinh lại mỗi request
  // như bản Bước 3) — nhờ vậy id luôn ổn định, ProductDetail tra cứu mới ra kết quả.
  private readonly products = Array.from({ length: 20 }).map((_, i) => ({
    id: `backend_prod_${i}`,
    name: `Sản phẩm từ NestJS Server ${i}`,
    price: 1000000 + i * 10000,
    image: `https://picsum.photos/id/${200 + i}/400/400`,
  }));

  getAllProducts() {
    return this.products;
  }

  getProductById(id: string) {
    const product = this.products.find((p) => p.id === id);
    if (!product) {
      // Đúng chuẩn Phần 9.6: KHÔNG return null, phải ném đúng mã 404
      throw new NotFoundException(`Không tìm thấy sản phẩm có id = ${id}`);
    }
    return product;
  }

  // Dùng lại ở Orders API (Bước 7f) để Server tự tra giá thật
  findRawById(id: string) {
    return this.products.find((p) => p.id === id) ?? null;
  }
}
