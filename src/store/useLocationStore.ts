import { create } from 'zustand';
import {
  ViloyatItem,
  TumanItem,
  MaktabItem,
  INITIAL_VILOYATLAR,
  INITIAL_TUMANLAR,
  INITIAL_MAKTABLAR,
} from '../data/initialLocations';

interface LocationState {
  viloyatlar: ViloyatItem[];
  tumanlar: TumanItem[];
  maktablar: MaktabItem[];

  addViloyat: (viloyat: { nomi: string; kod: string }) => void;
  updateViloyat: (id: string, viloyat: { nomi: string; kod: string }) => void;
  deleteViloyat: (id: string) => void;

  addTuman: (tuman: { nomi: string; viloyatNomi: string; kod: string }) => void;
  updateTuman: (id: string, tuman: { nomi: string; viloyatNomi: string; kod: string }) => void;
  deleteTuman: (id: string) => void;

  addMaktab: (maktab: { nomi: string; turi: string; noyobKod: string; viloyatNomi: string; tumanNomi: string }) => void;
  updateMaktab: (id: string, maktab: { nomi: string; turi: string; noyobKod: string; viloyatNomi: string; tumanNomi: string }) => void;
  deleteMaktab: (id: string) => void;

  resetToDefaults: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  viloyatlar: INITIAL_VILOYATLAR,
  tumanlar: INITIAL_TUMANLAR,
  maktablar: INITIAL_MAKTABLAR,

  addViloyat: ({ nomi, kod }) => {
    const { viloyatlar, tumanlar, maktablar } = get();
    const newViloyat: ViloyatItem = {
      id: `v-${Date.now()}`,
      nomi: nomi.trim(),
      kod: kod.trim().toUpperCase(),
      tumanlarSoni: 0,
      maktablarSoni: 0,
    };
    set({
      viloyatlar: [newViloyat, ...viloyatlar],
      tumanlar,
      maktablar,
    });
  },

  updateViloyat: (id, { nomi, kod }) => {
    const { viloyatlar, tumanlar, maktablar } = get();
    const oldVil = viloyatlar.find((v) => v.id === id);
    const oldName = oldVil ? oldVil.nomi : '';

    const updatedViloyatlar = viloyatlar.map((v) => {
      if (v.id === id) {
        return { ...v, nomi: nomi.trim(), kod: kod.trim().toUpperCase() };
      }
      return v;
    });

    const updatedTumanlar = tumanlar.map((t) => {
      if (oldName && t.viloyatNomi.toLowerCase() === oldName.toLowerCase()) {
        return { ...t, viloyatNomi: nomi.trim() };
      }
      return t;
    });

    const updatedMaktablar = maktablar.map((m) => {
      if (oldName && m.viloyatNomi.toLowerCase() === oldName.toLowerCase()) {
        return { ...m, viloyatNomi: nomi.trim() };
      }
      return m;
    });

    set({
      viloyatlar: updatedViloyatlar,
      tumanlar: updatedTumanlar,
      maktablar: updatedMaktablar,
    });
  },

  deleteViloyat: (id) => {
    const { viloyatlar, tumanlar, maktablar } = get();
    const updatedViloyatlar = viloyatlar.filter((v) => v.id !== id);
    set({ viloyatlar: updatedViloyatlar, tumanlar, maktablar });
  },

  addTuman: ({ nomi, viloyatNomi, kod }) => {
    const { viloyatlar, tumanlar, maktablar } = get();
    const newTuman: TumanItem = {
      id: `t-${Date.now()}`,
      nomi: nomi.trim(),
      viloyatNomi: viloyatNomi.trim(),
      kod: kod.trim().toUpperCase(),
      maktablarSoni: 0,
    };
    const updatedTumanlar = [newTuman, ...tumanlar];

    const updatedViloyatlar = viloyatlar.map((v) => {
      if (v.nomi.toLowerCase() === viloyatNomi.trim().toLowerCase()) {
        return { ...v, tumanlarSoni: v.tumanlarSoni + 1 };
      }
      return v;
    });

    set({
      viloyatlar: updatedViloyatlar,
      tumanlar: updatedTumanlar,
      maktablar,
    });
  },

