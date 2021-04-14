import { test, expect } from "@jest/globals";
import { Database, sql } from "@leafac/sqlite";
import databaseMigrate from ".";

test("No migrations", () => {
  const database = new Database(":memory:");
  expect(databaseMigrate(database, [])).toMatchInlineSnapshot(`0`);
  expect(
    database.all(sql`SELECT * FROM "leafacMigrations"`)
  ).toMatchInlineSnapshot(`Array []`);
  database.close();
});

test("One migration run twice", () => {
  const database = new Database(":memory:");
  const migrations = [
    sql`CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL);`,
  ];

  expect(() => {
    database.all(sql`SELECT * FROM "users"`);
  }).toThrowErrorMatchingInlineSnapshot(`"no such table: users"`);

  expect(databaseMigrate(database, migrations)).toMatchInlineSnapshot(`1`);
  expect(database.all(sql`SELECT * FROM "leafacMigrations"`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1,
        "source": "CREATE TABLE \\"users\\" (\\"id\\" INTEGER PRIMARY KEY AUTOINCREMENT, \\"name\\" TEXT NOT NULL);",
      },
    ]
  `);
  expect(database.all(sql`SELECT * FROM "users"`)).toMatchInlineSnapshot(
    `Array []`
  );

  expect(databaseMigrate(database, migrations)).toMatchInlineSnapshot(`0`);
  expect(database.all(sql`SELECT * FROM "leafacMigrations"`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1,
        "source": "CREATE TABLE \\"users\\" (\\"id\\" INTEGER PRIMARY KEY AUTOINCREMENT, \\"name\\" TEXT NOT NULL);",
      },
    ]
  `);
  expect(database.all(sql`SELECT * FROM "users"`)).toMatchInlineSnapshot(
    `Array []`
  );

  database.close();
});

test("Multiple migrations run twice", () => {
  const database = new Database(":memory:");
  const migrations = [
    sql`CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL);`,
    sql`CREATE TABLE "threads" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "author" INTEGER NOT NULL REFERENCES "user", "title" TEXT NOT NULL);`,
  ];

  expect(() => {
    database.all(sql`SELECT * FROM "users"`);
  }).toThrowErrorMatchingInlineSnapshot(`"no such table: users"`);
  expect(() => {
    database.all(sql`SELECT * FROM "threads"`);
  }).toThrowErrorMatchingInlineSnapshot(`"no such table: threads"`);

  expect(databaseMigrate(database, migrations)).toMatchInlineSnapshot(`2`);
  expect(database.all(sql`SELECT * FROM "leafacMigrations"`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1,
        "source": "CREATE TABLE \\"users\\" (\\"id\\" INTEGER PRIMARY KEY AUTOINCREMENT, \\"name\\" TEXT NOT NULL);",
      },
      Object {
        "id": 2,
        "source": "CREATE TABLE \\"threads\\" (\\"id\\" INTEGER PRIMARY KEY AUTOINCREMENT, \\"author\\" INTEGER NOT NULL REFERENCES \\"user\\", \\"title\\" TEXT NOT NULL);",
      },
    ]
  `);
  expect(database.all(sql`SELECT * FROM "users"`)).toMatchInlineSnapshot(
    `Array []`
  );
  expect(database.all(sql`SELECT * FROM "threads"`)).toMatchInlineSnapshot(
    `Array []`
  );

  expect(databaseMigrate(database, migrations)).toMatchInlineSnapshot(`0`);
  expect(database.all(sql`SELECT * FROM "leafacMigrations"`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1,
        "source": "CREATE TABLE \\"users\\" (\\"id\\" INTEGER PRIMARY KEY AUTOINCREMENT, \\"name\\" TEXT NOT NULL);",
      },
      Object {
        "id": 2,
        "source": "CREATE TABLE \\"threads\\" (\\"id\\" INTEGER PRIMARY KEY AUTOINCREMENT, \\"author\\" INTEGER NOT NULL REFERENCES \\"user\\", \\"title\\" TEXT NOT NULL);",
      },
    ]
  `);
  expect(database.all(sql`SELECT * FROM "users"`)).toMatchInlineSnapshot(
    `Array []`
  );
  expect(database.all(sql`SELECT * FROM "threads"`)).toMatchInlineSnapshot(
    `Array []`
  );

  database.close();
});

