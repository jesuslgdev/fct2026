# Findings — HU-10 Supplier-Product

## Existing Code Analysis

### Entity (already exists)
- `SupplierProduct` at `modules/suppliers/domain/entities/supplier_product.py`
- Composite PK (supplier_id, product_id), supplier_price Decimal(10,2)
- FK only to suppliers.supplier_id — **NO FK to products.product_id**

### Migration (already exists)
- `c3d4e5f6a1b2_add_supplier_products_table.py` — depends on `bea4c4d77e2b`
- Products table migration `6420ed7a69c6` depends on `c4f8a21e9d35`
- Need new migration to add FK constraint

### Exception numbering
- Suppliers module uses 3xxx range
- 31xx = supplier errors (3101 NOT_FOUND, 3102 ALREADY_EXISTS)
- Use 32xx for supplier-product errors

### Cross-module access pattern
- `shared/domain/interfaces/i_client_reader.py` shows the pattern
- `IClientReader` defines `get_by_id()` and `get_name_by_id()`
- `ClientRepository` implements both `IClientRepository` and `IClientReader`
- Need `IProductReader` for suppliers module to check product existence/active status

### Current SupplierProductDTO is minimal
- Only has `product_id` and `supplier_price`
- HU-10 requires: product_name, product_code, category_name (from supplier view)
- HU-10 requires: supplier_name, tax_id (from product view)
- These need JOIN queries or multiple repo calls

### Permission model
- `require_purchases_manager_or_admin` already exists in `composition/security.py`
- Read access: `get_current_user` (all authenticated)
- Write access: `require_purchases_manager_or_admin`
