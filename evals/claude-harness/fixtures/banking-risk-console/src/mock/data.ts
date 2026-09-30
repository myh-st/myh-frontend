/**
 * BACKEND-OWNED: seed data mirroring the Fraud Case Service fixtures.
 * Maintained by the backend team. Frontend changes must not modify it.
 */
import type {
  AlertSummary,
  AuditEvent,
  CaseDetail,
  Channel,
  EstimatedImpact,
  FreezeRequest,
  Me,
  Role,
  Transaction,
  UserRef,
} from '../api/types';

export type CaseRecord = Omit<CaseDetail, 'allowedActions' | 'unavailableSources'>;
export type FreezeRecord = Omit<FreezeRequest, 'allowedActions'>;

export const users = {
  ploy: { id: 'u-1042', name: 'Ploy K.' },
  anan: { id: 'u-1107', name: 'Anan W.' },
  kanya: { id: 'u-1063', name: 'Kanya T.' },
  somchai: { id: 'u-0981', name: 'Somchai R.' },
  system: { id: 'svc-sentinel', name: 'Sentinel' },
} satisfies Record<string, UserRef>;

export const roles: Record<string, Role | 'system'> = {
  'u-1042': 'senior_investigator',
  'u-1107': 'investigator',
  'u-1063': 'investigator',
  'u-0981': 'senior_investigator',
  'svc-sentinel': 'system',
};

export const me: Me = {
  ...users.ploy,
  role: 'senior_investigator',
  team: 'Retail Fraud – Digital Channels',
  permissions: ['view_cases', 'record_decision', 'request_freeze', 'approve_freeze', 'view_audit'],
};

export const auditorMe: Me = { ...me, role: 'auditor', team: 'Internal Audit – Financial Crime', permissions: ['view_cases', 'view_audit'] };

const now = Date.now();
export const iso = (mins: number) => new Date(now + mins * 60_000).toISOString();
const thb = (amount: number) => ({ amount, currency: 'THB' });

type Dev = Transaction['device'];
const dev = (id: string, label: string, firstSeenMins: number): Dev => ({ id, label, firstSeenAt: iso(firstSeenMins) });
const tx = (
  id: string,
  mins: number,
  direction: 'debit' | 'credit',
  amount: number,
  channel: Channel,
  cp: [string, string, string],
  device: Dev,
  geo: [string, string, string | null] | null,
  flagReason: string | null = null,
): Transaction => ({
  id,
  at: iso(mins),
  direction,
  amount: thb(amount),
  channel,
  counterparty: { name: cp[0], accountRef: cp[1], institution: cp[2] },
  device,
  geo: geo ? { city: geo[0], country: geo[1], ip: geo[2] } : null,
  flagged: flagReason !== null,
  flagReason,
});

/** Per-account operational impact used to estimate the scope of a freeze. */
export const accountImpact: Record<string, EstimatedImpact> = {
  'ACC-2201': { pendingPayments: 2, scheduledTransfers: 1, cardsAffected: 1 },
  'ACC-7310': { pendingPayments: 0, scheduledTransfers: 3, cardsAffected: 1 },
  'ACC-0932': { pendingPayments: 14, scheduledTransfers: 6, cardsAffected: 4 },
  'ACC-0933': { pendingPayments: 3, scheduledTransfers: 0, cardsAffected: 0 },
  'ACC-5518': { pendingPayments: 1, scheduledTransfers: 0, cardsAffected: 1 },
  'ACC-2087': { pendingPayments: 0, scheduledTransfers: 2, cardsAffected: 1 },
  'ACC-7745': { pendingPayments: 0, scheduledTransfers: 0, cardsAffected: 2 },
  'ACC-3391': { pendingPayments: 0, scheduledTransfers: 0, cardsAffected: 1 },
  'ACC-3392': { pendingPayments: 0, scheduledTransfers: 1, cardsAffected: 0 },
  'ACC-8124': { pendingPayments: 5, scheduledTransfers: 0, cardsAffected: 1 },
  'ACC-6630': { pendingPayments: 1, scheduledTransfers: 0, cardsAffected: 1 },
};

