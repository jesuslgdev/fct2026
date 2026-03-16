# HU-10 — Supplier-Product Relationship Management

## Goal
Implement full CRUD for supplier-product associations (add, update price, remove, list, import via Excel) following existing Clean Architecture patterns, divided into small PRs (<500 lines each).

## Branch Chain
All branches chain from `feature/backend_catalog_products_api`:

```
feature/backend_catalog_products_api (base)
  └─ PR1: feature/backend_supplier_product_core
       └─ PR2: feature/backend_supplier_product_api
            └─ PR3: feature/backend_supplier_product_import
                 └─ PR4: feature/backend_supplier_product_tests
```

## What Already Exists
- **Entity**: `supplier_product.py` — SupplierProduct(supplier_id PK, product_id PK, supplier_price)
- **Migration**: `c3d4e5f6a1b2_add_supplier_products_table.py` — BUT no FK to products table
- **Repo interface**: `ISupplierRepository.get_products_by_supplier()` exists
- **Repo impl**: `SupplierRepository.get_products_by_supplier()` exists
- **GetSupplierUseCase**: Returns `tuple[Supplier, list[SupplierProduct]]`
- **SupplierProductDTO**: Has `product_id` + `supplier_price` (needs `product_name`, `product_code`, `category_name`)
- **Exception info**: 3xxx range (suppliers), uses 31xx for suppliers

## What Needs to Be Built

### PR1: Core domain + repository (~350 líneas) `[complete]`
**Branch**: `feature/backend_supplier_product_core`

Files created/modified:
1. **New migration**: Added FK from `supplier_products.product_id` → `products.product_id` (`4bd6e6c99238`)
2. **Supplier exceptions**: Added error codes 32xx
3. **ISupplierRepository**: Added methods for association management
4. **SupplierRepository**: Implemented new methods
5. **Shared interface**: Created `shared/domain/interfaces/i_product_reader.py`
6. **ProductRepository**: Implemented `IProductReader`


### PR2: Use cases + API endpoints (~400 lines) `[complete]`
**Branch**: `feature/backend_supplier_product_api`

Files created/modified:
1. **Detail Entities**: `supplier_product_detail.py`, `product_supplier_detail.py`
2. **Use case interfaces**: `i_add_product_to_supplier_use_case.py`, etc. (5 files)
3. **Use case implementations**: `add_product_to_supplier_use_case.py`, etc. (5 files)
4. **Schemas**: Added `AddSupplierProductRequest`, `UpdateSupplierProductPriceRequest`, enriched `SupplierProductDTO`, `ProductSupplierDTO`
5. **Router**: Added endpoints to `suppliers/router.py`
6. **Catalog router**: Added `GET /products/{id}/suppliers` to `catalog/router.py`
7. **Dependencies**: Wired all 5 new use cases

### PR3: Excel import for supplier-products (~350 lines) `[complete]`
**Branch**: `feature/backend_supplier_product_import`

Files created/modified:
1. **Template use case**: `download_supplier_product_template_use_case.py`
2. **Import use case**: `import_supplier_products_use_case.py`
3. **Use case interfaces**: `i_download_supplier_product_template_use_case.py`, `i_import_supplier_products_use_case.py`
4. **ISupplierRepository**: Added `bulk_create_products()`
5. **SupplierRepository**: Implemented `bulk_create_products()`
6. **IProductReader**: Added `get_by_code()`
7. **Router**: Added `GET /{id}/products/template` and `POST /{id}/products/import`
8. **Dependencies**: Wired import use cases

### PR4: Integration tests (~400 lines) `[complete]`
**Branch**: `feature/backend_supplier_product_tests`

Files created/modified:
1. **Test file**: `tests/test_supplier_products.py` — full integration tests
   - Verified: Add/update/remove associations
   - Verified: Paginated listings (Supplier side and Catalog side)
   - Verified: Template download and Excel import endpoints

## Security Requirements
- **Read**: All authenticated users (`get_current_user`)
- **Write/Delete**: Admin or Purchases Manager (`require_purchases_manager_or_admin`)

## Key Patterns to Follow
- Domain entities are pure Python (no Pydantic in domain/application layers)
- One class per file
- Interfaces in `domain/interfaces/`
- DTOs in `infrastructure/http/schemas.py`
- Factory functions in `composition/dependencies.py`
- Cross-module access via shared interfaces (`shared/domain/interfaces/`)

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | | |
