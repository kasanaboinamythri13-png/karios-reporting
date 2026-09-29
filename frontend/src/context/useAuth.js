// src/context/useAuth.js — thin re-export so HMR does not invalidate auth tree
import { useContext } from "react";
import { AuthContext } from "./AuthContext.jsx";
export const useAuth = () => useContext(AuthContext);