  updateTuman: (id, { nomi, viloyatNomi, kod }) => {
    const { viloyatlar, tumanlar, maktablar } = get();
    const oldTuman = tumanlar.find((t) => t.id === id);
    const oldName = oldTuman ? oldTuman.nomi : '';

    const updatedTumanlar = tumanlar.map((t) => {
      if (t.id === id) {
        return { ...t, nomi: nomi.trim(), viloyatNomi: viloyatNomi.trim(), kod: kod.trim() };
      }
      return t;
    });

    const updatedMaktablar = maktablar.map((m) => {
      if (oldName && m.tumanNomi.toLowerCase() === oldName.toLowerCase()) {
        return { ...m, tumanNomi: nomi.trim(), viloyatNomi: viloyatNomi.trim() };
      }
      return m;
    });

    set({
      viloyatlar,
      tumanlar: updatedTumanlar,
      maktablar: updatedMaktablar,
    });
  },

  deleteTuman: (id) => {
    const { viloyatlar, tumanlar, maktablar } = get();
    const updatedTumanlar = tumanlar.filter((t) => t.id !== id);
    set({ viloyatlar, tumanlar: updatedTumanlar, maktablar });
  },

  addMaktab: ({ nomi, turi, noyobKod, viloyatNomi, tumanNomi }) => {
    const { viloyatlar, tumanlar, maktablar } = get();
    const newMaktab: MaktabItem = {
      id: `m-${Date.now()}`,
      nomi: nomi.trim(),
      turi: turi || 'public',
      noyobKod: noyobKod.trim() || `${Math.floor(10000 + Math.random() * 90000)}`,
      viloyatNomi: viloyatNomi.trim(),
      tumanNomi: tumanNomi.trim(),
    };
    const updatedMaktablar = [newMaktab, ...maktablar];

    const updatedViloyatlar = viloyatlar.map((v) => {
      if (v.nomi.toLowerCase() === viloyatNomi.trim().toLowerCase()) {
        return { ...v, maktablarSoni: v.maktablarSoni + 1 };
      }
      return v;
    });

    const updatedTumanlar = tumanlar.map((t) => {
      if (t.nomi.toLowerCase() === tumanNomi.trim().toLowerCase()) {
        return { ...t, maktablarSoni: t.maktablarSoni + 1 };
      }
      return t;
    });

    set({
      viloyatlar: updatedViloyatlar,
      tumanlar: updatedTumanlar,
      maktablar: updatedMaktablar,
    });
  },

  updateMaktab: (id, { nomi, turi, noyobKod, viloyatNomi, tumanNomi }) => {
    const { viloyatlar, tumanlar, maktablar } = get();
    const updatedMaktablar = maktablar.map((m) => {
      if (m.id === id) {
        return {
          ...m,
          nomi: nomi.trim(),
          turi: turi || 'public',
          noyobKod: noyobKod.trim(),
          viloyatNomi: viloyatNomi.trim(),
          tumanNomi: tumanNomi.trim(),
        };
      }
      return m;
    });

    set({
      viloyatlar,
      tumanlar,
      maktablar: updatedMaktablar,
    });
  },

  deleteMaktab: (id) => {
    const { viloyatlar, tumanlar, maktablar } = get();
    const updatedMaktablar = maktablar.filter((m) => m.id !== id);
    set({ viloyatlar, tumanlar, maktablar: updatedMaktablar });
  },

  resetToDefaults: () => {
    set({
      viloyatlar: INITIAL_VILOYATLAR,
      tumanlar: INITIAL_TUMANLAR,
      maktablar: INITIAL_MAKTABLAR,
    });
  },
}));
