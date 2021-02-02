import { Database, Query, sql } from "@leafac/sqlite";

export interface Migration {
  id: number;
  source: string;
}

export default (database: Database, migrations: Query[]): number => {
  database.execute(
    sql`CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT);`
  );
  const executedMigrations = database.all<Migration>(
    sql`SELECT * FROM migrations ORDER BY id`
  );

  if (executedMigrations.length > migrations.length)
    throw new Error(
      `Migrations corrupted: The number of executed migrations on the database (${executedMigrations.length}) is greater than the number of migrations provided (${migrations.length})`
    );
  for (
    let executedMigrationIndex = 0;
    executedMigrationIndex < executedMigrations.length;
    executedMigrationIndex++
  ) {
    const id = executedMigrationIndex + 1;
    const executedMigration = executedMigrations[executedMigrationIndex];
    const migration = migrations[executedMigrationIndex];
    if (executedMigration.id !== id)
      throw new Error(
        `Migrations corrupted: Migration with id ${id} is missing from the database`
      );
    if (executedMigration.source !== migration.source)
      throw new Error(
        `Migrations corrupted: Migration with id ${id} is different in the database from what was passed in migrations.\nDatabase:\n${executedMigration.source}\nMigration:\n${migration.source}`
      );
  }

  for (const migration of migrations.slice(executedMigrations.length)) {
    // FIXME: Use executeTransaction()
    database.transaction(() => {
      database.execute(migration);
      database.run(
        sql`INSERT INTO migrations (source) VALUES (${migration.source})`
      );
    })();
  }

  return migrations.length - executedMigrations.length;
};
