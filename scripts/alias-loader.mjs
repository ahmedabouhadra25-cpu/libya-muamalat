// Node ESM loader hook (built-in `module.register` API — zero npm packages)
// يحوّل استيراد "@/..." إلى "<جذر المشروع>/src/..." كي يمكن تشغيل ملفات
// src/lib/ai/*.ts مباشرة عبر `node` (دعم TypeScript الأصلي في Node 24) دون
// أي حزمة اختبار جديدة (jest/vitest/ts-node...). يُستخدم فقط من سكربتات
// الاختبار اليدوية تحت scripts/ — لا يُحمَّل أبدًا من أي كود إنتاجي.
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const target = resolvePath(projectRoot, "src", specifier.slice(2) + ".ts");
    return nextResolve(pathToFileURL(target).href, context);
  }
  return nextResolve(specifier, context);
}
