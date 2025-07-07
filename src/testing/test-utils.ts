import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement, Type } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Observable, of, throwError } from 'rxjs';
import { BehaviorSubject, Subject } from 'rxjs';
import { Question } from '../app/models/question.model';
import { Account, UserInfo } from '../app/models/User.model';

/**
 * Test utilities for component testing and mocking
 */
export class TestUtils {
  
  /**
   * Creates a component fixture with proper setup
   */
  static async createComponent<T>(
    component: Type<T>,
    imports: any[] = [],
    providers: any[] = []
  ): Promise<ComponentFixture<T>> {
    await TestBed.configureTestingModule({
      imports: [component, ...imports],
      providers: [...providers]
    }).compileComponents();

    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    return fixture;
  }

  /**
   * Finds element by test id
   */
  static getByTestId<T>(
    fixture: ComponentFixture<T>,
    testId: string
  ): DebugElement | null {
    return fixture.debugElement.query(By.css(`[data-testid="${testId}"]`));
  }

  /**
   * Finds all elements by test id
   */
  static getAllByTestId<T>(
    fixture: ComponentFixture<T>,
    testId: string
  ): DebugElement[] {
    return fixture.debugElement.queryAll(By.css(`[data-testid="${testId}"]`));
  }

  /**
   * Simulates click event
   */
  static click<T>(
    fixture: ComponentFixture<T>,
    element: DebugElement
  ): void {
    element.nativeElement.click();
    fixture.detectChanges();
  }

  /**
   * Simulates input value change
   */
  static setInputValue<T>(
    fixture: ComponentFixture<T>,
    element: DebugElement,
    value: string
  ): void {
    const input = element.nativeElement as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  /**
   * Waits for async operations to complete
   */
  static async waitForAsync(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

/**
 * Mock implementations for Firebase services
 */
export class FirebaseMocks {
  
  /**
   * Creates a mock Firestore service
   */
  static createFirestoreMock() {
    return {
      collection: vi.fn(),
      doc: vi.fn(),
      collectionData: vi.fn(),
      docData: vi.fn(),
      query: vi.fn(),
      where: vi.fn(),
      addDoc: vi.fn()
    };
  }

  /**
   * Creates a mock Auth service
   */
  static createAuthMock() {
    return {
      currentUser: null,
      authState: of(null),
      signInWithPopup: vi.fn(),
      signOut: vi.fn(),
      setPersistence: vi.fn(),
      onAuthStateChanged: vi.fn(),
      updateProfile: vi.fn(),
      updatePassword: vi.fn()
    };
  }

  /**
   * Creates a mock questions service
   */
  static createQuestionsServiceMock(questions: Question[] = []) {
    return {
      getQuestions: vi.fn().mockReturnValue(of(questions)),
      getSpecificQuestions: vi.fn().mockReturnValue(of(questions)),
      addQuestion: vi.fn().mockReturnValue(Promise.resolve())
    };
  }

  /**
   * Creates a mock auth service
   */
  static createAuthServiceMock(user: UserInfo | null = null) {
    const loginChanged = new BehaviorSubject<UserInfo | null>(user);
    const errorStatusChanged = new Subject<any>();
    
    return {
      loginChanged,
      errorStatusChanged,
      googleLogin: vi.fn(),
      handleLogin: vi.fn(),
      handleError: vi.fn(),
      logOut: vi.fn()
    };
  }

  /**
   * Creates a mock accounts service
   */
  static createAccountsServiceMock(isAdmin: boolean = false) {
    const isAdminSubject = new BehaviorSubject<boolean>(isAdmin);
    
    return {
      isAdmin: isAdminSubject,
      getAccounts: vi.fn().mockReturnValue(of([])),
      checkIfAdmin: vi.fn(),
      resetAdminStatus: vi.fn()
    };
  }

  /**
   * Creates a mock test service
   */
  static createTestServiceMock() {
    const testStatus = new BehaviorSubject<string>('not-started');
    
    return {
      testStatus,
      correctAnswers: {},
      handleTestStart: vi.fn(),
      handleTestEnd: vi.fn(),
      addClickedAnswer: vi.fn(),
      resetTest: vi.fn()
    };
  }

  /**
   * Creates a mock cookie service
   */
  static createCookieServiceMock() {
    return {
      get: vi.fn().mockReturnValue(''),
      set: vi.fn(),
      delete: vi.fn(),
      check: vi.fn().mockReturnValue(false)
    };
  }

  /**
   * Creates a mock router
   */
  static createRouterMock() {
    return {
      navigate: vi.fn().mockResolvedValue(true),
      navigateByUrl: vi.fn().mockResolvedValue(true),
      url: '/',
      events: of()
    };
  }
}

/**
 * Custom test matchers
 */
export const customMatchers = {
  toHaveBeenCalledWithObservable: (received: any, expected: Observable<any>) => {
    const pass = received.calls.some((call: any[]) => {
      const callArg = call[0];
      return callArg instanceof Observable;
    });
    
    return {
      pass,
      message: () => `expected function ${pass ? 'not ' : ''}to have been called with Observable`
    };
  },

  toEmitValue: async (received: Observable<any>, expected: any) => {
    let emittedValue: any;
    let hasEmitted = false;
    
    received.subscribe(value => {
      emittedValue = value;
      hasEmitted = true;
    });
    
    await TestUtils.waitForAsync();
    
    const pass = hasEmitted && JSON.stringify(emittedValue) === JSON.stringify(expected);
    
    return {
      pass,
      message: () => `expected Observable ${pass ? 'not ' : ''}to emit ${JSON.stringify(expected)}, but got ${JSON.stringify(emittedValue)}`
    };
  }
};

/**
 * Helper functions for common test patterns
 */
export class TestHelpers {
  
  /**
   * Creates a spy that returns an Observable
   */
  static createObservableSpy<T>(returnValue: T): any {
    return vi.fn().mockReturnValue(of(returnValue));
  }

  /**
   * Creates a spy that returns a rejected Promise
   */
  static createRejectedPromiseSpy(error: any): any {
    return vi.fn().mockRejectedValue(error);
  }

  /**
   * Creates a spy that returns an Observable error
   */
  static createObservableErrorSpy(error: any): any {
    return vi.fn().mockReturnValue(throwError(() => error));
  }

  /**
   * Advances timer by specified milliseconds
   */
  static advanceTimersByTime(ms: number): void {
    vi.advanceTimersByTime(ms);
  }

  /**
   * Flushes all pending timer callbacks
   */
  static runAllTimers(): void {
    vi.runAllTimers();
  }
}