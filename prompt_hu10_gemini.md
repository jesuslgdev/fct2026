# Prompt: Implementar HU-10 — Gestionar relación proveedor-producto

## Contexto del proyecto

Estás trabajando en un **ERP backend** con **FastAPI + PostgreSQL + SQLAlchemy async + Alembic + Firebase Auth**. El proyecto sigue **Clean Architecture** con módulos independientes. Cada módulo tiene: `domain/` (entidades, interfaces), `application/` (use cases) e `infrastructure/` (repos, HTTP router, schemas).

**Rama base**: `feature/backend_catalog_products_api`
**Cada PR debe ser <500 líneas** y crear una rama nueva que parte de la anterior (cadena de branches).

---

## Historia de Usuario HU-10

**COMO** Administrador / Gerente de Compras
**QUIERO** asociar productos a proveedores indicando el precio específico de cada proveedor para cada producto
**PARA** conocer qué proveedores suministran cada producto y a qué precio, facilitando la creación de compras.

### Criterios de Aceptación
1. Solo admin y gerentes del departamento de Compras pueden gestionar las asociaciones proveedor-producto.
2. La combinación proveedor + producto debe ser única (no duplicar).
3. El precio del proveedor debe ser decimal positivo > 0 con máximo 2 decimales.
4. Solo se pueden asociar proveedores y productos que estén activos.
5. Al eliminar una asociación, las compras históricas no se ven afectadas.
6. La tabla de asociaciones está paginada.
7. El precio del proveedor se usa como precio sugerido al añadir líneas en una compra.
8. Todos los usuarios pueden consultar las asociaciones, pero solo admin y gerentes de Compras pueden modificarlas.
9. El sistema permite importar asociaciones de forma masiva mediante Excel desde la vista de detalle del proveedor.
10. El sistema valida los datos del Excel y muestra errores en caso de registros inválidos.

### Vista desde detalle de proveedor
Muestra: nombre del producto (read-only), código de producto (read-only), categoría (read-only), precio del proveedor (editable). Permite añadir productos individualmente, modificar precios, eliminar asociaciones e importar masivamente vía Excel.

### Vista desde detalle de producto
Muestra: nombre del proveedor (read-only), CIF (read-only), precio del proveedor (editable). Permite añadir proveedores, modificar precios y eliminar asociaciones.

---

## Convenciones del proyecto (OBLIGATORIAS)

- **Todo el código en inglés**: variables, funciones, clases, comentarios, commits
- **Naming**: archivos en `snake_case`, clases en `PascalCase`
- **Un class por archivo**, EXCEPTO `schemas.py` que agrupa todos los DTOs Pydantic del módulo
- **DTOs**: solo en `infrastructure/http/schemas.py`. Los use cases reciben/retornan primitivos o entidades de dominio. NO Pydantic en capas application/domain
- **Domain layer**: puro Python (dataclasses), sin Pydantic, sin frameworks
- **Imports**: siempre al inicio del archivo, nunca inline
- **Sesiones**: `get_db()` como FastAPI dependency
- **Auth**: proteger endpoints con `Depends(get_current_user)` para lectura, `Depends(require_purchases_manager_or_admin)` para escritura
- **Acceso cross-module**: interfaces compartidas en `shared/domain/interfaces/` (patrón `IClientReader`)
- **Excepciones**: cada módulo tiene su rango numérico. Suppliers = 3xxx (31xx para suppliers, 32xx para supplier-products)
- **No añadir features extra** ni refactorizar código que no se toque
- **No añadir docstrings/comentarios** a código que no se cambie

---

## Lo que YA EXISTE en el código (NO recrear)

### 1. Entidad SupplierProduct (`modules/suppliers/domain/entities/supplier_product.py`)
```python
from decimal import Decimal
from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from shared.infrastructure.database.base_model import Base

class SupplierProduct(Base):
    __tablename__ = "supplier_products"
    supplier_id: Mapped[int] = mapped_column(Integer, ForeignKey("suppliers.supplier_id"), primary_key=True)
    product_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    supplier_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
```

### 2. Migración de la tabla (`alembic/versions/c3d4e5f6a1b2_add_supplier_products_table.py`)
- Crea tabla `supplier_products` con PK compuesta (supplier_id, product_id)
- FK solo a `suppliers.supplier_id` — **FALTA FK a `products.product_id`** (hay que añadirla con nueva migración)
- `down_revision = "bea4c4d77e2b"`

