const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();
const { runMigrations } = require('./migrations');

const app = express();
const PORT = process.env.PORT || 8012;

// ضبط الإعدادات الأساسية
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
}));

// تقديم الملفات الثابتة
app.use(express.static(path.join(__dirname, '/')));

// توجيه الطلبات إلى ملفات API
const studentsAPI = require('./api/students');
app.use('/api/students', studentsAPI);

// Sample courses endpoint for testing
app.get('/api/courses-sample', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    // اقرأ الملف مباشرة لتجنب كاش require
    const sampleCoursesPath = path.join(__dirname, 'sample-courses.json');
    const sampleCoursesData = fs.readFileSync(sampleCoursesPath, 'utf8');
    const sampleCourses = JSON.parse(sampleCoursesData);

    // Check if request is from admin page or frontend
    if (req.headers.referer && req.headers.referer.includes('courses.html')) {
      // Format the response for admin page
      res.json({
        success: true,
        data: sampleCourses.map(course => ({
          id: course.id,
          db_id: course.id, // إضافة db_id للتوافق مع الكود
          course_code: course.course_code,
          course_name: course.title,
          description: course.description,
          category: course.category,
          level: course.level_name,
          status: "active",
          duration: course.duration_weeks,
          instructor: course.instructor_name,
          price: course.price,
          youtube_link: course.youtube_link,
          start_date: course.start_date || null,
          end_date: course.end_date || null
        }))
      });
    } else {
      // Format for frontend - using courses property instead of data
      res.json({
        success: true,
        courses: sampleCourses
      });
    }
  } catch (error) {
    console.error('Error serving sample courses:', error);
    res.status(500).json({ error: 'Failed to load sample courses' });
  }
});

// إضافة دورة جديدة (POST)
app.post('/api/courses-sample', (req, res) => {
  try {
    const newCourse = req.body;
    const fs = require('fs');
    const path = require('path');
    
    // قراءة ملف الدورات
    const sampleCoursesPath = path.join(__dirname, 'sample-courses.json');
    const sampleCoursesData = fs.readFileSync(sampleCoursesPath, 'utf8');
    const sampleCourses = JSON.parse(sampleCoursesData);
    
    // إنشاء معرف جديد للدورة
    const newId = sampleCourses.length > 0 ? Math.max(...sampleCourses.map(c => parseInt(c.id))) + 1 : 1;
    
    // إنشاء كود فريد للدورة
    const courseCode = `CRS-${newId.toString().padStart(3, '0')}`;
    
    // إضافة الدورة الجديدة
    const courseToAdd = {
      id: newId,
      title: newCourse.course_name || 'دورة جديدة',
      course_code: courseCode,
      description: newCourse.description || 'وصف الدورة',
      instructor_name: newCourse.instructor || 'مدرس جديد',
      duration_weeks: newCourse.duration || 8,
      credits: 3,
      max_students: 25,
      category: newCourse.category || 'language',
      price: newCourse.price || '299',
      level_name: newCourse.level || 'متوسط',
      start_date: newCourse.start_date || new Date().toISOString().split('T')[0],
      end_date: newCourse.end_date || null,
      course_icon: 'fas fa-book',
      badge_text: 'جديد',
      youtube_link: newCourse.youtube_link || ''
    };
    
    // إضافة الدورة إلى المصفوفة
    sampleCourses.push(courseToAdd);
    
    // حفظ التغييرات في الملف
    fs.writeFileSync(sampleCoursesPath, JSON.stringify(sampleCourses, null, 2));
    
    res.json({
      success: true,
      message: 'تم إضافة الدورة بنجاح',
      data: courseToAdd
    });
  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة الدورة: ' + error.message
    });
  }
});

