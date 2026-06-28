# TipShift — Client (Frontend)

צד-לקוח לפרויקט הגמר בקורס Web & Cloud — **HTML / CSS / JavaScript בלבד** (ללא framework).
ממשק בעברית (RTL) לניהול משמרות, טיפים ובדיקת תלושים.

## מבנה
```
login.html      התחברות / הרשמה
index.html      האפליקציה (5 טאבים, מוגן באימות)
style/          theme.css (משתני צבע) · main.css · components.css
js/             api.js · auth.js · ui.js · router.js · charts.js
js/tabs/        home · shifts · auditor · summary · settings
images/         לוגו ואייקונים
```

## טאבים
**בית · משמרות · בדיקה (Auditor) · סיכום · הגדרות**

## הרצה מקומית
האתר סטטי. אפשר לפתוח עם שרת סטטי פשוט:
```bash
npx serve .        # או כל static server
```
כתובת ה-API נקבעת ב-`js/config.js` (מצביעה לשרת ב-Vercel; בפיתוח ל-localhost:4000).

## ספרייה חיצונית
**Chart.js** — גרפים בטאב הסיכום.
