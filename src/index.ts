import { Database, Query, sql } from "@leafac/sqlite";

export interface Migration {
  id: number;
  source: string;
}

export default (database: Database, migrations: Query[]): number => {
  database.execute(
    sql`CREATE TABLE IF NOT EXISTS leafac_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL);`
  );

  let executedMigrationsCount: number;
  try {
    executedMigrationsCount = database.get<{ executedMigrationsCount: number }>(
      sql`SELECT seq as executedMigrationsCount FROM sqlite_sequence WHERE name = 'leafac_migrations'`
    ).executedMigrationsCount;
  } catch (error) {
    executedMigrationsCount = 0;
  }
  const executedMigrations = database.all<Migration>(
    sql`SELECT id, source FROM leafac_migrations ORDER BY id`
  );

  if (executedMigrationsCount !== executedMigrations.length)
    throw new Error(
      `The number of executed migrations (${executedMigrationsCount}) doesn’t match the number of rows in the leafac_migrations table (${executedMigrations.length}). Did you delete rows from the leafac_migrations table? If so, you must reinsert them before trying to migrate again.`
    );
  if (executedMigrationsCount > migrations.length)
    throw new Error(
      `The number of executed migrations (${executedMigrationsCount}) is greater than the number of migrations provided (${migrations.length})`
    );

  for (let index = 0; index < executedMigrationsCount; index++) {
    const executedMigration = executedMigrations[index];
    const migration = migrations[index];
    if (executedMigration.source !== migration.source)
      throw new Error(
        `Migration (index = ${index}, id = ${
          index + 1
        }) is different in the leafac_migrations table from what was passed in migrations.\nleafac_migrations table:\n${
          executedMigration.source
        }\nMigration:\n${migration.source}`
      );
  }

  for (
    let index = executedMigrationsCount;
    index < migrations.length;
    index++
  ) {
    const migration = migrations[index];
    try {
      database.executeTransaction(() => {
        database.execute(migration);
        database.run(
          sql`INSERT INTO leafac_migrations (source) VALUES (${migration.source})`
        );
      });
    } catch (error) {
      throw new Error(
        `Error running migration (index = ${index}, would have been id = ${
          index + 1
        }).\nMigration: ${JSON.stringify(
          migration,
          undefined,
          2
        )}\nError: ${error}`
      );
    }
  }

  return migrations.length - executedMigrationsCount;
};