### 3. Migración de productos (`alembic/versions/6420ed7a69c6_create_products_table.py`)
- Crea tabla `products` con FK a `categories.category_id`
- `down_revision = "c4f8a21e9d35"`

### 4. ISupplierRepository (`modules/suppliers/domain/interfaces/repositories/i_supplier_repository.py`)
```python
from abc import ABC, abstractmethod
from modules.suppliers.domain.entities.supplier import Supplier
from modules.suppliers.domain.entities.supplier_product import SupplierProduct
from shared.domain.paginated_result import PaginatedResult

class ISupplierRepository(ABC):
    @abstractmethod
    async def get_all_paginated(self, page: int, page_size: int) -> PaginatedResult[Supplier]: ...
    @abstractmethod
    async def get_by_id(self, supplier_id: int) -> Supplier | None: ...
    @abstractmethod
    async def get_by_tax_id(self, tax_id: str) -> Supplier | None: ...
    @abstractmethod
    async def update(self, supplier_id: int, name: str | None, address: str | None, city: str | None, province: str | None, postal_code: str | None, phone: str | None, email: str | None) -> Supplier: ...
    @abstractmethod
    async def set_active(self, supplier_id: int, is_active: bool) -> None: ...
    @abstractmethod
    async def get_products_by_supplier(self, supplier_id: int) -> list[SupplierProduct]: ...
    @abstractmethod
    async def get_existing_tax_ids(self, tax_ids: list[str]) -> set[str]: ...
    @abstractmethod
    async def bulk_create(self, suppliers: list[Supplier]) -> int: ...
```

### 5. SupplierRepository (`modules/suppliers/infrastructure/repos/supplier_repository.py`)
Implementa `ISupplierRepository`. Ya tiene `get_products_by_supplier()`:
```python
async def get_products_by_supplier(self, supplier_id: int) -> list[SupplierProduct]:
    result = await self._db.execute(
        select(SupplierProduct).where(SupplierProduct.supplier_id == supplier_id)
    )
    return list(result.scalars().all())
```

### 6. GetSupplierUseCase (`modules/suppliers/application/get_supplier_use_case.py`)
```python
class GetSupplierUseCase(IGetSupplierUseCase):
    def __init__(self, repo: ISupplierRepository) -> None:
        self._repo = repo
    async def execute(self, supplier_id: int) -> tuple[Supplier, list[SupplierProduct]]:
        supplier = await self._repo.get_by_id(supplier_id)
        if supplier is None:
            raise SupplierException(SupplierExceptionInfo.SUPPLIER_NOT_FOUND)
        products = await self._repo.get_products_by_supplier(supplier_id)
        return supplier, products
```

### 7. SupplierProductDTO actual (en schemas.py) — INSUFICIENTE, hay que enriquecer
```python
class SupplierProductDTO(BaseModel):
    product_id: int
    supplier_price: Decimal
```

### 8. Router actual de suppliers (`modules/suppliers/infrastructure/http/router.py`)
- Ya tiene: GET `/template`, POST `/import`, GET `""`, GET `/{supplier_id}`, PUT `/{supplier_id}`, PATCH `/{supplier_id}/active`
- El GET `/{supplier_id}` devuelve `SupplierDetailDTO` que incluye `products: list[SupplierProductDTO]`
- Hay que AÑADIR endpoints, no reemplazar los existentes

### 9. Excepciones del módulo suppliers (`modules/suppliers/domain/exceptions.py`)
```python
from shared.exceptions import AppException, AppExceptionInfo

class SupplierExceptionInfo(AppExceptionInfo):
    """Error codes for the suppliers module (3xxx range).
    Numbering: 31xx suppliers
    """
    SUPPLIER_NOT_FOUND = (3101, "Supplier not found", 404)
    SUPPLIER_ALREADY_EXISTS = (3102, "Supplier with this tax ID already exists", 409)

class SupplierException(AppException):
    pass
```

### 10. Entidad Supplier (`modules/suppliers/domain/entities/supplier.py`)
```python
class Supplier(Base):
    __tablename__ = "suppliers"
    supplier_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    tax_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    address: Mapped[str] = mapped_column(String(300), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    province: Mapped[str] = mapped_column(String(100), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(10), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
```

