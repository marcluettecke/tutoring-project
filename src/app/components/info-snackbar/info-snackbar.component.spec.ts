import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoSnackbarComponent } from './info-snackbar.component';

describe('InfoSnackbarComponent', () => {
  let component: InfoSnackbarComponent;
  let fixture: ComponentFixture<InfoSnackbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoSnackbarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoSnackbarComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Basics', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with undefined infoText', () => {
      expect(component.infoText).toBeUndefined();
    });
  });

  describe('Input Properties', () => {
    it('should accept infoText input', () => {
      component.infoText = 'Test info message';

      expect(component.infoText).toBe('Test info message');
    });

    it('should handle empty info text', () => {
      component.infoText = '';

      expect(component.infoText).toBe('');
    });

    it('should handle long info messages', () => {
      const longMessage =
        'This is a very long informational message that provides detailed instructions and helpful tips for the user to understand what they need to do next.';

      component.infoText = longMessage;

      expect(component.infoText).toBe(longMessage);
    });

    it('should handle special characters in info text', () => {
      component.infoText = 'Info: ñ áéíóú ¿¡ 100% & symbols!';

      expect(component.infoText).toBe('Info: ñ áéíóú ¿¡ 100% & symbols!');
    });

    it('should maintain proper typing for infoText', () => {
      component.infoText = 'Type test';

      expect(typeof component.infoText).toBe('string');
    });
  });

  describe('Component State', () => {
    it('should maintain infoText state correctly', () => {
      const initialInfo = 'Initial info';
      const updatedInfo = 'Updated info';

      component.infoText = initialInfo;
      expect(component.infoText).toBe(initialInfo);

      component.infoText = updatedInfo;

      expect(component.infoText).toBe(updatedInfo);
    });

    it('should handle multiple state changes', () => {
      const messages = ['Info 1', 'Info 2', 'Info 3'];

      messages.forEach((message) => {
        component.infoText = message;
        expect(component.infoText).toBe(message);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values gracefully', () => {
      component.infoText = null as any;

      expect(component.infoText).toBe(null);
    });

    it('should handle undefined values', () => {
      component.infoText = undefined as any;

      expect(component.infoText).toBe(undefined);
    });

    it('should handle HTML-like strings', () => {
      component.infoText = '<div>HTML info message</div>';

      expect(component.infoText).toBe('<div>HTML info message</div>');
    });

    it('should handle JSON-like strings', () => {
      component.infoText = '{"info": "Something important"}';

      expect(component.infoText).toBe('{"info": "Something important"}');
    });
  });

  describe('Common Info Scenarios', () => {
    it('should handle success messages', () => {
      component.infoText = 'Operation completed successfully!';

      expect(component.infoText).toContain('successfully');
    });

    it('should handle instruction messages', () => {
      component.infoText = 'Please select an answer to continue with the test.';

      expect(component.infoText).toContain('Please select');
    });

    it('should handle progress messages', () => {
      component.infoText = 'Loading questions... Please wait.';

      expect(component.infoText).toContain('Loading');
    });

    it('should handle completion messages', () => {
      component.infoText = 'Test completed! Your score is 85%.';

      expect(component.infoText).toContain('completed');
    });

    it('should handle warning messages', () => {
      component.infoText = 'Warning: This action cannot be undone.';

      expect(component.infoText).toContain('Warning');
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with different info sources', () => {
      const userGuideInfo = 'Click the answer option to select your choice.';
      const systemInfo = 'Auto-save is enabled for this session.';
      const progressInfo = 'Question 5 of 20 completed.';

      component.infoText = userGuideInfo;
      expect(component.infoText).toBe(userGuideInfo);

      component.infoText = systemInfo;
      expect(component.infoText).toBe(systemInfo);

      component.infoText = progressInfo;
      expect(component.infoText).toBe(progressInfo);
    });

    it('should handle rapid info updates', () => {
      const infos = [
        'Starting test...',
        'Question loaded',
        'Answer submitted',
        'Moving to next question',
      ];

      infos.forEach((info, _index) => {
        component.infoText = info;
        expect(component.infoText).toBe(info);
      });
    });

    it('should handle numbered info messages', () => {
      const numberedInfos = [
        '1. Read the question carefully',
        '2. Select your answer',
        '3. Click next to continue',
      ];

      numberedInfos.forEach((info) => {
        component.infoText = info;
        expect(component.infoText).toBe(info);
        expect(component.infoText).toMatch(/^\d+\./);
      });
    });
  });

  describe('Type Safety', () => {
    it('should maintain string type for infoText', () => {
      const testMessages = [
        'Simple info',
        '123 numeric info',
        'Info with numbers: 404',
        'Symbols & special chars!',
      ];

      testMessages.forEach((message) => {
        component.infoText = message;
        expect(typeof component.infoText).toBe('string');
      });
    });

    it('should handle component properties correctly', () => {
      component.infoText = 'test';

      expect(component.infoText).toBe('test');
      expect(typeof component).toBe('object');
    });

    it('should handle info text variations', () => {
      const variations = [
        'Short info',
        'Medium length informational message for testing',
        'Very long informational message that contains multiple sentences and provides comprehensive details about the current state of the application and what the user should expect to happen next in the workflow process.',
      ];

      variations.forEach((variation) => {
        component.infoText = variation;
        expect(typeof component.infoText).toBe('string');
        expect(component.infoText.length).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
