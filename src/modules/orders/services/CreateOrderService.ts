import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';
import ICreateOrderDTO from '../dtos/ICreateOrderDTO';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const productList = await this.productsRepository.findAllById(
      products.map(product => ({ id: product.id })),
    );

    if (productList.length !== products.length) {
      throw new AppError('Some products was not founded');
    }

    const productQuantities = productList.map(product => {
      const findProd = products.find(
        productParam => productParam.id === product.id,
      );

      if (!findProd) return undefined;

      if (product.quantity < findProd?.quantity) {
        throw new AppError(
          `Insufficient quantity for product "${product.name}"`,
        );
      }

      Object.assign(product, {
        quantity: product.quantity - findProd.quantity,
      });

      return {
        product_id: product.id,
        price: product.price,
        quantity: findProd.quantity,
      };
    });

    await this.productsRepository.updateQuantity(productList);

    const order = await this.ordersRepository.create({
      customer,
      products: productQuantities,
    } as ICreateOrderDTO);

    return order;
  }
}

export default CreateOrderService;