### 11. Entidad Product (`modules/catalog/domain/entities/product.py`)
```python
class Product(Base):
    __tablename__ = "products"
    product_id: Mapped[int] = mapped_column(primary_key=True)
    product_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.category_id"), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    stock_current: Mapped[int] = mapped_column(nullable=False, default=0)
    stock_min: Mapped[int] = mapped_column(nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    category: Mapped["Category"] = relationship(back_populates="products")
```

### 12. IProductRepository (`modules/catalog/domain/interfaces/repositories/i_product_repository.py`)
```python
class IProductRepository(ABC):
    async def get_all_paginated(self, page: int, page_size: int, category_id: int | None = None) -> PaginatedResult[Product]: ...
    async def get_by_id(self, product_id: int) -> Product | None: ...
    async def get_by_code(self, product_code: str) -> Product | None: ...
    async def create(...) -> Product: ...
    async def update(...) -> Product: ...
    async def set_active(self, product_id: int, is_active: bool) -> None: ...
```

### 13. Patrón de acceso cross-module — IClientReader (`shared/domain/interfaces/i_client_reader.py`)
```python
from __future__ import annotations
from abc import ABC, abstractmethod
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from modules.clients.domain.entities.client import Client

class IClientReader(ABC):
    @abstractmethod
    async def get_by_id(self, client_id: int) -> Client | None: ...
    @abstractmethod
    async def get_name_by_id(self, client_id: int) -> str: ...
```

### 14. Excepciones base (`shared/exceptions.py`)
```python
class AppExceptionInfo(Enum):
    def __new__(cls, code: int, message: str, http_status: int):
        obj = object.__new__(cls)
        obj._value_ = code
        obj.code = code
        obj.message = message
        obj.http_status = http_status
        return obj

class AppException(Exception):
    def __init__(self, info: AppExceptionInfo) -> None:
        self.info = info
        super().__init__(info.message)
```

### 15. PaginatedResult (`shared/domain/paginated_result.py`)
```python
from dataclasses import dataclass

@dataclass
class PaginatedResult[T]:
    items: list[T]
    total: int
    page: int
    page_size: int
```

### 16. PaginatedResponse (`shared/infrastructure/http/paginated_response.py`)
```python
from pydantic import BaseModel
from typing import Generic, TypeVar
T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
```

### 17. Security (`composition/security.py`)
```python
_bearer = HTTPBearer()

async def get_current_user(...) -> UserSession: ...  # Todos los autenticados
async def require_admin(...) -> UserSession: ...  # Solo admin
def require_department_manager_or_admin(department_name: str): ...  # Admin o manager del depto

require_purchases_manager_or_admin = require_department_manager_or_admin("Purchases")
require_sales_manager_or_admin = require_department_manager_or_admin("Sales")
```

### 18. Dependencies (`composition/dependencies.py`)
Contiene factory functions para inyección de dependencias. Patrón:
```python
async def get_import_suppliers_use_case(
    db: AsyncSession = Depends(get_db),
) -> IImportSuppliersUseCase:
    return ImportSuppliersUseCase(SupplierRepository(db))
```

### 19. ImportResult y ImportRowError (`modules/suppliers/domain/entities/import_result.py`)
```python
@dataclass
class ImportRowError:
    row: int
    reason: str

@dataclass
class ImportResult:
    total: int
    created: int
    errors: list[ImportRowError]
```

### 20. ImportSuppliersUseCase existente (`modules/suppliers/application/import_suppliers_use_case.py`)
Importa proveedores desde Excel. Valida headers, campos requeridos, formatos (CIF, email, CP, teléfono), longitudes máximas, duplicados en archivo y en BD. Patrón a seguir para el import de supplier-products.

### 21. DownloadSupplierTemplateUseCase existente (`modules/suppliers/application/download_supplier_template_use_case.py`)
```python
class DownloadSupplierTemplateUseCase(IDownloadSupplierTemplateUseCase):
    HEADERS = ("Nombre", "CIF", "Dirección", "Ciudad", "Provincia", "Código Postal", "Teléfono", "Email")
    EXAMPLE = ("Proveedor Ejemplo S.L.", "B12345674", "Calle Gran Vía 1", "Madrid", "Madrid", "28001", "912345678", "contacto@ejemplo.com")
    def execute(self) -> bytes:
        wb = Workbook()
        ws = wb.active
        ws.title = "Proveedores"
        ws.append(list(self.HEADERS))
        ws.append(list(self.EXAMPLE))
        with BytesIO() as buffer:
            wb.save(buffer)
            return buffer.getvalue()
```

