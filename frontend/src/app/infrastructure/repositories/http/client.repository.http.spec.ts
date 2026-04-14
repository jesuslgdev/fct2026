import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ClientEmailAlreadyExistsError } from '@domain/models/client-errors';
import { CreateClientPayload, UpdateClientPayload } from '@domain/models/client.model';
import { environment } from 'environments/environment';
import { HttpClientRepository } from './client.repository.http';

const BASE_URL = `${environment.apiUrl}/api/v1/clients`;

const CLIENT_DETAIL_DTO = {
  client_id: 1,
  name: 'Acme Corp',
  tax_id: '12345678A',
  city: 'Madrid',
  address: {
    street: 'Calle Mayor 1',
    city: 'Madrid',
    province: 'Madrid',
    postal_code: '28001',
  },
  phone: '600000001',
  email: 'acme@example.com',
  is_active: true,
};

const CREATE_PAYLOAD: CreateClientPayload = {
  name: 'Acme Corp',
  taxId: '12345678A',
  address: 'Calle Mayor 1',
  city: 'Madrid',
  province: 'Madrid',
  postalCode: '28001',
  phone: '600000001',
  email: 'acme@example.com',
};

describe('HttpClientRepository', () => {
  let repo: HttpClientRepository;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpClientRepository],
    });

    repo = TestBed.inject(HttpClientRepository);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('maps nested address responses to the flat client detail model', async () => {
    const promise = firstValueFrom(repo.getClientById(1));
    const req = controller.expectOne(`${BASE_URL}/1`);

    expect(req.request.method).toBe('GET');
    req.flush(CLIENT_DETAIL_DTO);

    await expect(promise).resolves.toEqual({
      clientId: 1,
      name: 'Acme Corp',
      taxId: '12345678A',
      address: 'Calle Mayor 1',
      city: 'Madrid',
      province: 'Madrid',
      postalCode: '28001',
      phone: '600000001',
      email: 'acme@example.com',
      isActive: true,
    });
  });

  it('sends nested address payloads when creating clients', async () => {
    const promise = firstValueFrom(repo.createClient(CREATE_PAYLOAD));
    const req = controller.expectOne(BASE_URL);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Acme Corp',
      tax_id: '12345678A',
      address: {
        street: 'Calle Mayor 1',
        city: 'Madrid',
        province: 'Madrid',
        postal_code: '28001',
      },
      phone: '600000001',
      email: 'acme@example.com',
    });
    req.flush(CLIENT_DETAIL_DTO);

    await expect(promise).resolves.toMatchObject({ clientId: 1 });
  });

  it('sends nested address payloads when updating clients', async () => {
    const payload: UpdateClientPayload = {
      name: 'Acme Updated',
      address: 'Calle Nueva 2',
      city: 'Sevilla',
      province: 'Sevilla',
      postalCode: '41001',
      phone: '600000002',
      email: 'updated@example.com',
    };
    const promise = firstValueFrom(repo.updateClient(1, payload));
    const req = controller.expectOne(`${BASE_URL}/1`);

    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      name: 'Acme Updated',
      address: {
        street: 'Calle Nueva 2',
        city: 'Sevilla',
        province: 'Sevilla',
        postal_code: '41001',
      },
      phone: '600000002',
      email: 'updated@example.com',
    });
    req.flush({
      ...CLIENT_DETAIL_DTO,
      name: 'Acme Updated',
      city: 'Sevilla',
      address: {
        street: 'Calle Nueva 2',
        city: 'Sevilla',
        province: 'Sevilla',
        postal_code: '41001',
      },
      phone: '600000002',
      email: 'updated@example.com',
    });

    await expect(promise).resolves.toMatchObject({
      name: 'Acme Updated',
      address: 'Calle Nueva 2',
      city: 'Sevilla',
      province: 'Sevilla',
      postalCode: '41001',
    });
  });

  it('omits address when updating only contact fields', async () => {
    const promise = firstValueFrom(repo.updateClient(1, { phone: '600000002' }));
    const req = controller.expectOne(`${BASE_URL}/1`);

    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ phone: '600000002' });
    req.flush({ ...CLIENT_DETAIL_DTO, phone: '600000002' });

    await expect(promise).resolves.toMatchObject({ phone: '600000002' });
  });

  it('maps backend error code 4104 to duplicate email errors', async () => {
    const promise = firstValueFrom(repo.createClient(CREATE_PAYLOAD));
    controller.expectOne(BASE_URL).flush(
      { detail: 'A client with this email already exists', error_code: 4104 },
      { status: 409, statusText: 'Conflict' },
    );

    await expect(promise).rejects.toBeInstanceOf(ClientEmailAlreadyExistsError);
  });
});
