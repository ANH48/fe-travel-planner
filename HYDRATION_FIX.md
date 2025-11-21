# Hydration Error Fix - November 19, 2025

## Problem
The application was experiencing hydration errors with the message:
```
Hydration failed because the server rendered HTML didn't match the client.
```

This is a common issue in Next.js when:
- Client-side only APIs (like `localStorage`, `window`) are used during server-side rendering
- State from persisted storage (Zustand persist) doesn't match between server and client
- Components render differently on server vs client

## Root Causes Identified

### 1. Zustand Persist Middleware
The `useAuthStore` was using `zustand/middleware/persist` which accesses `localStorage` during initialization, causing mismatch between server and client renders.

### 2. Direct localStorage Access
API interceptors and store actions were directly accessing `localStorage` without checking if running in browser context.

### 3. Missing Hydration State Tracking
The store didn't track whether it had been rehydrated from localStorage, causing components to use stale data.

## Solutions Implemented

### 1. Updated Zustand Store (`lib/store.ts`)

**Added:**
- `_hasHydrated` state to track rehydration status
- `setHasHydrated()` method to update hydration state
- SSR-safe storage using `createJSONStorage`
- `onRehydrateStorage` callback to set hydration flag
- `typeof window !== 'undefined'` checks for localStorage access

**Before:**
```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
      isAuthenticated: () => {
        const state = get();
        return !!state.token && !!state.user;
      },
    }),
    { name: 'auth-storage' }
  )
);
```

**After:**
```typescript
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      _hasHydrated: false,
      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        set({ user, token });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        set({ user: null, token: null });
      },
      isAuthenticated: () => {
        const state = get();
        return !!state.token && !!state.user;
      },
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => 
        typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
```

### 2. Updated Dashboard Page (`app/dashboard/page.tsx`)

**Added:**
- `mounted` state to track client-side mounting
- `_hasHydrated` from store
- Loading screen while waiting for hydration
- Conditional rendering based on mount and hydration state

**Before:**
```typescript
export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: trips, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const response = await tripsApi.getAll();
      return response.data;
    },
    enabled: isAuthenticated(),
  });

  if (!isAuthenticated()) {
    return null;
  }
  // ...
}
```

**After:**
```typescript
export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && _hasHydrated && !isAuthenticated()) {
      router.push('/login');
    }
  }, [mounted, _hasHydrated, isAuthenticated, router]);

  const { data: trips, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const response = await tripsApi.getAll();
      return response.data;
    },
    enabled: mounted && _hasHydrated && isAuthenticated(),
  });

  // Wait for hydration and mounting
  if (!mounted || !_hasHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null;
  }
  // ...
}
```

### 3. Updated API Client (`lib/api.ts`)

**Added:**
- `typeof window !== 'undefined'` checks in interceptors
- Safe localStorage access in request interceptor
- Safe window access in response interceptor

**Before:**
```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**After:**
```typescript
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## Benefits of These Changes

1. **No More Hydration Errors**: Server and client render the same content initially
2. **Better UX**: Shows loading state during rehydration instead of flash of wrong content
3. **SSR Safe**: All browser APIs are properly guarded
4. **Type Safe**: TypeScript types updated to include `_hasHydrated`
5. **Future Proof**: Pattern can be applied to other pages using auth state

## Pattern to Follow for Other Pages

If you create new pages that use `useAuthStore`, follow this pattern:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';

export default function YourPage() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Wait for hydration
  if (!mounted || !_hasHydrated) {
    return <LoadingScreen />;
  }

  // Check auth after hydration
  if (!isAuthenticated()) {
    return <Redirect to="/login" />;
  }

  return (
    // Your page content
  );
}
```

## Testing

1. **Clear cache and localStorage**
2. **Refresh page** - should see loading screen briefly
3. **No hydration errors in console**
4. **Auth state persists across refreshes**
5. **Protected routes redirect properly**

## Files Modified

- ✅ `lib/store.ts` - Added hydration tracking
- ✅ `lib/api.ts` - Added SSR guards
- ✅ `app/dashboard/page.tsx` - Added mount/hydration checks

## Additional Improvements Needed (Future)

1. Apply same pattern to other pages using auth (if any)
2. Consider adding error boundary for hydration errors
3. Add retry logic for failed rehydration
4. Consider migrating to Next.js middleware for auth checks

## References

- [Next.js Hydration Errors](https://nextjs.org/docs/messages/react-hydration-error)
- [Zustand Persist SSR](https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md#ssr)
- [React useEffect for client-only code](https://react.dev/reference/react/useEffect#examples-useeffect)

---

**Status**: ✅ Fixed and Tested
**Date**: November 19, 2025
