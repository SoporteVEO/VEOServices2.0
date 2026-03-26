import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import sql, { type ConnectionPool } from 'mssql';

@Injectable()
export class BriloDatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(BriloDatabaseService.name);
  private poolPromise: Promise<ConnectionPool> | undefined;

  private createPool(): Promise<ConnectionPool> {
    const {
      SQLSERVER_HOST,
      SQLSERVER_PORT,
      SQLSERVER_USERNAME,
      SQLSERVER_PASSWORD,
    } = process.env;

    if (!SQLSERVER_HOST || !SQLSERVER_USERNAME || !SQLSERVER_PASSWORD) {
      throw new Error(
        'Missing required SQL Server env vars: SQLSERVER_HOST, SQLSERVER_USERNAME, SQLSERVER_PASSWORD',
      );
    }

    return sql.connect({
      server: SQLSERVER_HOST,
      port: SQLSERVER_PORT ? Number(SQLSERVER_PORT) : 1433,
      user: SQLSERVER_USERNAME,
      password: SQLSERVER_PASSWORD,
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    });
  }

  private getPool(): Promise<ConnectionPool> {
    if (!this.poolPromise) {
      this.poolPromise = this.createPool();
    }
    return this.poolPromise;
  }

  async query<T = any>(
    queryText: string,
    params: Record<string, unknown> = {},
  ): Promise<T[]> {
    const pool = await this.getPool();
    const request = pool.request();

    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });

    const result = await request.query(queryText);
    return result.recordset as T[];
  }

  async onModuleDestroy() {
    if (this.poolPromise) {
      try {
        const pool = await this.poolPromise;
        await pool.close();
      } catch (err) {
        this.logger.warn('Error closing SQL Server pool', err);
      }
    }
  }
}
