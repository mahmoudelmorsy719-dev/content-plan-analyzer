import React, { useState, useRef, useEffect } from 'react';
import { Result, Question, ConsultationForm } from '../types';
import { Download, FileText, Send, CheckCircle, MessageCircle, RefreshCw, AlertCircle } from 'lucide-react';

interface ResultCardProps {
  result: Result;
  questions: Question[];
  answers: Record<number, string>;
  onReset: () => void;
}

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxLiaWLO5XBtXofLRS5EPgoNYWSZRGA-NNCeH7DgFvdII-7fhgMXUWQiYyoqYTpGStgyw/exec";

// Declare html2pdf for TypeScript
declare const html2pdf: any;

const COUNTRIES = [
  { code: '+20', name: 'مصر', flag: '🇪🇬' },
  { code: '+966', name: 'السعودية', flag: '🇸🇦' },
  { code: '+971', name: 'الإمارات', flag: '🇦🇪' },
  { code: '+965', name: 'الكويت', flag: '🇰🇼' },
  { code: '+974', name: 'قطر', flag: '🇶🇦' },
  { code: '+973', name: 'البحرين', flag: '🇧🇭' },
  { code: '+968', name: 'عمان', flag: '🇴🇲' },
  { code: '+962', name: 'الأردن', flag: '🇯🇴' },
  { code: '+964', name: 'العراق', flag: '🇮🇶' },
  { code: '+961', name: 'لبنان', flag: '🇱🇧' },
  { code: '+212', name: 'المغرب', flag: '🇲🇦' },
  { code: '+213', name: 'الجزائر', flag: '🇩🇿' },
  { code: '+216', name: 'تونس', flag: '🇹🇳' },
  { code: '+249', name: 'السودان', flag: '🇸🇩' },
  { code: '+218', name: 'ليبيا', flag: '🇱🇾' },
  { code: '+967', name: 'اليمن', flag: '🇾🇪' },
  { code: '+970', name: 'فلسطين', flag: '🇵🇸' },
  { code: '+963', name: 'سوريا', flag: '🇸🇾' },
];

