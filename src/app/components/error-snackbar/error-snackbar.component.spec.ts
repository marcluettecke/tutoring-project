import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorSnackbarComponent } from './error-snackbar.component';

describe('ErrorSnackbarComponent', () => {
  let component: ErrorSnackbarComponent;
  let fixture: ComponentFixture<ErrorSnackbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorSnackbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorSnackbarComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Basics', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with undefined errorText', () => {
      expect(component.errorText).toBeUndefined();
    });
  });

  describe('Input Properties', () => {
    it('should accept errorText input', () => {
      component.errorText = 'Test error message';

      expect(component.errorText).toBe('Test error message');
    });

    it('should handle empty error text', () => {
      component.errorText = '';

      expect(component.errorText).toBe('');
    });

    it('should handle long error messages', () => {
      const longMessage =
        'This is a very long error message that should be handled properly by the component even when it contains multiple sentences and detailed information about what went wrong.';

      component.errorText = longMessage;

      expect(component.errorText).toBe(longMessage);
    });

    it('should handle special characters in error text', () => {
      component.errorText = 'Error: ñ áéíóú ¿¡ 100% & symbols!';

      expect(component.errorText).toBe('Error: ñ áéíóú ¿¡ 100% & symbols!');
    });

    it('should maintain proper typing for errorText', () => {
      component.errorText = 'Type test';

      expect(typeof component.errorText).toBe('string');
    });
  });

  describe('Component State', () => {
    it('should maintain errorText state correctly', () => {
      const initialError = 'Initial error';
      const updatedError = 'Updated error';

      component.errorText = initialError;
      expect(component.errorText).toBe(initialError);

      component.errorText = updatedError;

      expect(component.errorText).toBe(updatedError);
    });

    it('should handle multiple state changes', () => {
      const messages = ['Error 1', 'Error 2', 'Error 3'];

      messages.forEach((message) => {
        component.errorText = message;
        expect(component.errorText).toBe(message);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values gracefully', () => {
      component.errorText = null as any;

      expect(component.errorText).toBe(null);
    });

    it('should handle undefined values', () => {
      component.errorText = undefined as any;

      expect(component.errorText).toBe(undefined);
    });

    it('should handle HTML-like strings', () => {
      component.errorText = '<div>HTML error message</div>';

      expect(component.errorText).toBe('<div>HTML error message</div>');
    });

    it('should handle JSON-like strings', () => {
      component.errorText = '{"error": "Something went wrong"}';

      expect(component.errorText).toBe('{"error": "Something went wrong"}');
    });
  });

  describe('Common Error Scenarios', () => {
    it('should handle network error messages', () => {
      component.errorText =
        'Network connection failed. Please check your internet connection.';

      expect(component.errorText).toContain('Network connection failed');
    });

    it('should handle authentication error messages', () => {
      component.errorText = 'Authentication failed. Please login again.';

      expect(component.errorText).toContain('Authentication failed');
    });

    it('should handle validation error messages', () => {
      component.errorText = 'Validation error: Email format is invalid.';

      expect(component.errorText).toContain('Validation error');
    });

    it('should handle server error messages', () => {
      component.errorText = 'Server error 500: Internal server error occurred.';

      expect(component.errorText).toContain('Server error 500');
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with different error sources', () => {
      const httpError = 'HTTP 404: Resource not found';
      const firebaseError = 'Firebase: auth/user-not-found';
      const validationError = 'Form validation failed';

      component.errorText = httpError;
      expect(component.errorText).toBe(httpError);

      component.errorText = firebaseError;
      expect(component.errorText).toBe(firebaseError);

      component.errorText = validationError;
      expect(component.errorText).toBe(validationError);
    });

    it('should handle rapid error updates', () => {
      const errors = [
        'Loading error',
        'Connection timeout',
        'Authentication expired',
        'Data fetch failed',
      ];

      errors.forEach((error, index) => {
        component.errorText = error;
        expect(component.errorText).toBe(error);
      });
    });
  });

  describe('Type Safety', () => {
    it('should maintain string type for errorText', () => {
      const testMessages = [
        'Simple error',
        '123 numeric error',
        'Error with numbers: 404',
        'Symbols & special chars!',
      ];

      testMessages.forEach((message) => {
        component.errorText = message;
        expect(typeof component.errorText).toBe('string');
      });
    });

    it('should handle component properties correctly', () => {
      component.errorText = 'test';

      expect(component.errorText).toBe('test');
      expect(typeof component).toBe('object');
    });
  });
});
