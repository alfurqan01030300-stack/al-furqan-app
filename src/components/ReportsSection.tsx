import React, { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Receipt,
  Download,
  FileText,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { AcademySettings, PaymentRecord, Student } from '../types';
import { getTodayDateStr } from '../utils/storage';
import {
  DownloadState,
  INITIAL_DOWNLOAD_STATE,
  executeUniversalDownload,
} from '../utils/downloadHelper';
import { DownloadFeedbackBox } from './DownloadFeedbackBox';

interface ReportsSectionProps {
  students: Student[];
  payments: PaymentRecord[];
  settings: AcademySettings;
  onViewReceipt: (payment: PaymentRecord) => void;
  onRecordPayment: (student: Student, amount?: number) => void;
}

export const ReportsSection: React.FC<ReportsSectionProps> = ({
  students,
  payments,
  settings,
  onViewReceipt,
  onRecordPayment,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(getTodayDateStr().slice(0, 7)); // YYYY-MM
  const [downloadState, setDownloadState] = useState<DownloadState>(INITIAL_DOWNLOAD_STATE);

  const currency = settings.currency || 'ر.س';
  const monthPayments = payments.filter((p) => p.monthKey === selectedMonth);

  // Students considered paid for selectedMonth: either have a PaymentRecord in that month, OR (for current month) student.feeStatus === 'paid'
  const currentMonthKey = getTodayDateStr().slice(0, 7);
  const paidStudentIdsThisMonth = new Set(monthPayments.map((p) => p.studentId));
  if (selectedMonth === currentMonthKey) {
    students.forEach((s) => {
      if (s.feeStatus === 'paid') paidStudentIdsThisMonth.add(s.id);
    });
  }

  const paidStudents = students.filter((s) => paidStudentIdsThisMonth.has(s.id));
  const unpaidStudents = students.filter((s) => !paidStudentIdsThisMonth.has(s.id));

  // Total money collected from recorded payments in this month
  const recordedSum = monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  // If current month has students marked paid without PaymentRecord yet, include fallback info cleanly or show exact collected sum
  const totalCollected = recordedSum;

  const handleDownloadCsv = async () => {
    const header = ['رقم الإيصال', 'اسم الطالب', 'المبلغ', 'العملة', 'التاريخ', 'الشهر', 'ملاحظات'];
    const rows = monthPayments.map((p) => [
      p.receiptNumber,
      p.studentName,
      String(p.amount),
      p.currency,
      p.date,
      p.monthKey,
      p.notes || '',
    ]);

    const summaryRows = [
      [],
      ['ملخص الشهر', selectedMonth],
      ['عدد الطلاب الذين دفعوا', String(paidStudents.length)],
      ['عدد الطلاب لم يدفعوا بعد', String(unpaidStudents.length)],
      ['إجمالي الفلوس المحصلة', `${totalCollected} ${currency}`],
    ];

    const csvContent =
      '\uFEFF' +
      [header, ...rows, ...summaryRows]
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    await executeUniversalDownload(
      blob,
      `تقرير-الأكاديمية-الشهري-${selectedMonth}.csv`,
      'text/csv;charset=utf-8',
      setDownloadState
    );
  };

  const handleDownloadHtmlReport = async () => {
    const rowsHtml = monthPayments
      .map(
        (p) => `
      <tr>
        <td>${p.receiptNumber}</td>
        <td>${p.studentName}</td>
        <td><strong>${p.amount} ${p.currency}</strong></td>
        <td>${p.date}</td>
        <td>${p.notes || '-'}</td>
      </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<title>التقرير المالي الشهري - ${selectedMonth} | ${settings.academyName}</title>
<style>
  body { font-family: Tahoma, Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 24px; }
  .box { max-width: 900px; margin: 0 auto; background: #fff; border: 2px solid #D4AF37; border-radius: 16px; padding: 24px; }
  h1 { color: #0B3D2E; margin: 0 0 6px; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
  .kpi { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 14px; text-align: center; }
  .kpi.warn { background: #fffbeb; border-color: #fde68a; }
  .kpi strong { display: block; font-size: 24px; color: #07241B; margin-top: 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: right; font-size: 13px; }
  th { background: #0B3D2E; color: #F3E5AB; }
</style>
</head>
<body>
  <div class="box">
    <h1>${settings.academyName}</h1>
    <p>التقرير المالي الشهري عن شهر: <strong>${selectedMonth}</strong></p>
    <div class="kpis">
      <div class="kpi"><span>طلاب دفعوا هذا الشهر</span><strong>${paidStudents.length}</strong></div>
      <div class="kpi warn"><span>طلاب لم يدفعوا بعد</span><strong>${unpaidStudents.length}</strong></div>
      <div class="kpi"><span>إجمالي المبالغ المحصلة</span><strong>${totalCollected} ${currency}</strong></div>
    </div>
    <table>
      <thead>
        <tr><th>رقم الإيصال</th><th>اسم الطالب</th><th>المبلغ</th><th>التاريخ</th><th>ملاحظات</th></tr>
      </thead>
      <tbody>${rowsHtml || '<tr><td colspan="5" style="text-align:center">لا توجد إيصالات مسجلة لهذا الشهر</td></tr>'}</tbody>
    </table>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    await executeUniversalDownload(
      blob,
      `تقرير-مالي-${selectedMonth}.html`,
      'text/html;charset=utf-8',
      setDownloadState
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-14">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B3D2E] border-2 border-[#D4AF37]/35 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B38728] text-[#07241B] flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-amiri text-white">
              التقرير المالي الشهري وإيرادات الأكاديمية
            </h2>
            <p className="text-xs text-[#D4AF37]">
              متابعة الطلاب المسددين، غير المسددين، وإجمالي المبالغ المحصلة شهرياً مع تصدير التقارير
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-[#07241B] px-3.5 py-2 rounded-xl border border-[#D4AF37]/40">
          <Calendar className="w-4 h-4 text-[#D4AF37]" />
          <label className="text-xs text-[#F3E5AB] font-semibold">الشهر:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-white text-xs sm:text-sm font-mono focus:outline-none"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0B3D2E] border-2 border-emerald-500/40 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-300 font-semibold block mb-1">
              طلاب دفعوا هذا الشهر
            </span>
            <div className="text-3xl font-black font-amiri text-white">
              {paidStudents.length}{' '}
              <span className="text-xs font-normal text-slate-300">من {students.length}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#0B3D2E] border-2 border-amber-500/40 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-300 font-semibold block mb-1">
              طلاب لم يدفعوا بعد
            </span>
            <div className="text-3xl font-black font-amiri text-amber-300">
              {unpaidStudents.length}{' '}
              <span className="text-xs font-normal text-slate-300">طالب</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#145A43] to-[#0B3D2E] border-2 border-[#D4AF37]/60 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-[#F3E5AB] font-semibold block mb-1">
              إجمالي الفلوس المحصلة ({selectedMonth})
            </span>
            <div className="text-3xl font-black font-amiri text-[#D4AF37]">
              {totalCollected.toLocaleString('ar-EG')}{' '}
              <span className="text-sm font-bold text-white">{currency}</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Export Buttons + Universal Download Feedback */}
      <div className="bg-[#0B3D2E]/90 border border-[#D4AF37]/30 rounded-2xl p-4 sm:p-5 space-y-3 shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-[#D4AF37]" />
              <span>تحميل التقرير الشهري ({selectedMonth})</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              تصدير مباشر على الكمبيوتر والموبايل بصيغة Excel (CSV) أو صفحة طباعة (HTML)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="gold-gradient-btn flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition active:scale-95"
            >
              <Download className="w-4 h-4 text-[#07241B]" />
              <span>تحميل تقرير CSV (إكسل)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadHtmlReport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#145A43] hover:bg-[#1A6C51] text-[#F3E5AB] border border-[#D4AF37]/40 text-xs font-bold cursor-pointer transition active:scale-95"
            >
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              <span>تحميل تقرير للطباعة HTML</span>
            </button>
          </div>
        </div>
        <DownloadFeedbackBox state={downloadState} title={`تقرير شهر ${selectedMonth}`} />
      </div>

      {/* Unpaid Students Quick Collect Section */}
      {unpaidStudents.length > 0 && (
        <div className="bg-[#0B3D2E] border border-amber-500/40 rounded-3xl p-5 shadow-lg space-y-3">
          <h3 className="text-base font-bold font-amiri text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <span>الطلاب غير المسددين عن شهر {selectedMonth} ({unpaidStudents.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unpaidStudents.map((st) => {
              const amount = st.subscriptionAmount || settings.defaultSubscriptionAmount || 250;
              return (
                <div
                  key={st.id}
                  className="bg-[#07241B]/80 border border-amber-500/25 rounded-2xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{st.name}</h4>
                    <p className="text-xs text-slate-400">
                      الاشتراك: <strong className="text-[#F3E5AB]">{amount} {currency}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRecordPayment(st, amount)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow cursor-pointer transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>تحصيل وإيصال</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recorded Payments Table */}
      <div className="bg-[#0B3D2E] border border-[#D4AF37]/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <h3 className="text-lg font-bold font-amiri text-white flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#D4AF37]" />
          <span>سجل الإيصالات والمدفوعات المسجلة ({monthPayments.length})</span>
        </h3>

        {monthPayments.length === 0 ? (
          <div className="bg-[#07241B]/60 border border-dashed border-[#D4AF37]/25 rounded-2xl p-8 text-center text-xs text-slate-400">
            لا توجد إيصالات دفع مسجلة في شهر {selectedMonth} حتى الآن. اضغط على «تحصيل وإيصال» عند أي طالب لتسجيل الدفع وإصدار إيصال فوري.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#D4AF37]/30 text-[#F3E5AB]">
                  <th className="py-3 px-3">رقم الإيصال</th>
                  <th className="py-3 px-3">اسم الطالب</th>
                  <th className="py-3 px-3">المبلغ</th>
                  <th className="py-3 px-3">تاريخ الدفع</th>
                  <th className="py-3 px-3">الإيصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {monthPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-3 font-mono text-xs text-[#D4AF37]" dir="ltr">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-3 font-bold text-white">{p.studentName}</td>
                    <td className="py-3 px-3 font-bold text-emerald-300">
                      {p.amount} {p.currency}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-300" dir="ltr">
                      {p.date}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => onViewReceipt(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#145A43] hover:bg-[#1A6C51] text-[#F3E5AB] border border-[#D4AF37]/40 text-xs font-bold cursor-pointer transition"
                      >
                        <Receipt className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>عرض / تحميل</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
