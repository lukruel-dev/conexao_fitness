import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

export class TestUtils {
  static async clearDatabase(app: INestApplication) {
    const dataSource = app.get(DataSource);
    const entities = dataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
    }
  }

  // TODO: Add helper methods for generating test users and auth tokens
}
