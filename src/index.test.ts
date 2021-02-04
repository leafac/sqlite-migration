import { test, expect } from "@jest/globals";
import { Database, sql } from "@leafac/sqlite";
import databaseMigrate from ".";

test("No migrations", () => {
  const database = new Database(":memory:");
  databaseMigrate(database, []);
  expect(
    database.all(sql`SELECT * FROM leafac_migrations`)
  ).toMatchInlineSnapshot(`Array []`);
  database.close();
});

test("One migration run twice", () => {
  const database = new Database(":memory:");
  const migrations = [
    sql`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);`,
  ];

  expect(() => {
    database.all(sql`SELECT * FROM users`);
  }).toThrowErrorMatchingInlineSnapshot(`"no such table: users"`);

  databaseMigrate(database, migrations);
  expect(database.all(sql`SELECT * FROM leafac_migrations`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1,
        "source": "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);",
      },
    ]
  `);
  expect(database.all(sql`SELECT * FROM users`)).toMatchInlineSnapshot(
    `Array []`
  );

  databaseMigrate(database, migrations);
  expect(database.all(sql`SELECT * FROM leafac_migrations`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1,
        "source": "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);",
      },
    ]
  `);
  expect(database.all(sql`SELECT * FROM users`)).toMatchInlineSnapshot(
    `Array []`
  );

  database.close();
});

test("Multiple migrations run twice", () => {
  const database = new Database(":memory:");
  const migrations = [
    sql`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);`,
    sql`CREATE TABLE threads (id INTEGER PRIMARY KEY AUTOINCREMENT, author INTEGER NOT NULL REFERENCES user, title TEXT NOT NULL);`,
  ];

  expect(() => {
    database.all(sql`SELECT * FROM users`);
  }).toThrowErrorMatchingInlineSnapshot(`"no such table: users"`);
  expect(() => {
    database.all(sql`SELECT * FROM threads`);
  }).toThrowErrorMatchingInlineSnapshot(`"no such table: threads"`);

  databaseMigrate(database, migrations);
  expect(database.all(sql`SELECT * FROM leafac_migrations`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1,
        "source": "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);",
      },
      Object {
        "id": 2,
        "source": "CREATE TABLE threads (id INTEGER PRIMARY KEY AUTOINCREMENT, author INTEGER NOT NULL REFERENCES user, title TEXT NOT NULL);",
      },
    ]
  `);
  expect(database.all(sql`SELECT * FROM users`)).toMatchInlineSnapshot(
    `Array []`
  );
  expect(database.all(sql`SELECT * FROM threads`)).toMatchInlineSnapshot(
    `Array []`
  );

  databaseMigrate(database, migrations);
  expect(database.all(sql`SELECT * FROM leafac_migrations`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1,
        "source": "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);",
      },
      Object {
        "id": 2,
        "source": "CREATE TABLE threads (id INTEGER PRIMARY KEY AUTOINCREMENT, author INTEGER NOT NULL REFERENCES user, title TEXT NOT NULL);",
      },
    ]
  `);
  expect(database.all(sql`SELECT * FROM users`)).toMatchInlineSnapshot(
    `Array []`
  );
  expect(database.all(sql`SELECT * FROM threads`)).toMatchInlineSnapshot(
    `Array []`
  );

  database.close();
});

test("One migration and then two", () => {
  const database = new Database(":memory:");
  const migrations = [
    sql`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);`,
    sql`CREATE TABLE threads (id INTEGER PRIMARY KEY AUTOINCREMENT, author INTEGER NOT NULL REFERENCES user, title TEXT NOT NULL);`,
  ];

  expect(() => {
    database.all(sql`SELECT * FROM users`);
  }).toThrowErrorMatchingInlineSnapshot(`"no such table: users"`);
  expect(() => {
    database.all(sql`SELECT * FROM threads`);
  }).toThrowErrorMatchingInlineSnapshot(`"no such table: threads"`);

  databaseMigrate(database, migrations.slice(0, 1));
  expect(database.all(sql`SELECT * FROM leafac_migrations`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1,
        "source": "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);",
      },
    ]
  `);
  expect(database.all(sql`SELECT * FROM users`)).toMatchInlineSnapshot(
    `Array []`
  );
  expect(() => {
    database.all(sql`SELECT * FROM threads`);
  }).toThrowErrorMatchingInlineSnapshot(`"no such table: threads"`);

  databaseMigrate(database, migrations);
  expect(database.all(sql`SELECT * FROM leafac_migrations`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1,
        "source": "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);",
      },
      Object {
        "id": 2,
        "source": "CREATE TABLE threads (id INTEGER PRIMARY KEY AUTOINCREMENT, author INTEGER NOT NULL REFERENCES user, title TEXT NOT NULL);",
      },
    ]
  `);
  expect(database.all(sql`SELECT * FROM users`)).toMatchInlineSnapshot(
    `Array []`
  );
  expect(database.all(sql`SELECT * FROM threads`)).toMatchInlineSnapshot(
    `Array []`
  );

  database.close();
});
