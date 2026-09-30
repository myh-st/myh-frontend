/**
 * BACKEND-OWNED: seed data for the in-browser Case Management API mirror.
 * Maintained by the backend team. Frontend changes must not modify it.
 */
import type {
  AuditAction,
  AuditEntry,
  CaseDetail,
  CaseState,
  Decision,
  EvidenceDocument,
  EvidenceKind,
  InfoRequest,
  LocalizedText,
  Me,
  ServiceType,
  SlaStatus,
  StaffRef,
} from '../api/types';

export const office: LocalizedText = { th: 'สำนักงานเขตบางรัก กรุงเทพมหานคร', en: 'Bang Rak District Office, Bangkok' };

export const staff = {
  officer: { id: 'u-off-01', name: { th: 'ณัฐพล วงศ์ประเสริฐ', en: 'Nattaphon Wongprasert' } },
  officer2: { id: 'u-off-02', name: { th: 'พิมพ์ชนก บุญมา', en: 'Phimchanok Boonma' } },
  supervisor: { id: 'u-sup-01', name: { th: 'อรุณี ทองคำ', en: 'Arunee Thongkham' } },
  viewer: { id: 'u-ro-01', name: { th: 'วีระ แก้วมณี', en: 'Weera Kaewmanee' } },
} satisfies Record<string, StaffRef>;

export const SYSTEM: StaffRef = { id: 'system', name: { th: 'ระบบ', en: 'System' } };

export const users: Me[] = [
  { ...staff.officer, role: 'case_officer', preferredLocale: 'th', office },
  { ...staff.officer2, role: 'case_officer', preferredLocale: 'th', office },
  { ...staff.supervisor, role: 'supervisor', preferredLocale: 'th', office },
  { ...staff.viewer, role: 'read_only', preferredLocale: 'en', office },
];

export const DOC_NAMES: Record<EvidenceKind, LocalizedText> = {
  national_id: { th: 'สำเนาบัตรประจำตัวประชาชน', en: 'Copy of national ID card' },
  house_registration: { th: 'สำเนาทะเบียนบ้าน (ทร.14)', en: 'Copy of house registration (Tor Ror 14)' },
  company_affidavit: { th: 'หนังสือรับรองการจดทะเบียนนิติบุคคล (ออกให้ไม่เกิน 6 เดือน)', en: 'Company affidavit (issued within the last 6 months)' },
  power_of_attorney: { th: 'หนังสือมอบอำนาจพร้อมติดอากรแสตมป์', en: 'Power of attorney with revenue stamp' },
  site_plan: { th: 'แผนผังแสดงที่ตั้งและแผนผังภายในสถานประกอบการ', en: 'Location map and premises layout plan' },
  building_drawings: { th: 'แบบแปลนอาคารและรายการคำนวณโครงสร้าง ลงนามโดยสถาปนิกและวิศวกรผู้ได้รับใบอนุญาต', en: 'Architectural drawings and structural calculations signed by licensed architect and engineer' },
  engineer_licence: { th: 'สำเนาใบอนุญาตประกอบวิชาชีพวิศวกรรมควบคุม', en: 'Copy of controlled engineering practice licence' },
  land_title: { th: 'สำเนาโฉนดที่ดิน (น.ส.4 จ.) ทุกหน้า', en: 'Copy of land title deed (Nor Sor 4 Jor), all pages' },
  health_certificate: { th: 'ใบรับรองแพทย์และหลักฐานการอบรมผู้สัมผัสอาหาร', en: 'Medical certificate and food-handler training record' },
  bank_book: { th: 'สำเนาหน้าสมุดบัญชีเงินฝากธนาคาร', en: 'Copy of bank passbook first page' },
  premises_photo: { th: 'ภาพถ่ายสถานที่ประกอบกิจการ', en: 'Photographs of premises' },
  other: { th: 'เอกสารอื่น ๆ', en: 'Other document' },
};

const req = (...kinds: EvidenceKind[]) => kinds.map((kind) => ({ kind, name: DOC_NAMES[kind] }));

export const serviceTypes: ServiceType[] = [
  {
    id: 'svc-business-reg',
    name: { th: 'จดทะเบียนพาณิชย์ (ใบอนุญาตประกอบธุรกิจ)', en: 'Commercial registration (business licence)' },
    slaDays: 7,
    feeThb: 50,
    decisions: ['approve', 'reject'],
    decisionsRequiringApproval: ['reject'],
    requiredDocuments: req('national_id', 'house_registration', 'site_plan', 'power_of_attorney'),
  },
  {
    id: 'svc-building-permit',
    name: { th: 'ใบอนุญาตก่อสร้าง ดัดแปลง หรือรื้อถอนอาคาร (แบบ ข.1)', en: 'Building construction, alteration or demolition permit (Form Kor.1)' },
    slaDays: 45,
    feeThb: 2000,
    decisions: ['approve', 'reject'],
    decisionsRequiringApproval: ['approve', 'reject'],
    requiredDocuments: req('national_id', 'house_registration', 'land_title', 'building_drawings', 'engineer_licence'),
  },
  {
    id: 'svc-elderly-allowance',
    name: { th: 'ลงทะเบียนรับเงินเบี้ยยังชีพผู้สูงอายุ', en: 'Elderly living allowance registration' },
    slaDays: 15,
    feeThb: 0,
    decisions: ['approve', 'reject'],
    decisionsRequiringApproval: ['reject'],
    requiredDocuments: req('national_id', 'house_registration', 'bank_book'),
  },
  {
    id: 'svc-land-use-cert',
    name: { th: 'หนังสือรับรองการใช้ประโยชน์ที่ดินตามผังเมืองรวม', en: 'Land-use certificate (comprehensive city plan)' },
    slaDays: 30,
    feeThb: 1000,
    decisions: ['approve', 'reject', 'waive_fee'],
    decisionsRequiringApproval: ['approve', 'reject', 'waive_fee'],
    requiredDocuments: req('national_id', 'land_title', 'site_plan', 'power_of_attorney'),
  },
  {
    id: 'svc-food-shop',
    name: { th: 'ใบอนุญาตจัดตั้งสถานที่จำหน่ายอาหาร (พื้นที่เกิน 200 ตารางเมตร)', en: 'Food shop establishment permit (over 200 m²)' },
    slaDays: 30,
    feeThb: 3000,
    decisions: ['approve', 'reject', 'waive_fee'],
    decisionsRequiringApproval: ['reject', 'waive_fee'],
    requiredDocuments: req('company_affidavit', 'power_of_attorney', 'site_plan', 'health_certificate', 'premises_photo'),
  },
];

