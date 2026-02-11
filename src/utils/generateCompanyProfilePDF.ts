import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateCompanyProfilePDF = async () => {
  // Create a hidden container with the PDF content
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '800px';
  container.style.direction = 'rtl';
  container.style.fontFamily = '"Cairo", "Tajawal", sans-serif';
  container.style.background = 'white';
  container.style.padding = '40px';
  container.style.lineHeight = '1.8';

  const currentYear = new Date().getFullYear();

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 60px; padding-bottom: 30px; border-bottom: 3px solid #1e40af;">
      <div style="font-size: 48px; font-weight: bold; color: #1e40af; margin-bottom: 10px;">
        ASH Holding
      </div>
      <div style="font-size: 20px; color: #666; margin-bottom: 5px;">
        الملف التعريفي للشركة
      </div>
      <div style="font-size: 14px; color: #999;">
        ${new Date().toLocaleDateString('ar-SA')}
      </div>
    </div>

    <!-- من نحن -->
    <div style="margin-bottom: 40px;">
      <div style="font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #ddd;">
        من نحن
      </div>
      <div style="color: #333; font-size: 14px; line-height: 1.8;">
        <p>نحن شركة ASH Holding - شركة تقنية سعودية متخصصة في تقديم حلول رقمية شاملة تساعد المؤسسات والأفراد على التحول الرقمي وتحقيق النمو المستدام.</p>
        <p style="margin-top: 10px;">نجمع بين الخبرة التقنية العميقة والرؤية الإبداعية لنقدم نتائج استثنائية تتجاوز توقعات عملائنا. فريقنا المتخصص يعمل بجد لضمان أن كل مشروع يحقق أهدافه بأعلى معايير الجودة.</p>
      </div>
    </div>

    <!-- خدماتنا -->
    <div style="margin-bottom: 40px;">
      <div style="font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #ddd;">
        خدماتنا
      </div>
      <div style="color: #333; font-size: 14px; line-height: 1.8;">
        <div style="margin-bottom: 12px;">
          <strong>💻 تطوير البرمجيات والأنظمة</strong>
          <p style="margin: 5px 0; color: #666;">أنظمة مؤسسية متكاملة مصممة خصيصاً لاحتياجات أعمالك</p>
        </div>
        <div style="margin-bottom: 12px;">
          <strong>🌐 تطوير المواقع والتطبيقات</strong>
          <p style="margin: 5px 0; color: #666;">مواقع وتطبيقات عصرية بأحدث التقنيات وأعلى الأداء</p>
        </div>
        <div style="margin-bottom: 12px;">
          <strong>🎨 التصميم والهوية البصرية</strong>
          <p style="margin: 5px 0; color: #666;">هوية بصرية مميزة تعكس قوة علامتك التجارية</p>
        </div>
        <div style="margin-bottom: 12px;">
          <strong>📊 التسويق الرقمي</strong>
          <p style="margin: 5px 0; color: #666;">استراتيجيات تسويق رقمية مبتكرة لتوسيع نطاق أعمالك</p>
        </div>
        <div style="margin-bottom: 12px;">
          <strong>⚙️ التحليل والأتمتة</strong>
          <p style="margin: 5px 0; color: #666;">حلول ذكاء اصطناعي وأتمتة لتحسين العمليات وزيادة الكفاءة</p>
        </div>
      </div>
    </div>

    <!-- التقنيات المستخدمة -->
    <div style="margin-bottom: 40px;">
      <div style="font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #ddd;">
        التقنيات المستخدمة
      </div>
      <div style="color: #333; font-size: 14px; line-height: 1.8;">
        <div style="margin-bottom: 8px;">• React / Next.js - تطوير واجهات المستخدم الحديثة</div>
        <div style="margin-bottom: 8px;">• Laravel / PHP - تطوير الخادم والتطبيقات الويب القوية</div>
        <div style="margin-bottom: 8px;">• Python - تحليل البيانات والأتمتة</div>
        <div style="margin-bottom: 8px;">• Cloud & APIs - خدمات سحابية متقدمة</div>
        <div style="margin-bottom: 8px;">• أدوات التسويق والتحليل - Google Analytics و Metabase وغيرها</div>
      </div>
    </div>

    <!-- لماذا ASH Holding -->
    <div style="margin-bottom: 40px;">
      <div style="font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #ddd;">
        لماذا ASH Holding؟
      </div>
      <div style="color: #333; font-size: 14px; line-height: 1.8;">
        <div style="margin-bottom: 12px;">
          <strong>🎯 حلول مخصصة</strong>
          <p style="margin: 5px 0; color: #666;">نصمم حلولاً فريدة تناسب طبيعة عملك الخاص</p>
        </div>
        <div style="margin-bottom: 12px;">
          <strong>✓ تنفيذ بمعايير عالمية</strong>
          <p style="margin: 5px 0; color: #666;">نلتزم بأفضل الممارسات والمعايير الدولية في كل مشروع</p>
        </div>
        <div style="margin-bottom: 12px;">
          <strong>👥 فريق محترف</strong>
          <p style="margin: 5px 0; color: #666;">خبراء متخصصون في مختلف المجالات التقنية</p>
        </div>
        <div style="margin-bottom: 12px;">
          <strong>📞 دعم مستمر</strong>
          <p style="margin: 5px 0; color: #666;">دعم فني متواصل لضمان استمرارية أعمالك</p>
        </div>
      </div>
    </div>

    <!-- بيانات التواصل -->
    <div style="margin-top: 50px; padding-top: 30px; border-top: 3px solid #1e40af;">
      <div style="font-size: 20px; font-weight: bold; color: #1e40af; margin-bottom: 15px;">
        تواصل معنا
      </div>
      <div style="color: #333; font-size: 14px; line-height: 2;">
        <div style="margin-bottom: 8px;">📧 البريد الإلكتروني: <strong>info@ash-holding.sa</strong></div>
        <div style="margin-bottom: 8px;">📧 الدعم: <strong>support@ash-holding.sa</strong></div>
        <div style="margin-bottom: 8px;">🌐 الموقع: <strong>https://ash-holding.sa</strong></div>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #999; font-size: 12px;">
      <p>© ${currentYear} ASH Holding - جميع الحقوق محفوظة</p>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Add images to PDF (handle multiple pages if needed)
    while (heightLeft > 0) {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height in mm
      position -= 297;
      if (heightLeft > 0) {
        pdf.addPage();
      }
    }

    // Download PDF
    pdf.save('ASH-Holding-Company-Profile.pdf');
  } finally {
    document.body.removeChild(container);
  }
};
