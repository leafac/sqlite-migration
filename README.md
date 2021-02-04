<h1 align="center">@leafac/sqlite-migration</h1>
<h3 align="center">A lightweight migration system for <a href="https://npm.im/@leafac/sqlite">@leafac/sqlite</a></h3>
<p align="center">
<a href="https://github.com/leafac/sqlite-migration"><img src="https://img.shields.io/badge/Source---" alt="Source"></a>
<a href="https://www.npmjs.com/package/@leafac/sqlite-migration"><img alt="Package" src="https://badge.fury.io/js/%40leafac%2Fsqlite-migration.svg"></a>
<a href="https://github.com/leafac/sqlite-migrations/actions"><img src="https://github.com/leafac/sqlite-migrations/workflows/.github/workflows/main.yml/badge.svg" alt="Continuous Integration"></a>
</p>

### Installation

```console
$ npm install @leafac/sqlite @leafac/sqlite-migration
```

### Features, Usage, and Example

@leafac/sqlite-migration provides a `databaseMigrate()` function which you must call with a @leafac/sqlite database and an array of migrations. For example:

```typescript
import { Database, sql } from "@leafac/sqlite";
import databaseMigrate from "@leafac/sqlite-migration";

const database = new Database(":memory:");

// First time running migration.
console.log(
  databaseMigrate(database, [
    sql`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);`,
  ])
); // => 1

// Run it again, and nothing changes. For best results, run databaseMigrate() at your application startup.
console.log(
  databaseMigrate(database, [
    sql`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);`,
  ])
); // => 0

// At some point in the future, a new migration comes in.
console.log(
  databaseMigrate(database, [
    sql`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);`,
    sql`CREATE TABLE threads (id INTEGER PRIMARY KEY AUTOINCREMENT, author INTEGER NOT NULL REFERENCES user, title TEXT NOT NULL);`,
  ])
); // => 1
```

The `databaseMigrate()` function returns the number of migrations that were executed.

#### No Down Migrations

Most migration systems (if not all), provide a way to **undo** migrations; something called **down** migrations. @leafac/sqlite-migration doesn’t provide a down migration mechanism.

I believe that down migrations are more trouble to maintain (they can be a lot of work!) than they’re worth, particularly in small applications. Why? Because down migrations have two main selling points:

1. You may go back and forward with the database schema in development (think of alternating back and forth while working on different feature branches that change the database schema).
2. You may rollback a deployment that goes wrong in production.

But I don’t think these selling points hold up:

1. You may recreate the database from scratch whenever you need in development.
2. You almost never want to run a down migration in production because that would make you lose data.

In case something goes wrong, @leafac/sqlite-migration requires you to write a new migration that undoes the troublesome previous migration. The only way through is forward!

### How It Works

@leafac/sqlite-migration creates a table in your database with the following schema:

```sql
CREATE TABLE IF NOT EXISTS leafacMigrations (id INTEGER PRIMARY KEY AUTOINCREMENT, source TEXT NOT NULL);
```

When migrating, it checks the migrations that you passed against the ones stored in the `leafacMigrations`. Any inconsistencies cause errors, and any new migration is run and stored for next time.

You must never manipulate `leafacMigrations` by hand; most likely that’ll lead to a corrupted migration state.

### Related Projects

- <https://npm.im/@leafac/sqlite>: [better-sqlite3](https://npm.im/better-sqlite3) with tagged template literals. That’s the package to which @leafac/sqlite-migration adds a migration system.
- <https://npm.im/@leafac/html>: Use tagged template literals as an HTML template engine.

### Prior Art

- <https://npm.im/sqlite>, and <https://npm.im/better-sqlite3-helper>: These packages include lightweight migration systems. @leafac/sqlite-migration is even more lightweight: It doesn’t support **down** migrations and it requires the migrations to be passed as an array, as opposed to, for example, being stored in SQL files. (But you can come up with this array in any way you want, including, for example, reading from a bunch of SQL files.) Also, these other packages don’t support @leafac/sqlite and its `sql` tagged template literal (naturally).
