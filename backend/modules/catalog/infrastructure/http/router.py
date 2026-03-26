from fastapi import APIRouter, Depends, Query

from composition.dependencies import (
    get_create_category_use_case,
    get_create_product_use_case,
    get_delete_category_use_case,
    get_get_category_use_case,
    get_get_product_use_case,
    get_list_categories_use_case,
    get_list_products_use_case,
    get_set_product_active_use_case,
    get_update_category_use_case,
    get_update_product_use_case,
)
from composition.security import (
    get_current_user,
    require_admin,
    require_purchases_manager_or_admin,
)
from modules.catalog.domain.entities.category import Category
from modules.catalog.domain.entities.product import Product
from modules.catalog.domain.interfaces.use_cases.categories.i_create_category_use_case import (
    ICreateCategoryUseCase,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_delete_category_use_case import (
    IDeleteCategoryUseCase,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_get_category_use_case import (
    IGetCategoryUseCase,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_list_categories_use_case import (
    IListCategoriesUseCase,
)
from modules.catalog.domain.interfaces.use_cases.categories.i_update_category_use_case import (
    IUpdateCategoryUseCase,
)
from modules.catalog.domain.interfaces.use_cases.products.i_create_product_use_case import (
    ICreateProductUseCase,
)
from modules.catalog.domain.interfaces.use_cases.products.i_get_product_use_case import (
    IGetProductUseCase,
)
from modules.catalog.domain.interfaces.use_cases.products.i_list_products_use_case import (
    IListProductsUseCase,
)
from modules.catalog.domain.interfaces.use_cases.products.i_set_product_active_use_case import (
    ISetProductActiveUseCase,
)
from modules.catalog.domain.interfaces.use_cases.products.i_update_product_use_case import (
    IUpdateProductUseCase,
)
from modules.catalog.infrastructure.http.schemas import (
    CategoryDTO,
    CreateCategoryRequest,
    CreateProductRequest,
    ProductDTO,
    SetProductActiveRequest,
    UpdateCategoryRequest,
    UpdateProductRequest,
)
from shared.domain.dtos.user_session import UserSession
from shared.infrastructure.http.paginated_response import PaginatedResponse

router = APIRouter(prefix="/catalog")


# ── Category Management ─────────────────────────────────────────


def _category_to_dto(category: Category) -> CategoryDTO:
    return CategoryDTO(
        category_id=category.category_id,
        name=category.name,
        description=category.description,
    )


@router.get(
    "/categories", response_model=list[CategoryDTO], tags=["Catalog - Categories"]
)
async def list_categories(
    use_case: IListCategoriesUseCase = Depends(get_list_categories_use_case),
    _: UserSession = Depends(get_current_user),
):
    """Return all categories."""
    results = await use_case.execute()
    return [_category_to_dto(c) for c in results]


@router.get(
    "/categories/{category_id}",
    response_model=CategoryDTO,
    tags=["Catalog - Categories"],
)
async def get_category(
    category_id: int,
    use_case: IGetCategoryUseCase = Depends(get_get_category_use_case),
    _: UserSession = Depends(get_current_user),
):
    """Return a single category by ID."""
    result = await use_case.execute(category_id)
    return _category_to_dto(result)


@router.post(
    "/categories",
    response_model=CategoryDTO,
    status_code=201,
    tags=["Catalog - Categories"],
)
async def create_category(
    body: CreateCategoryRequest,
    use_case: ICreateCategoryUseCase = Depends(get_create_category_use_case),
    _: UserSession = Depends(require_admin),
):
    """Create a new category."""
    result = await use_case.execute(body.name, body.description)
    return _category_to_dto(result)


@router.put(
    "/categories/{category_id}",
    response_model=CategoryDTO,
    tags=["Catalog - Categories"],
)
async def update_category(
    category_id: int,
    body: UpdateCategoryRequest,
    use_case: IUpdateCategoryUseCase = Depends(get_update_category_use_case),
    _: UserSession = Depends(require_admin),
):
    """Update an existing category."""
    result = await use_case.execute(category_id, body.name, body.description)
    return _category_to_dto(result)


@router.delete(
    "/categories/{category_id}", status_code=204, tags=["Catalog - Categories"]
)
async def delete_category(
    category_id: int,
    use_case: IDeleteCategoryUseCase = Depends(get_delete_category_use_case),
    _: UserSession = Depends(require_admin),
):
    """Delete a category."""
    await use_case.execute(category_id)


# ── Product Management ──────────────────────────────────────────


def _product_to_dto(product: Product) -> ProductDTO:
    return ProductDTO(
        product_id=product.product_id,
        product_code=product.product_code,
        name=product.name,
        description=product.description,
        category_id=product.category_id,
        category_name=product.category.name if product.category else None,
        price=product.price,
        stock_current=product.stock_current,
        stock_min=product.stock_min,
        is_active=product.is_active,
    )


@router.get(
    "/products",
    response_model=PaginatedResponse[ProductDTO],
    tags=["Catalog - Products"],
)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category_id: int | None = Query(None),
    search: str | None = Query(None, max_length=255),
    active: bool | None = Query(None),
    sort_field: str = Query("name"),
    sort_order: str = Query("asc"),
    use_case: IListProductsUseCase = Depends(get_list_products_use_case),
    _: UserSession = Depends(get_current_user),
):
    """Return a paginated list of products with optional filters."""
    result = await use_case.execute(
        page,
        page_size,
        category_id,
        search=search,
        active=active,
        sort_field=sort_field,
        sort_order=sort_order,
    )
    return PaginatedResponse(
        items=[_product_to_dto(p) for p in result.items],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
    )


@router.get(
    "/products/{product_id}", response_model=ProductDTO, tags=["Catalog - Products"]
)
async def get_product(
    product_id: int,
    use_case: IGetProductUseCase = Depends(get_get_product_use_case),
    _: UserSession = Depends(get_current_user),
):
    """Return a single product by ID."""
    result = await use_case.execute(product_id)
    return _product_to_dto(result)


@router.post(
    "/products",
    response_model=ProductDTO,
    status_code=201,
    tags=["Catalog - Products"],
)
async def create_product(
    body: CreateProductRequest,
    use_case: ICreateProductUseCase = Depends(get_create_product_use_case),
    _: UserSession = Depends(require_purchases_manager_or_admin),
):
    """Create a new product."""
    result = await use_case.execute(
        product_code=body.product_code,
        name=body.name,
        description=body.description,
        category_id=body.category_id,
        price=body.price,
        stock_current=body.stock_current,
        stock_min=body.stock_min,
    )
    return _product_to_dto(result)


@router.put(
    "/products/{product_id}", response_model=ProductDTO, tags=["Catalog - Products"]
)
async def update_product(
    product_id: int,
    body: UpdateProductRequest,
    use_case: IUpdateProductUseCase = Depends(get_update_product_use_case),
    _: UserSession = Depends(require_purchases_manager_or_admin),
):
    """Update an existing product."""
    result = await use_case.execute(
        product_id=product_id,
        product_code=body.product_code,
        name=body.name,
        description=body.description,
        category_id=body.category_id,
        price=body.price,
        stock_min=body.stock_min,
    )
    return _product_to_dto(result)


@router.patch(
    "/products/{product_id}/active", status_code=204, tags=["Catalog - Products"]
)
async def set_product_active(
    product_id: int,
    body: SetProductActiveRequest,
    use_case: ISetProductActiveUseCase = Depends(get_set_product_active_use_case),
    _: UserSession = Depends(require_purchases_manager_or_admin),
):
    """Activate or deactivate a product."""
    await use_case.execute(product_id, body.is_active)
