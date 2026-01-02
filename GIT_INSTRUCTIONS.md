# 📤 تعليمات رفع المشروع إلى GitHub
# Git Instructions for Uploading to GitHub

## 🚀 الخطوات | Steps

### 1️⃣ تهيئة Git (إذا لم يكن مهيأ)
### Initialize Git (if not already initialized)

```bash
git init
```

### 2️⃣ إضافة جميع الملفات
### Add all files

```bash
git add .
```

### 3️⃣ إنشاء Commit الأول
### Create the first commit

```bash
git commit -m "Initial commit: IntelliPath - Academic Guidance System

- Complete academic guidance system with AI-powered features
- RAG and Agentic RAG implementation
- Multi-database architecture (PostgreSQL, Neo4j, Qdrant)
- Full bilingual support (Arabic/English)
- Advanced analytics and reporting
- Student, Advisor, and Admin dashboards
- Comprehensive security implementation"
```

### 4️⃣ إعادة تسمية الفرع الرئيسي
### Rename main branch

```bash
git branch -M main
```

### 5️⃣ إضافة Remote Repository
### Add remote repository

**أولاً، أنشئ مستودع جديد على GitHub:**
**First, create a new repository on GitHub:**

1. اذهب إلى [GitHub](https://github.com)
2. اضغط على زر "+" في الأعلى واختر "New repository"
3. اختر اسم المستودع (مثلاً: `intellipath` أو `intellipath-academic-guidance`)
4. اختر Private أو Public حسب رغبتك
5. **لا** تضع علامة على "Initialize this repository with a README"
6. اضغط "Create repository"

**ثم أضف الـ remote:**
**Then add the remote:**

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

**أو باستخدام SSH:**
**Or using SSH:**

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
```

### 6️⃣ رفع المشروع
### Push the project

```bash
git push -u origin main
```

---

## 📝 أوامر Git الكاملة (نسخ ولصق)
## Complete Git Commands (Copy & Paste)

```bash
# تهيئة Git
git init

# إضافة جميع الملفات
git add .

# إنشاء Commit
git commit -m "Initial commit: IntelliPath - Academic Guidance System

- Complete academic guidance system with AI-powered features
- RAG and Agentic RAG implementation
- Multi-database architecture (PostgreSQL, Neo4j, Qdrant)
- Full bilingual support (Arabic/English)
- Advanced analytics and reporting
- Student, Advisor, and Admin dashboards
- Comprehensive security implementation"

# إعادة تسمية الفرع
git branch -M main

# إضافة Remote (استبدل YOUR_USERNAME و YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# رفع المشروع
git push -u origin main
```

---

## ⚠️ ملاحظات مهمة | Important Notes

### قبل الرفع | Before Pushing

✅ **تأكد من:**
- لا توجد ملفات `.env` في المشروع
- جميع الملفات الحساسة في `.gitignore`
- لا توجد مراجع لـ Lovable أو أدوات خارجية
- `package.json` محدث بشكل صحيح

### إذا واجهت مشاكل | If You Encounter Issues

**1. إذا طُلب منك اسم المستخدم وكلمة المرور:**
```bash
# استخدم Personal Access Token بدلاً من كلمة المرور
# أو استخدم SSH keys
```

**2. إذا كان المستودع موجوداً بالفعل:**
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

**3. إذا أردت رفع فرع محدد:**
```bash
git push -u origin main:main
```

---

## 🔐 إعدادات الأمان | Security Settings

### Personal Access Token (إذا استخدمت HTTPS)

1. اذهب إلى GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. اضغط "Generate new token"
3. اختر الصلاحيات المطلوبة (على الأقل `repo`)
4. انسخ الـ Token واستخدمه ككلمة مرور عند الرفع

### SSH Keys (الطريقة الموصى بها)

```bash
# إنشاء SSH key (إذا لم يكن موجوداً)
ssh-keygen -t ed25519 -C "your_email@example.com"

# إضافة SSH key إلى ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# نسخ المفتاح العام
cat ~/.ssh/id_ed25519.pub

# ثم أضفه إلى GitHub: Settings → SSH and GPG keys → New SSH key
```

---

## 📋 Checklist قبل الرفع | Pre-Push Checklist

- [ ] ✅ تم حذف جميع ملفات `.env`
- [ ] ✅ تم تحديث `.gitignore`
- [ ] ✅ تم تحديث `package.json` (الاسم والإصدار)
- [ ] ✅ لا توجد مراجع لـ Lovable
- [ ] ✅ `README.md` محدث ومكتمل
- [ ] ✅ تم اختبار المشروع محلياً
- [ ] ✅ تم إنشاء المستودع على GitHub
- [ ] ✅ تم إعداد المصادقة (Token أو SSH)

---

## 🎯 بعد الرفع | After Pushing

بعد رفع المشروع بنجاح، يمكنك:

1. **إضافة وصف للمستودع** على GitHub
2. **إضافة Topics/Tags** مثل: `ai`, `rag`, `academic-guidance`, `react`, `typescript`
3. **إضافة License** إذا أردت
4. **إعداد GitHub Pages** إذا أردت نشر الموقع
5. **إضافة GitHub Actions** للـ CI/CD إذا أردت

---

## 📞 مساعدة إضافية | Additional Help

إذا واجهت أي مشاكل، يمكنك:

1. التحقق من حالة Git: `git status`
2. عرض الـ remotes: `git remote -v`
3. عرض الـ branches: `git branch -a`
4. عرض الـ commits: `git log --oneline`

---

**تم التطوير بواسطة طارق محيسن | Developed by Tareq Mhysen**

