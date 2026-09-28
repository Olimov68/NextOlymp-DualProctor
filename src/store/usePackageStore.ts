import { create } from 'zustand';
import { PackageItem, INITIAL_PACKAGES } from '../data/initialPackages';

const STORAGE_KEY = 'next_olymp_packages';

const getStoredPackages = (): PackageItem[] => {
  if (typeof window === 'undefined') return INITIAL_PACKAGES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('LocalStorage load error for packages:', e);
  }
  return INITIAL_PACKAGES;
};

const persistPackages = (items: PackageItem[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('LocalStorage save error for packages:', e);
  }
};

interface PackageStore {
  packages: PackageItem[];
  addPackage: (pkg: Omit<PackageItem, 'id' | 'createdAt' | 'sotilganSoni' | 'jamiTushum'>) => void;
  updatePackage: (id: string, updated: Partial<PackageItem>) => void;
  deletePackage: (id: string) => void;
  togglePackageStatus: (id: string) => void;
  resetPackages: () => void;
}

export const usePackageStore = create<PackageStore>((set, get) => ({
  packages: getStoredPackages(),

  addPackage: (newPkg) => {
    const current = get().packages;
    const nextIdNumber = current.length + 1;
    const id = `PKG-${String(nextIdNumber).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const packageItem: PackageItem = {
      ...newPkg,
      id,
      sotilganSoni: 0,
      jamiTushum: 0,
      createdAt: today,
    };

    const updatedList = [packageItem, ...current];
    persistPackages(updatedList);
    set({ packages: updatedList });
  },

  updatePackage: (id, updated) => {
    const updatedList = get().packages.map((p) => {
      if (p.id === id) {
        return { ...p, ...updated };
      }
      return p;
    });

    persistPackages(updatedList);
    set({ packages: updatedList });
  },

  deletePackage: (id) => {
    const updatedList = get().packages.filter((p) => p.id !== id);
    persistPackages(updatedList);
    set({ packages: updatedList });
  },

  togglePackageStatus: (id) => {
    const updatedList = get().packages.map((p) => {
      if (p.id === id) {
        const nextStatus: 'sotuvda' | 'nofaol' = p.holati === 'sotuvda' ? 'nofaol' : 'sotuvda';
        return { ...p, holati: nextStatus };
      }
      return p;
    });

    persistPackages(updatedList);
    set({ packages: updatedList });
  },

  resetPackages: () => {
    persistPackages(INITIAL_PACKAGES);
    set({ packages: INITIAL_PACKAGES });
  },
}));
