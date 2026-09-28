// يُسجِّل alias-loader.mjs بالطريقة المستقرة (module.register)، مُستخدَم فقط
// عبر `node --import ./scripts/register-loader.mjs ...` من سكربتات
// الاختبار اليدوية — لا علاقة له بكود الإنتاج إطلاقًا.
import { register } from "node:module";

register("./alias-loader.mjs", import.meta.url);
