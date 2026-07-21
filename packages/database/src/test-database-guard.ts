/** Refuses to let destructive integration suites point at a non-test database. */
export const guardedTestDatabaseUrl = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const url = new URL(value);
  const databaseName = decodeURIComponent(url.pathname.replace(/^\//u, ""));
  if (!/(?:_test|_ci)$/u.test(databaseName)) {
    throw new Error(`TEST_DATABASE_URL must name a dedicated *_test or *_ci database; received ${databaseName || "<empty>"}.`);
  }
  return value;
};
