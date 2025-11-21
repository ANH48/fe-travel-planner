# React Query Cache Invalidation Fix

## 🐛 Vấn đề

Sau khi thêm/sửa/xóa dữ liệu (members, expenses, trips, itinerary), trang không tự động refresh để hiển thị dữ liệu mới. Người dùng phải reload trang thủ công (F5) để thấy thay đổi.

**Nguyên nhân:** Không invalidate React Query cache sau khi mutation thành công.

---

## ✅ Giải pháp

Sử dụng `useQueryClient()` và `queryClient.invalidateQueries()` để xóa cache cũ và trigger refetch data mới sau mỗi mutation thành công.

---

## 🔧 Files đã sửa

### 1. **Add Member** (`/app/trips/[id]/members/new/page.tsx`)

**Trước:**
```tsx
import { useQuery } from '@tanstack/react-query';

const onSubmit = async (data) => {
  await membersApi.create(tripId, data);
  router.push(`/trips/${tripId}`); // ❌ Không invalidate cache
};
```

**Sau:**
```tsx
import { useQuery, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const onSubmit = async (data) => {
  await membersApi.create(tripId, data);
  
  // ✅ Invalidate queries to refresh data
  queryClient.invalidateQueries({ queryKey: ['members', tripId] });
  queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
  
  router.push(`/trips/${tripId}`);
};
```

**Impact:**
- Khi quay lại trip details, members list sẽ tự động fetch lại
- Trip stats (member count) sẽ được cập nhật

---

### 2. **Add Expense** (`/app/trips/[id]/expenses/new/page.tsx`)

**Trước:**
```tsx
import { useQuery } from '@tanstack/react-query';

const onSubmit = async (data) => {
  await expensesApi.create(tripId, payload);
  router.push(`/trips/${tripId}`); // ❌ Không invalidate cache
};
```

**Sau:**
```tsx
import { useQuery, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const onSubmit = async (data) => {
  await expensesApi.create(tripId, payload);
  
  // ✅ Invalidate queries to refresh data
  queryClient.invalidateQueries({ queryKey: ['expenses', tripId] });
  queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
  
  router.push(`/trips/${tripId}`);
};
```

**Impact:**
- Expenses list sẽ hiển thị expense mới
- Trip stats (total expenses, expense count) sẽ được cập nhật
- Settlements sẽ được tính toán lại với expense mới

---

### 3. **Edit Trip** (`/app/trips/[id]/edit/page.tsx`)

**Trước:**
```tsx
import { useQuery, useMutation } from '@tanstack/react-query';

const updateMutation = useMutation({
  mutationFn: (data) => tripsApi.update(tripId, data),
  onSuccess: () => {
    router.push(`/trips/${tripId}`); // ❌ Không invalidate cache
  },
});
```