### 22. Router registry (`composition/router_registry.py`)
```python
def register_routers(app: FastAPI) -> None:
    from modules.admin.infrastructure.http.router import router as admin_router
    from modules.catalog.infrastructure.http.router import router as catalog_router
    from modules.clients.infrastructure.http.router import router as clients_router
    from modules.suppliers.infrastructure.http.router import router as suppliers_router
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(admin_router, prefix="/api/v1")
    app.include_router(catalog_router, prefix="/api/v1")
    app.include_router(suppliers_router, prefix="/api/v1")
    app.include_router(clients_router, prefix="/api/v1")
```

### 23. Constantes (`shared/constants.py`)
```python
ROLE_PATTERN = r"^(Administrator|Manager|Employee)$"
TAX_ID_PATTERN = r"^([0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]|[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J])$"
EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
POSTAL_CODE_PATTERN = r"^\d{5}$"
PHONE_PATTERN = r"^\+?[\d\s-]{9,20}$"
```

### 24. AppException handler en main.py
```python
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.info.http_status,
        content={"error_code": exc.info.code, "detail": exc.info.message},
    )
```

### 25. Alembic env.py — ya importa supplier_product
```python
import modules.suppliers.domain.entities.supplier_product  # noqa: F401
```

### 26. Patrón de tests (tests de integración con DB real)
**conftest.py raíz** (`tests/conftest.py`):
```python
@pytest_asyncio.fixture
async def db_session():
    async with engine.begin() as conn:
        async with AsyncSession(bind=conn, expire_on_commit=False) as session:
            yield session
            await conn.rollback()
```

**conftest.py del módulo catalog** (`tests/catalog/conftest.py`):
- Fixtures: `admin_client`, `purchases_manager_client`, `other_manager_client`, `non_admin_client`
- Cada uno overridea `get_db` con `db_session` y `get_current_user` con el rol correspondiente
- El `purchases_manager_client` inserta el departamento Purchases en la BD y deja actuar a la lógica real de `require_purchases_manager_or_admin`

**Ejemplo de test** (`tests/catalog/test_product_create.py`):
```python
@pytest.fixture
async def sample_category(db_session: AsyncSession) -> Category:
    category = Category(name="Electronics", description="Gadgets")
    db_session.add(category)
    await db_session.flush()
    return category

async def test_create_product_success(purchases_manager_client, db_session, sample_category):
    payload = {"product_code": "NEW-PROD-001", "name": "Smartphone", ...}
    response = await purchases_manager_client.post("/api/v1/catalog/products", json=payload)
    assert response.status_code == 201
```

**Tests de seguridad con mocks** (`tests/suppliers/test_suppliers_security.py`):
```python
def _mock_user(role: str, department_id: int | None = None):
    def override():
        return UserSession(email="test@test.com", role=role, department_id=department_id, firebase_uid="test-uid", name="Test User")
    return override

def _mock_db(dept_id: int | None):
    async def override_get_db():
        session = MagicMock()
        result = MagicMock()
        result.scalar_one_or_none.return_value = dept_id
        session.execute = AsyncMock(return_value=result)
        yield session
    return override_get_db
```

---

## Plan de PRs (4 PRs en cadena)

### PR1: `feature/backend_supplier_product_core` (desde `feature/backend_catalog_products_api`)
**Core domain + repository** (~350 líneas)

Archivos a **crear**:
1. `alembic/versions/XXXX_add_supplier_products_product_fk.py` — Nueva migración que añade FK de `supplier_products.product_id` → `products.product_id`. El `down_revision` debe apuntar a la **última migración** actual (busca cuál es el head actual con el merge de todos). Incluir también `depends_on` para asegurar que la tabla products ya existe.
2. `shared/domain/interfaces/i_product_reader.py` — Interfaz compartida para acceso cross-module a productos:
   ```python
   class IProductReader(ABC):
       async def get_by_id(self, product_id: int) -> Product | None: ...
       async def is_active(self, product_id: int) -> bool: ...
   ```

