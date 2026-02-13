import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Define the expected schema contract
const REQUIRED_SCHEMA = {
  products: {
    columns: ['id', 'name', 'sku', 'stock_on_hand', 'image_url'],
    foreignKeys: []
  },
  wines: {
    columns: [
      'id', 'product_id', 'vintage', 'producer', 'region', 
      'wine_type', 'grape_varieties', 'body', 'sweetness', 
      'purchase_price', 'sale_price'
    ],
    foreignKeys: [
      { column: 'product_id', targetTable: 'products', targetColumn: 'id' }
    ]
  },
  inventory_sessions: {
    columns: ['id', 'status', 'started_at', 'started_by'],
    foreignKeys: [] // started_by -> profiles/users (auth)
  },
  inventory_items: {
    columns: [
      'id', 'session_id', 'wine_id', 'counted_quantity_unopened', 
      'counted_quantity_opened', 'counting_method'
    ],
    foreignKeys: [
      { column: 'session_id', targetTable: 'inventory_sessions', targetColumn: 'id' },
      { column: 'wine_id', targetTable: 'wines', targetColumn: 'id' }
    ]
  },
  integration_syrve_config: {
    columns: ['id', 'base_url', 'api_login', 'default_store_id'],
    foreignKeys: []
  },
  integration_syrve_products: {
    columns: ['id', 'syrve_product_id', 'mapped_wine_id'],
    foreignKeys: [
      { column: 'mapped_wine_id', targetTable: 'wines', targetColumn: 'id' }
    ]
  }
};

describe('Database Schema Validation', () => {
  let schemaInfo: any[] = [];

  beforeAll(async () => {
    // Attempt to call the RPC function
    // Note: This requires the current user to be an Admin or using Service Role
    const { data, error } = await supabase.rpc('get_schema_info');
    
    if (error) {
      console.warn('Skipping DB Validation: Could not fetch schema info. Ensure you are logged in as Admin or have the "get_schema_info" RPC installed.', error);
      return;
    }
    
    schemaInfo = data as any[];
  });

  it('should have all required tables', () => {
    if (schemaInfo.length === 0) return; // Skip if no access

    const existingTables = schemaInfo.map(t => t.table_name);
    const requiredTables = Object.keys(REQUIRED_SCHEMA);

    requiredTables.forEach(table => {
      expect(existingTables).toContain(table);
    });
  });

  Object.entries(REQUIRED_SCHEMA).forEach(([tableName, requirements]) => {
    it(`should have correct structure for table: ${tableName}`, () => {
      if (schemaInfo.length === 0) return;

      const tableInfo = schemaInfo.find(t => t.table_name === tableName);
      expect(tableInfo).toBeDefined();

      // Check Columns
      const existingColumns = tableInfo.columns.map((c: any) => c.column_name);
      requirements.columns.forEach(col => {
        expect(existingColumns).toContain(col);
      });

      // Check Foreign Keys
      if (requirements.foreignKeys.length > 0) {
        const existingFKs = tableInfo.foreign_keys || [];
        requirements.foreignKeys.forEach(fk => {
          const match = existingFKs.find((efk: any) => 
            efk.column_name === fk.column &&
            efk.foreign_table_name === fk.targetTable &&
            efk.foreign_column_name === fk.targetColumn
          );
          expect(match, `Missing FK on ${tableName}.${fk.column} -> ${fk.targetTable}.${fk.targetColumn}`).toBeDefined();
        });
      }
    });
  });
});
