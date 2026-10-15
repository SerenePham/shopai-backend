import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { IOrderRepository } from './order.repository';

@Injectable()
export class OrderService {
  constructor(
    private readonly productService: ProductService,
    @Inject('IOrderRepository') private readonly orderRepository: IOrderRepository,
  ) {}

  async createOrder(dto: CreateOrderDto, userId: string) {
    let serverTotal = 0;
    const enrichedItems: { productId: string; quantity: number; price: number }[] = [];

    for (const item of dto.items) {
      const product = this.productService.findRawById(item.productId);
      if (!product) {
        throw new BadRequestException(`Sản phẩm ${item.productId} không còn tồn tại`);
      }
      serverTotal += product.price * item.quantity;
      enrichedItems.push({ ...item, price: product.price });
    }

    if (serverTotal !== dto.total) {
      throw new BadRequestException(
        `Tổng tiền không khớp. Server tính ${serverTotal}, Client gửi ${dto.total}. Vui lòng tải lại giỏ hàng.`,
      );
    }

    return this.orderRepository.save({
      id: `ORD-${Date.now()}`,
      userId,
      total: serverTotal,
      items: enrichedItems,
    });
  }

  async getOrdersForUser(userId: string) {
    return this.orderRepository.findByUserId(userId);
  }

  async getOrderForUser(orderId: string, userId: string) {
    const order = await this.orderRepository.findById(orderId);
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Không tìm thấy hóa đơn');
    }
    return order;
  }

  async payOrder(orderId: string, userId: string) {
    const order = await this.getOrderForUser(orderId, userId);
    if (order.status === 'PAID') {
      return order; // Idempotent
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException(`Không thể thanh toán đơn ở trạng thái ${order.status}`);
    }
    return this.orderRepository.updateStatus(orderId, 'PAID');
  }

  async getAllOrders() {
    return this.orderRepository.findAll();
  }
}