Archivos a **modificar**:
3. `modules/suppliers/domain/exceptions.py` — Añadir error codes 32xx:
   - `ASSOCIATION_NOT_FOUND = (3201, "Supplier-product association not found", 404)`
   - `ASSOCIATION_ALREADY_EXISTS = (3202, "Supplier-product association already exists", 409)`
   - `SUPPLIER_NOT_ACTIVE = (3203, "Supplier is not active", 409)`
   - `PRODUCT_NOT_ACTIVE = (3204, "Product is not active", 409)`
   - `INVALID_SUPPLIER_PRICE = (3205, "Supplier price must be greater than zero", 422)`
4. `modules/suppliers/domain/interfaces/repositories/i_supplier_repository.py` — Añadir métodos:
   ```python
   async def add_product(self, supplier_id: int, product_id: int, price: Decimal) -> SupplierProduct: ...
   async def update_product_price(self, supplier_id: int, product_id: int, price: Decimal) -> SupplierProduct: ...
   async def remove_product(self, supplier_id: int, product_id: int) -> None: ...
   async def get_association(self, supplier_id: int, product_id: int) -> SupplierProduct | None: ...
   async def get_suppliers_by_product(self, product_id: int) -> list[SupplierProduct]: ...
   async def get_products_by_supplier_paginated(self, supplier_id: int, page: int, page_size: int) -> PaginatedResult[SupplierProduct]: ...
   async def get_suppliers_by_product_paginated(self, product_id: int, page: int, page_size: int) -> PaginatedResult[SupplierProduct]: ...
   ```
5. `modules/suppliers/infrastructure/repos/supplier_repository.py` — Implementar todos los métodos nuevos
6. `modules/catalog/infrastructure/repos/product_repository.py` — Implementar `IProductReader` (añadir herencia + método `is_active`)

### PR2: `feature/backend_supplier_product_api` (desde PR1)
**Use cases + API endpoints** (~400 líneas)

Archivos a **crear** (interfaces de use cases, un archivo por interfaz):
1. `modules/suppliers/domain/interfaces/use_cases/i_add_product_to_supplier_use_case.py`
2. `modules/suppliers/domain/interfaces/use_cases/i_update_supplier_product_price_use_case.py`
3. `modules/suppliers/domain/interfaces/use_cases/i_remove_product_from_supplier_use_case.py`
4. `modules/suppliers/domain/interfaces/use_cases/i_list_supplier_products_use_case.py`
5. `modules/suppliers/domain/interfaces/use_cases/i_list_product_suppliers_use_case.py`

Archivos a **crear** (implementaciones de use cases):
6. `modules/suppliers/application/add_product_to_supplier_use_case.py` — Valida: supplier existe y activo, product existe y activo (via IProductReader), precio > 0, asociación no existe ya. Crea la asociación.
7. `modules/suppliers/application/update_supplier_product_price_use_case.py` — Valida: asociación existe, precio > 0. Actualiza precio.
8. `modules/suppliers/application/remove_product_from_supplier_use_case.py` — Valida: asociación existe. Elimina.
9. `modules/suppliers/application/list_supplier_products_use_case.py` — Lista paginada de productos de un supplier.
10. `modules/suppliers/application/list_product_suppliers_use_case.py` — Lista paginada de suppliers de un product.

Archivos a **modificar**:
11. `modules/suppliers/infrastructure/http/schemas.py` — Añadir:
    - `AddSupplierProductRequest(BaseModel)`: `product_id: int`, `supplier_price: Decimal = Field(..., gt=0, decimal_places=2)`
    - `UpdateSupplierProductPriceRequest(BaseModel)`: `supplier_price: Decimal = Field(..., gt=0, decimal_places=2)`
    - Enriquecer `SupplierProductDTO` con: `product_name: str`, `product_code: str`, `category_name: str | None`
    - `ProductSupplierDTO(BaseModel)`: `supplier_id: int`, `supplier_name: str`, `tax_id: str`, `supplier_price: Decimal`
12. `modules/suppliers/infrastructure/http/router.py` — Añadir endpoints:
    - `POST /{supplier_id}/products` — add_product (require_purchases_manager_or_admin)
    - `PUT /{supplier_id}/products/{product_id}` — update_price (require_purchases_manager_or_admin)
    - `DELETE /{supplier_id}/products/{product_id}` — remove (require_purchases_manager_or_admin)
    - `GET /{supplier_id}/products` — list paginated (get_current_user)
