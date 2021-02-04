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

test("Delete migrations from leafac_migrations", () => {
  const database = new Database(":memory:");
  const migrations = [
    sql`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);`,
  ];

  databaseMigrate(database, migrations);
  database.execute(sql`DELETE FROM leafac_migrations WHERE id = 1`);
  expect(() => {
    databaseMigrate(database, migrations);
  }).toThrowErrorMatchingInlineSnapshot(
    `"The number of executed migrations (1) doesn’t match the number of rows in the leafac_migrations table (0). Did you delete rows from the leafac_migrations table? If so, you must reinsert them before trying to migrate again."`
  );

  database.close();
});

test("More migrations in leafac_migrations than passed in", () => {
  const database = new Database(":memory:");

  databaseMigrate(database, [
    sql`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);`,
  ]);
  expect(() => {
    databaseMigrate(database, []);
  }).toThrowErrorMatchingInlineSnapshot(
    `"The number of executed migrations (1) is greater than the number of migrations provided (0)"`
  );

  database.close();
});

test("Change a migration", () => {
  const database = new Database(":memory:");

  databaseMigrate(database, [
    sql`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);`,
  ]);
  expect(() => {
    databaseMigrate(database, [sql`SOMETHING ELSE;`]);
  }).toThrowErrorMatchingInlineSnapshot(`
    "Migration (index = 0, id = 1) is different in the leafac_migrations table from what was passed in migrations.
    leafac_migrations table:
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);
    Migration:
    SOMETHING ELSE;"
  `);

  database.close();
});

test("Invalid SQL", () => {
  const database = new Database(":memory:");

  expect(() => {
    databaseMigrate(database, [sql`I AM INVALID SQL;`]);
  }).toThrowErrorMatchingInlineSnapshot(`
    "Error running migration (index = 0, would have been id = 1).
    Migration: {
      \\"source\\": \\"I AM INVALID SQL;\\",
      \\"parameters\\": []
    }
    Error: SqliteError: near \\"I\\": syntax error"
  `);
  databaseMigrate(database, [
    sql`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);`,
  ]);
  expect(database.all(sql`SELECT * FROM leafac_migrations`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1,
        "source": "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);",
      },
    ]
  `);

  database.close();
});