// تحديث الدورات (PUT)
app.put('/api/courses-sample', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const updatedCourse = req.body;
    
    if (!updatedCourse.id) {
      return res.status(400).json({
        success: false,
        message: 'معرف الدورة مطلوب'
      });
    }
    
    // قراءة ملف الدورات
    const sampleCoursesPath = path.join(__dirname, 'sample-courses.json');
    const sampleCoursesData = fs.readFileSync(sampleCoursesPath, 'utf8');
    const sampleCourses = JSON.parse(sampleCoursesData);
    
    // البحث عن الدورة المطلوب تحديثها
    const courseIndex = sampleCourses.findIndex(course => course.id == updatedCourse.id);
    
    if (courseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الدورة'
      });
    }
    
    // تحديث بيانات الدورة مع الحفاظ على البنية الصحيحة
    sampleCourses[courseIndex] = {
      ...sampleCourses[courseIndex],
      title: updatedCourse.course_name,
      description: updatedCourse.description,
      category: updatedCourse.category,
      level_name: updatedCourse.level,
      duration_weeks: parseInt(updatedCourse.duration),
      price: updatedCourse.price,
      instructor_name: updatedCourse.instructor,
      youtube_link: typeof updatedCourse.youtube_link !== 'undefined' ? updatedCourse.youtube_link : sampleCourses[courseIndex].youtube_link,
      start_date: typeof updatedCourse.start_date !== 'undefined' ? updatedCourse.start_date : sampleCourses[courseIndex].start_date,
      end_date: typeof updatedCourse.end_date !== 'undefined' ? updatedCourse.end_date : sampleCourses[courseIndex].end_date
    };
    
    // حفظ التغييرات في الملف
    fs.writeFileSync(sampleCoursesPath, JSON.stringify(sampleCourses, null, 2));
    
    // إرجاع البيانات المحدثة بالتنسيق المطلوب للواجهة
    const updatedCourseFormatted = {
      id: sampleCourses[courseIndex].id,
      course_code: sampleCourses[courseIndex].course_code,
      course_name: sampleCourses[courseIndex].title,
      description: sampleCourses[courseIndex].description,
      category: sampleCourses[courseIndex].category,
      level: sampleCourses[courseIndex].level_name,
      status: "active",
      duration: sampleCourses[courseIndex].duration_weeks,
      instructor: sampleCourses[courseIndex].instructor_name,
      price: sampleCourses[courseIndex].price
    };
    
    res.json({
      success: true,
      message: 'تم تحديث الدورة بنجاح',
      data: updatedCourseFormatted
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الدورة: ' + error.message
    });
  }
});



// حذف الدورات (DELETE)
app.delete('/api/courses-sample', (req, res) => {
  try {
    // استخدام معرف الدورة من query أو body
    const id = req.query.id || (req.body && req.body.id);
    const fs = require('fs');
    const path = require('path');
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'معرف الدورة مطلوب'
      });
    }
    
    // قراءة ملف الدورات
    const sampleCoursesPath = path.join(__dirname, 'sample-courses.json');
    const sampleCoursesData = fs.readFileSync(sampleCoursesPath, 'utf8');
    const sampleCourses = JSON.parse(sampleCoursesData);
    
    // البحث عن الدورة المطلوب حذفها
    const courseIndex = sampleCourses.findIndex(course => course.id == id);
    
    if (courseIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الدورة'
      });
    }
    
    // حذف الدورة من المصفوفة
    const deletedCourse = sampleCourses.splice(courseIndex, 1)[0];
    
    // حفظ التغييرات في الملف
    fs.writeFileSync(sampleCoursesPath, JSON.stringify(sampleCourses, null, 2));
    
    res.json({
      success: true,
      message: 'تم حذف الدورة بنجاح',
      data: deletedCourse
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الدورة: ' + error.message
    });
  }
});

// Import courses API
const coursesAPI = require('./api/courses');

// Courses API routes
app.get('/api/courses', coursesAPI.getCourses);
app.get('/api/courses/:id', coursesAPI.getCourseById);
app.post('/api/courses', coursesAPI.addCourse);
app.put('/api/courses', coursesAPI.updateCourse);
app.delete('/api/courses', coursesAPI.deleteCourse);

// Import categories API
const categoriesAPI = require('./api/categories');

// Categories API routes
app.get('/api/categories', categoriesAPI.getCategories);
app.get('/api/categories/:id/courses', categoriesAPI.getCoursesByCategory);
app.post('/api/categories', categoriesAPI.addCategory);
app.put('/api/categories/:id', categoriesAPI.updateCategory);
app.delete('/api/categories/:id', categoriesAPI.deleteCategory);

app.use('/api/videos', (req, res) => {
    require('./api/videos.php')(req, res);
});

// API endpoints
const enrollmentsAPI = require('./api/enrollments');
app.get('/api/enrollments', enrollmentsAPI.getEnrollments);
app.post('/api/enrollments', enrollmentsAPI.postEnrollments);
app.delete('/api/enrollments', enrollmentsAPI.deleteEnrollment);

// Stats API endpoint
const statsAPI = require('./api/stats');
app.use('/api/stats', statsAPI);

// Pretty URL route: /category/:id -> serve category-courses.html
app.get('/category/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'category-courses.html'));
});

// توجيه جميع الطلبات الأخرى إلى الصفحة الرئيسية
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// تنفيذ الـ migrations لإنشاء قاعدة البيانات
runMigrations()
    .then(() => {
        console.log('تم إنشاء وتهيئة قاعدة البيانات بنجاح');
        
        // تشغيل الخادم بعد إنشاء قاعدة البيانات
        app.listen(PORT, () => {
            console.log(`الخادم يعمل على المنفذ ${PORT}`);
        });
    })
    .catch(err => {
        console.error('حدث خطأ أثناء إنشاء قاعدة البيانات:', err);
        
        // تشغيل الخادم حتى في حالة فشل إنشاء قاعدة البيانات
        app.listen(PORT, () => {
            console.log(`الخادم يعمل على المنفذ ${PORT} (بدون إنشاء قاعدة البيانات)`);
        });
    });