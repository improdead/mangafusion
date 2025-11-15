# Form Validation Examples

## Visual Guide to Error States and Validation

### 1. Title Field - Empty Error

**What the user sees:**
```
Story Title *                                   0/100
┌─────────────────────────────────────────────────┐
│ Enter your manga title...                      │ ← Red border
└─────────────────────────────────────────────────┘
⚠️ Title is required
```

### 2. Title Field - Too Long

**What the user sees:**
```
Story Title *                                 125/100 ← Red and bold
┌─────────────────────────────────────────────────┐
│ My Amazing Manga Adventure With A Very Very ... │ ← Red border
└─────────────────────────────────────────────────┘
⚠️ Title must be 100 characters or less
```

### 3. Description Field - Normal

**What the user sees:**
```
Story Description                              45/500 ← Gray
┌─────────────────────────────────────────────────┐
│ A young hero discovers ancient powers and...   │
│                                                 │
└─────────────────────────────────────────────────┘
Optional: Provide a brief summary of the story...
```

### 4. Cast Input - Live Counter

**What the user sees:**
```
Main Characters *
┌─────────────────────────────────────────────────┐
│ Aoi                                             │
│ Kenji                                           │
│ Sakura                                          │
└─────────────────────────────────────────────────┘
Enter one character name per line (1-10 characters max)
3 characters added ← Dynamic counter
```

### 5. Cast Input - Too Many Characters

**What the user sees:**
```
Main Characters *
┌─────────────────────────────────────────────────┐
│ Character1                                      │ ← Red border
│ Character2                                      │
│ ... (11 total)                                  │
└─────────────────────────────────────────────────┘
⚠️ Maximum 10 characters allowed
```

### 6. Style References - Files Selected

**What the user sees:**
```
Upload Style Reference Images (optional)
┌─────────────────────────────────────────────────┐
│ [Choose Files] style-ref-1.png                  │
└─────────────────────────────────────────────────┘
✓ 3 images selected - will be used to guide the art style
```
With purple background pill and checkmark icon.

### 7. Submit Button - Loading State

**What the user sees:**
```
┌─────────────────────────────────────────────────┐
│     ⟳ Planning story structure...              │
│                                                 │
│  • AI is planning your 10-page story...        │
│                                                 │
│ Planning → Structuring → References → Generating │
│              ^^^^^^^^^ (highlighted)            │
└─────────────────────────────────────────────────┘
```

### 8. Form-Wide Error

**When user tries to submit with errors:**
```
╔═════════════════════════════════════════════════╗
║ ⚠️ Error                                        ║
║ Please fix the validation errors before         ║
║ submitting                                      ║
╚═════════════════════════════════════════════════╝
```

---

## Validation Logic Flow

### On Page Load
```
1. All fields have default values (from useState)
2. No errors shown (touched Set is empty)
3. Character counters show: 0/100, 0/500
```

### On Field Focus
```
1. User focuses on field
2. No validation yet
3. Help text is visible
```

### On Field Blur (first time)
```
1. Field is marked as "touched"
2. Validation runs
3. If invalid, error appears
4. If valid, help text remains
```

### On Field Change (after touched)
```
1. User types
2. Character counter updates live
3. If field was touched, validation runs
4. Error message updates/clears in real-time
```

### On Form Submit
```
1. Validate all fields
2. If any errors:
   - Mark all fields as touched
   - Show all errors
   - Display form-wide error
   - Prevent submission
3. If valid:
   - Clear all errors
   - Show loading state
   - Begin generation
```

---

## Accessibility Features

### Screen Reader Announcements

**When field becomes invalid:**
```
"Title, invalid entry. Error: Title is required"
```

**When character counter updates:**
```
"45 out of 100 characters" (announced politely, not interrupting)
```

**When submit button changes state:**
```
"Button, busy. Planning story structure..."
```

### Keyboard Navigation

**Tab order:**
1. Title field
2. Description field
3. Genre Tags field
4. Tone field
5. Setting field
6. Visual Vibe field
7. Style Reference upload
8. Cast input
9. Submit button

**Focus indicators:**
- Purple ring around focused element
- High contrast
- Visible on all interactive elements

---

## Color Coding

### Normal State
- Border: `border-gray-300`
- Text: `text-gray-700`
- Help: `text-gray-500`

### Error State
- Border: `border-red-300` → `focus:border-red-500`
- Text: `text-red-600`
- Icon: Red warning icon

### Success State (file upload)
- Background: `bg-purple-50`
- Text: `text-purple-700`
- Icon: Green checkmark

### Loading State
- Button: Purple gradient background
- Text: White
- Spinner: Animated white circle

---

## Error Message Templates

### Required Fields
```
"{Field name} is required"
```

### Character Limits
```
"{Field name} must be {limit} characters or less"
```

### Count Limits
```
"Maximum {limit} characters allowed"
"At least one character is required"
```

### Recommendations
```
"{Field name} helps guide the {purpose}"
"At least one {field} is recommended"
```

---

## Progressive Enhancement

The form works even if JavaScript is disabled:
1. HTML5 validation provides basic checks
2. Server-side validation is still required
3. ARIA attributes improve accessibility regardless

With JavaScript enabled:
1. Real-time validation
2. Character counters
3. Live error messages
4. Enhanced UX
5. Progress tracking

---

## Testing the Validation

### Test Cases

**✅ Happy Path**
```
Title: "Shadow Sketch" (13 chars)
Description: "A story about..." (50 chars)
Genre Tags: "action, adventure"
Tone: "heroic"
Setting: "Tokyo"
Visual Vibe: "Demon Slayer style"
Cast: "Aoi\nKenji" (2 characters)
→ Should submit successfully
```

**❌ Empty Title**
```
Title: "" (empty)
→ Error: "Title is required"
```

**❌ Title Too Long**
```
Title: (101 characters)
→ Error: "Title must be 100 characters or less"
→ Counter shows: 101/100 in red
```

**❌ Description Too Long**
```
Description: (501 characters)
→ Error: "Description must be 500 characters or less"
→ Counter shows: 501/500 in red
```

**❌ No Characters**
```
Cast: "" (empty)
→ Error: "At least one character is required"
```

**❌ Too Many Characters**
```
Cast: (11 lines)
→ Error: "Maximum 10 characters allowed"
```

---

## Tips for Users

1. **Watch the character counters** - They turn red when you exceed the limit
2. **Fill required fields first** - Marked with red asterisk (*)
3. **Read the help text** - Each field has guidance
4. **Check for red borders** - Indicates an error that needs fixing
5. **Wait for validation** - Errors appear after you leave a field (blur)

---

This validation system provides a smooth, professional user experience while ensuring data quality! 🎯
