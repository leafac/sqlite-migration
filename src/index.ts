import { Database, Query, sql } from "@leafac/sqlite";

export interface Migration {
  id: number;
  source: string;
}

export default (database: Database, migrations: Query[]): number => {
  database.execute(
    sql`CREATE TABLE IF NOT EXISTS leafacMigrations (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL);`
  );

  let executedMigrationsCount: number;
  try {
    executedMigrationsCount = database.get<{ seq: number }>(
      sql`SELECT seq FROM sqlite_sequence WHERE name = ${"leafacMigrations"}`
    ).seq;
  } catch (error) {
    executedMigrationsCount = 0;
  }
  const executedMigrations = database.all<Migration>(
    sql`SELECT id, source FROM leafacMigrations ORDER BY id`
  );

  if (executedMigrationsCount !== executedMigrations.length)
    throw new Error(
      `The AUTOINCREMENT sequence of the leafacMigrations table (${executedMigrationsCount}) doesn’t match its number of rows (${executedMigrations.length}). Did you manipulate the leafacMigrations table by hand? If so, you must get to a consistent state before trying to migrate again.`
    );
  if (migrations.length < executedMigrationsCount)
    throw new Error(
      `The number of migrations provided (${migrations.length}) is less than the number of migrations that have already run in the database (${executedMigrationsCount}). Did you forget to pass some of the migrations?`
    );

  for (let index = 0; index < executedMigrationsCount; index++) {
    const migration = migrations[index];
    const executedMigration = executedMigrations[index];
    if (migration.source !== executedMigration.source)
      throw new Error(
        `Migration index ${index} is different from leafacMigrations row ${
          index + 1
        }.\nMigration:\n${migration.source}\nleafacMigrations:\n${
          executedMigration.source
        }`
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
          sql`INSERT INTO leafacMigrations (source) VALUES (${migration.source})`
        );
      });
    } catch (error) {
      throw new Error(
        `Error running migration ${index}.\nMigration: ${JSON.stringify(
          migration,
          undefined,
          2
        )}\nError: ${error}`
      );
    }
  }

  return migrations.length - executedMigrationsCount;
};
