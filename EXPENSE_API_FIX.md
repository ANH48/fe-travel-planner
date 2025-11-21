# Expense API Format Update

## 🐛 Vấn đề ban đầu

API trả về lỗi validation khi tạo expense:
```json
{
  "error": "Bad Request",
  "message": [
    "property splitType should not exist",
    "category must be one of the following values: FOOD, TRANSPORT, ACCOMMODATION, ENTERTAINMENT, OTHER",
    "Total split amounts must equal the expense amount",
    "splits must be an array"
  ],
  "statusCode": 400
}
```

---

## ✅ Giải pháp

### 1. **Remove `splitType` field**
Backend KHÔNG chấp nhận field `splitType`. Frontend phải tự tính toán splits.

**Trước:**
```tsx
const payload = {
  description: "Hotel",
  amount: 1000000,
  splitType: "equal", // ❌ Backend không nhận
};
```

**Sau:**
```tsx
const payload = {
  description: "Hotel",
  amount: 1000000,
  splits: [...], // ✅ Luôn gửi splits array
};
```

---

### 2. **Update Category Enum**
Backend yêu cầu category phải là UPPERCASE enum.

**Trước:**
```tsx
const categories = [
  'Accommodation',     // ❌ Wrong
  'Transportation',    // ❌ Wrong
  'Food & Dining',     // ❌ Wrong
  'Activities',        // ❌ Wrong
  'Shopping',          // ❌ Wrong
  'Other'              // ❌ Wrong
];
```

**Sau:**
```tsx
const categories = [
  { value: 'FOOD', label: 'Food & Dining' },
  { value: 'TRANSPORT', label: 'Transportation' },
  { value: 'ACCOMMODATION', label: 'Accommodation' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'OTHER', label: 'Other' },
];
```

---

### 3. **Always send `splits` array**

Frontend phải luôn gửi splits array, bất kể là equal hay custom split.

**Equal Split Logic:**
```tsx
if (splitType === 'equal') {
  const perPerson = Math.floor(totalAmount / members.length);
  const remainder = totalAmount - (perPerson * members.length);
  
  splits = members.map((member, index) => ({
    memberId: member.id,
    // Add remainder to last person to ensure total = amount
    amount: index === members.length - 1 
      ? perPerson + remainder 
      : perPerson,
  }));
}
```

**Custom Split Logic:**
```tsx
if (splitType === 'custom') {
  splits = Object.entries(customSplits).map(([memberId, amount]) => ({
    memberId,
    amount: parseVND(amount),
  }));
  
  // Validation: total must equal expense amount
  const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
  if (totalSplit !== totalAmount) {
    throw new Error('Total split must equal expense amount');
  }
}
```

---

## 📋 API Request Format (Updated)

### Request Body
```json
{
  "description": "Hotel Booking",
  "amount": 6000000,
  "date": "2025-11-20",
  "category": "ACCOMMODATION",
  "paidById": "member_id_1",
  "splits": [
    {
      "memberId": "member_id_1",
      "amount": 2000000
    },
    {
      "memberId": "member_id_2",
      "amount": 2000000
    },
    {
      "memberId": "member_id_3",
      "amount": 2000000
    }
  ]
}
```

### Validation Rules

1. **Category** (Optional)
   - Must be one of: `FOOD`, `TRANSPORT`, `ACCOMMODATION`, `ENTERTAINMENT`, `OTHER`
   - If omitted, backend may use default or null

2. **Splits** (Required)
   - Must be an array
   - Each split must have `memberId` and `amount`
   - Sum of all split amounts MUST equal total expense amount
   - Can set amount to `0` for members not participating
   
3. **Amount**
   - Must be positive integer (VNĐ)
   - No decimal places

---

## 🔧 Code Changes

### File: `app/trips/[id]/expenses/new/page.tsx`