test("One migration and then two", () => {
  const database = new Database(":memory:");
  const migrations = [
    sql`CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL);`,
    sql`CREATE TABLE "threads" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "author" INTEGER NOT NULL REFERENCES "user", "title" TEXT NOT NULL);`,
  ];

  expect(() => {
    database.all(sql`SELECT * FROM "users"`);
  }).toThrowErrorMatchingInlineSnapshot(`"no such table: users"`);
  expect(() => {
    database.all(sql`SELECT * FROM "threads"`);
  }).toThrowErrorMatchingInlineSnapshot(`"no such table: threads"`);

  expect(
    databaseMigrate(database, migrations.slice(0, 1))
  ).toMatchInlineSnapshot(`1`);
  expect(database.all(sql`SELECT * FROM "leafacMigrations"`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1,
        "source": "CREATE TABLE \\"users\\" (\\"id\\" INTEGER PRIMARY KEY AUTOINCREMENT, \\"name\\" TEXT NOT NULL);",
      },
    ]
  `);
  expect(database.all(sql`SELECT * FROM "users"`)).toMatchInlineSnapshot(
    `Array []`
  );
  expect(() => {
    database.all(sql`SELECT * FROM "threads"`);
  }).toThrowErrorMatchingInlineSnapshot(`"no such table: threads"`);

  expect(databaseMigrate(database, migrations)).toMatchInlineSnapshot(`1`);
  expect(database.all(sql`SELECT * FROM "leafacMigrations"`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1,
        "source": "CREATE TABLE \\"users\\" (\\"id\\" INTEGER PRIMARY KEY AUTOINCREMENT, \\"name\\" TEXT NOT NULL);",
      },
      Object {
        "id": 2,
        "source": "CREATE TABLE \\"threads\\" (\\"id\\" INTEGER PRIMARY KEY AUTOINCREMENT, \\"author\\" INTEGER NOT NULL REFERENCES \\"user\\", \\"title\\" TEXT NOT NULL);",
      },
    ]
  `);
  expect(database.all(sql`SELECT * FROM "users"`)).toMatchInlineSnapshot(
    `Array []`
  );
  expect(database.all(sql`SELECT * FROM "threads"`)).toMatchInlineSnapshot(
    `Array []`
  );

  database.close();
});

test("Insert a migration into leafacMigrations by hand", () => {
  const database = new Database(":memory:");
  const migrations = [
    sql`CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL);`,
  ];

  expect(databaseMigrate(database, migrations)).toMatchInlineSnapshot(`1`);
  expect(
    database.run(
      sql`INSERT INTO "leafacMigrations" ("id", "source") VALUES (${200}, ${"FAKE MIGRATION;"})`
    )
  ).toMatchInlineSnapshot(`
    Object {
      "changes": 1,
      "lastInsertRowid": 200,
    }
  `);
  expect(() => {
    databaseMigrate(database, migrations);
  }).toThrowErrorMatchingInlineSnapshot(
    `"The AUTOINCREMENT sequence of the leafacMigrations table (200) doesn’t match its number of rows (2). Did you manipulate the leafacMigrations table by hand? If so, you must get to a consistent state before trying to migrate again."`
  );

  database.close();
});

test("Delete a migration from leafacMigrations by hand", () => {
  const database = new Database(":memory:");
  const migrations = [
    sql`CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL);`,
  ];

  expect(databaseMigrate(database, migrations)).toMatchInlineSnapshot(`1`);
  expect(database.run(sql`DELETE FROM "leafacMigrations" WHERE "id" = ${1}`))
    .toMatchInlineSnapshot(`
    Object {
      "changes": 1,
      "lastInsertRowid": 1,
    }
  `);
  expect(() => {
    databaseMigrate(database, migrations);
  }).toThrowErrorMatchingInlineSnapshot(
    `"The AUTOINCREMENT sequence of the leafacMigrations table (1) doesn’t match its number of rows (0). Did you manipulate the leafacMigrations table by hand? If so, you must get to a consistent state before trying to migrate again."`
  );

  database.close();
});

test("Pass fewer migrations than already run", () => {
  const database = new Database(":memory:");

  expect(
    databaseMigrate(database, [
      sql`CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL);`,
    ])
  ).toMatchInlineSnapshot(`1`);
  expect(() => {
    databaseMigrate(database, []);
  }).toThrowErrorMatchingInlineSnapshot(
    `"The number of migrations provided (0) is less than the number of migrations that have already run in the database (1). Did you forget to pass some of the migrations?"`
  );

  database.close();
});

test("Change a migration", () => {
  const database = new Database(":memory:");

  expect(
    databaseMigrate(database, [
      sql`CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL);`,
    ])
  ).toMatchInlineSnapshot(`1`);
  expect(() => {
    databaseMigrate(database, [sql`SOMETHING ELSE;`]);
  }).toThrowErrorMatchingInlineSnapshot(`
    "Migration index 0 is different from leafacMigrations row 1.
    Migration:
    SOMETHING ELSE;
    leafacMigrations:
    CREATE TABLE \\"users\\" (\\"id\\" INTEGER PRIMARY KEY AUTOINCREMENT, \\"name\\" TEXT NOT NULL);"
  `);

  database.close();
});