const ResultCard: React.FC<ResultCardProps> = ({ result, questions, answers, onReset }) => {
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for phone number parts
  const [countryCode, setCountryCode] = useState('+20');
  const [localPhone, setLocalPhone] = useState('');

  const [formData, setFormData] = useState<ConsultationForm>({
    name: '',
    whatsapp: '',
    website: '',
    problems: ''
  });
  
  const [formErrors, setFormErrors] = useState<Partial<ConsultationForm>>({});
  const reportRef = useRef<HTMLDivElement>(null);

  // Update formData.whatsapp whenever country or local phone changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      whatsapp: `${countryCode}${localPhone}`
    }));
    
    // Clear error if user starts typing
    if (localPhone.length > 5 && formErrors.whatsapp) {
      setFormErrors(prev => ({ ...prev, whatsapp: undefined }));
    }
  }, [countryCode, localPhone]);

  const getFeedbackForQuestion = (q: Question, answerId: string) => {
    const option = q.options.find(o => o.id === answerId);
    if (!option) return null;
    
    const value = option.value;
    const feedback = q.feedback.find(f => f.range.includes(value));
    return { value, feedback };
  };

  const handleDownloadPDF = () => {
    if (!reportRef.current) return;
    
    const element = reportRef.current;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: 'تقرير-خطة-المحتوى.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().from(element).set(opt).save();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof ConsultationForm]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<ConsultationForm> = {};
    let isValid = true;

    // 1. Validate Name
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      errors.name = "يرجى كتابة الاسم الثلاثي أو الثنائي بشكل صحيح (3 أحرف على الأقل).";
      isValid = false;
    }

    // 2. Validate WhatsApp (Combined International Number)
    // Check if local phone part is not empty and contains enough digits
    const cleanLocalPhone = localPhone.replace(/\D/g, '');
    if (!localPhone.trim() || cleanLocalPhone.length < 5) {
      errors.whatsapp = "يرجى إدخال رقم الهاتف بشكل صحيح.";
      isValid = false;
    }

    // 3. Validate Website
    const urlRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
    if (!formData.website.trim() || !urlRegex.test(formData.website)) {
      errors.website = "يرجى إدخال رابط صحيح (مثال: www.example.com أو رابط حساب انستجرام/فيسبوك).";
      isValid = false;
    }

    // 4. Validate Problems
    if (!formData.problems.trim() || formData.problems.trim().length < 10) {
      errors.problems = "يرجى توضيح المشكلة أو الهدف بشكل مفهوم (10 أحرف على الأقل).";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("ضع_رابط")) {
      alert("يرجى التأكد من إعداد رابط جوجل شيت بشكل صحيح.");
      return;
    }

    setIsSubmitting(true);

    const submissionData = {
      name: formData.name,
      whatsapp: formData.whatsapp, // This is already combined via useEffect
      website: formData.website,
      problems: formData.problems
    };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(submissionData)
      });
      
      setFormSubmitted(true);
      setShowConsultationForm(false);
    } catch (error) {
      console.error("Error submitting form", error);
      alert("حدث خطأ أثناء الإرسال، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => (
    <div className="space-y-8 text-right" dir="rtl">
      <div className="text-center border-b pb-6 border-slate-200">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">{result.title}</h2>
        <p className="text-slate-600">{result.description}</p>
      </div>

      <div className="space-y-6">
        {questions.map((q, index) => {
          const selectedOptionId = answers[q.id];
          const data = getFeedbackForQuestion(q, selectedOptionId);
          if (!data || !data.feedback) return null;

          const { value, feedback } = data;
          
          let scoreColor = "text-amber-600 bg-amber-50 border-amber-200";
          if (value >= 4) scoreColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
          else if (value <= 2) scoreColor = "text-red-600 bg-red-50 border-red-200";

          return (
            <div key={q.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm break-inside-avoid page-break-inside-avoid">
              <div className="flex items-start justify-between mb-3 gap-4">
                 <span className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${scoreColor.split(' ')[1]} ${scoreColor.split(' ')[0]}`}>
                   {value}/5
                 </span>
                 <h3 className="text-lg font-bold text-slate-800 flex-1">{q.text}</h3>
              </div>
              
              <div className="pr-4 border-r-2 border-slate-200 space-y-3">
                <div>
                   <p className="font-bold text-slate-700 text-sm mb-1">التشخيص:</p>
                   <p className="text-slate-600 leading-relaxed text-sm">{feedback.diagnosis}</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg mt-2">
                   <p className="font-bold text-indigo-900 text-sm mb-1">💡 التوصية:</p>
                   <p className="text-indigo-800 leading-relaxed text-sm">{feedback.recommendation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="text-center pt-8 border-t border-slate-200 text-slate-400 text-sm">
        تم إنشاء هذا التقرير تلقائياً بواسطة أداة تحليل المحتوى الذكي
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto slide-up">
      {/* PDF Generation Container */}
      <div className="absolute top-0 -left-[10000px]">
         <div ref={reportRef} className="p-8 bg-white w-[210mm] min-h-screen">
            <div className="text-center mb-8">
               <h1 className="text-2xl font-bold text-indigo-900">تقرير تحليل استراتيجية المحتوى</h1>
            </div>
            {renderContent()}
         </div>
      </div>

      {/* Visible Card */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
        <div className="p-8 md:p-12">
           {formSubmitted ? (
             <div className="text-center py-12 slide-up">
               <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle size={40} />
               </div>
               <h3 className="text-2xl font-bold text-slate-800 mb-2">تم استلام طلبك بنجاح!</h3>
               <p className="text-slate-600 mb-8">شكراً لتواصلك معنا {formData.name}. سيقوم فريقنا بمراجعة تقريرك والتواصل معك عبر الواتساب قريباً جداً.</p>
               <button
                  onClick={onReset}
                  className="text-slate-500 font-medium hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <RefreshCw size={18} />
                  إجراء تحليل جديد
                </button>
             </div>
           ) : showConsultationForm ? (
             <div className="slide-up max-w-xl mx-auto text-right" dir="rtl">
                <button 
                  onClick={() => setShowConsultationForm(false)}
                  className="text-slate-400 hover:text-slate-600 mb-6 text-sm flex items-center gap-1"
                >
                  العودة للتقرير
                </button>
                <h3 className="text-2xl font-bold text-indigo-900 mb-6">طلب استشارة مجانية</h3>
                
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 text-sm flex items-start gap-2">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <p>يرجى ملء جميع الحقول بعناية لنتمكن من دراسة حالتك بدقة والتواصل معك بالحل المناسب.</p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">الاسم الكامل <span className="text-red-500">*</span></label>
                    <input 
                      name="name"
                      type="text" 
                      value={formData.name}
                      onChange={handleFormChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 outline-none transition-all ${formErrors.name ? 'border-red-500 focus:ring-red-200 bg-red-50' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                      placeholder="أدخل اسمك"
                    />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">رقم الواتساب <span className="text-red-500">*</span></label>
                    <div className="flex flex-row-reverse gap-2" dir="ltr">
                      {/* Country Selector */}
                      <select 
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="w-[140px] p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-slate-50 text-sm"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.flag} {c.name} ({c.code})
                          </option>
                        ))}
                      </select>

                      {/* Phone Number Input */}
                      <input 
                        name="localPhone"
                        type="tel" 
                        value={localPhone}
                        onChange={(e) => setLocalPhone(e.target.value)}
                        className={`flex-1 p-3 border rounded-lg focus:ring-2 outline-none transition-all ${formErrors.whatsapp ? 'border-red-500 focus:ring-red-200 bg-red-50' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                        placeholder="رقم الهاتف"
                      />
                    </div>
                     {formErrors.whatsapp && <p className="text-red-500 text-xs mt-1 text-right">{formErrors.whatsapp}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">رابط الموقع / صفحة الشركة <span className="text-red-500">*</span></label>
                    <input 
                      name="website"
                      type="text" 
                      value={formData.website}
                      onChange={handleFormChange}
                      className={`w-full p-3 border rounded-lg focus:ring-2 outline-none transition-all ${formErrors.website ? 'border-red-500 focus:ring-red-200 bg-red-50' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                      placeholder="www.yourcompany.com أو رابط انستجرام/فيسبوك"
                      dir="ltr"
                      style={{ textAlign: 'right' }}
                    />
                     {formErrors.website && <p className="text-red-500 text-xs mt-1">{formErrors.website}</p>}
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">ما المشاكل التي تود مناقشتها؟ <span className="text-red-500">*</span></label>
                    <textarea 
                      name="problems"
                      value={formData.problems}
                      onChange={handleFormChange}
                      rows={4}
                      className={`w-full p-3 border rounded-lg focus:ring-2 outline-none transition-all ${formErrors.problems ? 'border-red-500 focus:ring-red-200 bg-red-50' : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                      placeholder="اشرح لنا باختصار التحديات التي تواجهها..."
                    ></textarea>
                     {formErrors.problems && <p className="text-red-500 text-xs mt-1">{formErrors.problems}</p>}
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'جاري الإرسال...' : (
                      <>
                        <Send size={20} />
                        إرسال الطلب
                      </>
                    )}
                  </button>
                </form>
             </div>
           ) : (
             <>
               {renderContent()}

               {/* Action Buttons */}
               <div className="flex flex-col md:flex-row gap-4 justify-center mt-12 pt-8 border-t border-slate-100">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex-1 py-4 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText size={20} />
                    تحميل التقرير (PDF)
                  </button>
                  <button
                    onClick={() => setShowConsultationForm(true)}
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={20} />
                    طلب استشارة مجانية
                  </button>
               </div>
             </>
           )}
        </div>
      </div>
    </div>
  );
};

export default ResultCard;