13. `modules/catalog/infrastructure/http/router.py` — Añadir endpoint:
    - `GET /products/{product_id}/suppliers` — list suppliers paginated (get_current_user)
14. `modules/catalog/infrastructure/http/schemas.py` — Añadir `ProductSupplierDTO` si se usa aquí, o importar del módulo suppliers
15. `composition/dependencies.py` — Añadir factories para los 5 nuevos use cases. Los use cases que necesitan `IProductReader` reciben `ProductRepository(db)`.

**IMPORTANTE para los use cases que necesitan datos enriquecidos**: El use case `list_supplier_products` necesita devolver datos del producto (name, code, category). Hay dos opciones:
- Opción A: El use case recibe un `IProductReader` y hace queries adicionales
- Opción B: El repositorio hace un JOIN y devuelve una dataclass enriquecida
- **Usa la Opción B**: Crea un dataclass `SupplierProductDetail` en `modules/suppliers/domain/entities/` con los campos enriquecidos, y haz que el repo haga el JOIN con la tabla products y categories.

### PR3: `feature/backend_supplier_product_import` (desde PR2)
**Excel import/template** (~350 líneas)

Archivos a **crear**:
1. `modules/suppliers/domain/interfaces/use_cases/i_download_supplier_product_template_use_case.py`
2. `modules/suppliers/domain/interfaces/use_cases/i_import_supplier_products_use_case.py`
3. `modules/suppliers/application/download_supplier_product_template_use_case.py` — Template Excel con headers: `Código Producto`, `Precio Proveedor`. Ejemplo: `PROD-001`, `25.50`.
4. `modules/suppliers/application/import_supplier_products_use_case.py` — Sigue el mismo patrón que `ImportSuppliersUseCase`:
   - Valida headers
   - Valida campos requeridos
   - Valida formato de precio (> 0, max 2 decimales)
   - Valida que el product_code exista y esté activo (via IProductReader o repo)
   - Detecta duplicados en el archivo
   - Detecta asociaciones ya existentes en BD
   - Si no hay errores, bulk create
   - Recibe el `supplier_id` como parámetro (el proveedor al que se asocian)

Archivos a **modificar**:
5. `modules/suppliers/domain/interfaces/repositories/i_supplier_repository.py` — Añadir `bulk_create_products(associations: list[SupplierProduct]) -> int`
6. `modules/suppliers/infrastructure/repos/supplier_repository.py` — Implementar `bulk_create_products`
7. `modules/suppliers/infrastructure/http/router.py` — Añadir:
   - `GET /{supplier_id}/products/template` — download template (require_purchases_manager_or_admin)
   - `POST /{supplier_id}/products/import` — import from Excel (require_purchases_manager_or_admin)
8. `composition/dependencies.py` — Añadir factories para los 2 nuevos use cases

### PR4: `feature/backend_supplier_product_tests` (desde PR3)
**Integration tests** (~400 líneas)

Archivos a **crear**:
1. `tests/suppliers/test_supplier_products_crud.py` — Tests de integración (con DB real):
   - Crear asociación exitosa
   - Asociación duplicada (409)
   - Supplier no existe (404)
   - Product no existe (404)
   - Supplier inactivo (409)
   - Product inactivo (409)
   - Precio inválido (≤ 0, más de 2 decimales) (422)
   - Actualizar precio exitoso
   - Eliminar asociación exitosa
   - Eliminar asociación no existente (404)
   - Listar productos de supplier (paginado)
   - Listar suppliers de product (paginado)
2. `tests/suppliers/test_supplier_products_security.py` — Tests de permisos:
   - Admin puede crear/editar/eliminar
   - Purchases Manager puede crear/editar/eliminar
   - Sales Manager NO puede (403)
   - Employee NO puede (403)
   - Todos pueden consultar (200)
   - No autenticado (401)
3. `tests/suppliers/test_supplier_products_import.py` — Tests del import Excel:
   - Descargar template exitoso
   - Import válido exitoso
   - Headers inválidos
   - Precio inválido
   - Product_code inexistente
   - Product inactivo
   - Duplicados en archivo
   - Asociación ya existe en BD

**Fixtures necesarias** (en conftest de suppliers o en el test file):
- `sample_category` — crea categoría en BD
- `sample_product` — crea producto activo en BD
- `sample_supplier` — crea proveedor activo en BD
- `inactive_product` — producto con `is_active=False`
- `inactive_supplier` — proveedor con `is_active=False`