export function seedAlerts(): AlertSummary[] {
  const a = (
    id: string,
    mins: number,
    severity: AlertSummary['severity'],
    confidence: number,
    source: [AlertSummary['source']['kind'], string, string],
    title: string,
    amount: number,
    customerRef: string,
    caseId: string | null,
    status: AlertSummary['status'],
  ): AlertSummary => ({
    id,
    createdAt: iso(mins),
    severity,
    confidence,
    source: { kind: source[0], name: source[1], version: source[2] },
    title,
    amount: thb(amount),
    customerRef,
    caseId,
    status,
    dataStatus: 'current',
  });
  return [
    a('AL-90420', -35, 'high', 0.78, ['model', 'cnp-anomaly', '3.4.0'], 'Card-not-present spend spike on credit card shortly after its BIN range appeared in a merchant data-breach list', 38760, 'CUST-••••6630', 'CASE-3111', 'in_case'),
    a('AL-90418', -52, 'medium', 0.54, ['rule', 'R-217 Cash structuring', 'r12'], 'Six cash deposits of 49,000 THB across three branches in two days', 294000, 'CUST-••••1976', null, 'new'),
    a('AL-90416', -80, 'low', 0.31, ['model', 'dormant-reactivation', '1.2.1'], 'Dormant account reactivated with a 1 THB test credit from an unfamiliar payer', 1, 'CUST-••••4058', null, 'new'),
    a('AL-90415', -130, 'critical', 0.93, ['model', 'ato-gbm', '2026.08.2'], 'Transfer to crypto exchange from a device registered 40 minutes earlier', 150000, 'CUST-••••4471', 'CASE-3107', 'in_case'),
    a('AL-90413', -150, 'critical', 0.88, ['rule', 'R-104 PromptPay velocity', 'r7'], 'Three PromptPay transfers just below the 50,000 THB step-up limit within 10 minutes', 149300, 'CUST-••••4471', 'CASE-3107', 'in_case'),
    a('AL-90412', -176, 'high', 0.81, ['rule', 'R-031 New device + foreign IP', 'r4'], 'Login from a new device via a cross-border hosting IP 18 minutes after an SMS-OTP password reset', 0, 'CUST-••••4471', 'CASE-3107', 'in_case'),
    a('AL-90381', -610, 'critical', 0.86, ['model', 'bec-nlp', '1.9.3'], 'Supplier payee bank details changed two hours before a 1.84M THB scheduled supplier payment run', 1840000, 'CUST-••••0932', 'CASE-3102', 'in_case'),
    a('AL-90377', -640, 'high', 0.72, ['rule', 'R-310 Corporate payee change', 'r3'], 'New payee added by a corporate user from an IP address never associated with that user', 0, 'CUST-••••0932', 'CASE-3102', 'in_case'),
    a('AL-90366', -1460, 'high', 0.84, ['model', 'mule-graph', '4.1.0'], 'Rapid pass-through: 97% of 612,450 THB inbound from 11 senders moved out within 3 hours', 612450, 'CUST-••••5518', 'CASE-3098', 'in_case'),
    a('AL-90352', -2900, 'high', 0.69, ['rule', 'R-412 Vulnerable customer outbound', 'r5'], 'Customer aged 70+ sending a third international transfer in 14 days to a payee added this month', 420000, 'CUST-••••2087', 'CASE-3095', 'in_case'),
    a('AL-90341', -4300, 'medium', 0.62, ['rule', 'R-022 Impossible travel', 'r9'], 'Card-present purchase in Tokyo 38 minutes after a card-present purchase in Bangkok', 18400, 'CUST-••••7745', 'CASE-3090', 'closed'),
    a('AL-90310', -8700, 'critical', 0.95, ['model', 'ato-gbm', '2026.08.1'], 'SIM swap, mobile banking re-registration and new payee added within one hour', 980000, 'CUST-••••3391', 'CASE-3084', 'in_case'),
    a('AL-90288', -14200, 'low', 0.41, ['rule', 'R-508 Refund abuse', 'r2'], 'Refund claim count above merchant-category baseline for the quarter', 7860, 'CUST-••••8124', 'CASE-3079', 'closed'),
  ];
}

const iphone = dev('DEV-a1c2', 'iPhone 15 · iOS 18.6 (…a1c2)', -900 * 24 * 60);
const samsung = dev('DEV-9f31', 'Android 14 · Samsung SM-A546E (…9f31)', -176);
const bkk = (ip: string | null): [string, string, string | null] => ['Bangkok', 'TH', ip];

