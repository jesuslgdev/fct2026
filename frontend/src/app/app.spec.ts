// Unit tests for AppComponent
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app';
import { AuthService } from '@core/services/auth.service';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { Session } from '@domain/models/session.model';
import { signal } from '@angular/core';

class MockAuthService {
  private _logged = signal(true);
  readonly isLoggedIn = this._logged.asReadonly();
  readonly user = signal(null);
}

class DummyAuthRepository implements AuthRepository {
  signInWithGoogle(): Promise<Session> { 
    return Promise.resolve({ token: '', user: { uid: '', email: null, displayName: null, photoURL: null } });
  }
  signOut(): Promise<void> { return Promise.resolve(); }
}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: AuthService, useValue: new MockAuthService() },
        { provide: AuthRepository, useClass: DummyAuthRepository },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render a router-outlet', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
