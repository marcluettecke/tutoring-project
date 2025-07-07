import { loginData } from './loginData.model';

describe('loginData Model', () => {
  describe('Interface Properties', () => {
    it('should create loginData with required properties', () => {
      const data: loginData = {
        email: 'test@example.com',
      };

      expect(data.email).toBe('test@example.com');
      expect(data.isAdmin).toBeUndefined();
    });

    it('should create loginData with optional isAdmin property', () => {
      const data: loginData = {
        email: 'admin@example.com',
        isAdmin: true,
      };

      expect(data.email).toBe('admin@example.com');
      expect(data.isAdmin).toBe(true);
    });

    it('should create loginData with isAdmin as false', () => {
      const data: loginData = {
        email: 'user@example.com',
        isAdmin: false,
      };

      expect(data.email).toBe('user@example.com');
      expect(data.isAdmin).toBe(false);
    });

    it('should maintain proper typing for loginData properties', () => {
      const data: loginData = {
        email: 'test@test.com',
        isAdmin: true,
      };

      expect(typeof data.email).toBe('string');
      expect(typeof data.isAdmin).toBe('boolean');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty email string', () => {
      const data: loginData = {
        email: '',
      };

      expect(data.email).toBe('');
    });

    it('should handle special characters in email', () => {
      const data: loginData = {
        email: 'test+tag@example-domain.co.uk',
      };

      expect(data.email).toBe('test+tag@example-domain.co.uk');
    });

    it('should handle various email formats', () => {
      const validEmails = [
        'simple@example.com',
        'user.name@domain.com',
        'user+tag@example.org',
        'user_name@example-domain.co.uk',
        'test123@test.io',
      ];

      validEmails.forEach((email) => {
        const data: loginData = { email };
        expect(data.email).toBe(email);
      });
    });
  });

  describe('Admin Role Testing', () => {
    it('should distinguish between admin and regular user', () => {
      const adminData: loginData = {
        email: 'admin@example.com',
        isAdmin: true,
      };

      const userData: loginData = {
        email: 'user@example.com',
        isAdmin: false,
      };

      const unknownData: loginData = {
        email: 'unknown@example.com',
      };

      expect(adminData.isAdmin).toBe(true);
      expect(userData.isAdmin).toBe(false);
      expect(unknownData.isAdmin).toBeUndefined();
    });

    it('should handle admin role changes', () => {
      const data: loginData = {
        email: 'user@example.com',
        isAdmin: false,
      };

      data.isAdmin = true;

      expect(data.isAdmin).toBe(true);
    });

    it('should handle removing admin role', () => {
      const data: loginData = {
        email: 'admin@example.com',
        isAdmin: true,
      };

      data.isAdmin = false;

      expect(data.isAdmin).toBe(false);
    });
  });

  describe('Data Validation Scenarios', () => {
    it('should create array of loginData objects', () => {
      const users: loginData[] = [
        { email: 'user1@example.com', isAdmin: false },
        { email: 'user2@example.com', isAdmin: true },
        { email: 'user3@example.com' },
      ];

      expect(users).toHaveLength(3);
      expect(users[0].isAdmin).toBe(false);
      expect(users[1].isAdmin).toBe(true);
      expect(users[2].isAdmin).toBeUndefined();
    });

    it('should handle loginData in authentication context', () => {
      const authData: loginData = {
        email: 'auth@example.com',
        isAdmin: false,
      };

      const isValidEmail = authData.email.includes('@');
      const hasAdminRights = authData.isAdmin === true;

      expect(isValidEmail).toBe(true);
      expect(hasAdminRights).toBe(false);
    });

    it('should maintain data integrity during operations', () => {
      const originalData: loginData = {
        email: 'original@example.com',
        isAdmin: true,
      };

      const copiedData: loginData = {
        email: originalData.email,
        isAdmin: originalData.isAdmin,
      };

      expect(copiedData.email).toBe(originalData.email);
      expect(copiedData.isAdmin).toBe(originalData.isAdmin);
    });
  });
});
