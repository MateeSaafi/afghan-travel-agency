import { create } from "zustand";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export type UserRole = "user" | "admin" | "superadmin";

interface UserState {
  role: UserRole | null;
  isLoadingRole: boolean;
  fetchUserRole: (email: string) => Promise<void>;
  clearUserRole: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  role: null,
  isLoadingRole: false,
  fetchUserRole: async (email: string) => {
    set({ isLoadingRole: true });
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        set({ role: userData.role || "user", isLoadingRole: false });
      } else {
        set({ role: "user", isLoadingRole: false });
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      set({ role: "user", isLoadingRole: false });
    }
  },
  clearUserRole: () => set({ role: null, isLoadingRole: false }),
}));
