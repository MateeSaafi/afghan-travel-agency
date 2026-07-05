import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Item {
  id: string;
  name: string;
  category: string;
  headline: string;
  description: string;
  processTime: string;
  price: number;
  image: string;
  requiredDocs: string[];
  createdAt?: number;
}

interface ItemStore {
  items: Item[];
  setItems: (items: Item[]) => void;
  clearItems: () => void;
}

export const useItemStore = create<ItemStore>()(
  persist(
    (set) => ({
      items: [],
      setItems: (items: Item[]) => set({ items }),
      clearItems: () => set({ items: [] }),
    }),
    {
      name: "items-storage", // this key is used in localStorage
      // (optional) you could also define a custom storage here
    }
  )
);
