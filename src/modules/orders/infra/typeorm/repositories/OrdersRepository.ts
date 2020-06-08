import { getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Order from '../entities/Order';
import OrdersProducts from '../entities/OrdersProducts';

class OrdersRepository implements IOrdersRepository {
  private ormRepository: Repository<Order>;

  constructor() {
    this.ormRepository = getRepository(Order);
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    const order = this.ormRepository.create({
      customer,
    });

    const order_products = products.map(product => {
      const orderProduct = new OrdersProducts();
      Object.assign(orderProduct, {
        order_id: order.id,
        price: product.price,
        product_id: product.product_id,
        quantity: product.quantity,
      });
      return orderProduct;
    });

    Object.assign(order, { order_products });

    await this.ormRepository.save(order);

    return order;
  }

  public async findById(id: string): Promise<Order | undefined> {
    const order = await this.ormRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    return order;
  }
}

export default OrdersRepository;