const DAY = 86_400_000;
const now = Date.now();
const at = (days: number, hours = 0) => new Date(now + days * DAY + hours * 3_600_000).toISOString();

export function computeSlaStatus(state: CaseState, slaDueAt: string, nowMs = Date.now()): SlaStatus {
  if (state === 'approved' || state === 'rejected' || state === 'closed') return 'on_track';
  const remaining = new Date(slaDueAt).getTime() - nowMs;
  if (remaining < 0) return 'breached';
  if (remaining < 3 * DAY) return 'due_soon';
  return 'on_track';
}

export type CaseRecord = Omit<CaseDetail, 'allowedActions' | 'unavailableSources' | 'dataStatus'>;

let auditSeq = 0;
const ev = (days: number, actor: StaffRef, action: AuditAction, th: string, en: string, hours = 0): AuditEntry => ({
  id: `AUD-${String(++auditSeq).padStart(5, '0')}`,
  at: at(days, hours),
  actor,
  action,
  details: { th, en },
});

const doc = (id: string, kind: EvidenceKind, days: number, verified: boolean | null, sizeKb: number, name?: LocalizedText): EvidenceDocument => ({
  id,
  kind,
  name: name ?? DOC_NAMES[kind],
  uploadedAt: at(days),
  verified,
  sizeKb,
});

interface CaseSeed extends Omit<CaseRecord, 'submittedAt' | 'slaDueAt' | 'slaStatus' | 'lastActivityAt' | 'pendingDecision' | 'infoRequests' | 'decisions'> {
  submittedDays: number;
  infoRequests?: InfoRequest[];
  decisions?: Decision[];
}

function build(s: CaseSeed): CaseRecord {
  const { submittedDays, infoRequests = [], decisions = [], ...rest } = s;
  const svc = serviceTypes.find((t) => t.id === s.serviceType)!;
  const submittedAt = at(submittedDays);
  const slaDueAt = new Date(new Date(submittedAt).getTime() + svc.slaDays * DAY).toISOString();
  return {
    ...rest,
    submittedAt,
    slaDueAt,
    slaStatus: computeSlaStatus(s.state, slaDueAt, now),
    lastActivityAt: s.audit[s.audit.length - 1].at,
    infoRequests,
    decisions,
    pendingDecision: decisions.find((d) => d.status === 'pending_approval') ?? null,
  };
}

const submittedEv = (days: number, hours = 0) =>
  ev(days, SYSTEM, 'case_submitted', 'ยื่นคำขอผ่านระบบบริการอิเล็กทรอนิกส์ และชำระค่าธรรมเนียมแล้ว', 'Application submitted via e-Service and fee paid', hours);
const assignedEv = (days: number, to: StaffRef) =>
  ev(days, staff.supervisor, 'case_assigned', `มอบหมายให้ ${to.name.th}`, `Assigned to ${to.name.en}`);

