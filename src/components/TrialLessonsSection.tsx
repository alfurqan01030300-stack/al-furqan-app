import React, { useState } from 'react';
import {
  Sparkles,
  Phone,
  MessageSquare,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trash2,
  UserCheck,
  Search,
  Filter,
  Plus,
  BookOpen
} from 'lucide-react';
import { TrialLesson, TrialLessonStatus } from '../types';
import { cleanWhatsAppNumber } from '../utils/storage';

interface TrialLessonsSectionProps {
  trialLessons: TrialLesson[];
  onUpdateStatus: (id: string, status: TrialLessonStatus) => void;
  onDeleteLesson: (id: string) => void;
  onConvertToStudent: (lesson: TrialLesson) => void;
  onOpenNewTrialModal: () => void;
  academyName: string;
  managerWhatsApp?: string;
}

export const TrialLessonsSection: React.FC<TrialLessonsSectionProps> = ({
  trialLessons,
  onUpdateStatus,
  onDeleteLesson,
  onConvertToStudent,
  onOpenNewTrialModal,
  academyName,
  managerWhatsApp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TrialLessonStatus>('all');

  // Statistics
  const totalCount = trialLessons.length;
  const newCount = trialLessons.filter((l) => l.status === 'new').length;
  const contactedCount = trialLessons.filter((l) => l.status === 'contacted' || l.status === 'scheduled').length;
  const enrolledCount = trialLessons.filter((l) => l.status === 'enrolled').length;

  // Filtered list
  const filtered = trialLessons.filter((lesson) => {
    const matchesSearch =
      lesson.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.parentPhone.includes(searchTerm) ||
      lesson.stageOrAge.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lesson.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: TrialLessonStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            طلب جديد لم يتم التواصل
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            تم التواصل مع ولي الأمر
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <Calendar className="w-3.5 h-3.5 text-purple-300" />
            تم تحديد موعد الحصة
          </span>
        );
      case 'enrolled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            تم الاشتراك في الأكاديمية
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40">
            ملغي / تعذر التواصل
          </span>
        );
    }
  };

  const getWhatsAppMessage = (lesson: TrialLesson) => {
    return encodeURIComponent(
      `السلام عليكم ورحمة الله وبركاته يا فندم،\nمعكم إدارة ${academyName}.\nبخصوص طلب الحصة التجريبية المجانية للطالب الكريم (${lesson.studentName}) - ${lesson.stageOrAge}.\nيسعدنا تحديد موعد الحصة التجريبية في الوقت المناسب لكم.\nهل الوقت الحالي مناسب للتنسيق؟`
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0B3D2E] border-2 border-[#D4AF37]/35 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B38728] text-[#07241B] flex items-center justify-center shadow-lg font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-amiri text-white flex items-center gap-2">
              طلبات الحصص التجريبية
              {newCount > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-extrabold shadow">
                  {newCount} جديد
                </span>
              )}
            </h2>
            <p className="text-xs text-[#D4AF37]">
              سجل الطلبات الواردة من الصفحة الرئيسية والمربوطة سحابياً بـ Firestore (مجموعة trialLessons)
            </p>
          </div>
        </div>

        {/* Add Manual Request Button */}
        <button
          onClick={onOpenNewTrialModal}
          className="gold-gradient-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold shadow-[0_4px_15px_rgba(212,175,55,0.35)] cursor-pointer transition active:scale-95"
        >
          <Plus className="w-4 h-4 text-[#07241B]" />
          <span>تسجيل طلب حصة جديد</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-[#0B3D2E] border border-[#D4AF37]/25 rounded-2xl p-4 shadow">
          <span className="text-xs text-slate-400 block mb-1">إجمالي الطلبات</span>
          <div className="text-2xl font-bold font-amiri text-white">{totalCount}</div>
        </div>

        <div className="bg-[#0B3D2E] border border-amber-500/40 rounded-2xl p-4 shadow">
          <span className="text-xs text-amber-300 font-semibold block mb-1">طلبات جديدة (انتظار)</span>
          <div className="text-2xl font-bold font-amiri text-amber-400">{newCount}</div>
        </div>

        <div className="bg-[#0B3D2E] border border-blue-500/40 rounded-2xl p-4 shadow">
          <span className="text-xs text-blue-300 font-semibold block mb-1">جاري المتابعة</span>
          <div className="text-2xl font-bold font-amiri text-blue-400">{contactedCount}</div>
        </div>

        <div className="bg-[#0B3D2E] border border-emerald-500/40 rounded-2xl p-4 shadow">
          <span className="text-xs text-emerald-300 font-semibold block mb-1">تم الاشتراك بنجاح</span>
          <div className="text-2xl font-bold font-amiri text-emerald-400">{enrolledCount}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0B3D2E]/90 border border-[#D4AF37]/25 p-3.5 sm:p-4 rounded-2xl shadow">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الطالب، رقم التليفون، أو المرحلة..."
            className="w-full bg-[#07241B] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-[#D4AF37] text-xs sm:text-sm pl-9"
          />
          <Search className="w-4 h-4 text-[#D4AF37]/60 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <span className="text-slate-400 text-xs hidden md:inline ml-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#D4AF37]" />
            الحالة:
          </span>
          {[
            { id: 'all', label: 'الكل' },
            { id: 'new', label: 'جديد' },
            { id: 'contacted', label: 'تم التواصل' },
            { id: 'scheduled', label: 'موعد محدد' },
            { id: 'enrolled', label: 'مشترك' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer font-medium ${
                statusFilter === tab.id
                  ? 'bg-[#145A43] text-[#F3E5AB] border border-[#D4AF37]/60 font-bold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Cards List */}
      {filtered.length === 0 ? (
        <div className="bg-[#0B3D2E] border border-[#D4AF37]/20 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#145A43]/50 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold font-amiri text-white">لا توجد طلبات حصص تجريبية تطابق البحث</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            عندما يقوم أولياء الأمور أو الزوار بالضغط على زر "حصة تجريبية" بالصفحة الرئيسية وإرسال بياناتهم، ستظهر طلباتهم هنا فورياً مع إمكانية التواصل معهم عبر واتساب بضغطة واحدة.
          </p>
          <button
            onClick={onOpenNewTrialModal}
            className="gold-gradient-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#07241B]" />
            <span>تجربة إضافة طلب الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lesson) => (
            <div
              key={lesson.id}
              className={`bg-[#0B3D2E] border rounded-3xl p-5 shadow-lg transition flex flex-col justify-between space-y-4 ${
                lesson.status === 'new'
                  ? 'border-amber-500/60 shadow-[0_4px_20px_rgba(245,158,11,0.15)] bg-gradient-to-b from-[#0B3D2E] to-[#07241B]'
                  : 'border-[#D4AF37]/25 hover:border-[#D4AF37]/50'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Student Name + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-base font-bold font-amiri text-white">
                      {lesson.studentName}
                    </h4>
                    <span className="text-xs text-[#D4AF37] font-medium flex items-center gap-1 mt-0.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      {lesson.stageOrAge}
                    </span>
                  </div>

                  <div>{getStatusBadge(lesson.status)}</div>
                </div>

                {/* Details Box */}
                <div className="bg-[#07241B]/80 rounded-2xl p-3 border border-[#D4AF37]/15 space-y-2 text-xs">
                  {/* Phone */}
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">هاتف ولي الأمر:</span>
                    <a
                      href={`tel:${cleanWhatsAppNumber(lesson.parentPhone)}`}
                      className="text-emerald-400 hover:underline font-mono font-semibold dir-ltr"
                    >
                      {lesson.parentPhone}
                    </a>
                  </div>

                  {/* Preferred Time */}
                  {lesson.preferredTime && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">الموعد المفضل:</span>
                      <span className="text-[#F3E5AB] font-medium">{lesson.preferredTime}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {lesson.notes && (
                    <div className="pt-1 border-t border-white/5 text-slate-300">
                      <span className="text-slate-400 block text-[11px] mb-0.5">ملاحظات:</span>
                      <p className="text-[11px] leading-relaxed italic bg-black/20 p-2 rounded-lg">
                        "{lesson.notes}"
                      </p>
                    </div>
                  )}

                  {/* Submission date */}
                  <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#D4AF37]" />
                      تاريخ الطلب:
                    </span>
                    <span dir="ltr">
                      {new Date(lesson.createdAt).toLocaleDateString('ar-EG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Status Selector */}
                <div className="pt-1">
                  <label className="block text-[11px] text-[#F3E5AB] font-semibold mb-1">
                    تحديث حالة المتابعة:
                  </label>
                  <select
                    value={lesson.status}
                    onChange={(e) => onUpdateStatus(lesson.id, e.target.value as TrialLessonStatus)}
                    className="w-full bg-[#07241B] border border-[#D4AF37]/35 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="new">🟡 جديد (لم يتم التواصل)</option>
                    <option value="contacted">🔵 تم التواصل مع ولي الأمر</option>
                    <option value="scheduled">🟣 تم تحديد موعد الحصة</option>
                    <option value="enrolled">🟢 تم الانضمام والاشتراك بالأكاديمية</option>
                    <option value="cancelled">🔴 ملغي / تعذر التواصل</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#D4AF37]/20 space-y-2">
                {/* 1-Click WhatsApp Button to Parent */}
                <a
                  href={`https://wa.me/${cleanWhatsAppNumber(lesson.parentPhone)}?text=${getWhatsAppMessage(lesson)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-[#07241B] text-xs font-extrabold shadow transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>مراسلة ولي الأمر على واتساب فوراً</span>
                </a>

                {/* Ready WhatsApp Summary with all Data for Admin */}
                <a
                  href={`https://wa.me/${cleanWhatsAppNumber(managerWhatsApp || '')}?text=${encodeURIComponent(
                    `📋 *طلب حصة تجريبية جديدة - ${academyName}*\n• اسم الطالب: ${lesson.studentName}\n• هاتف ولي الأمر: ${lesson.parentPhone}\n• المرحلة / السن: ${lesson.stageOrAge}${
                      lesson.preferredTime ? `\n• الموعد المفضل: ${lesson.preferredTime}` : ''
                    }${lesson.notes ? `\n• ملاحظات: ${lesson.notes}` : ''}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-[#07241B] hover:bg-[#145A43] text-[#F3E5AB] border border-[#D4AF37]/30 text-[11px] font-bold transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>إرسال ملخص البيانات لإدارة الأكاديمية (واتساب)</span>
                </a>

                {/* Sub Actions */}
                <div className="flex items-center gap-2">
                  {/* Convert to official Student */}
                  <button
                    onClick={() => onConvertToStudent(lesson)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#145A43] hover:bg-[#1A6C51] text-[#F3E5AB] text-xs font-semibold border border-[#D4AF37]/40 transition cursor-pointer"
                    title="تسجيله كطالب رسمي في الأكاديمية"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>تحويل لطالب رسمي</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (window.confirm(`هل أنت متأكد من حذف طلب الطالب (${lesson.studentName})؟`)) {
                        onDeleteLesson(lesson.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-red-900/20 hover:bg-red-800/30 text-red-300 border border-red-500/20 transition cursor-pointer"
                    title="حذف هذا الطلب"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
