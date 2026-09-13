import { z } from "zod";

/**
 * ตารางสอบระดับชาติ (TGAT/TPAT/A-Level) — เก็บเป็นไฟล์ข้อมูลในโปรเจกต์ ไม่ใช่ฐานข้อมูล
 * เพราะไม่ใช่ข้อมูลผู้ใช้ และต้องตรวจทานผ่าน git ได้เหมือนไฟล์เนื้อหาบทเรียน
 *
 * ข้อมูลข้างล่างนี้เป็นของจริง (ไม่ใช่ตัวอย่าง) ตรวจเทียบแล้วจาก mytcas.com (ประกาศทางการ)
 * บวกแหล่งรองอีก 5-6 แหล่ง ณ วันที่ 12 ก.ย. 2569 (verifiedAt ของทุกแถว) — ต้องตรวจซ้ำทุกเดือน
 * เพราะ ทปอ. เลื่อนวันสอบได้จริง (TCAS70 เองก็ย้ายวันสอบ TGAT/TPAT2-5 จากเดือนธันวาคม
 * มาเป็นปลายเดือนมกราคมเมื่อเทียบกับรูปแบบของปีก่อน ๆ) ถ้าตรวจแล้วพบว่า mytcas.com ประกาศ
 * ต่างจากนี้ ให้ยึดของ mytcas.com เป็นหลักเสมอ แล้วอัปเดต verifiedAt ใหม่
 *
 * กติกาของ crossChecked: ทุกแหล่งที่ใส่ในแถวหนึ่งต้องไม่ขัดกับค่าวันเวลาใดเลยในแถวนั้น
 * (สมัคร/สอบ/ประกาศผล) ถ้าแหล่งไหนขัดแม้ฟิลด์เดียว ห้ามใส่แหล่งนั้นในแถวนี้ — ใส่ได้เฉพาะแหล่งที่
 * ยืนยันตรงกันจริงเท่านั้น ไม่ใช่ใส่ไปเพื่อให้ครบจำนวนขั้นต่ำ
 */

export const EXAM_GROUPS = [
  "TGAT",
  "TPAT1",
  "TPAT2",
  "TPAT3",
  "TPAT4",
  "TPAT5",
  "A-Level",
] as const;
export type ExamGroup = (typeof EXAM_GROUPS)[number];

export const EXAM_GROUP_LABEL: Record<ExamGroup, string> = {
  TGAT: "TGAT",
  TPAT1: "TPAT1 (กสพท: แพทย์ ทันตะ เภสัช สัตวแพทย์)",
  TPAT2: "TPAT2 (ศิลปกรรมศาสตร์)",
  TPAT3: "TPAT3 (วิทยาศาสตร์ เทคโนโลยี วิศวกรรมศาสตร์)",
  TPAT4: "TPAT4 (สถาปัตยกรรมศาสตร์)",
  TPAT5: "TPAT5 (ครุศาสตร์/ศึกษาศาสตร์ ปรับปรุงใหม่)",
  "A-Level": "A-Level",
};

/** โดเมนแหล่งอ้างอิงที่ยอมรับสำหรับ sourceUrl — ประกาศทางการของระบบ TCAS หรือหน่วยงานที่จัดสอบเท่านั้น
 * ห้ามเป็นเว็บข่าว/บล็อก (แหล่งรองที่ใช้ตรวจเทียบให้ใส่ใน crossChecked แทน ไม่ใช่ sourceUrl) */
const ALLOWED_SOURCE_DOMAINS = ["mytcas.com", "niets.or.th"];

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isOfficialSource(url: string): boolean {
  const host = hostnameOf(url);
  if (!host) return false;
  return ALLOWED_SOURCE_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}

const crossCheckedSourceSchema = z.object({ name: z.string(), url: z.string().url() });

const baseExamSlot = z.object({
  id: z.string(),
  examYear: z.string(),
  examGroup: z.enum(EXAM_GROUPS),
  subjectCode: z.string().optional(),
  subjectName: z.string().optional(),
  startsOn: z.string().datetime({ offset: true }).optional(),
  endsOn: z.string().datetime({ offset: true }).optional(),
  resultAnnounceOn: z.string().datetime({ offset: true }).optional(),
  /** วันเปิด/ปิดรับสมัคร — พลาดวันปิดรับสมัครจบเลย เจ็บกว่าพลาดวันสอบ จึงนับถอยหลังแยกได้เหมือนกัน */
  registrationOpensOn: z.string().datetime({ offset: true }).optional(),
  registrationClosesOn: z.string().datetime({ offset: true }).optional(),
  status: z.enum(["confirmed", "tentative", "waiting"]),
  sourceName: z.string(),
  sourceUrl: z
    .string()
    .url()
    .refine(isOfficialSource, {
      message: `sourceUrl ต้องเป็นโดเมนทางการเท่านั้น (${ALLOWED_SOURCE_DOMAINS.join(", ")}) ห้ามอ้างเว็บข่าวหรือบล็อก`,
    }),
  verifiedAt: z.string().date(),
  note: z.string().optional(),
  /** แหล่งรองที่เอามาตรวจเทียบกับประกาศทางการ (ไม่ใช่แหล่งต้นทาง) — บังคับอย่างน้อย 2 รายการเมื่อ confirmed */
  crossChecked: z.array(crossCheckedSourceSchema).default([]),
});