export function seedCases(): CaseRecord[] {
  return [
    {
      id: 'CASE-3107',
      version: 4,
      title: 'Suspected account takeover – new device, password reset and rapid outbound transfers',
      status: 'open',
      severity: 'critical',
      customerRef: 'CUST-••••4471',
      assignee: users.ploy,
      openedAt: iso(-170),
      updatedAt: iso(-112),
      alertIds: ['AL-90412', 'AL-90413', 'AL-90415'],
      transactions: [
        tx('TX-5509877', -3 * 24 * 60, 'debit', 3420.5, 'mobile_app', ['Metropolitan Electricity Authority', 'BILLER-MEA', 'MEA'], iphone, bkk('171.97.12.40')),
        tx('TX-5510021', -26 * 60, 'debit', 1250, 'card_present', ['7-Eleven Sukhumvit 24', 'MID-000912', 'CP All'], null, bkk(null)),
        tx('TX-5510402', -160, 'debit', 49900, 'promptpay', ['Thanakorn P.', 'KBANK ••••8812', 'Kasikornbank'], samsung, ['Poipet', 'KH', '103.216.51.77'], 'New device + cross-border hosting IP; payee added 3 minutes earlier'),
        tx('TX-5510405', -155, 'debit', 49900, 'promptpay', ['Jiraporn S.', 'SCB ••••4410', 'Siam Commercial Bank'], samsung, ['Poipet', 'KH', '103.216.51.77'], 'Velocity: second transfer just below the 50,000 THB step-up threshold'),
        tx('TX-5510409', -151, 'debit', 49500, 'promptpay', ['Kittipong Trading', 'KTB ••••0391', 'Krungthai Bank'], samsung, ['Poipet', 'KH', '103.216.51.77'], 'Velocity: third transfer below threshold within 10 minutes'),
        tx('TX-5510417', -142, 'debit', 150000, 'internet_banking', ['Siam Digital Asset Co., Ltd.', 'BBL ••••0065', 'Bangkok Bank'], samsung, ['Poipet', 'KH', '103.216.51.77'], 'First payment to a crypto on-ramp; limit raised 12 minutes earlier from the same session'),
        tx('TX-5510420', -95, 'debit', 20000, 'atm', ['ATM withdrawal', 'ATM-SK-0144', 'Own bank'], null, ['Aranyaprathet', 'TH', null]),
        tx('TX-5510433', -60, 'credit', 500, 'promptpay', ['Wanida C.', 'BAY ••••2210', 'Krungsri'], null, bkk(null)),
      ],
      relatedEntities: [
        { id: 'ACC-2201', type: 'account', label: 'Savings ••••2201 (customer)', linkReason: 'Source account for all four flagged outbound transfers', riskLevel: 'high', dataStatus: 'current', accountStatus: 'active' },
        { id: 'ACC-7310', type: 'account', label: 'Current ••••7310 (customer)', linkReason: 'Same customer; shares PromptPay ID and registered mobile number with ••••2201. No outbound activity yet.', riskLevel: 'medium', dataStatus: 'current', accountStatus: 'active' },
        { id: 'CP-8812', type: 'counterparty', label: 'Thanakorn P. · KBANK ••••8812', linkReason: 'Received 49,900 THB; beneficiary also appears in open mule investigation CASE-3098 and closed case CASE-2977', riskLevel: 'high', dataStatus: 'current' },
        { id: 'CP-4410', type: 'counterparty', label: 'Jiraporn S. · SCB ••••4410', linkReason: 'Received 49,900 THB; account opened 11 days ago according to the interbank mule-risk feed', riskLevel: 'high', dataStatus: 'current' },
        { id: 'CP-0065', type: 'counterparty', label: 'Siam Digital Asset Co., Ltd. · BBL ••••0065', linkReason: 'Licensed digital-asset exchange; first-ever payment from this customer', riskLevel: 'medium', dataStatus: 'current' },
        { id: 'DEV-9f31', type: 'device', label: 'Android 14 · Samsung SM-A546E (…9f31)', linkReason: 'First seen 16 minutes before the first flagged transfer; bound to three unrelated customer profiles in the last 7 days', riskLevel: 'high', dataStatus: 'current' },
        { id: 'IP-103.216.51.77', type: 'ip', label: '103.216.51.77 · Poipet, KH · hosting ASN', linkReason: 'Used by device …9f31 for the login, the limit change and all four flagged transfers', riskLevel: 'high', dataStatus: 'current' },
        { id: 'DEV-a1c2', type: 'device', label: 'iPhone 15 · iOS 18.6 (…a1c2)', linkReason: "Customer's usual device since 2024; not used during the flagged window", riskLevel: 'low', dataStatus: 'current' },
      ],
      hypothesis: {
        summary:
          'Likely account takeover. A previously unseen Android device logged in from a Cambodian hosting IP 18 minutes after a password reset completed via SMS OTP, raised the daily transfer limit, and then sent four outbound transfers totalling 299,300 THB within 18 minutes. Three PromptPay transfers were structured just below the 50,000 THB step-up threshold and two of the beneficiaries are linked to a known mule cluster. The customer\'s usual iPhone was not used during this window.',
        confidence: 0.91,
        basis: [
          { evidenceType: 'device', ref: 'DEV-9f31', weight: 0.31, description: 'New device bound to three unrelated customer profiles in 7 days' },
          { evidenceType: 'ip', ref: 'IP-103.216.51.77', weight: 0.18, description: 'Cross-border hosting ASN, never seen for this customer' },
          { evidenceType: 'rule_hit', ref: 'AL-90413', weight: 0.2, description: 'Structured PromptPay transfers below the step-up threshold' },
          { evidenceType: 'network', ref: 'CP-8812', weight: 0.19, description: 'Beneficiary shared with open mule case CASE-3098' },
          { evidenceType: 'transaction', ref: 'TX-5510417', weight: 0.12, description: 'First payment to a crypto on-ramp immediately after a limit increase' },
        ],
        modelVersion: 'ato-gbm-2026.08.2',
        generatedAt: iso(-128),
      },
      decision: null,
      freezeRequestIds: [],
      activeFreezeRequestId: null,
    },
    {
      id: 'CASE-3111',
      version: 1,
      title: 'Card-not-present spend spike after BIN exposure in merchant breach',
      status: 'open',
      severity: 'high',
      customerRef: 'CUST-••••6630',
      assignee: users.anan,
      openedAt: iso(-30),
      updatedAt: iso(-30),
      alertIds: ['AL-90420'],
      transactions: [
        tx('TX-5510501', -58, 'debit', 12900, 'card_not_present', ['GAMESHOP DIGITAL LTD', 'MID-UK-88120', 'Adyen'], null, ['London', 'GB', '185.220.101.4'], 'Unfamiliar merchant; TOR exit node IP'),
        tx('TX-5510503', -55, 'debit', 12930, 'card_not_present', ['GAMESHOP DIGITAL LTD', 'MID-UK-88120', 'Adyen'], null, ['London', 'GB', '185.220.101.4'], 'Repeat charge 3 minutes apart'),
        tx('TX-5510507', -49, 'debit', 12930, 'card_not_present', ['GIFTCARD HUB', 'MID-NL-10442', 'Stripe'], null, ['Amsterdam', 'NL', '185.220.101.9'], 'Gift-card merchant; same IP block'),
        tx('TX-5510100', -2 * 24 * 60, 'debit', 689, 'card_not_present', ['GrabFood', 'MID-TH-00211', 'Grab'], null, bkk('49.228.3.17')),
      ],
      relatedEntities: [
        { id: 'ACC-6630', type: 'account', label: 'Credit card ••••6630 (customer)', linkReason: 'Card used for all three flagged purchases', riskLevel: 'high', dataStatus: 'current', accountStatus: 'active' },
        { id: 'IP-185.220.101.4', type: 'ip', label: '185.220.101.4 · TOR exit node', linkReason: 'Checkout IP for two flagged purchases', riskLevel: 'high', dataStatus: 'current' },
        { id: 'CP-UK-88120', type: 'counterparty', label: 'GAMESHOP DIGITAL LTD (UK)', linkReason: 'Merchant appears in 41 chargeback disputes across the portfolio this month', riskLevel: 'medium', dataStatus: 'current' },
      ],
      hypothesis: null,
      decision: null,
      freezeRequestIds: [],
      activeFreezeRequestId: null,
    },
    {
      id: 'CASE-3102',
      version: 6,
      title: 'Business email compromise – supplier bank details changed before payment run',
      status: 'freeze_pending_approval',
      severity: 'critical',
      customerRef: 'CUST-••••0932',
      assignee: users.anan,
      openedAt: iso(-600),
      updatedAt: iso(-95),
      alertIds: ['AL-90377', 'AL-90381'],
      transactions: [
        tx('TX-5507700', -9 * 24 * 60, 'debit', 1_762_300, 'internet_banking', ['Chonburi Packaging Co., Ltd.', 'KBANK ••••1180', 'Kasikornbank'], dev('DEV-c7e0', 'Windows 11 · Edge (…c7e0)', -400 * 24 * 60), bkk('203.150.7.21')),
        tx('TX-5510210', -520, 'debit', 1_840_000, 'internet_banking', ['Chonburi Packaging Co., Ltd.', 'TTB ••••6624', 'TMBThanachart'], dev('DEV-c7e0', 'Windows 11 · Edge (…c7e0)', -400 * 24 * 60), bkk('203.150.7.21'), 'Payee bank details changed 2 hours earlier; new beneficiary account 6 days old'),
        tx('TX-5510214', -505, 'debit', 96_500, 'internet_banking', ['Chonburi Packaging Co., Ltd.', 'TTB ••••6624', 'TMBThanachart'], dev('DEV-c7e0', 'Windows 11 · Edge (…c7e0)', -400 * 24 * 60), bkk('203.150.7.21'), 'Second payment to the changed beneficiary'),
      ],
      relatedEntities: [
        { id: 'ACC-0932', type: 'account', label: 'Business current ••••0932 (customer – payroll & suppliers)', linkReason: 'Payer account for both flagged supplier payments', riskLevel: 'high', dataStatus: 'current', accountStatus: 'active' },
        { id: 'ACC-0933', type: 'account', label: 'Business savings ••••0933 (customer)', linkReason: 'Sweep account linked to ••••0932; same corporate user credentials', riskLevel: 'medium', dataStatus: 'current', accountStatus: 'active' },
        { id: 'CP-6624', type: 'counterparty', label: 'Chonburi Packaging Co., Ltd. · TTB ••••6624', linkReason: 'Replacement beneficiary account opened 6 days ago; name matches supplier but tax ID differs', riskLevel: 'high', dataStatus: 'current' },
        { id: 'IP-45.133.1.90', type: 'ip', label: '45.133.1.90 · Lagos, NG · residential proxy', linkReason: 'IP used to edit the payee record; never seen for this corporate user', riskLevel: 'high', dataStatus: 'current' },
      ],
      hypothesis: {
        summary:
          'Business email compromise. The supplier payee record was edited from a residential proxy two hours before the scheduled payment run, redirecting 1,936,500 THB to a six-day-old account whose registered tax ID does not match the long-standing supplier. Payment approvals themselves came from the customer\'s usual workstation, consistent with a finance user acting on a spoofed invoice email.',
        confidence: 0.84,
        basis: [
          { evidenceType: 'ip', ref: 'IP-45.133.1.90', weight: 0.34, description: 'Payee edit from residential proxy outside customer footprint' },
          { evidenceType: 'counterparty', ref: 'CP-6624', weight: 0.38, description: 'Beneficiary tax ID mismatch; account age 6 days' },
          { evidenceType: 'behavioural', ref: 'TX-5510210', weight: 0.28, description: 'Payment amount matches previous invoice cycle within 5%' },
        ],
        modelVersion: 'bec-nlp-1.9.3',
        generatedAt: iso(-590),
      },
      decision: {
        outcome: 'confirmed_fraud',
        rationale: 'Customer finance manager confirmed by phone call-back that no change of bank details was requested by the supplier. Supplier confirmed their account at KBANK ••••1180 is unchanged.',
        decidedBy: users.anan,
        decidedAt: iso(-120),
      },
      freezeRequestIds: ['FRZ-0419'],
      activeFreezeRequestId: 'FRZ-0419',
    },
    {
      id: 'CASE-3098',
      version: 7,
      title: 'Suspected money-mule account – rapid pass-through of inbound transfers',
      status: 'freeze_pending_approval',
      severity: 'high',
      customerRef: 'CUST-••••5518',
      assignee: users.ploy,
      openedAt: iso(-1440),
      updatedAt: iso(-40),
      alertIds: ['AL-90366'],
      transactions: [
        tx('TX-5508811', -1600, 'credit', 58_000, 'promptpay', ['Suda M.', 'BBL ••••7702', 'Bangkok Bank'], null, null, 'Inbound from victim account reported in interbank fraud feed'),
        tx('TX-5508815', -1590, 'credit', 74_450, 'promptpay', ['Prasert K.', 'KTB ••••3310', 'Krungthai Bank'], null, null, 'Inbound from victim account reported in interbank fraud feed'),
        tx('TX-5508840', -1540, 'credit', 49_900, 'promptpay', ['Customer CUST-••••4471', 'OWN ••••2201', 'Own bank'], null, null, 'Inbound linked to CASE-3107 account takeover'),
        tx('TX-5508902', -1480, 'debit', 590_000, 'mobile_app', ['Lucky Star Exchange', 'GSB ••••9044', 'Government Savings Bank'], dev('DEV-44be', 'Android 13 · Oppo A78 (…44be)', -20 * 24 * 60), ['Mae Sot', 'TH', '110.164.8.3'], '97% of inbound funds moved out within 3 hours'),
      ],
      relatedEntities: [
        { id: 'ACC-5518', type: 'account', label: 'Savings ••••5518 (customer, opened 23 days ago)', linkReason: 'Received funds from 11 senders and forwarded 97% within 3 hours', riskLevel: 'high', dataStatus: 'current', accountStatus: 'active' },
        { id: 'CP-9044', type: 'counterparty', label: 'Lucky Star Exchange · GSB ••••9044', linkReason: 'Outbound destination; previously reported by two other banks', riskLevel: 'high', dataStatus: 'current' },
        { id: 'DEV-44be', type: 'device', label: 'Android 13 · Oppo A78 (…44be)', linkReason: 'Only device ever used on this account; located near a border crossing', riskLevel: 'medium', dataStatus: 'current' },
      ],
      hypothesis: {
        summary: 'Money-mule account. Newly opened account receiving multiple unrelated inbound transfers from reported victims, followed by a single consolidated outbound transfer to an exchange flagged by other institutions.',
        confidence: 0.87,
        basis: [
          { evidenceType: 'network', ref: 'CP-9044', weight: 0.4, description: 'Destination flagged by two peer banks' },
          { evidenceType: 'behavioural', ref: 'TX-5508902', weight: 0.35, description: 'Pass-through ratio 97% within 3 hours' },
          { evidenceType: 'transaction', ref: 'TX-5508840', weight: 0.25, description: 'Inbound funds traced to account takeover CASE-3107' },
        ],
        modelVersion: 'mule-graph-4.1.0',
        generatedAt: iso(-1450),
      },
      decision: {
        outcome: 'confirmed_fraud',
        rationale: 'Account holder did not respond to two verification calls. Pass-through pattern and inbound funds from three confirmed victim accounts meet the mule policy threshold.',
        decidedBy: users.ploy,
        decidedAt: iso(-60),
      },
      freezeRequestIds: ['FRZ-0417'],
      activeFreezeRequestId: 'FRZ-0417',
    },
    {
      id: 'CASE-3095',
      version: 5,
      title: 'Elderly customer – repeated large transfers to new overseas payee (possible romance scam)',
      status: 'under_review',
      severity: 'high',
      customerRef: 'CUST-••••2087',
      assignee: users.kanya,
      openedAt: iso(-2880),
      updatedAt: iso(-700),
      alertIds: ['AL-90352'],
      transactions: [
        tx('TX-5503301', -13 * 24 * 60, 'debit', 150_000, 'branch', ['Daniel Morgan', 'IBAN GB•• •••• 4411', 'Wise Payments'], null, ['Chiang Mai', 'TH', null], 'First international transfer in 6 years'),
        tx('TX-5506612', -6 * 24 * 60, 'debit', 180_000, 'branch', ['Daniel Morgan', 'IBAN GB•• •••• 4411', 'Wise Payments'], null, ['Chiang Mai', 'TH', null], 'Repeat transfer; customer stated "medical bills for a friend"'),
        tx('TX-5509120', -2900, 'debit', 420_000, 'internet_banking', ['D. Morgan Consulting', 'IBAN AE•• •••• 0071', 'Emirates NBD'], dev('DEV-77d1', 'iPad · iPadOS 17 (…77d1)', -3 * 365 * 24 * 60), ['Chiang Mai', 'TH', '1.46.20.113'], 'New payee in different jurisdiction; amount 3× customer monthly average balance'),
      ],
      relatedEntities: [
        { id: 'ACC-2087', type: 'account', label: 'Savings ••••2087 (customer, pension deposits)', linkReason: 'Source account for all three international transfers', riskLevel: 'medium', dataStatus: 'current', accountStatus: 'active' },
        { id: 'CP-GB4411', type: 'counterparty', label: 'Daniel Morgan · Wise GB ••••4411', linkReason: 'Payee name matches profile reported in two romance-scam complaints to the national hotline', riskLevel: 'high', dataStatus: 'current' },
        { id: 'CP-AE0071', type: 'counterparty', label: 'D. Morgan Consulting · Emirates NBD ••••0071', linkReason: 'Added 3 days before the largest transfer; similar name to earlier payee', riskLevel: 'high', dataStatus: 'current' },
      ],
      hypothesis: {
        summary: 'Possible authorised push payment (romance) scam. Customer is initiating payments themselves, so device and credential signals are normal; risk comes from payee reputation, escalating amounts and customer vulnerability.',
        confidence: 0.63,
        basis: [
          { evidenceType: 'counterparty', ref: 'CP-GB4411', weight: 0.45, description: 'Payee matches complaint reports' },
          { evidenceType: 'behavioural', ref: 'TX-5509120', weight: 0.35, description: 'Escalating amounts to newly added payees' },
          { evidenceType: 'rule_hit', ref: 'AL-90352', weight: 0.2, description: 'Vulnerable-customer outbound rule' },
        ],
        modelVersion: 'app-scam-0.9.4',
        generatedAt: iso(-2870),
      },
      decision: {
        outcome: 'needs_more_info',
        rationale: 'Customer insists payments are voluntary. Requested branch welfare visit with a relative present before deciding; awaiting branch report expected within 2 business days.',
        decidedBy: users.kanya,
        decidedAt: iso(-700),
      },
      freezeRequestIds: [],
      activeFreezeRequestId: null,
    },
    {
      id: 'CASE-3090',
      version: 3,
      title: 'Card used in Tokyo and Bangkok within 40 minutes',
      status: 'decision_recorded',
      severity: 'medium',
      customerRef: 'CUST-••••7745',
      assignee: users.ploy,
      openedAt: iso(-4290),
      updatedAt: iso(-3900),
      alertIds: ['AL-90341'],
      transactions: [
        tx('TX-5507001', -4340, 'debit', 2150, 'card_present', ['Tops Market Thonglor', 'MID-TH-55012', 'Central Food Retail'], null, bkk(null)),
        tx('TX-5507010', -4302, 'debit', 18400, 'card_present', ['BIC CAMERA SHINJUKU', 'MID-JP-00413', 'JCB Acquiring'], null, ['Tokyo', 'JP', null], 'Impossible travel: 38 minutes after Bangkok purchase'),
      ],
      relatedEntities: [
        { id: 'ACC-7745', type: 'account', label: 'Credit card ••••7745 (customer, primary + supplementary)', linkReason: 'Both purchases on this card account', riskLevel: 'low', dataStatus: 'current', accountStatus: 'active' },
      ],
      hypothesis: {
        summary: 'Low-confidence card cloning. Alternatively, the supplementary cardholder may be travelling while the primary cardholder is at home.',
        confidence: 0.38,
        basis: [{ evidenceType: 'rule_hit', ref: 'AL-90341', weight: 1, description: 'Impossible-travel rule' }],
        modelVersion: 'card-clone-2.2.0',
        generatedAt: iso(-4280),
      },
      decision: {
        outcome: 'not_fraud',
        rationale: 'Tokyo purchase was made by the supplementary cardholder (customer\'s daughter) on a declared trip; primary card used in Bangkok. Travel notice confirmed via call-back.',
        decidedBy: users.ploy,
        decidedAt: iso(-3900),
      },
      freezeRequestIds: [],
      activeFreezeRequestId: null,
    },
    {
      id: 'CASE-3084',
      version: 9,
      title: 'SIM swap followed by mobile banking re-registration and new payee',
      status: 'frozen',
      severity: 'critical',
      customerRef: 'CUST-••••3391',
      assignee: users.kanya,
      openedAt: iso(-8690),
      updatedAt: iso(-8400),
      alertIds: ['AL-90310'],
      transactions: [
        tx('TX-5501190', -8705, 'debit', 490_000, 'mobile_app', ['Nattapong R.', 'KBANK ••••6103', 'Kasikornbank'], dev('DEV-2b88', 'Android 12 · Xiaomi (…2b88)', -8720), bkk('27.55.70.4'), 'Payee added 6 minutes after re-registration'),
        tx('TX-5501192', -8702, 'debit', 490_000, 'mobile_app', ['Nattapong R.', 'KBANK ••••6103', 'Kasikornbank'], dev('DEV-2b88', 'Android 12 · Xiaomi (…2b88)', -8720), bkk('27.55.70.4'), 'Repeat transfer; blocked by limit, not executed'),
      ],
      relatedEntities: [
        { id: 'ACC-3391', type: 'account', label: 'Savings ••••3391 (customer)', linkReason: 'Source of transfers after SIM swap', riskLevel: 'high', dataStatus: 'current', accountStatus: 'frozen' },
        { id: 'ACC-3392', type: 'account', label: 'Fixed deposit ••••3392 (customer)', linkReason: 'Linked for early-withdrawal to ••••3391', riskLevel: 'medium', dataStatus: 'current', accountStatus: 'frozen' },
        { id: 'DEV-2b88', type: 'device', label: 'Android 12 · Xiaomi (…2b88)', linkReason: 'Registered 15 minutes after the telco reported a SIM swap', riskLevel: 'high', dataStatus: 'current' },
      ],
      hypothesis: {
        summary: 'Account takeover via SIM swap. The telco SIM-swap signal preceded re-registration of mobile banking on a new device, which immediately added a payee and attempted two maximum-limit transfers.',
        confidence: 0.95,
        basis: [
          { evidenceType: 'device', ref: 'DEV-2b88', weight: 0.5, description: 'Device registered minutes after SIM swap' },
          { evidenceType: 'transaction', ref: 'TX-5501190', weight: 0.5, description: 'Max-limit transfer to new payee' },
        ],
        modelVersion: 'ato-gbm-2026.08.1',
        generatedAt: iso(-8690),
      },
      decision: {
        outcome: 'confirmed_fraud',
        rationale: 'Customer confirmed in branch with ID that they lost mobile service and did not re-register the app or add any payee.',
        decidedBy: users.kanya,
        decidedAt: iso(-8600),
      },
      freezeRequestIds: ['FRZ-0409'],
      activeFreezeRequestId: null,
    },
    {
      id: 'CASE-3079',
      version: 6,
      title: 'Repeated refund claims at online marketplace',
      status: 'closed',
      severity: 'low',
      customerRef: 'CUST-••••8124',
      assignee: users.somchai,
      openedAt: iso(-14190),
      updatedAt: iso(-12000),
      alertIds: ['AL-90288'],
      transactions: [
        tx('TX-5496610', -15000, 'credit', 2620, 'card_not_present', ['SHOPEE REFUND', 'MID-TH-30001', 'Shopee'], null, null),
        tx('TX-5496711', -14800, 'credit', 2620, 'card_not_present', ['SHOPEE REFUND', 'MID-TH-30001', 'Shopee'], null, null, 'Duplicate refund amount within 3 days'),
        tx('TX-5496790', -14600, 'credit', 2620, 'card_not_present', ['SHOPEE REFUND', 'MID-TH-30001', 'Shopee'], null, null, 'Third identical refund'),
      ],
      relatedEntities: [
        { id: 'ACC-8124', type: 'account', label: 'Debit card account ••••8124 (customer)', linkReason: 'Recipient of refunds', riskLevel: 'low', dataStatus: 'current', accountStatus: 'active' },
      ],
      hypothesis: {
        summary: 'Weak signal of refund abuse; merchant-side duplicate processing is equally plausible.',
        confidence: 0.29,
        basis: [{ evidenceType: 'rule_hit', ref: 'AL-90288', weight: 1, description: 'Refund-count rule' }],
        modelVersion: 'refund-abuse-1.0.2',
        generatedAt: iso(-14180),
      },
      decision: {
        outcome: 'not_fraud',
        rationale: 'Merchant confirmed a batch reprocessing error on their side and reversed two of the three refunds.',
        decidedBy: users.somchai,
        decidedAt: iso(-12100),
      },
      freezeRequestIds: ['FRZ-0402'],
      activeFreezeRequestId: null,
    },
  ];
}

