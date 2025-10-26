# Quick Start Guide

## 🚀 How to Launch & Use

### Step 1: Reload Extension
```bash
# In VS Code Extension Development Host window
# Press: Cmd+R (or Reload Window from command palette)
```

### Step 2: Find the Extension

**Option A - Activity Bar (Left Side)**
- Look for 🚨 icon in the LEFT activity bar
- Click it → Sidebar opens

**Option B - Move to Right Side**
- Right-click the 🚨 icon
- Select "Move Primary Side Bar Right"
- OR drag the entire sidebar to the right

### Step 3: Use @ Pick File

1. Click **"@ Pick File"** button
2. **Quick Pick** dialog should appear at the top
3. You'll see all `.log` files in your workspace
4. Type to search
5. Press Enter to select

### If @ Pick File Doesn't Work

**Workaround**: Just type the path manually
```
logs/payment-service.log
```

Then click **"Parse Log"**

---

## 🧪 Full Test Flow

```bash
# 1. Make sure backend is running
cd /Users/kmanoj/incident-autopilot/server
npm run dev

# 2. Reload VS Code Extension Dev Host
# Press Cmd+R in the extension window

# 3. In the extension sidebar:
# - Enter: logs/payment-service.log (or use @ Pick File)
# - Click: Parse Log
# - Click: 🔍 Diagnose
# - Wait for results
# - Click: ✅ Confirm Fix Works & Save to Memory
```

---

## 🎯 For Demo

**To get RIGHT-SIDE appearance like Cursor:**

1. Open VS Code Command Palette (`Cmd+Shift+P`)
2. Type: `View: Move Primary Side Bar Right`
3. Your sidebar (including Incident Autopilot) moves to right!

OR

- Use `View: Toggle Secondary Side Bar` to open auxiliary bar on right
- But our extension will still be in primary sidebar for now

---

## 🐛 Troubleshooting

### "Can't find the extension"
- Look for 🚨 icon in activity bar (left or right)
- Try: `Cmd+Shift+P` → "Incident Autopilot"

### "@ Pick File doesn't work"
- Make sure you have `.log` files in workspace
- Check: `logs/payment-service.log` exists
- If it doesn't work, manually type path

### "Parse Log fails"
- Make sure path is correct relative to workspace root
- Example: `logs/payment-service.log` not `/full/path/...`

---

## ✅ Success Checklist

- [ ] Extension icon (🚨) visible in activity bar
- [ ] Sidebar opens when clicking icon
- [ ] Can enter log file path
- [ ] Parse Log extracts error/service/env
- [ ] Diagnose button calls backend
- [ ] Results appear in Panel 2
- [ ] Buttons show based on similarity

Perfect! You're ready to demo! 🎯