export const examSlotSchema = baseExamSlot
  .refine((e) => e.examGroup !== "A-Level" || !!e.subjectName, {
    message: "examGroup เป็น 'A-Level' ต้องมี subjectName เสมอ (แต่ละวิชาสอบคนละเวลา)",
    path: ["subjectName"],
  })
  .refine((e) => e.status !== "confirmed" || (!!e.startsOn && !!e.endsOn), {
    message: "status เป็น 'confirmed' ต้องมีทั้ง startsOn และ endsOn เสมอ",
    path: ["startsOn"],
  })
  .refine((e) => e.status !== "confirmed" || e.crossChecked.length >= 2, {
    message: "status เป็น 'confirmed' ต้องมี crossChecked อย่างน้อย 2 รายการ (แหล่งรองที่ตรวจเทียบแล้ว)",
    path: ["crossChecked"],
  });

export type ExamSlot = z.infer<typeof baseExamSlot>;
export type CrossCheckedSource = z.infer<typeof crossCheckedSourceSchema>;

// แหล่งที่ใช้ตรวจเทียบกับประกาศทางการ (ไม่ใช่แหล่งต้นทาง) — mytcas.com คือแหล่งต้นทางอยู่ใน sourceUrl แล้ว
const SRC_SMP_TCAS70: CrossCheckedSource = {
  name: "SmartMathPro — ปฏิทิน TCAS70",
  url: "https://www.smartmathpro.com/article/tcas70-calendar/",
};
const SRC_SMP_ALEVEL: CrossCheckedSource = {
  name: "SmartMathPro — ปฏิทิน A-Level 70",
  url: "https://www.smartmathpro.com/article/calendar-alevel/",
};
const SRC_MEDDENTGAT: CrossCheckedSource = {
  name: "MedDentGAT — ปฏิทินการสอบ TCAS70",
  url: "https://www.meddentgat.com/posts/tcas-calendar",
};
const SRC_EDUZONES: CrossCheckedSource = {
  name: "Eduzones (LINE TODAY) — Timeline TCAS70",
  url: "https://today.line.me/th/v3/article/1DM1LnM",
};
const SRC_PPTV: CrossCheckedSource = {
  name: "PPTV HD36 — เปิดปฏิทิน TCAS70",
  url: "https://www.pptvhd36.com/news/%E0%B8%AA%E0%B8%B1%E0%B8%87%E0%B8%84%E0%B8%A1/274111",
};
// แหล่งที่ยืนยันวันรับสมัคร TPAT1 (กสพท) โดยเฉพาะ — แหล่งชุดข้างบนไม่ได้พูดถึงวันสมัคร TPAT1 ตรง ๆ
const SRC_DEKD_TPAT1: CrossCheckedSource = {
  name: "Dek-D (LINE TODAY) — กสพท70 เปิดรับสมัคร TPAT1",
  url: "https://today.line.me/th/v3/article/1DlOKm3",
};
const SRC_EDUZONES_TPAT1: CrossCheckedSource = {
  name: "Eduzones — สมัครสอบ TPAT1 กสพท70",
  url: "https://www.eduzones.com/2026/08/28/cotmesadmission70-2/",
};
const SRC_EDUFRIEND_TPAT1: CrossCheckedSource = {
  name: "EduFriend — TPAT1 กสพท70 เปิดสมัคร 1-20 ก.ย. 69",
  url: "https://edufriend.co/posts/tpat1-cotmes-70-application-steps-2026",
};

/** ใช้ตรวจเทียบรอบ TGAT/TPAT (สมัคร 4-10 พ.ย. 2569 · ประกาศผล 28 ก.พ. 2570) */
const TGAT_TPAT2_5_CROSSCHECK = [SRC_SMP_TCAS70, SRC_MEDDENTGAT, SRC_EDUZONES];
const TGAT_TPAT2_5_REGISTRATION = {
  registrationOpensOn: "2026-11-04T00:00:00+07:00",
  registrationClosesOn: "2026-11-10T23:59:00+07:00",
  resultAnnounceOn: "2027-02-28T00:00:00+07:00",
};

