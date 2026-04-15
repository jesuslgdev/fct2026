# Paso 6 — API Integration

Pasar de mock repository a HTTP repository cuando el backend está disponible.

---

## 6.1 Cambiar provider en app.config.ts

```typescript
// frontend/src/app/app.config.ts

// ANTES (desarrollo con mocks):
import { MockUserRepository } from '@infrastructure/repositories/mock/user.repository.mock';
{ provide: UserRepository, useClass: MockUserRepository },

// DESPUÉS (con backend real):
import { HttpUserRepository } from '@infrastructure/repositories/http/user.repository.http';
{ provide: UserRepository, useClass: HttpUserRepository },
```

El cambio es **una sola línea** en un solo archivo. Esto es posible gracias al patrón de repositorio con clase abstracta como token DI.

---

## 6.2 Verificar environment.ts

Asegurar que `environment.apiUrl` está configurado correctamente:

```typescript
// frontend/src/environments/environment.ts (dev)
export const environment = {
  production: false,
  apiUrl: 'https://api-dev.example.com',  // URL del backend de desarrollo
  firebase: { ... },
};

// frontend/src/environments/environment.prod.ts (prod)
export const environment = {
  production: true,
  apiUrl: 'https://api.example.com',       // URL del backend de producción
  firebase: { ... },
};
```

---

## 6.3 Verificar endpoints del HTTP repository

Asegurar que las URLs en el HTTP repository coinciden con los endpoints reales del backend:

```typescript
// Patrón de URLs
const BASE_URL = `${environment.apiUrl}/api/v1/admin/<entities>`;

// GET    /api/v1/admin/<entities>?page=1&page_size=20&search=...
// GET    /api/v1/admin/<entities>/:id
// POST   /api/v1/admin/<entities>
// PUT    /api/v1/admin/<entities>/:id
// PATCH  /api/v1/admin/<entities>/:id/active
// DELETE /api/v1/admin/<entities>/:id
```

---

## 6.4 Verificar auth interceptor

El proyecto tiene un `authInterceptor` en `@core/interceptors/auth.interceptor.ts` que añade automáticamente el token Firebase a las peticiones HTTP. Solo verificar que está registrado en `app.config.ts`:

```typescript
provideHttpClient(
  withInterceptors([authInterceptor])
),
```

---

## 6.5 Verificar DTOs contra API real

Comparar los DTOs definidos en `@infrastructure/dtos/` con la respuesta real del API. Ajustar campos si hay diferencias.

---

## 6.6 Checklist de API integration

- [ ] Provider cambiado de Mock a HTTP en `app.config.ts`
- [ ] `environment.apiUrl` configurado en ambos environments
- [ ] Endpoints del HTTP repository verificados contra API real
- [ ] Auth interceptor registrado
- [ ] DTOs validados contra responses reales
- [ ] Error mapping cubre todos los status codes del API
- [ ] Probado manualmente con el backend real
