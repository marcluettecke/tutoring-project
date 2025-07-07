import { QUESTIONWEIGHTS } from './constants';

describe('Test Constants', () => {
  describe('QUESTIONWEIGHTS', () => {
    it('should contain all main sections', () => {
      expect(QUESTIONWEIGHTS).toHaveProperty('administrativo');
      expect(QUESTIONWEIGHTS).toHaveProperty('medio ambiente');
      expect(QUESTIONWEIGHTS).toHaveProperty('costas');
      expect(QUESTIONWEIGHTS).toHaveProperty('aguas');
    });

    it('should have correct weight values', () => {
      expect(QUESTIONWEIGHTS.administrativo).toBe(20);
      expect(QUESTIONWEIGHTS['medio ambiente']).toBe(25);
      expect(QUESTIONWEIGHTS.costas).toBe(20);
      expect(QUESTIONWEIGHTS.aguas).toBe(35);
    });

    it('should sum to 100 for proper weight distribution', () => {
      const totalWeight = Object.values(QUESTIONWEIGHTS).reduce(
        (sum, weight) => sum + weight,
        0,
      );

      expect(totalWeight).toBe(100);
    });

    it('should contain only numeric values', () => {
      Object.values(QUESTIONWEIGHTS).forEach((weight) => {
        expect(typeof weight).toBe('number');
        expect(weight).toBeGreaterThan(0);
      });
    });

    it('should be properly typed', () => {
      expect(typeof QUESTIONWEIGHTS).toBe('object');
      Object.keys(QUESTIONWEIGHTS).forEach((key) => {
        expect(typeof key).toBe('string');
      });
    });

    it('should handle section lookup correctly', () => {
      const testSections = [
        'administrativo',
        'medio ambiente',
        'costas',
        'aguas',
      ];

      testSections.forEach((section) => {
        expect(QUESTIONWEIGHTS[section]).toBeDefined();
        expect(typeof QUESTIONWEIGHTS[section]).toBe('number');
      });
    });

    it('should return undefined for invalid sections', () => {
      expect(QUESTIONWEIGHTS['invalid-section']).toBeUndefined();
      expect(QUESTIONWEIGHTS['']).toBeUndefined();
    });

    it('should maintain proper weight proportions', () => {
      expect(QUESTIONWEIGHTS.aguas).toBeGreaterThan(
        QUESTIONWEIGHTS.administrativo,
      );
      expect(QUESTIONWEIGHTS.aguas).toBeGreaterThan(QUESTIONWEIGHTS.costas);
      expect(QUESTIONWEIGHTS.aguas).toBeGreaterThan(
        QUESTIONWEIGHTS['medio ambiente'],
      );

      expect(QUESTIONWEIGHTS['medio ambiente']).toBeGreaterThan(
        QUESTIONWEIGHTS.administrativo,
      );
      expect(QUESTIONWEIGHTS['medio ambiente']).toBeGreaterThan(
        QUESTIONWEIGHTS.costas,
      );

      expect(QUESTIONWEIGHTS.administrativo).toBe(QUESTIONWEIGHTS.costas);
    });
  });
});
