// src/tests/utils/database/database.ts
import { Connection, createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";

export async function createDBConnection(): Promise<Connection> {
  dotenv.config();
  const { MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASS, MYSQL_DB } = process.env;

  const connection: Connection = await createConnection({
    host: MYSQL_HOST,
    port: parseInt(MYSQL_PORT as string),
    user: MYSQL_USER,
    password: MYSQL_PASS,
    database: MYSQL_DB,
  });

  return connection;
}