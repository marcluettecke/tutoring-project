import { Account, UserInfo } from './User.model';

describe('User Models', () => {
  describe('Account Interface', () => {
    it('should create Account with all required properties', () => {
      const account: Account = {
        id: 'user123',
        email: 'test@example.com',
        isAdmin: false,
      };

      expect(account.id).toBe('user123');
      expect(account.email).toBe('test@example.com');
      expect(account.isAdmin).toBe(false);
    });

    it('should create admin Account', () => {
      const adminAccount: Account = {
        id: 'admin456',
        email: 'admin@example.com',
        isAdmin: true,
      };

      expect(adminAccount.id).toBe('admin456');
      expect(adminAccount.email).toBe('admin@example.com');
      expect(adminAccount.isAdmin).toBe(true);
    });

    it('should maintain proper typing for Account properties', () => {
      const account: Account = {
        id: 'test',
        email: 'test@test.com',
        isAdmin: false,
      };

      expect(typeof account.id).toBe('string');
      expect(typeof account.email).toBe('string');
      expect(typeof account.isAdmin).toBe('boolean');
    });
  });

  describe('UserInfo Interface', () => {
    it('should create UserInfo with all properties', () => {
      const userInfo: UserInfo = {
        uid: 'firebase-uid-123',
        email: 'user@example.com',
        phoneNumber: '+1234567890',
        isEmailVerified: true,
        displayName: 'Test User',
      };

      expect(userInfo.uid).toBe('firebase-uid-123');
      expect(userInfo.email).toBe('user@example.com');
      expect(userInfo.phoneNumber).toBe('+1234567890');
      expect(userInfo.isEmailVerified).toBe(true);
      expect(userInfo.displayName).toBe('Test User');
    });

    it('should create UserInfo with null values', () => {
      const userInfo: UserInfo = {
        uid: 'firebase-uid-456',
        email: null,
        phoneNumber: null,
        displayName: null,
      };

      expect(userInfo.uid).toBe('firebase-uid-456');
      expect(userInfo.email).toBe(null);
      expect(userInfo.phoneNumber).toBe(null);
      expect(userInfo.displayName).toBe(null);
    });

    it('should create UserInfo with optional isEmailVerified', () => {
      const userInfo: UserInfo = {
        uid: 'firebase-uid-789',
        email: 'test@example.com',
        phoneNumber: null,
        displayName: 'Test User',
      };

      expect(userInfo.uid).toBe('firebase-uid-789');
      expect(userInfo.isEmailVerified).toBeUndefined();
    });

    it('should maintain proper typing for UserInfo properties', () => {
      const userInfo: UserInfo = {
        uid: 'test-uid',
        email: 'test@test.com',
        phoneNumber: '+123456789',
        isEmailVerified: false,
        displayName: 'Test',
      };

      expect(typeof userInfo.uid).toBe('string');
      expect(typeof userInfo.email).toBe('string');
      expect(typeof userInfo.phoneNumber).toBe('string');
      expect(typeof userInfo.isEmailVerified).toBe('boolean');
      expect(typeof userInfo.displayName).toBe('string');
    });

    it('should handle edge cases for UserInfo properties', () => {
      const userInfo: UserInfo = {
        uid: '',
        email: '',
        phoneNumber: '',
        isEmailVerified: false,
        displayName: '',
      };

      expect(userInfo.uid).toBe('');
      expect(userInfo.email).toBe('');
      expect(userInfo.phoneNumber).toBe('');
      expect(userInfo.isEmailVerified).toBe(false);
      expect(userInfo.displayName).toBe('');
    });
  });

  describe('Model Relationships', () => {
    it('should handle conversion between Account and UserInfo', () => {
      const userInfo: UserInfo = {
        uid: 'firebase-uid',
        email: 'user@example.com',
        phoneNumber: null,
        displayName: 'Test User',
      };

      const account: Account = {
        id: userInfo.uid,
        email: userInfo.email || '',
        isAdmin: false,
      };

      expect(account.id).toBe(userInfo.uid);
      expect(account.email).toBe(userInfo.email);
      expect(account.isAdmin).toBe(false);
    });

    it('should handle null email in UserInfo to Account conversion', () => {
      const userInfo: UserInfo = {
        uid: 'firebase-uid',
        email: null,
        phoneNumber: null,
        displayName: 'Test User',
      };

      const account: Account = {
        id: userInfo.uid,
        email: userInfo.email || 'unknown@example.com',
        isAdmin: false,
      };

      expect(account.id).toBe(userInfo.uid);
      expect(account.email).toBe('unknown@example.com');
    });
  });
});
