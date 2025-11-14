import { resolvePath, dashboardForUser } from './roleRouter.js';

export function getUser(){
  try{ const s = localStorage.getItem('user'); if(s) return JSON.parse(s); }catch(e){}
  if (globalThis.__USER__) return globalThis.__USER__;
  return null;
}

export function requireRole(requiredRole){
  const user = getUser();
  if(!user){
    globalThis.location.replace(resolvePath('login.html'));
    return false;
  }
  if(requiredRole && user.role !== requiredRole){
    globalThis.location.replace(resolvePath(dashboardForUser(user)));
    return false;
  }
  return true;
}

export function ensureLoggedIn(){
  const user = getUser();
  if(!user){ globalThis.location.replace(resolvePath('login.html')); return false; }
  return true;
}

export default { getUser, requireRole, ensureLoggedIn };
