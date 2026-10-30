#!/usr/bin/env -S node

import type { Contract as End } from '../../snapshots/b157ccfd21d99b3ad29badfb4207849c4aa18bd8185367f97260b8b3a9a95430/contract';

import endContract from '../../snapshots/b157ccfd21d99b3ad29badfb4207849c4aa18bd8185367f97260b8b3a9a95430/contract.json' with { type: 'json' };

import type { Contract as Start } from '../../snapshots/8dd3f22256ef27f0de6cfa7ec28145858e6c0e7444acb0e89b29c1d109ffe668/contract';

import startContract from '../../snapshots/8dd3f22256ef27f0de6cfa7ec28145858e6c0e7444acb0e89b29c1d109ffe668/contract.json' with { type: 'json' };

import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'lab_progress',

        columns: [
          col('account_id', 'uuid', {
            notNull: true,
            codecRef: { codecId: 'pg/uuid@1' },
          }),

          col('account_type', 'character varying(20)', {
            notNull: true,
            codecRef: {
              codecId: 'sql/varchar@1',
              typeParams: { length: 20 },
            },
          }),

          col('attempts', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),

          col('completed_at', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),

          col('hint_penalty', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),

          col('hints_revealed', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),

          col('lab_slug', 'character varying(60)', {
            notNull: true,
            codecRef: {
              codecId: 'sql/varchar@1',
              typeParams: { length: 60 },
            },
          }),

          col('score', 'int4', {
            codecRef: { codecId: 'pg/int4@1' },
          }),

          col('started_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),

          col('state', 'jsonb', {
            notNull: true,
            default: fn("'{}'::jsonb"),
            codecRef: { codecId: 'pg/jsonb@1' },
          }),

          col('status', 'character varying(20)', {
            notNull: true,
            default: lit('in_progress'),
            codecRef: {
              codecId: 'sql/varchar@1',
              typeParams: { length: 20 },
            },
          }),

          col('updated_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
        ],

        constraints: [
          primaryKey(
            ['account_id', 'account_type', 'lab_slug'],
            { name: 'lab_progress_pkey' },
          ),

          checkExpression(
            'ck_lab_progress_account_type_v1_bed3e337',
            "((account_type)::text = ANY (ARRAY[('learner'::character varying)::text, ('organisation'::character varying)::text, ('professionals'::character varying)::text]))",
          ),

          checkExpression(
            'ck_lab_progress_status_v1_d87d9043',
            "((status)::text = ANY (ARRAY[('in_progress'::character varying)::text, ('completed'::character varying)::text]))",
          ),
        ],
      }),

      this.addColumn({
        schema: 'public',
        table: 'admins',

        column: col('token_version', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),

      this.addColumn({
        schema: 'public',
        table: 'login_otps',

        column: col('attempts', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),

      this.addColumn({
        schema: 'public',
        table: 'login_otps',

        column: col('last_sent_at', 'timestamptz', {
          notNull: true,
          default: fn('now()'),
          codecRef: { codecId: 'pg/timestamptz-temporal@1' },
        }),
      }),

      this.addColumn({
        schema: 'public',
        table: 'login_otps',

        column: col('resend_count', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),

      this.addColumn({
        schema: 'public',
        table: 'organisation',

        column: col('token_version', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),

      this.addColumn({
        schema: 'public',
        table: 'professionals',

        column: col('token_version', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),

      this.addColumn({
        schema: 'public',
        table: 'users',

        column: col('token_version', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),

      this.addColumn({
        schema: 'public',
        table: 'login_otps',

        column: col('login_token_hash', 'text', {
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),

      this.setNotNull({
        schema: 'public',
        table: 'login_otps',
        column: 'login_token_hash',
      }),

      this.alterColumnType({
        schema: 'public',
        table: 'login_otps',
        column: 'otp',

        options: {
          qualifiedTargetType: 'text',
          formatTypeExpected: 'text',
          rawTargetTypeForLabel: 'text',
        },
      }),

      this.addUnique({
        schema: 'public',
        table: 'login_otps',
        constraint: 'login_otps_login_token_hash_key',
        columns: ['login_token_hash'],
      }),

      this.createIndex({
        schema: 'public',
        table: 'lab_progress',
        index: 'lab_progress_lab_slug_idx',
        columns: ['lab_slug', 'status'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);