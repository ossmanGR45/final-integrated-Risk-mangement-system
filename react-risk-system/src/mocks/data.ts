// src/mocks/data.ts

export type ProposalStatus = 'manager_review' | 'admin_review' | 'accepted' | 'rejected';

export interface NewRiskProposal {
  id: string;
  riskName: string;
  riskDescription: string;
  location: string;
  department: string;
  categoryName: string;
  categoryID: number;
  impact: number;
  likelihood: number;
  score: number;
  causes?: string[];
  actions?: string[];
  strategicGoals?: string[];
  proposedBy: string;
  proposedByRole: 'initiator' | 'manager';
  status: ProposalStatus;
  submittedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  rejectionReason?: string;
}

export type RequestWorkflowStatus =
  | 'pending'
  | 'rejected'
  | 'accepted';

export interface WorkflowRequest {
  id: string;
  mode: 'before' | 'after';
  department: string;
  category: string;
  name: string;
  date: string;
  impact: number;
  likelihood: number;
  score: number;
  postImpact?: number;
  postLikelihood?: number;
  postScore?: number;
  responsiblePerson: string;
  customResponsible?: string;
  semester: 'first' | 'second' | 'summer';
  mitigationActions: string[];
  submittedBy: string;
  status: RequestWorkflowStatus;
  sentToAdmin: boolean;
  currentReviewerRole?: 'initiator' | 'manager' | 'admin';
  rejectionReason?: string;
  rejectedByRole?: 'manager' | 'admin';
  evidence?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogEntry {
  id: string;
  requestId: string;
  riskName: string;
  action: string;
  actor: string;
  actorRole: 'initiator' | 'manager' | 'admin';
  owner: string;
  status: RequestWorkflowStatus;
  createdAt: string;
  details: string;
}

export const mockUsers = [
  {
    id: 1,
    email: 'admin@ju.edu.jo',
    password: 'admin123',
    username: 'مدير النظام',
    role: 'admin',
    token: 'mock-admin-token',
    refreshToken: 'mock-refresh-token-admin'
  },
  {
    id: 2,
    email: 'manager@ju.edu.jo',
    password: 'manager123',
    username: 'مدير المخاطر',
    role: 'manager',
    token: 'mock-manager-token',
    refreshToken: 'mock-refresh-token-manager'
  },
  {
    id: 3,
    email: 'initiator@ju.edu.jo',
    password: 'initiator123',
    username: 'ضابط الارتباط',
    role: 'initiator',
    token: 'mock-initiator-token',
    refreshToken: 'mock-refresh-token-initiator'
  }
];

export const mockCategories = [
  { id: 1, categoryName: 'مخاطر تشغيلية', risks: null },
  { id: 2, categoryName: 'مخاطر مالية', risks: null },
  { id: 3, categoryName: 'مخاطر استراتيجية', risks: null },
  { id: 4, categoryName: 'مخاطر امتثال', risks: null }
];

export const mockRisks: any[] = [
  {
    id: 1,
    department: 'قسم تكنولوجيا المعلومات',
    riskName: 'حريق في المختبر',
    riskDescription: 'حريق في المبنى قد يؤدي إلى خسائر مادية كبيرة وتوقف العمليات التشغيلية',
    location: 'كلية التكنولوجيا - الطابق الثالث',
    likelihood: 2,
    impact: 4,
    custom: false,
    userId: 1,
    categoryName: 'مخاطر تشغيلية',
    categoryID: 1,
    responsibleId: 1,
    user: null,
    responsible: null,
    riskCauses: ['ماس كهربائي', 'إهمال السلامة', 'تخزين مواد قابلة للاشتعال'],
    riskActions: ['إخلاء الموقع', 'إبلاغ الجهة المسؤولة', 'تشغيل إنذار الحريق'],
    riskGoals: ['فحص دوري', 'تدريب السلامة', 'توفير طفايات الحريق'],
    strategicGoals: [
      'تعزيز بيئة عمل آمنة وصحية',
      'رفع جاهزية الاستجابة للطوارئ',
      'تقليل الحوادث التشغيلية داخل المرافق'
    ],
    requests: null
  },
  {
    id: 2,
    department: 'قسم أمن المعلومات',
    riskName: 'اختراق إلكتروني',
    riskDescription: 'تسريب بيانات حساسة للطلاب والموظفين نتيجة هجوم إلكتروني على الأنظمة',
    location: 'مركز البيانات الرئيسي',
    likelihood: 3,
    impact: 5,
    custom: false,
    userId: 1,
    categoryName: 'مخاطر تشغيلية',
    categoryID: 1,
    responsibleId: 4,
    user: null,
    responsible: null,
    riskCauses: ['كلمات مرور ضعيفة', 'عدم التحديث', 'ثغرات أمنية غير معالجة'],
    riskActions: ['عزل الأنظمة', 'إبلاغ فريق الأمن', 'إيقاف الوصول الخارجي مؤقتًا'],
    riskGoals: ['تفعيل المصادقة الثنائية', 'تحديث مستمر', 'اختبارات اختراق دورية'],
    strategicGoals: [
      'حماية أصول الجامعة الرقمية',
      'رفع مستوى الأمن السيبراني المؤسسي',
      'ضمان استمرارية الخدمات الإلكترونية'
    ],
    requests: null
  },
  {
    id: 3,
    department: 'قسم المالية',
    riskName: 'عجز في الميزانية',
    riskDescription: 'زيادة غير متوقعة في التكاليف التشغيلية تتجاوز الميزانية المخصصة',
    location: 'الإدارة المالية - المبنى الرئيسي',
    likelihood: 2,
    impact: 5,
    custom: false,
    userId: 1,
    categoryName: 'مخاطر مالية',
    categoryID: 2,
    responsibleId: 2,
    user: null,
    responsible: null,
    riskCauses: ['زيادة المصاريف', 'ضعف التخطيط', 'ارتفاع الأسعار'],
    riskActions: ['مراجعة الإنفاق', 'رفع تقرير عاجل', 'إعادة توزيع البنود'],
    riskGoals: ['خطة احتياطية', 'رقابة مالية أفضل', 'ترشيد المصروفات'],
    strategicGoals: [
      'تحسين كفاءة الإنفاق',
      'تعزيز الاستدامة المالية',
      'رفع كفاءة التخطيط المالي والرقابة'
    ],
    requests: null
  },
  {
    id: 4,
    department: 'قسم الشؤون القانونية',
    riskName: 'عدم الامتثال للأنظمة',
    riskDescription: 'مخالفة القوانين واللوائح الجديدة مما قد يؤدي إلى غرامات مالية',
    location: 'مكتب الشؤون القانونية',
    likelihood: 2,
    impact: 4,
    custom: false,
    userId: 1,
    categoryName: 'مخاطر امتثال',
    categoryID: 4,
    responsibleId: 3,
    user: null,
    responsible: null,
    riskCauses: ['ضعف المتابعة', 'تغير التشريعات', 'تأخر تحديث الإجراءات'],
    riskActions: ['مراجعة قانونية', 'إبلاغ الإدارة', 'تحديث السياسات فورًا'],
    riskGoals: ['مراجعات دورية', 'تدريب قانوني', 'تحديث الإجراءات'],
    strategicGoals: [
      'تعزيز الحوكمة والامتثال',
      'خفض المخاطر النظامية والقانونية',
      'تحديث السياسات والإجراءات المؤسسية'
    ],
    requests: null
  },
  {
    id: 5,
    department: 'قسم التخطيط والتطوير',
    riskName: 'فشل المبادرات الاستراتيجية',
    riskDescription: 'عدم تحقيق الأهداف الاستراتيجية طويلة المدى للجامعة',
    location: 'مكتب التخطيط والتطوير',
    likelihood: 2,
    impact: 4,
    custom: false,
    userId: 1,
    categoryName: 'مخاطر استراتيجية',
    categoryID: 3,
    responsibleId: 5,
    user: null,
    responsible: null,
    riskCauses: ['سوء التنفيذ', 'ضعف المتابعة', 'غياب مؤشرات الأداء'],
    riskActions: ['إعادة تقييم', 'رفع تقرير أداء', 'إعادة جدولة التنفيذ'],
    riskGoals: ['مؤشرات واضحة', 'متابعة دورية', 'قياس أداء مستمر'],
    strategicGoals: [
      'مواءمة المبادرات مع الخطة الاستراتيجية',
      'تحسين تحقيق مؤشرات الأداء المؤسسية',
      'رفع نضج التخطيط والمتابعة'
    ],
    requests: null
  },
  {
    id: 6,
    department: 'عمادة التعلم الإلكتروني',
    riskName: 'تعطل منصة التعليم الإلكتروني',
    riskDescription: 'توقف المنصة التعليمية قد يؤدي إلى تعطيل المحاضرات والاختبارات والوصول للمحتوى',
    location: 'مركز التعلم الإلكتروني',
    likelihood: 3,
    impact: 4,
    custom: false,
    userId: 1,
    categoryName: 'مخاطر تشغيلية',
    categoryID: 1,
    responsibleId: 4,
    user: null,
    responsible: null,
    riskCauses: ['ضغط مرتفع على الخوادم', 'ضعف السعة', 'أخطاء تقنية مفاجئة'],
    riskActions: ['تحويل للخوادم الاحتياطية', 'إبلاغ الفريق التقني', 'إرسال تنبيه للمستخدمين'],
    riskGoals: ['تعزيز السعة', 'خطة تعافي', 'مراقبة استباقية للأداء'],
    strategicGoals: [
      'ضمان استمرارية العملية التعليمية الرقمية',
      'رفع جاهزية البنية التحتية التقنية',
      'تحسين تجربة الطالب الرقمية'
    ],
    requests: null
  },
  {
    id: 7,
    department: 'إدارة المشاريع والتحول الرقمي',
    riskName: 'تأخر تنفيذ المشاريع التحولية',
    riskDescription: 'التأخير في تنفيذ المشاريع التحولية قد يؤثر على تحقيق مستهدفات الجامعة الرقمية',
    location: 'إدارة المشاريع',
    likelihood: 3,
    impact: 3,
    custom: false,
    userId: 1,
    categoryName: 'مخاطر استراتيجية',
    categoryID: 3,
    responsibleId: 5,
    user: null,
    responsible: null,
    riskCauses: ['ضعف إدارة الوقت', 'تأخر الموردين', 'تغير الأولويات'],
    riskActions: ['إعادة جدولة المشروع', 'تصعيد للقيادة', 'معالجة الاختناقات الحرجة'],
    riskGoals: ['متابعة أسبوعية', 'تقارير تقدم', 'حوكمة مشروع أوضح'],
    strategicGoals: [
      'تسريع التحول الرقمي المؤسسي',
      'رفع كفاءة إدارة المشاريع الاستراتيجية',
      'تحسين الالتزام بالجداول الزمنية للمبادرات'
    ],
    requests: null
  },
  {
    id: 8,
    department: 'عمادة الجودة والاعتماد',
    riskName: 'عدم تحقيق متطلبات الاعتماد الأكاديمي',
    riskDescription: 'قصور في استيفاء متطلبات الاعتماد قد يؤثر على السمعة الأكاديمية واستمرارية البرامج',
    location: 'مكتب الجودة والاعتماد',
    likelihood: 2,
    impact: 5,
    custom: false,
    userId: 1,
    categoryName: 'مخاطر امتثال',
    categoryID: 4,
    responsibleId: 6,
    user: null,
    responsible: null,
    riskCauses: ['نقص الأدلة', 'ضعف المتابعة', 'تأخر تحديث الملفات'],
    riskActions: ['خطة تصحيح عاجلة', 'اجتماع مع الجهات المعنية', 'استكمال ملفات الاعتماد'],
    riskGoals: ['أرشفة منظمة', 'خطة متابعة', 'تحديث دوري للمتطلبات'],
    strategicGoals: [
      'تعزيز جودة البرامج الأكاديمية',
      'الحفاظ على الاعتماد الأكاديمي المؤسسي والبرامجي',
      'رفع جاهزية الأدلة والحوكمة الأكاديمية'
    ],
    requests: null
  }
];

export const mockResponsible = [
  {
    id: 1,
    entityName: 'لجنة السلامة العامة',
    contactName: 'مدير مكتب السلامة العامة',
    contactEmail: 'safety@ju.edu.jo',
    contactPhoneNumber: '0775760333',
    risk: null,
    requests: null
  },
  {
    id: 2,
    entityName: 'قسم المالية والخزينة',
    contactName: 'مدير قسم المالية',
    contactEmail: 'finance@ju.edu.jo',
    contactPhoneNumber: '0791234567',
    risk: null,
    requests: null
  },
  {
    id: 3,
    entityName: 'المكتب القانوني',
    contactName: 'المستشار القانوني الرئيسي',
    contactEmail: 'legal@ju.edu.jo',
    contactPhoneNumber: '0798765432',
    risk: null,
    requests: null
  },
  {
    id: 4,
    entityName: 'مركز أمن المعلومات',
    contactName: 'مدير مركز أمن المعلومات',
    contactEmail: 'soc@ju.edu.jo',
    contactPhoneNumber: '0795552211',
    risk: null,
    requests: null
  },
  {
    id: 5,
    entityName: 'وحدة التخطيط الاستراتيجي',
    contactName: 'مدير وحدة التخطيط الاستراتيجي',
    contactEmail: 'strategy@ju.edu.jo',
    contactPhoneNumber: '0794443322',
    risk: null,
    requests: null
  },
  {
    id: 6,
    entityName: 'مكتب الاعتماد وضمان الجودة',
    contactName: 'مدير ضمان الجودة',
    contactEmail: 'quality@ju.edu.jo',
    contactPhoneNumber: '0798881144',
    risk: null,
    requests: null
  }
];

export const mockRiskRequests: WorkflowRequest[] = [
  {
    id: 'REQ-001',
    mode: 'before',
    department: 'كلية تقنية المعلومات',
    category: 'مخاطر تشغيلية',
    name: 'انقطاع الكهرباء في المعمل',
    date: '2026-03-10',
    impact: 4,
    likelihood: 2,
    score: 8,
    postImpact: 2,
    postLikelihood: 1,
    postScore: 2,
    responsiblePerson: 'أحمد محمد',
    customResponsible: '',
    semester: 'first',
    mitigationActions: ['عمل نسخ احتياطية', 'صيانة دورية'],
    submittedBy: 'initiator@ju.edu.jo',
    status: 'pending',
    sentToAdmin: false,
    currentReviewerRole: 'manager',
    rejectionReason: '',
    rejectedByRole: undefined,
    evidence: '',
    createdAt: '2026-03-10T10:00:00.000Z',
    updatedAt: '2026-03-10T10:00:00.000Z'
  },
  {
    id: 'REQ-002',
    mode: 'after',
    department: 'كلية تقنية المعلومات',
    category: 'مخاطر تشغيلية',
    name: 'تعطل خوادم التسجيل',
    date: '2026-03-11',
    impact: 5,
    likelihood: 3,
    score: 15,
    postImpact: 3,
    postLikelihood: 2,
    postScore: 6,
    responsiblePerson: 'سارة علي',
    customResponsible: '',
    semester: 'second',
    mitigationActions: ['تحديث الأنظمة', 'إبلاغ الفريق الفني'],
    submittedBy: 'initiator@ju.edu.jo',
    status: 'pending',
    sentToAdmin: false,
    currentReviewerRole: 'manager',
    rejectionReason: '',
    rejectedByRole: undefined,
    evidence: '',
    createdAt: '2026-03-11T09:00:00.000Z',
    updatedAt: '2026-03-11T09:00:00.000Z'
  },
  {
    id: 'REQ-003',
    mode: 'before',
    department: 'كلية تقنية المعلومات',
    category: 'مخاطر مالية',
    name: 'نقص في الميزانية',
    date: '2026-03-12',
    impact: 4,
    likelihood: 3,
    score: 12,
    postImpact: 2,
    postLikelihood: 2,
    postScore: 4,
    responsiblePerson: 'محمد الأحمد',
    customResponsible: '',
    semester: 'first',
    mitigationActions: ['مراجعة الإجراءات'],
    submittedBy: 'initiator@ju.edu.jo',
    status: 'rejected',
    sentToAdmin: false,
    currentReviewerRole: 'initiator',
    rejectionReason: 'يرجى تعديل البيانات وإضافة إجراءات أكثر وضوحًا',
    rejectedByRole: 'manager',
    evidence: '',
    createdAt: '2026-03-12T08:00:00.000Z',
    updatedAt: '2026-03-12T08:00:00.000Z'
  },
  {
    id: 'REQ-004',
    mode: 'after',
    department: 'كلية تقنية المعلومات',
    category: 'مخاطر امتثال',
    name: 'تأخر توريد المواد',
    date: '2026-03-13',
    impact: 3,
    likelihood: 2,
    score: 6,
    postImpact: 2,
    postLikelihood: 1,
    postScore: 2,
    responsiblePerson: 'فاطمة حسن',
    customResponsible: '',
    semester: 'summer',
    mitigationActions: ['التعاقد مع مورد بديل'],
    submittedBy: 'initiator@ju.edu.jo',
    status: 'accepted',
    sentToAdmin: true,
    currentReviewerRole: 'initiator',
    rejectionReason: '',
    rejectedByRole: undefined,
    evidence: '',
    createdAt: '2026-03-13T08:30:00.000Z',
    updatedAt: '2026-03-13T08:30:00.000Z'
  },
  {
    id: 'REQ-005',
    mode: 'before',
    department: 'كلية تقنية المعلومات',
    category: 'مخاطر استراتيجية',
    name: 'تسرب بيانات داخلية',
    date: '2026-03-14',
    impact: 5,
    likelihood: 2,
    score: 10,
    postImpact: 3,
    postLikelihood: 1,
    postScore: 3,
    responsiblePerson: 'أحمد محمد',
    customResponsible: '',
    semester: 'second',
    mitigationActions: ['تفعيل المصادقة الثنائية', 'تحديث الأنظمة'],
    submittedBy: 'initiator@ju.edu.jo',
    status: 'pending',
    sentToAdmin: true,
    currentReviewerRole: 'admin',
    rejectionReason: '',
    rejectedByRole: undefined,
    evidence: '',
    createdAt: '2026-03-14T11:00:00.000Z',
    updatedAt: '2026-03-14T11:00:00.000Z'
  }
];

export const mockLogs: LogEntry[] = [
  {
    id: 'LOG-001',
    requestId: 'REQ-001',
    riskName: 'انقطاع الكهرباء في المعمل',
    action: 'إنشاء طلب',
    actor: 'initiator@ju.edu.jo',
    actorRole: 'initiator',
    owner: 'initiator@ju.edu.jo',
    status: 'pending',
    createdAt: '2026-03-10T10:00:00.000Z',
    details: 'تم إنشاء الطلب وإرساله إلى المدير'
  },
  {
    id: 'LOG-002',
    requestId: 'REQ-002',
    riskName: 'تعطل خوادم التسجيل',
    action: 'فتح التفاصيل',
    actor: 'manager@ju.edu.jo',
    actorRole: 'manager',
    owner: 'initiator@ju.edu.jo',
    status: 'pending',
    createdAt: '2026-03-11T09:05:00.000Z',
    details: 'قام المدير بفتح الطلب'
  },
  {
    id: 'LOG-003',
    requestId: 'REQ-003',
    riskName: 'نقص في الميزانية',
    action: 'رفض من المدير',
    actor: 'manager@ju.edu.jo',
    actorRole: 'manager',
    owner: 'initiator@ju.edu.jo',
    status: 'rejected',
    createdAt: '2026-03-12T08:10:00.000Z',
    details: 'تم رفض الطلب وإرجاعه إلى ضابط الارتباط'
  },
  {
    id: 'LOG-004',
    requestId: 'REQ-004',
    riskName: 'تأخر توريد المواد',
    action: 'قبول من الأدمن',
    actor: 'admin@ju.edu.jo',
    actorRole: 'admin',
    owner: 'initiator@ju.edu.jo',
    status: 'accepted',
    createdAt: '2026-03-13T09:00:00.000Z',
    details: 'تم قبول الطلب ويمكن الآن إضافة الدليل'
  }
];

export const mockRiskProposals: NewRiskProposal[] = [
  {
    id: 'RP-001',
    riskName: 'انقطاع الكهرباء المتكرر',
    riskDescription: 'انقطاع متكرر للتيار الكهربائي يؤثر على استمرارية العمل والأجهزة الإلكترونية',
    location: 'المبنى الرئيسي - جميع الطوابق',
    department: 'قسم الصيانة والخدمات',
    categoryName: 'مخاطر تشغيلية',
    categoryID: 1,
    impact: 4,
    likelihood: 3,
    score: 12,
    causes: ['ضغط على الشبكة', 'أعطال مفاجئة'],
    actions: ['التواصل مع الصيانة', 'تشغيل البدائل'],
    strategicGoals: [
      'رفع الجاهزية التشغيلية للمرافق',
      'ضمان استمرارية الخدمات الأساسية',
      'تقليل الانقطاعات المفاجئة'
    ],
    proposedBy: 'initiator@ju.edu.jo',
    proposedByRole: 'initiator',
    status: 'manager_review',
    submittedDate: '2026-03-10'
  },
  {
    id: 'RP-002',
    riskName: 'تأخر توريد الأجهزة',
    riskDescription: 'تأخر وصول الأجهزة المخبرية يؤثر على سير العملية التعليمية',
    location: 'المستودعات',
    department: 'دائرة اللوازم',
    categoryName: 'مخاطر تشغيلية',
    categoryID: 1,
    impact: 3,
    likelihood: 3,
    score: 9,
    causes: ['مشاكل في المورد', 'تأخر الشحن'],
    actions: ['متابعة التوريد', 'خطة بديلة'],
    strategicGoals: [
      'رفع كفاءة سلسلة الإمداد',
      'ضمان جاهزية المختبرات التعليمية',
      'تقليل تعطل العملية التعليمية'
    ],
    proposedBy: 'initiator@ju.edu.jo',
    proposedByRole: 'initiator',
    status: 'manager_review',
    submittedDate: '2026-03-11'
  },
  {
    id: 'RP-003',
    riskName: 'ارتفاع تكاليف التشغيل',
    riskDescription: 'ارتفاع النفقات التشغيلية بشكل مفاجئ',
    location: 'الإدارة المالية',
    department: 'قسم المالية',
    categoryName: 'مخاطر مالية',
    categoryID: 2,
    impact: 5,
    likelihood: 2,
    score: 10,
    causes: ['زيادة الأسعار', 'ضعف الضبط المالي'],
    actions: ['مراجعة التكاليف', 'تقارير شهرية'],
    strategicGoals: [
      'تعزيز الاستدامة المالية',
      'رفع كفاءة الإنفاق',
      'تحسين الرقابة على المصروفات'
    ],
    proposedBy: 'manager@ju.edu.jo',
    proposedByRole: 'manager',
    status: 'admin_review',
    submittedDate: '2026-03-12'
  },
  {
    id: 'RP-004',
    riskName: 'فقدان وثائق رسمية',
    riskDescription: 'احتمالية فقدان ملفات ووثائق رسمية مهمة',
    location: 'الأرشيف المركزي',
    department: 'دائرة الوثائق',
    categoryName: 'مخاطر امتثال',
    categoryID: 4,
    impact: 4,
    likelihood: 2,
    score: 8,
    causes: ['أرشفة ضعيفة'],
    actions: ['نسخ إلكتروني'],
    strategicGoals: [
      'تعزيز الحوكمة وحفظ الوثائق',
      'رفع موثوقية الأرشفة المؤسسية',
      'خفض مخاطر فقدان الأدلة الرسمية'
    ],
    proposedBy: 'initiator@ju.edu.jo',
    proposedByRole: 'initiator',
    status: 'rejected',
    submittedDate: '2026-03-09',
    rejectionReason: 'المقترح بحاجة لتفاصيل أكثر',
    reviewedBy: 'manager@ju.edu.jo',
    reviewedDate: '2026-03-10'
  },
  {
    id: 'RP-005',
    riskName: 'ضعف مؤشرات الأداء للمبادرات',
    riskDescription: 'عدم وضوح مؤشرات الأداء يضعف القدرة على متابعة تنفيذ المبادرات الاستراتيجية',
    location: 'وحدة التخطيط الاستراتيجي',
    department: 'التخطيط والتطوير',
    categoryName: 'مخاطر استراتيجية',
    categoryID: 3,
    impact: 4,
    likelihood: 3,
    score: 12,
    causes: ['غياب لوحات قياس', 'عدم تحديث المؤشرات'],
    actions: ['إعداد مؤشرات جديدة', 'مراجعة دورية للأداء'],
    strategicGoals: [
      'تحسين تحقيق مؤشرات الأداء المؤسسية',
      'رفع نضج التخطيط والمتابعة',
      'تعزيز مواءمة المبادرات مع الخطة الاستراتيجية'
    ],
    proposedBy: 'initiator@ju.edu.jo',
    proposedByRole: 'initiator',
    status: 'manager_review',
    submittedDate: '2026-03-15'
  },
  {
    id: 'RP-006',
    riskName: 'ثغرات في أنظمة الوصول الداخلي',
    riskDescription: 'وجود ثغرات في أنظمة الوصول قد يؤدي إلى تسريب معلومات أو إساءة استخدام الصلاحيات',
    location: 'مركز البيانات',
    department: 'مركز أمن المعلومات',
    categoryName: 'مخاطر تشغيلية',
    categoryID: 1,
    impact: 5,
    likelihood: 3,
    score: 15,
    causes: ['إعدادات خاطئة', 'صلاحيات غير محدثة'],
    actions: ['مراجعة الصلاحيات', 'تفعيل مراقبة أمنية'],
    strategicGoals: [
      'رفع مستوى الأمن السيبراني المؤسسي',
      'حماية أصول الجامعة الرقمية',
      'ضمان استمرارية الخدمات الإلكترونية'
    ],
    proposedBy: 'manager@ju.edu.jo',
    proposedByRole: 'manager',
    status: 'admin_review',
    submittedDate: '2026-03-16'
  }
];