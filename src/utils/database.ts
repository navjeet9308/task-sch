import { createConnection } from 'typeorm';
import { Task } from '../models/Task';

export const connectDatabase = async () => {
  try {
    await createConnection({
      type: 'sqlite',
      database: 'database.sqlite',
      synchronize: true,
      entities: [Task],
    });
    console.log('Database connection established.');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1); // Exit process with failure
  }
};
