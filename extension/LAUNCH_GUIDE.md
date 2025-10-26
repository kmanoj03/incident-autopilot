# 🚀 How to Launch the Extension - Step by Step

## Method 1: Launch from Extension Folder (RECOMMENDED)

### Step 1: Open Extension Folder in VS Code
```bash
code /Users/kmanoj/incident-autopilot/extension
```

### Step 2: Press F5
- This opens a NEW VS Code window called "Extension Development Host"
- The extension is ONLY active in this new window
- Look for the title bar saying **[Extension Development Host]**

### Step 3: Look for the Icon
In the NEW window (Extension Development Host):
- Look at the **LEFT sidebar** (activity bar)
- Find the 🚨 icon at the bottom
- Click it!

---

## Method 2: Manual Check

### In Extension Development Host Window:

1. **Open Command Palette**: `Cmd+Shift+P`
2. Type: `Developer: Show Running Extensions`
3. Look for: **"incident-autopilot"** in the list
4. If you see it → extension is running!

---

## Method 3: Alternative Activation

### Force Open the View:

1. **Command Palette**: `Cmd+Shift+P`
2. Type: `View: Open View`
3. Look for: **"Incident Assist"**
4. Select it → Should open!

---

## 🐛 If You STILL Don't See It

### Check the Debug Console:

In the **original VS Code window** (where you opened the extension folder):
1. Go to **Debug Console** tab (bottom panel)
2. Look for errors
3. You should see: `"Incident Autopilot extension activated"`

### Common Issues:

**Issue 1: Not in Extension Development Host**
- The extension ONLY works in the new window that opens when you press F5
- Not in your main VS Code window

**Issue 2: Activation Failed**
- Check Debug Console for errors
- Make sure package.json is valid

**Issue 3: Icon Not Visible**
- Try scrolling in the activity bar (left sidebar)
- Try maximizing the window

---

## ✅ Success Indicators

You'll know it worked when:
1. New window opens with title **[Extension Development Host]**
2. Debug Console shows: `Incident Autopilot extension activated`
3. You see 🚨 icon in left activity bar
4. Clicking icon opens "INCIDENT AUTOPILOT: INCIDENT ASSIST" sidebar

---

## 🎯 Try This NOW:

```bash
# 1. Open extension folder
cd /Users/kmanoj/incident-autopilot/extension
code .

# 2. In VS Code: Press F5

# 3. In NEW window: Look for 🚨 icon in left bar

# 4. Or use Command Palette: 
#    Cmd+Shift+P → "Incident Assist"
```