---

## Estructura de archivos final esperada

```
modules/suppliers/
├── domain/
│   ├── entities/
│   │   ├── supplier.py                          (ya existe)
│   │   ├── supplier_product.py                  (ya existe)
│   │   ├── supplier_product_detail.py           (NUEVO - PR2)
│   │   ├── product_supplier_detail.py           (NUEVO - PR2)
│   │   └── import_result.py                     (ya existe)
│   ├── exceptions.py                            (MODIFICAR - PR1)
│   └── interfaces/
│       ├── repositories/
│       │   └── i_supplier_repository.py         (MODIFICAR - PR1, PR3)
│       └── use_cases/
│           ├── i_get_supplier_use_case.py                  (ya existe)
│           ├── i_list_suppliers_use_case.py                (ya existe)
│           ├── i_update_supplier_use_case.py               (ya existe)
│           ├── i_set_supplier_active_use_case.py           (ya existe)
│           ├── i_import_suppliers_use_case.py              (ya existe)
│           ├── i_download_supplier_template_use_case.py    (ya existe)
│           ├── i_add_product_to_supplier_use_case.py              (NUEVO - PR2)
│           ├── i_update_supplier_product_price_use_case.py        (NUEVO - PR2)
│           ├── i_remove_product_from_supplier_use_case.py         (NUEVO - PR2)
│           ├── i_list_supplier_products_use_case.py               (NUEVO - PR2)
│           ├── i_list_product_suppliers_use_case.py               (NUEVO - PR2)
│           ├── i_download_supplier_product_template_use_case.py   (NUEVO - PR3)
│           └── i_import_supplier_products_use_case.py             (NUEVO - PR3)
├── application/
│   ├── get_supplier_use_case.py                       (ya existe)
│   ├── list_suppliers_use_case.py                     (ya existe)
│   ├── update_supplier_use_case.py                    (ya existe)
│   ├── set_supplier_active_use_case.py                (ya existe)
│   ├── import_suppliers_use_case.py                   (ya existe)
│   ├── download_supplier_template_use_case.py         (ya existe)
│   ├── add_product_to_supplier_use_case.py            (NUEVO - PR2)
│   ├── update_supplier_product_price_use_case.py      (NUEVO - PR2)
│   ├── remove_product_from_supplier_use_case.py       (NUEVO - PR2)
│   ├── list_supplier_products_use_case.py             (NUEVO - PR2)
│   ├── list_product_suppliers_use_case.py             (NUEVO - PR2)
│   ├── download_supplier_product_template_use_case.py (NUEVO - PR3)
│   └── import_supplier_products_use_case.py           (NUEVO - PR3)
└── infrastructure/
    ├── repos/
    │   └── supplier_repository.py               (MODIFICAR - PR1, PR3)
    └── http/
        ├── router.py                            (MODIFICAR - PR2, PR3)
        └── schemas.py                           (MODIFICAR - PR2)

shared/domain/interfaces/
├── i_client_reader.py                           (ya existe)
└── i_product_reader.py                          (NUEVO - PR1)

modules/catalog/infrastructure/
├── repos/product_repository.py                  (MODIFICAR - PR1)
└── http/
    ├── router.py                                (MODIFICAR - PR2)
    └── schemas.py                               (MODIFICAR - PR2, si se necesita DTO)

composition/
├── dependencies.py                              (MODIFICAR - PR2, PR3)
└── security.py                                  (no tocar)

alembic/versions/
└── XXXX_add_supplier_products_product_fk.py     (NUEVO - PR1)

tests/suppliers/
├── test_supplier_products_crud.py               (NUEVO - PR4)
├── test_supplier_products_security.py           (NUEVO - PR4)
└── test_supplier_products_import.py             (NUEVO - PR4)
```

---

## Notas finales

- Usa `ruff check .` y `ruff format .` después de cada PR para asegurarte de que el linting pasa
- Los commits deben ser en inglés
- No tocar archivos que no están en el plan
- Cada PR debe compilar y pasar lint independientemente
- Los use cases reciben primitivos (int, str, Decimal), NO DTOs Pydantic
- Los use cases devuelven entidades de dominio o dataclasses, NO DTOs Pydantic
- El router se encarga de mapear entidades → DTOs
- Seguir el patrón exacto de los tests existentes (fixtures, mocks, assert patterns)
