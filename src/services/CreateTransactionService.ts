import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface RequestDTO {
  title: string;
  value: number;
  category: string;
  type: 'income' | 'outcome';
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: RequestDTO): Promise<Transaction> {
    if (!type || (type !== 'income' && type !== 'outcome')) {
      throw new AppError('type deve ser income ou outcome');
    }
    const repository = getCustomRepository(TransactionsRepository);

    if (type === 'outcome') {
      const { total } = await repository.getBalance();
      if (total < value) {
        throw new AppError('insufficient funds', 400);
      }
    }

    const categoryRepository = getRepository(Category);
    let categoryExists = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });
    if (!categoryExists) {
      categoryExists = categoryRepository.create({ title: category });
      await categoryRepository.save(categoryExists);
    }

    const transaction = repository.create({
      title,
      value,
      type,
      category_id: categoryExists.id,
    });
    await repository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
