import { create } from "zustand";


const useStore = create((set) => ({
  server: import.meta.env.VITE_HOST_SERVER,
  username: null,
  user_email: null,
  set_username: (value) => set(() => ({ username: value })),
  set_user_email: (value) => set(() => ({ user_email: value })),
}));



export default useStore;
