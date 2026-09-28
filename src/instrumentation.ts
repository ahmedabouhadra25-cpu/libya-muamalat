/**
 * يعمل مرة واحدة فقط عند بدء تشغيل خادم Next.js. يبدأ هنا كل جامعي البيانات
 * الخلفيين (عقارات طرابلس + جالب الأخبار) بمعزل تام عن أي طلب مستخدم — لا
 * صفحة رئيسية، ولا أي مسار آخر، ينتظر أي استدعاء هنا. كل نظام معزول عن
 * الآخر تمامًا (لا استيراد متبادل)؛ فشل أحدهما لا يمنع الآخر من البدء، وفشل
 * أي منهما لا يمنع الخادم من الإقلاع إطلاقًا.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { ensureBackgroundCollectorStarted } = await import("@/lib/realEstate/collector");
    ensureBackgroundCollectorStarted();
  } catch {
    // لا شيء — نظام العقارات معزول عمدًا؛ فشل بدئه لا يجب أن يوقف الخادم.
  }

  try {
    const { ensureNewsBackgroundStarted } = await import("@/lib/news/fetchLibyaNews");
    ensureNewsBackgroundStarted();
  } catch {
    // لا شيء — نظام الأخبار معزول عمدًا؛ فشل بدئه لا يجب أن يوقف الخادم.
  }
}