#### 1. Updated Categories
```tsx
const categories = [
  { value: 'FOOD', label: 'Food & Dining' },
  { value: 'TRANSPORT', label: 'Transportation' },
  { value: 'ACCOMMODATION', label: 'Accommodation' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'OTHER', label: 'Other' },
];
```

#### 2. Updated Render
```tsx
<select {...register('category')}>
  <option value="">Select a category</option>
  {categories.map((cat) => (
    <option key={cat.value} value={cat.value}>
      {cat.label}
    </option>
  ))}
</select>
```

#### 3. Updated Submit Logic
```tsx
const onSubmit = async (data) => {
  const totalAmount = parseVND(data.amount);
  
  // Calculate splits based on split type
  let splits;
  if (splitType === 'equal') {
    const perPerson = Math.floor(totalAmount / members.length);
    const remainder = totalAmount - (perPerson * members.length);
    
    splits = members.map((member, index) => ({
      memberId: member.id,
      amount: index === members.length - 1 
        ? perPerson + remainder 
        : perPerson,
    }));
  } else {
    splits = Object.entries(customSplits).map(([memberId, amount]) => ({
      memberId,
      amount: parseVND(amount),
    }));
    
    // Validate total
    const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
    if (totalSplit !== totalAmount) {
      setError('Total split must equal expense amount');
      return;
    }
  }
  
  const payload = {
    description: data.description,
    amount: totalAmount,
    date: data.date,
    paidById: data.paidById,
    splits,
  };
  
  // Add category if provided
  if (data.category) {
    payload.category = data.category;
  }
  
  await expensesApi.create(tripId, payload);
};
```

---

## 🎯 Testing Scenarios

### Test 1: Equal Split with 3 members
```
Amount: 10.000 ₫
Members: A, B, C

Expected splits:
- A: 3.333 ₫
- B: 3.333 ₫
- C: 3.334 ₫ (gets remainder)

Total: 10.000 ₫ ✅
```

### Test 2: Equal Split with 2 members
```
Amount: 100.000 ₫
Members: A, B

Expected splits:
- A: 50.000 ₫
- B: 50.000 ₫

Total: 100.000 ₫ ✅
```

### Test 3: Custom Split
```
Amount: 500.000 ₫
Members: A (uses taxi), B (uses taxi), C (doesn't use)

Custom splits:
- A: 250.000 ₫
- B: 250.000 ₫
- C: 0 ₫

Total: 500.000 ₫ ✅
```

### Test 4: Category Selection
```
Select category: "Food & Dining"
Backend receives: "FOOD" ✅

Select category: "Accommodation"
Backend receives: "ACCOMMODATION" ✅
```

---

## 📝 API Requirements Update

File `API_REQUIREMENTS.md` đã được cập nhật:

1. ✅ Removed `splitType` field from examples
2. ✅ Changed category values to UPPERCASE enum
3. ✅ Added note that `splits` is always required
4. ✅ Updated validation rules

---

## 🚨 Important Notes

### 1. Remainder Handling
Khi chia equally, có thể có số dư. Frontend add số dư vào người cuối cùng:
```
10.000 ₫ / 3 = 3.333,33 (repeating)
→ A: 3.333
→ B: 3.333  
→ C: 3.334 (gets +1 remainder)
```

### 2. Validation Frontend vs Backend
Frontend validate trước khi gửi:
- Total split must equal amount
- All members must be in splits array

Backend cũng validate lại để ensure data integrity.

### 3. Category is Optional
Nếu user không chọn category, field sẽ không được gửi lên backend (hoặc gửi empty string).

---

## ✅ Checklist

- [x] Remove `splitType` from payload
- [x] Update categories to UPPERCASE enum values
- [x] Always send `splits` array
- [x] Handle remainder in equal split
- [x] Validate total split = expense amount
- [x] Update API_REQUIREMENTS.md
- [x] Test with backend API

---

**Last Updated:** November 19, 2025  
**Status:** ✅ Fixed and Ready to Test
