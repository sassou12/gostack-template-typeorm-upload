import { getRepository } from 'typeorm';
import { isUuid } from 'uuidv4';

import Transaction from '../models/Transaction';
import AppError from '../errors/AppError';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    if (!id || !isUuid(id)) {
      throw new AppError('Id is invalid format');
    }
    const repository = getRepository(Transaction);
    const transaction = await repository.findOne(id);
    if (!transaction) {
      throw new AppError('Transaction not found.');
    }
    await repository.delete(id);
  }
}

export default DeleteTransactionService;
