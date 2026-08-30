// Inert @/db stub — used by suites that must never touch a database.
export const db = {
  select() { throw new Error('db.select() called in a suite that should not use it'); },
  insert() { throw new Error('db.insert() called in a suite that should not use it'); },
};
