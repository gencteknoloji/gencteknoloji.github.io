import { getSupabaseClient } from '@/lib/supabase';
import type { DbMock, SqlRunResult } from '@/types/database';

const noopTransaction = new Set(['BEGIN TRANSACTION', 'COMMIT', 'ROLLBACK', 'BEGIN']);

function isTransactionStatement(sql: string): boolean {
  return noopTransaction.has(sql.trim().toUpperCase());
}

export const db: DbMock = {
  async all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (isTransactionStatement(sql)) return [];
    const client = getSupabaseClient();
    if (!client) return [];
    const { data, error } = await client.rpc('execute_raw_sql', { sql_query: sql, params });
    if (error) throw new Error(error.message);
    return data || [];
  },

  async get<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
    if (isTransactionStatement(sql)) return null;
    const client = getSupabaseClient();
    if (!client) return null;
    const { data, error } = await client.rpc('execute_raw_sql', { sql_query: sql, params });
    if (error) throw new Error(error.message);
    return data?.length ? data[0] : null;
  },

  async run(sql: string, params: unknown[] = []): Promise<SqlRunResult> {
    if (isTransactionStatement(sql)) return { changes: 0, lastID: null };
    const client = getSupabaseClient();
    if (!client) return { changes: 0, lastID: null };
    const postgresSql = sql.includes('MAX(0,') ? sql.replace(/MAX\(0,\s*/g, 'GREATEST(0, ') : sql;
    const { error } = await client.rpc('execute_raw_sql', { sql_query: postgresSql, params });
    if (error) throw new Error(error.message);
    return { changes: 1, lastID: null };
  },
};
