# Bulk Upload Features Guide

## Overview
The Product Inventory System now includes powerful bulk upload features that allow you to add multiple products or orders at once using a spreadsheet-style interface.

## Features

### 📦 Bulk Products Upload
**Location:** Dashboard → Bulk Products (in sidebar)

**Purpose:** Add multiple products at once instead of one-by-one

**How it works:**
1. Navigate to "Bulk Products" from the dashboard sidebar
2. Fill in the table with your product information
3. Click "Add Row" button to add more products
4. Click "Upload All Products" when ready
5. All products are saved to Firebase in a single batch operation

**Table Columns:**
- **Name*** (Required) - Product name
- **Description** - Detailed product description
- **SKU** - Stock Keeping Unit identifier
- **Price ($)*** (Required) - Selling price
- **Cost Price ($)** - Your cost for the product
- **Stock*** (Required) - Available quantity
- **Low Stock Alert** - Threshold for low stock warnings (default: 10)
- **Category** - Product category/type
- **Active** - Checkbox to make product visible in catalog

**Validation:**
- Required fields are validated in real-time
- Errors appear in red below the field
- Cannot submit until all rows are valid
- Can delete individual rows (minimum 1 row required)

### 🛒 Bulk Orders Creation
**Location:** Dashboard → Bulk Orders (in sidebar)

**Purpose:** Create multiple orders quickly with automatic customer grouping

**How it works:**
1. Navigate to "Bulk Orders" from the dashboard sidebar
2. Fill in the table with order item information
3. Multiple items with the **same customer name** are automatically grouped into a single order
4. Click "Add Row" to add more order items
5. Click "Create All Orders" to process everything
6. Stock is automatically deducted from products

**Table Columns:**
- **Customer Name*** (Required) - Customer's full name
- **Phone** - Customer phone number
- **Email** - Customer email address
- **Product*** (Required) - Select from available products (only shows in-stock items)
- **Quantity*** (Required) - Number of units to order
- **Discount ($)** - Discount amount for this item
- **Total** - Auto-calculated total (quantity × price - discount)

**Smart Features:**
- **Automatic Grouping:** Items with the same customer name are combined into one order
- **Stock Validation:** Real-time validation ensures sufficient stock availability
- **Stock Deduction:** Inventory is automatically updated when orders are created
- **Stock Logs:** All stock changes are tracked in the system

**Example Scenario:**
```
Row 1: John Doe, Product A, Qty: 2
Row 2: John Doe, Product B, Qty: 1
Row 3: Jane Smith, Product A, Qty: 3
```
Results in:
- **1 Order for John Doe** with 2 items (Product A × 2, Product B × 1)
- **1 Order for Jane Smith** with 1 item (Product A × 3)

## Tips & Best Practices

### For Bulk Products:
1. **Prepare your data** - Have product information ready before starting
2. **Use consistent naming** - Follow a naming convention for categories
3. **Fill required fields first** - Name, Price, and Stock are mandatory
4. **Review before uploading** - Check all rows for accuracy
5. **Start small** - Test with a few products first

### For Bulk Orders:
1. **Group by customer** - Keep items for the same customer together
2. **Check stock first** - Ensure products have sufficient inventory
3. **Double-check quantities** - Validation prevents overselling
4. **Use discounts wisely** - Apply discounts at the item level
5. **Complete customer info** - Fill in contact details for order tracking

## Keyboard Shortcuts
- **Tab** - Move to next field
- **Shift + Tab** - Move to previous field
- **Enter** (in last field) - Automatically adds new row (coming soon)

## Common Issues

### "Please fix all validation errors"
- Review each row for red error messages
- Ensure all required fields (*) are filled
- Check that numeric fields contain valid numbers

### "Insufficient stock for [Product]"
- The product doesn't have enough inventory
- Reduce the quantity or add stock first
- Check the Products page for current stock levels

### "Failed to save/create"
- Check your internet connection
- Ensure you're logged in
- Try refreshing the page and re-entering data

## Technical Details

### Performance
- Bulk operations use Firebase batch writes for speed
- Maximum 500 operations per batch (plenty for typical use)
- Transactions ensure data consistency

### Data Safety
- All validations happen before saving
- Failed operations don't affect other data
- Stock updates are atomic (all-or-nothing)

## Future Enhancements
- CSV/Excel import support
- Bulk edit existing products/orders
- Templates for common product types
- Duplicate detection
- Undo functionality

---

**Need Help?** Check the main dashboard or contact support from the Settings page.