export const impactOf = (ids: string[]): EstimatedImpact =>
  ids.reduce(
    (t, id) => {
      const i = accountImpact[id] ?? { pendingPayments: 0, scheduledTransfers: 0, cardsAffected: 0 };
      return {
        pendingPayments: t.pendingPayments + i.pendingPayments,
        scheduledTransfers: t.scheduledTransfers + i.scheduledTransfers,
        cardsAffected: t.cardsAffected + i.cardsAffected,
      };
    },
    { pendingPayments: 0, scheduledTransfers: 0, cardsAffected: 0 },
  );

export function seedFreezeRequests(): FreezeRecord[] {
  return [
    {
      id: 'FRZ-0419',
      caseId: 'CASE-3102',
      version: 1,
      status: 'pending_approval',
      requestedBy: users.anan,
      requestedAt: iso(-95),
      reason: 'Confirmed BEC. Freeze payer account to stop the remaining scheduled supplier payments to the redirected beneficiary while the recall request is processed with TTB.',
      scope: { accounts: [{ id: 'ACC-0932', label: 'Business current ••••0932 (customer – payroll & suppliers)' }], estimatedImpact: impactOf(['ACC-0932']) },
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      receipt: null,
    },
    {
      id: 'FRZ-0417',
      caseId: 'CASE-3098',
      version: 1,
      status: 'pending_approval',
      requestedBy: users.ploy,
      requestedAt: iso(-40),
      reason: 'Mule policy threshold met; freeze to preserve remaining 18,420 THB balance and prevent further pass-through while police report is filed.',
      scope: { accounts: [{ id: 'ACC-5518', label: 'Savings ••••5518 (customer, opened 23 days ago)' }], estimatedImpact: impactOf(['ACC-5518']) },
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      receipt: null,
    },
    {
      id: 'FRZ-0409',
      caseId: 'CASE-3084',
      version: 2,
      status: 'executed',
      requestedBy: users.kanya,
      requestedAt: iso(-8590),
      reason: 'Confirmed SIM-swap takeover. Freeze savings and linked fixed deposit until customer re-verifies identity in branch.',
      scope: {
        accounts: [
          { id: 'ACC-3391', label: 'Savings ••••3391 (customer)' },
          { id: 'ACC-3392', label: 'Fixed deposit ••••3392 (customer)' },
        ],
        estimatedImpact: impactOf(['ACC-3391', 'ACC-3392']),
      },
      reviewedBy: users.somchai,
      reviewedAt: iso(-8400),
      rejectionReason: null,
      receipt: { freezeId: 'FZ-77120', executedAt: iso(-8400), accountsFrozen: ['ACC-3391', 'ACC-3392'], referenceNo: 'SNT-2026-004417' },
    },
    {
      id: 'FRZ-0402',
      caseId: 'CASE-3079',
      version: 2,
      status: 'rejected',
      requestedBy: users.anan,
      requestedAt: iso(-14000),
      reason: 'Precautionary freeze pending merchant confirmation of refund legitimacy.',
      scope: { accounts: [{ id: 'ACC-8124', label: 'Debit card account ••••8124 (customer)' }], estimatedImpact: impactOf(['ACC-8124']) },
      reviewedBy: users.somchai,
      reviewedAt: iso(-13900),
      rejectionReason: 'Amount below freeze policy threshold and no customer harm; merchant contact is sufficient.',
      receipt: null,
    },
  ];
}

