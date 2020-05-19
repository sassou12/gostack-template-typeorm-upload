import { getRepository, In } from 'typeorm';
import fs from 'fs';
import csvParser from 'csv-parse';
import path from 'path';

import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface TransactionCsvDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category?: string;
  category_id?: string;
}

class ImportTransactionsService {
  async execute(fileName: string): Promise<Transaction[]> {
    const file = path.join(uploadConfig.directory, fileName);
    console.log(file);

    const fileExists = await fs.promises.stat(file);

    const mapTransactions: Transaction[] = [];
    if (fileExists) {
      const fileReader = fs.createReadStream(file);
      const parser = csvParser({
        from_line: 2,
      });

      const parserCSV = fileReader.pipe(parser);

      const transactions: TransactionCsvDTO[] = [];
      const categories: string[] = [];
      parserCSV.on('data', async line => {
        const [title, type, value, category] = line.map((cell: string) =>
          cell.trim(),
        );

        if (!title || !type || !value) return;
        transactions.push({ title, type, value, category });
        if (!categories.includes(category)) categories.push(category);
      });

      await new Promise(resolve => parserCSV.on('end', resolve));

      const catRepository = getRepository(Category);
      const categoriesExists = await catRepository.find({
        where: {
          title: In(categories),
        },
      });

      const categoriesNotExists = categories
        .filter(
          cat =>
            !categoriesExists.map(catExists => catExists.title).includes(cat),
        )
        .map(title => catRepository.create({ title }));

      if (categoriesNotExists) {
        await catRepository.save(categoriesNotExists);
        categoriesExists.push(...categoriesNotExists);
      }

      const repository = getRepository(Transaction);

      const transactionArray = transactions.map(
        (transactionCsv: TransactionCsvDTO): Transaction => {
          const { title, category, type, value } = transactionCsv;
          const category2 = categoriesExists.find(
            cat => cat.title === category,
          );
          const trans = repository.create({
            title,
            type,
            value,
            // (category && category_id: category2.id,)
          });
          return category2 ? { ...trans, category_id: category2.id } : trans;
        },
      );
      await fs.promises.unlink(file);
      await repository.save(transactionArray);
      return transactionArray;
    }
    return mapTransactions;
  }
}

export default ImportTransactionsService;
