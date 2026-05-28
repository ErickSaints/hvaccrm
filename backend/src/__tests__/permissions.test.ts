import { hasPermission, getPermissionsForRole } from '../permissions';

describe('Permissions System', () => {
  describe('hasPermission', () => {
    it('should return true for ADMIN on all permissions', () => {
      expect(hasPermission('ADMIN', 'users:view')).toBe(true);
      expect(hasPermission('ADMIN', 'customers:delete')).toBe(true);
      expect(hasPermission('ADMIN', 'admin:panel')).toBe(true);
    });

    it('should return true for TECHNICIAN on their permissions', () => {
      expect(hasPermission('TECHNICIAN', 'tickets:view')).toBe(true);
      expect(hasPermission('TECHNICIAN', 'tickets:edit')).toBe(true);
      expect(hasPermission('TECHNICIAN', 'customers:view')).toBe(true);
    });

    it('should return false for TECHNICIAN on admin permissions', () => {
      expect(hasPermission('TECHNICIAN', 'users:view')).toBe(false);
      expect(hasPermission('TECHNICIAN', 'admin:panel')).toBe(false);
    });

    it('should return false for COMPRAS on customer permissions', () => {
      expect(hasPermission('COMPRAS', 'customers:view')).toBe(false);
      expect(hasPermission('COMPRAS', 'tickets:view')).toBe(false);
    });

    it('should return true for COMPRAS on catalog permissions', () => {
      expect(hasPermission('COMPRAS', 'catalog:view')).toBe(true);
      expect(hasPermission('COMPRAS', 'catalog:create')).toBe(true);
    });

    it('should return true for CLIENT on their permissions', () => {
      expect(hasPermission('CLIENT', 'tickets:view')).toBe(true);
      expect(hasPermission('CLIENT', 'tickets:create')).toBe(true);
      expect(hasPermission('CLIENT', 'notifications:view')).toBe(true);
    });

    it('should return false for CLIENT on backoffice permissions', () => {
      expect(hasPermission('CLIENT', 'customers:view')).toBe(false);
      expect(hasPermission('CLIENT', 'users:view')).toBe(false);
    });

    it('should respect custom overrides', () => {
      expect(hasPermission('COMPRAS', 'customers:view', { 'customers:view': true })).toBe(true);
      expect(hasPermission('COMPRAS', 'customers:view', { 'customers:view': false })).toBe(false);
    });

    it('should return false for unknown role', () => {
      expect(hasPermission('UNKNOWN' as any, 'tickets:view')).toBe(false);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return all permissions for ADMIN', () => {
      const perms = getPermissionsForRole('ADMIN');
      expect(perms.length).toBeGreaterThan(50);
      expect(perms).toContain('users:view');
      expect(perms).toContain('admin:panel');
    });

    it('should return limited permissions for COMPRAS', () => {
      const perms = getPermissionsForRole('COMPRAS');
      expect(perms.length).toBeLessThan(10);
      expect(perms).toContain('catalog:view');
      expect(perms).not.toContain('customers:view');
    });
  });
});