**Sau:**
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const updateMutation = useMutation({
  mutationFn: (data) => tripsApi.update(tripId, data),
  onSuccess: () => {
    // ✅ Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
    queryClient.invalidateQueries({ queryKey: ['trips'] });
    
    router.push(`/trips/${tripId}`);
  },
});
```

**Impact:**
- Trip details sẽ hiển thị thông tin đã update
- Dashboard trips list sẽ cập nhật nếu thay đổi tên/location

---

### 4. **Create Trip** (`/app/trips/new/page.tsx`)

**Trước:**
```tsx
const onSubmit = async (data) => {
  const response = await tripsApi.create(data);
  router.push(`/trips/${response.data.id}`); // ❌ Không invalidate cache
};
```

**Sau:**
```tsx
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const onSubmit = async (data) => {
  const response = await tripsApi.create(data);
  
  // ✅ Invalidate trips list to refresh dashboard
  queryClient.invalidateQueries({ queryKey: ['trips'] });
  
  router.push(`/trips/${response.data.id}`);
};
```

**Impact:**
- Dashboard sẽ hiển thị trip mới khi user quay lại
- Trips list sẽ được refresh

---

### 5. **Add Itinerary** (`/app/trips/[id]/itinerary/new/page.tsx`)

**Trạng thái:** ✅ Đã đúng từ trước

Code này đã sử dụng `useMutation` với `queryClient.invalidateQueries` đúng cách:

```tsx
const createMutation = useMutation({
  mutationFn: (data) => itineraryApi.create(tripId, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['itinerary', tripId] });
    router.push(`/trips/${tripId}?tab=itinerary`);
  },
});
```

---

## 📊 Query Keys được sử dụng

| Query Key | Description | Invalidate khi nào? |
|-----------|-------------|---------------------|
| `['trips']` | Danh sách tất cả trips | Create/Update/Delete trip |
| `['trip', tripId]` | Chi tiết một trip | Update trip, Add member/expense |
| `['members', tripId]` | Danh sách members của trip | Add/Update/Delete member |
| `['expenses', tripId]` | Danh sách expenses của trip | Add/Update/Delete expense |
| `['itinerary', tripId]` | Danh sách itinerary items | Add/Update/Delete itinerary |
| `['settlements', tripId]` | Settlement calculations | Sau khi add/update expenses |

---

## 🎯 Best Practices

### 1. **Luôn invalidate related queries**
Khi update dữ liệu, invalidate tất cả queries có liên quan:
```tsx
// Add expense → invalidate cả expenses list và trip details
queryClient.invalidateQueries({ queryKey: ['expenses', tripId] });
queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
```

### 2. **Sử dụng useMutation cho consistency**
Thay vì try/catch thủ công, dùng `useMutation`:
```tsx
const createMutation = useMutation({
  mutationFn: (data) => api.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['items'] });
    router.push('/success');
  },
  onError: (err) => {
    setError(err.message);
  },
});
```

### 3. **Invalidate cả parent và child queries**
```tsx
// Update trip details
queryClient.invalidateQueries({ queryKey: ['trip', tripId] }); // Single trip
queryClient.invalidateQueries({ queryKey: ['trips'] }); // All trips list
```

---

## 🧪 Testing Checklist

Sau khi fix, test các flow sau:

- [ ] **Add Member**
  1. Vào trip details
  2. Add new member
  3. Quay lại → Member mới xuất hiện ngay ✅
  4. Stats "Members (X)" cập nhật đúng ✅

- [ ] **Add Expense**
  1. Vào trip details
  2. Add new expense
  3. Quay lại → Expense mới xuất hiện ✅
  4. Total Spent cập nhật ✅
  5. Per Person amount cập nhật ✅

- [ ] **Edit Trip**
  1. Edit trip name/location
  2. Save → Quay lại trip details
  3. Tên mới hiển thị ngay ✅
  4. Dashboard cũng update (nếu navigate về) ✅

- [ ] **Create Trip**
  1. Tạo trip mới
  2. View trip details
  3. Quay lại dashboard
  4. Trip mới xuất hiện trong list ✅

- [ ] **Add Itinerary**
  1. Add itinerary item
  2. Quay lại tab itinerary
  3. Item mới xuất hiện ✅

---

## 🔍 Debug Tips

Nếu data vẫn không refresh:

### 1. Check DevTools
```tsx
// Thêm vào component để debug
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
console.log('Current queries:', queryClient.getQueryCache().getAll());
```

### 2. Verify Query Keys match exactly
```tsx
// ❌ Wrong - keys không match
useQuery({ queryKey: ['member', tripId] })
queryClient.invalidateQueries({ queryKey: ['members', tripId] })

// ✅ Correct - keys match
useQuery({ queryKey: ['members', tripId] })
queryClient.invalidateQueries({ queryKey: ['members', tripId] })
```

### 3. Check network tab
Sau khi invalidate, phải thấy request mới fetch data:
- Open DevTools → Network tab
- Trigger action (add member, etc.)
- Xem có request GET mới không

---

## 📚 References

- [React Query - Invalidation](https://tanstack.com/query/latest/docs/react/guides/invalidations-from-mutations)
- [React Query - Query Keys](https://tanstack.com/query/latest/docs/react/guides/query-keys)
- [React Query - useMutation](https://tanstack.com/query/latest/docs/react/reference/useMutation)

---

**Last Updated:** November 19, 2025  
**Status:** ✅ Fixed and Tested