export function seedAudit(): AuditEvent[] {
  let n = 0;
  const ev = (caseId: string, mins: number, actor: UserRef, action: AuditEvent['action'], details: string): AuditEvent => ({
    id: `AUD-${String(++n).padStart(5, '0')}`,
    caseId,
    at: iso(mins),
    actor: { ...actor, role: roles[actor.id] },
    action,
    details,
  });
  const s = users.system;
  return [
    ev('CASE-3107', -170, s, 'case_opened', 'Case opened from alert AL-90412'),
    ev('CASE-3107', -150, s, 'alert_linked', 'Alert AL-90413 linked (same customer, 24h window)'),
    ev('CASE-3107', -130, s, 'alert_linked', 'Alert AL-90415 linked (same customer, 24h window)'),
    ev('CASE-3107', -128, s, 'hypothesis_generated', 'Hypothesis generated by ato-gbm-2026.08.2 (confidence 0.91)'),
    ev('CASE-3107', -112, users.somchai, 'case_assigned', 'Assigned to Ploy K.'),
    ev('CASE-3111', -30, s, 'case_opened', 'Case opened from alert AL-90420'),
    ev('CASE-3111', -30, s, 'case_assigned', 'Auto-assigned to Anan W. (card queue)'),
    ev('CASE-3102', -640, s, 'case_opened', 'Case opened from alert AL-90377'),
    ev('CASE-3102', -610, s, 'alert_linked', 'Alert AL-90381 linked'),
    ev('CASE-3102', -590, s, 'hypothesis_generated', 'Hypothesis generated by bec-nlp-1.9.3 (confidence 0.84)'),
    ev('CASE-3102', -600, users.somchai, 'case_assigned', 'Assigned to Anan W.'),
    ev('CASE-3102', -120, users.anan, 'decision_recorded', 'Outcome: confirmed_fraud'),
    ev('CASE-3102', -95, users.anan, 'freeze_requested', 'Freeze request FRZ-0419 for ACC-0932 (14 pending payments, 6 scheduled transfers, 4 cards)'),
    ev('CASE-3098', -1460, s, 'case_opened', 'Case opened from alert AL-90366'),
    ev('CASE-3098', -1450, s, 'hypothesis_generated', 'Hypothesis generated by mule-graph-4.1.0 (confidence 0.87)'),
    ev('CASE-3098', -1440, users.somchai, 'case_assigned', 'Assigned to Ploy K.'),
    ev('CASE-3098', -60, users.ploy, 'decision_recorded', 'Outcome: confirmed_fraud'),
    ev('CASE-3098', -40, users.ploy, 'freeze_requested', 'Freeze request FRZ-0417 for ACC-5518 (1 pending payment, 1 card)'),
    ev('CASE-3095', -2900, s, 'case_opened', 'Case opened from alert AL-90352'),
    ev('CASE-3095', -2870, s, 'hypothesis_generated', 'Hypothesis generated by app-scam-0.9.4 (confidence 0.63)'),
    ev('CASE-3095', -2880, users.somchai, 'case_assigned', 'Assigned to Kanya T. (vulnerable customers)'),
    ev('CASE-3095', -700, users.kanya, 'decision_recorded', 'Outcome: needs_more_info'),
    ev('CASE-3090', -4300, s, 'case_opened', 'Case opened from alert AL-90341'),
    ev('CASE-3090', -4290, s, 'case_assigned', 'Auto-assigned to Ploy K.'),
    ev('CASE-3090', -3900, users.ploy, 'decision_recorded', 'Outcome: not_fraud'),
    ev('CASE-3084', -8700, s, 'case_opened', 'Case opened from alert AL-90310'),
    ev('CASE-3084', -8600, users.kanya, 'decision_recorded', 'Outcome: confirmed_fraud'),
    ev('CASE-3084', -8590, users.kanya, 'freeze_requested', 'Freeze request FRZ-0409 for ACC-3391, ACC-3392'),
    ev('CASE-3084', -8400, users.somchai, 'freeze_approved', 'Freeze request FRZ-0409 approved'),
    ev('CASE-3084', -8400, s, 'freeze_executed', 'Freeze FZ-77120 executed on 2 accounts (ref SNT-2026-004417)'),
    ev('CASE-3079', -14200, s, 'case_opened', 'Case opened from alert AL-90288'),
    ev('CASE-3079', -14000, users.anan, 'freeze_requested', 'Freeze request FRZ-0402 for ACC-8124'),
    ev('CASE-3079', -13900, users.somchai, 'freeze_rejected', 'Freeze request FRZ-0402 rejected: amount below policy threshold'),
    ev('CASE-3079', -12100, users.somchai, 'decision_recorded', 'Outcome: not_fraud'),
    ev('CASE-3079', -12000, users.somchai, 'case_closed', 'Case closed'),
  ];
}