test("Invalid SQL", () => {
  const database = new Database(":memory:");

  expect(() => {
    databaseMigrate(database, [sql`I AM INVALID SQL;`]);
  }).toThrowErrorMatchingInlineSnapshot(`
    "Error running migration 0.
    Migration: {
      \\"source\\": \\"I AM INVALID SQL;\\",
      \\"parameters\\": []
    }
    Error: SqliteError: near \\"I\\": syntax error"
  `);
  expect(
    databaseMigrate(database, [
      sql`CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL);`,
    ])
  ).toMatchInlineSnapshot(`1`);
  expect(database.all(sql`SELECT * FROM "leafacMigrations"`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1,
        "source": "CREATE TABLE \\"users\\" (\\"id\\" INTEGER PRIMARY KEY AUTOINCREMENT, \\"name\\" TEXT NOT NULL);",
      },
    ]
  `);

  database.close();
});

test("Invalid SQL because of interpolation", () => {
  const database = new Database(":memory:");

  expect(() => {
    databaseMigrate(database, [
      sql`INSERT INTO "users" ("name") VALUES (${"Leandro Facchinetti"});`,
    ]);
  }).toThrowErrorMatchingInlineSnapshot(`
    "Error running migration 0.
    Migration: {
      \\"source\\": \\"INSERT INTO \\\\\\"users\\\\\\" (\\\\\\"name\\\\\\") VALUES (?);\\",
      \\"parameters\\": [
        \\"Leandro Facchinetti\\"
      ]
    }
    Error: Error: Failed to execute({
      \\"source\\": \\"INSERT INTO \\\\\\"users\\\\\\" (\\\\\\"name\\\\\\") VALUES (?);\\",
      \\"parameters\\": [
        \\"Leandro Facchinetti\\"
      ]
    }) because execute() doesn’t support queries with parameters"
  `);
  expect(
    databaseMigrate(database, [
      sql`CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL);`,
    ])
  ).toMatchInlineSnapshot(`1`);
  expect(database.all(sql`SELECT * FROM "leafacMigrations"`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1,
        "source": "CREATE TABLE \\"users\\" (\\"id\\" INTEGER PRIMARY KEY AUTOINCREMENT, \\"name\\" TEXT NOT NULL);",
      },
    ]
  `);

  database.close();
});

test("An error rolls back all migrations", () => {
  const database = new Database(":memory:");

  expect(() => {
    databaseMigrate(database, [
      sql`CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL);`,
      sql`INSERT INTO "users" ("name") VALUES (${"Leandro Facchinetti"});`,
    ]);
  }).toThrowErrorMatchingInlineSnapshot(`
    "Error running migration 1.
    Migration: {
      \\"source\\": \\"INSERT INTO \\\\\\"users\\\\\\" (\\\\\\"name\\\\\\") VALUES (?);\\",
      \\"parameters\\": [
        \\"Leandro Facchinetti\\"
      ]
    }
    Error: Error: Failed to execute({
      \\"source\\": \\"INSERT INTO \\\\\\"users\\\\\\" (\\\\\\"name\\\\\\") VALUES (?);\\",
      \\"parameters\\": [
        \\"Leandro Facchinetti\\"
      ]
    }) because execute() doesn’t support queries with parameters"
  `);
  expect(() => {
    database.all(sql`SELECT * FROM "users"`);
  }).toThrowErrorMatchingInlineSnapshot(`"no such table: users"`);
  expect(
    databaseMigrate(database, [
      sql`CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL);`,
    ])
  ).toMatchInlineSnapshot(`1`);
  expect(database.all(sql`SELECT * FROM "leafacMigrations"`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1,
        "source": "CREATE TABLE \\"users\\" (\\"id\\" INTEGER PRIMARY KEY AUTOINCREMENT, \\"name\\" TEXT NOT NULL);",
      },
    ]
  `);

  database.close();
});

test.skip(".defaultSafeIntegers()", () => {
  const database = new Database(":memory:");
  database.defaultSafeIntegers();
  const migrations = [
    sql`CREATE TABLE "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL);`,
  ];

  expect(() => {
    database.all(sql`SELECT * FROM "users"`);
  }).toThrowErrorMatchingInlineSnapshot(`"no such table: users"`);

  expect(databaseMigrate(database, migrations)).toMatchInlineSnapshot(`1`);
  expect(database.all(sql`SELECT * FROM "leafacMigrations"`))
    .toMatchInlineSnapshot(`
    Array [
      Object {
        "id": 1n,
        "source": "CREATE TABLE \"users\" (\"id\" INTEGER PRIMARY KEY AUTOINCREMENT, \"name\" TEXT NOT NULL);",
      },
    ]
  `);
  expect(database.all(sql`SELECT * FROM "users"`)).toMatchInlineSnapshot(
    `Array []`
  );

  expect(databaseMigrate(database, migrations)).toMatchInlineSnapshot(`0`);
  expect(
    database.all(sql`SELECT * FROM "leafacMigrations"`)
  ).toMatchInlineSnapshot();
  expect(database.all(sql`SELECT * FROM "users"`)).toMatchInlineSnapshot(
    `Array []`
  );

  database.close();
});
