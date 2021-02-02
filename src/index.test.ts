import { test, expect } from "@jest/globals";
import { Database, sql } from "@leafac/sqlite";
import databaseMigrate from ".";

test("No migrations", () => {
  const database = new Database(":memory:");
  databaseMigrate(database, []);
  expect(database.all(sql`SELECT * FROM migrations`)).toHaveLength(0);
  database.close();
});

test("One migration run twice", () => {
  const database = new Database(":memory:");
  const migrations = [
    sql`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);`,
  ];
  databaseMigrate(database, migrations);
  databaseMigrate(database, migrations);
  expect(database.all(sql`SELECT * FROM migrations`)).toHaveLength(1);
  database.close();
});

test("Multiple migration run twice", () => {
  const database = new Database(":memory:");
  const migrations = [
    sql`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);`,
    sql`CREATE TABLE threads (id INTEGER PRIMARY KEY AUTOINCREMENT, author INTEGER REFERENCES user, title TEXT);`,
  ];
  databaseMigrate(database, migrations);
  databaseMigrate(database, migrations);
  expect(database.all(sql`SELECT * FROM migrations`)).toHaveLength(2);
  database.close();
});
