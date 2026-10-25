import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const trainingStates=sqliteTable('training_states',{owner:text('owner').primaryKey(),payload:text('payload').notNull(),revision:integer('revision').notNull().default(1),updatedAt:text('updated_at').notNull()});