/**
 * ใช้ตรวจเทียบรอบ A-Level (เฉลย 26 มี.ค. 2570 · ประกาศผล 20 เม.ย. 2570)
 * ไม่ใส่ registrationOpensOn/registrationClosesOn ที่นี่ เพราะ SRC_SMP_ALEVEL ที่อยู่ใน
 * ALEVEL_CROSSCHECK เขียนวันรับสมัครขัดกับค่าที่เคยใส่ไว้ — อ้างเป็นหลักฐานไม่ได้ ปล่อยว่างไว้ก่อน
 * จนกว่าจะมีแหล่งที่ยืนยันวันรับสมัคร A-Level ตรงกันจริง
 */
const ALEVEL_CROSSCHECK = [SRC_SMP_ALEVEL, SRC_MEDDENTGAT, SRC_PPTV];
const ALEVEL_REGISTRATION = {
  resultAnnounceOn: "2027-04-20T00:00:00+07:00",
};

const COMMON = {
  examYear: "TCAS70",
  status: "confirmed" as const,
  sourceName: "ประกาศกำหนดการ TCAS70 (ทปอ.)",
  sourceUrl: "https://www.mytcas.com/",
  verifiedAt: "2026-09-12",
};

const REAL_EXAMS: ExamSlot[] = [
  // TGAT/TPAT2-5 — สมัคร 4-10 พ.ย. 2569 · ประกาศผล 28 ก.พ. 2570
  {
    id: "tpat3-70",
    ...COMMON,
    examGroup: "TPAT3",
    startsOn: "2027-01-30T09:00:00+07:00",
    endsOn: "2027-01-30T12:00:00+07:00",
    ...TGAT_TPAT2_5_REGISTRATION,
    crossChecked: TGAT_TPAT2_5_CROSSCHECK,
  },
  {
    id: "tgat-70",
    ...COMMON,
    examGroup: "TGAT",
    startsOn: "2027-01-30T13:00:00+07:00",
    endsOn: "2027-01-30T16:00:00+07:00",
    ...TGAT_TPAT2_5_REGISTRATION,
    crossChecked: TGAT_TPAT2_5_CROSSCHECK,
  },
  {
    id: "tpat5-70",
    ...COMMON,
    examGroup: "TPAT5",
    startsOn: "2027-01-31T09:00:00+07:00",
    endsOn: "2027-01-31T12:00:00+07:00",
    ...TGAT_TPAT2_5_REGISTRATION,
    crossChecked: TGAT_TPAT2_5_CROSSCHECK,
  },
  {
    id: "tpat2-70",
    ...COMMON,
    examGroup: "TPAT2",
    startsOn: "2027-01-31T13:00:00+07:00",
    endsOn: "2027-01-31T16:00:00+07:00",
    ...TGAT_TPAT2_5_REGISTRATION,
    crossChecked: TGAT_TPAT2_5_CROSSCHECK,
  },
  {
    id: "tpat4-70",
    ...COMMON,
    examGroup: "TPAT4",
    startsOn: "2027-02-01T09:00:00+07:00",
    endsOn: "2027-02-01T12:00:00+07:00",
    ...TGAT_TPAT2_5_REGISTRATION,
    crossChecked: TGAT_TPAT2_5_CROSSCHECK,
  },

  // TPAT1 (กสพท) — สมัคร 1-20 ก.ย. 2569 · ประกาศผล 15 มี.ค. 2570
  {
    id: "tpat1-70",
    ...COMMON,
    examGroup: "TPAT1",
    startsOn: "2027-02-13T08:30:00+07:00",
    endsOn: "2027-02-13T12:30:00+07:00",
    registrationOpensOn: "2026-09-01T00:00:00+07:00",
    registrationClosesOn: "2026-09-20T23:59:00+07:00",
    resultAnnounceOn: "2027-03-15T00:00:00+07:00",
    crossChecked: [SRC_DEKD_TPAT1, SRC_EDUZONES_TPAT1, SRC_EDUFRIEND_TPAT1],
  },

  // A-Level — สมัคร 14-20 ม.ค. 2570 · เฉลย 26 มี.ค. 2570 · ประกาศผล 20 เม.ย. 2570
  {
    id: "alevel-66-70",
    ...COMMON,
    examGroup: "A-Level",
    subjectCode: "66",
    subjectName: "ชีววิทยา",
    startsOn: "2027-03-13T08:30:00+07:00",
    endsOn: "2027-03-13T10:00:00+07:00",
    ...ALEVEL_REGISTRATION,
    crossChecked: ALEVEL_CROSSCHECK,
    note: "เฉลยคำตอบ 26 มี.ค. 2570",
  },
  {
    id: "alevel-64-70",
    ...COMMON,
    examGroup: "A-Level",
    subjectCode: "64",
    subjectName: "ฟิสิกส์",
    startsOn: "2027-03-13T11:00:00+07:00",
    endsOn: "2027-03-13T12:30:00+07:00",
    ...ALEVEL_REGISTRATION,
    crossChecked: ALEVEL_CROSSCHECK,
    note: "เฉลยคำตอบ 26 มี.ค. 2570",
  },
  {
    id: "alevel-81-70",
    ...COMMON,
    examGroup: "A-Level",
    subjectCode: "81",
    subjectName: "ภาษาไทย",
    startsOn: "2027-03-13T13:30:00+07:00",
    endsOn: "2027-03-13T15:00:00+07:00",
    ...ALEVEL_REGISTRATION,
    crossChecked: ALEVEL_CROSSCHECK,
    note: "เฉลยคำตอบ 26 มี.ค. 2570",
  },
  {
    id: "alevel-70-70",
    ...COMMON,
    examGroup: "A-Level",
    subjectCode: "70",
    subjectName: "สังคมศึกษา",
    startsOn: "2027-03-13T15:30:00+07:00",
    endsOn: "2027-03-13T17:00:00+07:00",
    ...ALEVEL_REGISTRATION,
    crossChecked: ALEVEL_CROSSCHECK,
    note: "เฉลยคำตอบ 26 มี.ค. 2570",
  },
  {
    id: "alevel-61-70",
    ...COMMON,
    examGroup: "A-Level",
    subjectCode: "61",
    subjectName: "คณิตศาสตร์ประยุกต์ 1",
    startsOn: "2027-03-14T08:30:00+07:00",
    endsOn: "2027-03-14T10:00:00+07:00",
    ...ALEVEL_REGISTRATION,
    crossChecked: ALEVEL_CROSSCHECK,
    note: "เฉลยคำตอบ 26 มี.ค. 2570",
  },
  {
    id: "alevel-82-70",
    ...COMMON,
    examGroup: "A-Level",
    subjectCode: "82",
    subjectName: "ภาษาอังกฤษ",
    startsOn: "2027-03-14T11:00:00+07:00",
    endsOn: "2027-03-14T12:30:00+07:00",
    ...ALEVEL_REGISTRATION,
    crossChecked: ALEVEL_CROSSCHECK,
    note: "เฉลยคำตอบ 26 มี.ค. 2570",
  },
  {
    id: "alevel-65-70",
    ...COMMON,
    examGroup: "A-Level",
    subjectCode: "65",
    subjectName: "เคมี",
    startsOn: "2027-03-14T13:30:00+07:00",
    endsOn: "2027-03-14T15:00:00+07:00",
    ...ALEVEL_REGISTRATION,
    crossChecked: ALEVEL_CROSSCHECK,
    note: "เฉลยคำตอบ 26 มี.ค. 2570",
  },
  {
    id: "alevel-62-70",
    ...COMMON,
    examGroup: "A-Level",
    subjectCode: "62",
    subjectName: "คณิตศาสตร์ประยุกต์ 2",
    startsOn: "2027-03-15T08:30:00+07:00",
    endsOn: "2027-03-15T10:00:00+07:00",
    ...ALEVEL_REGISTRATION,
    crossChecked: ALEVEL_CROSSCHECK,
    note: "เฉลยคำตอบ 26 มี.ค. 2570",
  },
  {
    id: "alevel-63-70",
    ...COMMON,
    examGroup: "A-Level",
    subjectCode: "63",
    subjectName: "วิทยาศาสตร์ประยุกต์",
    startsOn: "2027-03-15T11:00:00+07:00",
    endsOn: "2027-03-15T12:30:00+07:00",
    ...ALEVEL_REGISTRATION,
    crossChecked: ALEVEL_CROSSCHECK,
    note: "เฉลยคำตอบ 26 มี.ค. 2570",
  },
  {
    id: "alevel-foreign-70",
    ...COMMON,
    examGroup: "A-Level",
    subjectCode: "83-89",
    subjectName: "ภาษาต่างประเทศ (ฝรั่งเศส เยอรมัน ญี่ปุ่น เกาหลี จีน บาลี สเปน)",
    startsOn: "2027-03-15T13:30:00+07:00",
    endsOn: "2027-03-15T15:00:00+07:00",
    ...ALEVEL_REGISTRATION,
    crossChecked: ALEVEL_CROSSCHECK,
    note: "เฉลยคำตอบ 26 มี.ค. 2570 — รหัส 83-89 รวม 7 ภาษาในช่วงเวลาเดียวกัน เลือกสอบได้ 1 ภาษา",
  },
];

/** parse ตอน import เสมอ — ถ้าข้อมูลผิดกติกาข้อใดข้อหนึ่ง (รวมถึง crossChecked ไม่ครบ 2) build จะล้มทันที */
export const examSchedule: ExamSlot[] = REAL_EXAMS.map((e) => examSlotSchema.parse(e));
