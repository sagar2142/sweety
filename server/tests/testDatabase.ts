/**
 * Safety net: the tests delete every row between runs, so refuse to run
 * against any database whose name does not end with "_test".
 */
export function assertIsTestDatabase(connectionString: string): void {
  const databaseName = new URL(connectionString).pathname.replace('/', '');
  if (!databaseName.endsWith('_test')) {
    throw new Error(`Refusing to run tests against "${databaseName}". Use a database whose name ends with "_test".`);
  }
}