export function seedCases(): CaseRecord[] {
  auditSeq = 0;
  const { officer, officer2, supervisor } = staff;
  return [
    build({
      id: 'BKK-2569-004213',
      serviceType: 'svc-food-shop',
      applicantName: { th: 'บริษัท ครัวคุณยายสมบูรณ์ฟู้ดส์ แอนด์ เบเวอเรจ (ประเทศไทย) จำกัด', en: 'Khrua Khun Yai Somboon Foods & Beverage (Thailand) Co., Ltd.' },
      state: 'in_review',
      assignee: officer,
      submittedDays: -28.5,
      version: 3,
      applicant: {
        kind: 'juristic_person',
        name: { th: 'บริษัท ครัวคุณยายสมบูรณ์ฟู้ดส์ แอนด์ เบเวอเรจ (ประเทศไทย) จำกัด', en: 'Khrua Khun Yai Somboon Foods & Beverage (Thailand) Co., Ltd.' },
        idNumberMasked: '0-1055-6xxxx-xx-4',
        phone: '02-234-5871',
        email: 'licensing@khruakhunyai.co.th',
        address: {
          th: 'เลขที่ 88/14-15 อาคารสีลมคอมเพล็กซ์ ชั้น 1 ห้อง G-07 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพมหานคร 10500',
          en: '88/14-15 Silom Complex, 1st Floor, Unit G-07, Silom Road, Silom, Bang Rak, Bangkok 10500',
        },
        correspondenceLocale: 'th',
        registryCheck: { status: 'verified', checkedAt: at(-28) },
      },
      fields: [
        { key: 'shop_name', label: { th: 'ชื่อสถานที่จำหน่ายอาหาร', en: 'Shop name' }, value: { th: 'ครัวคุณยายสมบูรณ์ สาขาสีลม', en: 'Khrua Khun Yai Somboon – Silom branch' } },
        { key: 'floor_area', label: { th: 'พื้นที่ประกอบการ', en: 'Floor area' }, value: { th: '286 ตารางเมตร', en: '286 m²' } },
        { key: 'seats', label: { th: 'จำนวนที่นั่ง', en: 'Seating capacity' }, value: { th: '96 ที่นั่ง', en: '96 seats' } },
        { key: 'food_type', label: { th: 'ประเภทอาหาร', en: 'Type of food' }, value: { th: 'อาหารไทยตามสั่ง ข้าวแกง และเครื่องดื่มไม่มีแอลกอฮอล์ ปรุงสดภายในร้าน', en: 'Thai made-to-order dishes, curry-and-rice and non-alcoholic drinks, cooked on site' } },
        { key: 'hours', label: { th: 'เวลาทำการ', en: 'Opening hours' }, value: { th: 'ทุกวัน 06:30–21:00 น.', en: 'Daily 06:30–21:00' } },
      ],
      evidence: [
        doc('EV-4213-1', 'company_affidavit', -28.5, true, 412),
        doc('EV-4213-2', 'power_of_attorney', -28.5, null, 188),
        doc('EV-4213-3', 'site_plan', -28.5, true, 2310),
        doc('EV-4213-4', 'health_certificate', -28.5, false, 964, { th: 'ใบรับรองแพทย์ผู้สัมผัสอาหาร จำนวน 7 คน (ไฟล์รวม)', en: 'Medical certificates for 7 food handlers (combined file)' }),
        doc('EV-4213-5', 'premises_photo', -28.5, null, 5870),
      ],
      audit: [
        submittedEv(-28.5),
        assignedEv(-27, officer),
        ev(-20, officer, 'document_verified', 'ตรวจสอบหนังสือรับรองนิติบุคคลและแผนผังแล้ว ถูกต้อง', 'Company affidavit and site plan checked – valid'),
        ev(-2, officer, 'document_rejected', 'ใบรับรองแพทย์ของผู้สัมผัสอาหาร 2 คน หมดอายุตั้งแต่เดือนมิถุนายน 2569', 'Medical certificates for 2 food handlers expired in June 2026'),
      ],
    }),
    build({
      id: 'BKK-2569-004198',
      serviceType: 'svc-building-permit',
      applicantName: { th: 'นายธนวัฒน์ รุ่งโรจน์ธนากร', en: 'Mr. Thanawat Rungrojthanakorn' },
      state: 'pending_supervisor',
      assignee: officer,
      submittedDays: -20,
      version: 5,
      applicant: {
        kind: 'individual',
        name: { th: 'นายธนวัฒน์ รุ่งโรจน์ธนากร', en: 'Mr. Thanawat Rungrojthanakorn' },
        idNumberMasked: '3-1012-0xxxx-xx-2',
        phone: '081-455-2093',
        email: 'thanawat.r@example.co.th',
        address: {
          th: 'เลขที่ 45 ซอยเจริญกรุง 36 (ซอยโรงภาษีเก่า) ถนนเจริญกรุง แขวงบางรัก เขตบางรัก กรุงเทพมหานคร 10500',
          en: '45 Soi Charoen Krung 36 (Soi Rong Phasi Kao), Charoen Krung Road, Bang Rak, Bangkok 10500',
        },
        correspondenceLocale: 'th',
        registryCheck: { status: 'verified', checkedAt: at(-20) },
      },
      fields: [
        { key: 'work_type', label: { th: 'ประเภทงาน', en: 'Type of work' }, value: { th: 'ดัดแปลงอาคาร ต่อเติมชั้นดาดฟ้า', en: 'Alteration – rooftop extension' } },
        { key: 'building_type', label: { th: 'ชนิดอาคาร', en: 'Building type' }, value: { th: 'ตึกแถว ค.ส.ล. 4 ชั้น', en: '4-storey reinforced-concrete shophouse' } },
        { key: 'area', label: { th: 'พื้นที่อาคารรวม', en: 'Total floor area' }, value: { th: '320 ตารางเมตร', en: '320 m²' } },
        { key: 'land', label: { th: 'ที่ดิน', en: 'Land parcel' }, value: { th: 'โฉนดที่ดินเลขที่ 3391 เลขที่ดิน 118 หน้าสำรวจ 2207', en: 'Title deed no. 3391, parcel 118, survey page 2207' } },
      ],
      evidence: [
        doc('EV-4198-1', 'national_id', -20, true, 96),
        doc('EV-4198-2', 'house_registration', -20, true, 144),
        doc('EV-4198-3', 'land_title', -20, true, 1620),
        doc('EV-4198-4', 'building_drawings', -9, true, 14880, { th: 'แบบแปลนอาคารฉบับแก้ไขครั้งที่ 2 พร้อมรายการคำนวณโครงสร้าง', en: 'Architectural drawings revision 2 with structural calculations' }),
        doc('EV-4198-5', 'engineer_licence', -20, true, 210),
      ],
      infoRequests: [
        {
          id: 'IR-4198-1',
          requestedAt: at(-14),
          requestedBy: officer,
          items: [{ documentKind: 'building_drawings', note: 'แบบโครงสร้างชั้นดาดฟ้าไม่ระบุขนาดคาน / Roof beam sizes missing' }],
          messageTh: 'กรุณาส่งแบบแปลนฉบับแก้ไขที่ระบุขนาดคานและเสาชั้นดาดฟ้า',
          messageEn: 'Please submit revised drawings showing rooftop beam and column sizes.',
          responseDueAt: at(-7),
          status: 'responded',
          respondedAt: at(-9),
        },
      ],
      decisions: [
        {
          id: 'DEC-4198-1',
          decision: 'approve',
          reasonTh: 'แบบแปลนฉบับแก้ไขเป็นไปตามกฎกระทรวงและข้อบัญญัติกรุงเทพมหานคร',
          reasonEn: 'Revised drawings comply with ministerial regulations and BMA ordinances.',
          decidedBy: officer,
          decidedAt: at(-1),
          status: 'pending_approval',
          review: null,
        },
      ],
      audit: [
        submittedEv(-20),
        assignedEv(-19, officer),
        ev(-14, officer, 'info_requested', 'ขอเอกสารเพิ่มเติม: แบบแปลนโครงสร้างชั้นดาดฟ้า', 'Requested additional document: rooftop structural drawings'),
        ev(-9, SYSTEM, 'info_received', 'ผู้ยื่นคำขอส่งเอกสารเพิ่มเติมแล้ว', 'Applicant submitted the requested documents'),
        ev(-1, officer, 'decision_submitted_for_approval', 'เสนออนุญาต รอผู้บังคับบัญชาอนุมัติ', 'Proposed approval – awaiting supervisor sign-off'),
      ],
    }),
    build({
      id: 'BKK-2569-004177',
      serviceType: 'svc-elderly-allowance',
      applicantName: { th: 'นางบุญเรือน ประดิษฐ์ศิลป์วัฒนากุล' },
      state: 'awaiting_info',
      assignee: officer,
      submittedDays: -6,
      version: 4,
      applicant: {
        kind: 'individual',
        name: { th: 'นางบุญเรือน ประดิษฐ์ศิลป์วัฒนากุล' },
        idNumberMasked: '3-1005-0xxxx-xx-7',
        phone: '089-771-0346',
        email: null,
        address: { th: 'เลขที่ 1187/42 ชุมชนวัดหัวลำโพง ซอยพระรามที่ 4 ซอย 24 ถนนพระรามที่ 4 แขวงสี่พระยา เขตบางรัก กรุงเทพมหานคร 10500' },
        correspondenceLocale: 'th',
        registryCheck: { status: 'mismatch', checkedAt: at(-6) },
      },
      fields: [
        { key: 'dob', label: { th: 'วันเดือนปีเกิด', en: 'Date of birth' }, value: { th: '14 มีนาคม 2509', en: '14 March 1966' } },
        { key: 'payment', label: { th: 'ช่องทางรับเงิน', en: 'Payment method' }, value: { th: 'โอนเข้าบัญชีธนาคารกรุงไทย ออมทรัพย์', en: 'Transfer to Krungthai Bank savings account' } },
        { key: 'other_benefits', label: { th: 'สวัสดิการอื่นที่ได้รับ', en: 'Other state benefits received' }, value: { th: 'ไม่มี', en: 'None' } },
      ],
      evidence: [
        doc('EV-4177-1', 'national_id', -6, true, 88),
        doc('EV-4177-2', 'house_registration', -6, false, 102),
        doc('EV-4177-3', 'bank_book', -6, null, 134),
      ],
      infoRequests: [
        {
          id: 'IR-4177-1',
          requestedAt: at(-4),
          requestedBy: officer,
          items: [{ documentKind: 'house_registration', note: 'ที่อยู่ในทะเบียนบ้านไม่ตรงกับฐานข้อมูลทะเบียนราษฎร' }],
          messageTh: 'ที่อยู่ตามสำเนาทะเบียนบ้านไม่ตรงกับฐานข้อมูลทะเบียนราษฎร กรุณาส่งสำเนาทะเบียนบ้านฉบับปัจจุบันที่มีชื่อผู้ยื่นคำขอ',
          messageEn: 'The address on the house registration copy does not match the civil registry. Please provide a current copy listing the applicant.',
          responseDueAt: at(8),
          status: 'open',
          respondedAt: null,
        },
      ],
      audit: [
        submittedEv(-6),
        assignedEv(-5, officer),
        ev(-4, officer, 'document_rejected', 'ทะเบียนบ้านไม่ตรงกับฐานข้อมูลทะเบียนราษฎร', 'House registration does not match civil registry'),
        ev(-4, officer, 'info_requested', 'ขอสำเนาทะเบียนบ้านฉบับปัจจุบัน ภายใน 12 วัน', 'Requested current house registration copy within 12 days', 1),
      ],
    }),
    build({
      id: 'BKK-2569-004150',
      serviceType: 'svc-land-use-cert',
      applicantName: { th: 'นายสุรเชษฐ์ เจริญรุ่งเรืองกิจไพศาล', en: 'Mr. Surachet Charoenrungrueangkitphaisan' },
      state: 'submitted',
      assignee: officer,
      submittedDays: -33,
      version: 1,
      applicant: {
        kind: 'individual',
        name: { th: 'นายสุรเชษฐ์ เจริญรุ่งเรืองกิจไพศาล', en: 'Mr. Surachet Charoenrungrueangkitphaisan' },
        idNumberMasked: '3-1101-4xxxx-xx-9',
        phone: '086-302-7718',
        email: 'surachet.c@example.com',
        address: {
          th: 'เลขที่ 219/7 หมู่บ้านนันทวันพระราม 3 ซอยพระรามที่ 3 ซอย 57 แยก 2 ถนนพระรามที่ 3 แขวงบางโคล่ เขตบางคอแหลม กรุงเทพมหานคร 10120',
          en: '219/7 Nantawan Rama 3 Village, Soi Rama 3 57 Yaek 2, Rama 3 Road, Bang Khlo, Bang Kho Laem, Bangkok 10120',
        },
        correspondenceLocale: 'en',
        registryCheck: { status: 'verified', checkedAt: at(-33) },
      },
      fields: [
        { key: 'land', label: { th: 'ที่ดิน', en: 'Land parcel' }, value: { th: 'โฉนดที่ดินเลขที่ 12874 เลขที่ดิน 305 หน้าสำรวจ 4471 แขวงมหาพฤฒาราม', en: 'Title deed no. 12874, parcel 305, survey page 4471, Maha Phruettharam' } },
        { key: 'intended_use', label: { th: 'วัตถุประสงค์การใช้ที่ดิน', en: 'Intended use' }, value: { th: 'ก่อสร้างอาคารพาณิชยกรรมและสำนักงาน สูงไม่เกิน 8 ชั้น', en: 'Commercial and office building, max. 8 storeys' } },
        { key: 'area', label: { th: 'เนื้อที่', en: 'Land area' }, value: { th: '1 งาน 42 ตารางวา', en: '568 m²' } },
      ],
      evidence: [
        doc('EV-4150-1', 'national_id', -33, null, 91),
        doc('EV-4150-2', 'land_title', -33, null, 2240),
        doc('EV-4150-3', 'site_plan', -33, null, 3105),
        doc('EV-4150-4', 'power_of_attorney', -33, null, 176),
      ],
      audit: [submittedEv(-33), assignedEv(-32, officer)],
    }),
    build({
      id: 'BKK-2569-004122',
      serviceType: 'svc-business-reg',
      applicantName: { th: 'ห้างหุ้นส่วนจำกัด สุริยวงศ์การพิมพ์และบรรจุภัณฑ์', en: 'Suriyawong Printing and Packaging Limited Partnership' },
      state: 'approved',
      assignee: officer,
      submittedDays: -12,
      version: 4,
      applicant: {
        kind: 'juristic_person',
        name: { th: 'ห้างหุ้นส่วนจำกัด สุริยวงศ์การพิมพ์และบรรจุภัณฑ์', en: 'Suriyawong Printing and Packaging Limited Partnership' },
        idNumberMasked: '0-1035-5xxxx-xx-1',
        phone: '02-266-4410',
        email: 'office@suriyawongprint.co.th',
        address: { th: 'เลขที่ 12 ถนนสุรวงศ์ แขวงสุริยวงศ์ เขตบางรัก กรุงเทพมหานคร 10500', en: '12 Surawong Road, Suriyawong, Bang Rak, Bangkok 10500' },
        correspondenceLocale: 'th',
        registryCheck: { status: 'verified', checkedAt: at(-12) },
      },
      fields: [
        { key: 'business', label: { th: 'ประเภทพาณิชยกิจ', en: 'Business type' }, value: { th: 'รับจ้างพิมพ์และผลิตบรรจุภัณฑ์กระดาษ', en: 'Contract printing and paper packaging' } },
        { key: 'capital', label: { th: 'จำนวนเงินทุน', en: 'Capital' }, value: { th: '2,000,000 บาท', en: 'THB 2,000,000' } },
      ],
      evidence: [
        doc('EV-4122-1', 'national_id', -12, true, 90),
        doc('EV-4122-2', 'house_registration', -12, true, 120),
        doc('EV-4122-3', 'site_plan', -12, true, 845),
      ],
      decisions: [
        {
          id: 'DEC-4122-1',
          decision: 'approve',
          reasonTh: 'เอกสารครบถ้วนและถูกต้อง',
          reasonEn: 'All documents complete and valid.',
          decidedBy: officer,
          decidedAt: at(-8),
          status: 'final',
          review: null,
        },
      ],
      audit: [
        submittedEv(-12),
        assignedEv(-11, officer),
        ev(-9, officer, 'document_verified', 'ตรวจสอบเอกสารครบ 3 รายการ', 'All 3 documents verified'),
        ev(-8, officer, 'decision_recorded', 'อนุญาตจดทะเบียนพาณิชย์', 'Commercial registration approved'),
      ],
    }),
    build({
      id: 'BKK-2569-004101',
      serviceType: 'svc-food-shop',
      applicantName: { th: 'นางสาวอัญชลี แซ่ตั้ง', en: 'Ms. Anchalee Saetang' },
      state: 'rejected',
      assignee: officer2,
      submittedDays: -40,
      version: 6,
      applicant: {
        kind: 'individual',
        name: { th: 'นางสาวอัญชลี แซ่ตั้ง', en: 'Ms. Anchalee Saetang' },
        idNumberMasked: '1-1002-0xxxx-xx-5',
        phone: '092-118-6654',
        email: null,
        address: { th: 'เลขที่ 1522 ถนนเจริญกรุง แขวงวัดพระยาไกร เขตบางคอแหลม กรุงเทพมหานคร 10120', en: '1522 Charoen Krung Road, Wat Phraya Krai, Bang Kho Laem, Bangkok 10120' },
        correspondenceLocale: 'th',
        registryCheck: { status: 'verified', checkedAt: at(-40) },
      },
      fields: [
        { key: 'shop_name', label: { th: 'ชื่อสถานที่จำหน่ายอาหาร', en: 'Shop name' }, value: { th: 'ร้านข้าวมันไก่เจ๊ชลี', en: 'Jae Chalee Chicken Rice' } },
        { key: 'floor_area', label: { th: 'พื้นที่ประกอบการ', en: 'Floor area' }, value: { th: '214 ตารางเมตร', en: '214 m²' } },
      ],
      evidence: [
        doc('EV-4101-1', 'national_id', -40, true, 87),
        doc('EV-4101-2', 'site_plan', -40, true, 1320),
        doc('EV-4101-3', 'premises_photo', -25, false, 7420),
      ],
      decisions: [
        {
          id: 'DEC-4101-1',
          decision: 'reject',
          reasonTh: 'สถานประกอบการไม่มีบ่อดักไขมันตามมาตรฐาน และไม่ได้แก้ไขภายในเวลาที่กำหนด',
          reasonEn: 'Premises lack a compliant grease trap and the issue was not corrected within the deadline.',
          decidedBy: officer2,
          decidedAt: at(-6),
          status: 'final',
          review: { by: supervisor, at: at(-5), outcome: 'approved', comment: null },
        },
      ],
      audit: [
        submittedEv(-40),
        assignedEv(-39, officer2),
        ev(-25, officer2, 'document_rejected', 'ภาพถ่ายสถานที่ไม่แสดงบ่อดักไขมัน', 'Premises photos do not show a grease trap'),
        ev(-6, officer2, 'decision_submitted_for_approval', 'เสนอไม่อนุญาต รอผู้บังคับบัญชาอนุมัติ', 'Proposed rejection – awaiting supervisor sign-off'),
        ev(-5, supervisor, 'decision_approved', 'อนุมัติคำสั่งไม่อนุญาต', 'Rejection approved'),
      ],
    }),
    build({
      id: 'BKK-2569-004088',
      serviceType: 'svc-building-permit',
      applicantName: { th: 'บริษัท เจริญกรุงพร็อพเพอร์ตี้ ดีเวลลอปเมนท์ จำกัด (มหาชน)', en: 'Charoenkrung Property Development Public Company Limited' },
      state: 'in_review',
      assignee: officer2,
      submittedDays: -47,
      version: 6,
      applicant: {
        kind: 'juristic_person',
        name: { th: 'บริษัท เจริญกรุงพร็อพเพอร์ตี้ ดีเวลลอปเมนท์ จำกัด (มหาชน)', en: 'Charoenkrung Property Development Public Company Limited' },
        idNumberMasked: '0-1075-5xxxx-xx-8',
        phone: '02-630-9900',
        email: 'permits@ckpd.co.th',
        address: {
          th: 'เลขที่ 1 อาคารเจริญกรุงทาวเวอร์ ชั้น 23 ถนนเจริญกรุง แขวงบางรัก เขตบางรัก กรุงเทพมหานคร 10500',
          en: '1 Charoenkrung Tower, 23rd Floor, Charoen Krung Road, Bang Rak, Bangkok 10500',
        },
        correspondenceLocale: 'en',
        registryCheck: { status: 'verified', checkedAt: at(-47) },
      },
      fields: [
        { key: 'work_type', label: { th: 'ประเภทงาน', en: 'Type of work' }, value: { th: 'ก่อสร้างอาคารใหม่', en: 'New construction' } },
        { key: 'building_type', label: { th: 'ชนิดอาคาร', en: 'Building type' }, value: { th: 'อาคารสูง ค.ส.ล. 23 ชั้น ใช้เป็นโรงแรมและพาณิชยกรรม พร้อมที่จอดรถใต้ดิน 3 ชั้น', en: '23-storey reinforced-concrete high-rise – hotel and retail with 3 basement parking levels' } },
        { key: 'area', label: { th: 'พื้นที่อาคารรวม', en: 'Total floor area' }, value: { th: '38,450 ตารางเมตร', en: '38,450 m²' } },
      ],
      evidence: [
        doc('EV-4088-1', 'company_affidavit', -47, true, 390),
        doc('EV-4088-2', 'land_title', -47, true, 3310),
        doc('EV-4088-3', 'building_drawings', -47, true, 48210),
        doc('EV-4088-4', 'engineer_licence', -47, true, 240),
        doc('EV-4088-5', 'other', -30, null, 5120, { th: 'รายงานการวิเคราะห์ผลกระทบสิ่งแวดล้อม (EIA) ฉบับที่ได้รับความเห็นชอบ', en: 'Approved environmental impact assessment (EIA) report' }),
      ],
      decisions: [
        {
          id: 'DEC-4088-1',
          decision: 'reject',
          reasonTh: 'ยังไม่ได้รับความเห็นชอบรายงาน EIA',
          reasonEn: 'EIA report not yet approved.',
          decidedBy: officer2,
          decidedAt: at(-32),
          status: 'returned',
          review: {
            by: supervisor,
            at: at(-31),
            outcome: 'returned',
            comment: 'ผู้ยื่นแจ้งว่า สผ. เห็นชอบแล้ว ให้ตรวจสอบเอกสารที่ส่งมาใหม่ก่อน / Applicant reports ONEP approval – check the newly uploaded report first.',
          },
        },
      ],
      audit: [
        submittedEv(-47),
        assignedEv(-46, officer2),
        ev(-32, officer2, 'decision_submitted_for_approval', 'เสนอไม่อนุญาต รอผู้บังคับบัญชาอนุมัติ', 'Proposed rejection – awaiting supervisor sign-off'),
        ev(-31, supervisor, 'decision_returned', 'ส่งคืนเพื่อตรวจสอบรายงาน EIA ฉบับใหม่', 'Returned for review of the new EIA report'),
        ev(-30, SYSTEM, 'info_received', 'ผู้ยื่นคำขออัปโหลดรายงาน EIA', 'Applicant uploaded EIA report'),
      ],
    }),
    build({
      id: 'BKK-2569-004075',
      serviceType: 'svc-elderly-allowance',
      applicantName: { th: 'นายเฉลิม มั่นคงดี' },
      state: 'closed',
      assignee: officer,
      submittedDays: -60,
      version: 5,
      applicant: {
        kind: 'individual',
        name: { th: 'นายเฉลิม มั่นคงดี' },
        idNumberMasked: '3-1006-0xxxx-xx-3',
        phone: '02-235-1187',
        email: null,
        address: { th: 'เลขที่ 77 ซอยประชาชื่น ถนนมเหสักข์ แขวงสุริยวงศ์ เขตบางรัก กรุงเทพมหานคร 10500' },
        correspondenceLocale: 'th',
        registryCheck: { status: 'verified', checkedAt: at(-60) },
      },
      fields: [
        { key: 'dob', label: { th: 'วันเดือนปีเกิด', en: 'Date of birth' }, value: { th: '2 กันยายน 2509', en: '2 September 1966' } },
        { key: 'payment', label: { th: 'ช่องทางรับเงิน', en: 'Payment method' }, value: { th: 'รับเงินสดที่สำนักงานเขต', en: 'Cash at district office' } },
      ],
      evidence: [doc('EV-4075-1', 'national_id', -60, true, 85), doc('EV-4075-2', 'house_registration', -60, true, 110)],
      decisions: [
        {
          id: 'DEC-4075-1',
          decision: 'approve',
          reasonTh: 'มีคุณสมบัติครบถ้วน อายุครบ 60 ปีบริบูรณ์',
          reasonEn: 'Eligible – applicant has reached 60 years of age.',
          decidedBy: officer,
          decidedAt: at(-52),
          status: 'final',
          review: null,
        },
      ],
      audit: [
        submittedEv(-60),
        assignedEv(-59, officer),
        ev(-52, officer, 'decision_recorded', 'อนุมัติการลงทะเบียน เริ่มจ่ายเงินเดือนตุลาคม 2569', 'Registration approved – payments start October 2026'),
        ev(-45, SYSTEM, 'case_closed', 'ปิดเรื่องอัตโนมัติหลังส่งข้อมูลให้กรมบัญชีกลาง', 'Closed automatically after hand-off to the Comptroller General'),
      ],
    }),
    build({
      id: 'BKK-2569-004231',
      serviceType: 'svc-business-reg',
      applicantName: { th: 'นายอนุชา ปัญญาวงศ์', en: 'Mr. Anucha Panyawong' },
      state: 'submitted',
      assignee: null,
      submittedDays: -1,
      version: 1,
      applicant: {
        kind: 'individual',
        name: { th: 'นายอนุชา ปัญญาวงศ์', en: 'Mr. Anucha Panyawong' },
        idNumberMasked: '1-1017-0xxxx-xx-6',
        phone: '095-640-2281',
        email: 'anucha.p@example.com',
        address: { th: 'เลขที่ 9/3 ซอยสีลม 20 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพมหานคร 10500', en: '9/3 Soi Silom 20, Silom Road, Silom, Bang Rak, Bangkok 10500' },
        correspondenceLocale: 'th',
        registryCheck: { status: 'verified', checkedAt: at(-1) },
      },
      fields: [{ key: 'business', label: { th: 'ประเภทพาณิชยกิจ', en: 'Business type' }, value: { th: 'ขายปลีกเสื้อผ้าและเครื่องประดับออนไลน์', en: 'Online retail of clothing and accessories' } }],
      evidence: [doc('EV-4231-1', 'national_id', -1, null, 93), doc('EV-4231-2', 'house_registration', -1, null, 118)],
      audit: [submittedEv(-1)],
    }),
    build({
      id: 'BKK-2569-004060',
      serviceType: 'svc-land-use-cert',
      applicantName: { th: 'มูลนิธิสงเคราะห์เด็กและเยาวชนชุมชนริมน้ำเจ้าพระยาบางรัก', en: 'Bang Rak Chao Phraya Riverside Community Child and Youth Welfare Foundation' },
      state: 'pending_supervisor',
      assignee: officer2,
      submittedDays: -28,
      version: 5,
      applicant: {
        kind: 'juristic_person',
        name: { th: 'มูลนิธิสงเคราะห์เด็กและเยาวชนชุมชนริมน้ำเจ้าพระยาบางรัก', en: 'Bang Rak Chao Phraya Riverside Community Child and Youth Welfare Foundation' },
        idNumberMasked: 'กท.xxxx',
        phone: '02-237-4015',
        email: 'contact@riversidekids.or.th',
        address: {
          th: 'เลขที่ 60 ซอยเจริญกรุง 40 (ซอยโอเรียนเต็ล) ถนนเจริญกรุง แขวงบางรัก เขตบางรัก กรุงเทพมหานคร 10500',
          en: '60 Soi Charoen Krung 40 (Soi Oriental), Charoen Krung Road, Bang Rak, Bangkok 10500',
        },
        correspondenceLocale: 'th',
        registryCheck: { status: 'verified', checkedAt: at(-28) },
      },
      fields: [
        { key: 'land', label: { th: 'ที่ดิน', en: 'Land parcel' }, value: { th: 'โฉนดที่ดินเลขที่ 5520 เลขที่ดิน 61', en: 'Title deed no. 5520, parcel 61' } },
        { key: 'intended_use', label: { th: 'วัตถุประสงค์การใช้ที่ดิน', en: 'Intended use' }, value: { th: 'ศูนย์การเรียนรู้สำหรับเด็กและเยาวชน', en: 'Learning centre for children and youth' } },
      ],
      evidence: [
        doc('EV-4060-1', 'other', -28, true, 305, { th: 'ใบสำคัญแสดงการจดทะเบียนมูลนิธิ', en: 'Foundation registration certificate' }),
        doc('EV-4060-2', 'land_title', -28, true, 1980),
        doc('EV-4060-3', 'site_plan', -28, true, 2544),
      ],
      decisions: [
        {
          id: 'DEC-4060-1',
          decision: 'waive_fee',
          reasonTh: 'ผู้ยื่นเป็นมูลนิธิที่ไม่แสวงหากำไร ใช้ที่ดินเพื่อสาธารณประโยชน์ เข้าเกณฑ์ยกเว้นค่าธรรมเนียม',
          reasonEn: 'Non-profit foundation using land for public benefit – eligible for fee exemption.',
          decidedBy: officer2,
          decidedAt: at(-2),
          status: 'pending_approval',
          review: null,
        },
      ],
      audit: [
        submittedEv(-28),
        assignedEv(-27, officer2),
        ev(-10, officer2, 'document_verified', 'ตรวจสอบเอกสารครบถ้วน', 'All documents verified'),
        ev(-2, officer2, 'decision_submitted_for_approval', 'เสนออนุญาตพร้อมยกเว้นค่าธรรมเนียม รอผู้บังคับบัญชาอนุมัติ', 'Proposed approval with fee waiver – awaiting supervisor sign-off'),
      ],
    }),
    build({
      id: 'BKK-2569-004244',
      serviceType: 'svc-elderly-allowance',
      applicantName: { th: 'นางสาวกัลยาณี ศรีวงศ์ตระกูลชัย ณ อยุธยา', en: 'Ms. Kanlayanee Sriwongtrakulchai Na Ayutthaya' },
      state: 'in_review',
      assignee: officer,
      submittedDays: -3,
      version: 2,
      applicant: {
        kind: 'individual',
        name: { th: 'นางสาวกัลยาณี ศรีวงศ์ตระกูลชัย ณ อยุธยา', en: 'Ms. Kanlayanee Sriwongtrakulchai Na Ayutthaya' },
        idNumberMasked: '3-1005-0xxxx-xx-1',
        phone: '081-903-5527',
        email: 'kanlayanee.s@example.com',
        address: {
          th: 'เลขที่ 33/118 อาคารชุดบ้านสาทร-เจริญกรุง ชั้น 11 ถนนเจริญกรุง แขวงบางรัก เขตบางรัก กรุงเทพมหานคร 10500',
          en: '33/118 Baan Sathorn–Charoen Krung Condominium, 11th Floor, Charoen Krung Road, Bang Rak, Bangkok 10500',
        },
        correspondenceLocale: 'en',
        registryCheck: { status: 'verified', checkedAt: at(-3) },
      },
      fields: [
        { key: 'dob', label: { th: 'วันเดือนปีเกิด', en: 'Date of birth' }, value: { th: '21 กรกฎาคม 2509', en: '21 July 1966' } },
        { key: 'payment', label: { th: 'ช่องทางรับเงิน', en: 'Payment method' }, value: { th: 'โอนเข้าบัญชีพร้อมเพย์ที่ผูกกับเลขประจำตัวประชาชน', en: 'PromptPay linked to national ID' } },
      ],
      evidence: [
        doc('EV-4244-1', 'national_id', -3, true, 95),
        doc('EV-4244-2', 'house_registration', -3, true, 131),
        doc('EV-4244-3', 'bank_book', -3, null, 142),
      ],
      audit: [submittedEv(-3), assignedEv(-2, officer), ev(-1, officer, 'document_verified', 'ตรวจสอบบัตรประชาชนและทะเบียนบ้านแล้ว', 'National ID and house registration verified')],
    }),
    build({
      id: 'BKK-2569-004019',
      serviceType: 'svc-building-permit',
      applicantName: { th: 'นายวิชัย ตั้งจิตรเจริญ', en: 'Mr. Wichai Tangjitcharoen' },
      state: 'awaiting_info',
      assignee: officer2,
      submittedDays: -50,
      version: 4,
      applicant: {
        kind: 'individual',
        name: { th: 'นายวิชัย ตั้งจิตรเจริญ', en: 'Mr. Wichai Tangjitcharoen' },
        idNumberMasked: '3-1015-0xxxx-xx-4',
        phone: '084-210-7763',
        email: null,
        address: { th: 'เลขที่ 402 ถนนมหาพฤฒาราม แขวงมหาพฤฒาราม เขตบางรัก กรุงเทพมหานคร 10500', en: '402 Maha Phruettharam Road, Maha Phruettharam, Bang Rak, Bangkok 10500' },
        correspondenceLocale: 'th',
        registryCheck: { status: 'verified', checkedAt: at(-50) },
      },
      fields: [
        { key: 'work_type', label: { th: 'ประเภทงาน', en: 'Type of work' }, value: { th: 'รื้อถอนอาคาร', en: 'Demolition' } },
        { key: 'building_type', label: { th: 'ชนิดอาคาร', en: 'Building type' }, value: { th: 'อาคารไม้ 2 ชั้น อายุประมาณ 70 ปี', en: '2-storey timber building, approx. 70 years old' } },
      ],
      evidence: [doc('EV-4019-1', 'national_id', -50, true, 90), doc('EV-4019-2', 'land_title', -50, true, 1450)],
      infoRequests: [
        {
          id: 'IR-4019-1',
          requestedAt: at(-40),
          requestedBy: officer2,
          items: [
            { documentKind: 'building_drawings', note: 'แผนการรื้อถอนและมาตรการป้องกันอันตราย' },
            { documentKind: 'engineer_licence', note: 'วิศวกรผู้ควบคุมงานรื้อถอน' },
          ],
          messageTh: 'กรุณาส่งแผนและขั้นตอนการรื้อถอน พร้อมสำเนาใบอนุญาตวิศวกรผู้ควบคุมงาน',
          messageEn: 'Please submit the demolition plan and method statement, with the supervising engineer licence.',
          responseDueAt: at(3),
          status: 'open',
          respondedAt: null,
        },
      ],
      audit: [
        submittedEv(-50),
        assignedEv(-49, officer2),
        ev(-40, officer2, 'info_requested', 'ขอแผนการรื้อถอนและใบอนุญาตวิศวกร', 'Requested demolition plan and engineer licence'),
      ],
    }),
  ];
}
