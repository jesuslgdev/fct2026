from fastapi import APIRouter, Depends

from composition.dependencies import (
    get_create_category_use_case,
    get_delete_category_use_case,
    get_get_category_use_case,
    get_list_categories_use_case,
    get_update_category_use_case,
)
from composition.security import get_current_user, require_admin
from modules.catalog.domain.entities.category import Category
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
from modules.catalog.infrastructure.http.schemas import (
    CategoryDTO,
    CreateCategoryRequest,
    UpdateCategoryRequest,
)
from shared.domain.entities.user_session import UserSession

router = APIRouter(prefix="/catalog", tags=["Catalog - Categories"])


def _to_dto(category: Category) -> CategoryDTO:
    return CategoryDTO(
        category_id=category.category_id,
        name=category.name,
        description=category.description,
    )


@router.get("/categories", response_model=list[CategoryDTO])
async def list_categories(
    use_case: IListCategoriesUseCase = Depends(get_list_categories_use_case),
    _: UserSession = Depends(get_current_user),
):
    results = await use_case.execute()
    return [_to_dto(c) for c in results]


@router.get("/categories/{category_id}", response_model=CategoryDTO)
async def get_category(
    category_id: int,
    use_case: IGetCategoryUseCase = Depends(get_get_category_use_case),
    _: UserSession = Depends(get_current_user),
):
    result = await use_case.execute(category_id)
    return _to_dto(result)


@router.post("/categories", response_model=CategoryDTO, status_code=201)
async def create_category(
    body: CreateCategoryRequest,
    use_case: ICreateCategoryUseCase = Depends(get_create_category_use_case),
    _: UserSession = Depends(require_admin),
):
    result = await use_case.execute(body.name, body.description)
    return _to_dto(result)


@router.put("/categories/{category_id}", response_model=CategoryDTO)
async def update_category(
    category_id: int,
    body: UpdateCategoryRequest,
    use_case: IUpdateCategoryUseCase = Depends(get_update_category_use_case),
    _: UserSession = Depends(require_admin),
):
    result = await use_case.execute(category_id, body.name, body.description)
    return _to_dto(result)


@router.delete("/categories/{category_id}", status_code=204)
async def delete_category(
    category_id: int,
    use_case: IDeleteCategoryUseCase = Depends(get_delete_category_use_case),
    _: UserSession = Depends(require_admin),
):
    await use_case.execute(category_id)
