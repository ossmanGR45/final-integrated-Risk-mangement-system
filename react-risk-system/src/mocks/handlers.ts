// src/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw';
import {
  mockUsers,
  mockCategories,
  mockRisks,
  mockResponsible,
  mockRiskRequests,
  mockRiskProposals,
  mockLogs,
  WorkflowRequest,
  RequestWorkflowStatus
} from './data';

const API_BASE = 'https://localhost:7002/api';

const getCurrentUser = () => {
  const username = localStorage.getItem('username') || 'unknown@ju.edu.jo';
  const role = ((localStorage.getItem('userRole') || 'initiator').toLowerCase()) as
    | 'initiator'
    | 'manager'
    | 'admin';

  return { username, role };
};

const isAuthorized = (request: Request) => {
  const authHeader = request.headers.get('Authorization');
  return !!authHeader?.startsWith('Bearer ');
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => String(item).trim())
    .filter(Boolean);
};

const uniqueValues = (values: string[]) => Array.from(new Set(values));

const getFallbackStrategicGoals = (categoryName?: string, riskName?: string): string[] => {
  const category = (categoryName || '').trim();
  const risk = (riskName || '').trim();

  const categoryDefaults: Record<string, string[]> = {
    'مخاطر تشغيلية': [
      'رفع كفاءة التشغيل واستمرارية الأعمال',
      'تعزيز الجاهزية للطوارئ',
      'تقليل الانقطاعات التشغيلية'
    ],
    'مخاطر مالية': [
      'تعزيز الاستدامة المالية',
      'رفع كفاءة الإنفاق',
      'تحسين التخطيط والرقابة المالية'
    ],
    'مخاطر استراتيجية': [
      'مواءمة المبادرات مع الخطة الاستراتيجية',
      'تحسين تحقيق مؤشرات الأداء المؤسسية',
      'رفع نضج التخطيط والمتابعة'
    ],
    'مخاطر امتثال': [
      'تعزيز الحوكمة والامتثال',
      'خفض المخاطر القانونية والتنظيمية',
      'تحديث السياسات والإجراءات المؤسسية'
    ]
  };

  const categoryGoals = categoryDefaults[category] || [
    'رفع كفاءة الأداء المؤسسي',
    'تحسين جودة المتابعة',
    'تعزيز الجاهزية المؤسسية'
  ];

  const keywordGoals: string[] = [];

  if (risk.includes('اختراق') || risk.includes('بيانات') || risk.includes('سيبر')) {
    keywordGoals.push(
      'رفع مستوى الأمن السيبراني المؤسسي',
      'حماية أصول الجامعة الرقمية',
      'ضمان استمرارية الخدمات الإلكترونية'
    );
  }

  if (risk.includes('حريق') || risk.includes('سلامة') || risk.includes('طوارئ')) {
    keywordGoals.push(
      'تعزيز بيئة عمل آمنة وصحية',
      'رفع جاهزية الاستجابة للطوارئ'
    );
  }

  if (risk.includes('منصة') || risk.includes('تعليم') || risk.includes('خوادم')) {
    keywordGoals.push(
      'ضمان استمرارية العملية التعليمية الرقمية',
      'رفع جاهزية البنية التحتية التقنية'
    );
  }

  if (risk.includes('ميزانية') || risk.includes('تكاليف') || risk.includes('مالية')) {
    keywordGoals.push(
      'تعزيز الاستدامة المالية',
      'رفع كفاءة الإنفاق'
    );
  }

  if (risk.includes('اعتماد') || risk.includes('امتثال') || risk.includes('قانون')) {
    keywordGoals.push(
      'تعزيز الحوكمة والامتثال',
      'الحفاظ على الاعتماد المؤسسي والبرامجي'
    );
  }

  if (risk.includes('مشروع') || risk.includes('مبادرات') || risk.includes('استراتيجية')) {
    keywordGoals.push(
      'مواءمة المبادرات مع الخطة الاستراتيجية',
      'تحسين تحقيق مؤشرات الأداء المؤسسية'
    );
  }

  return uniqueValues([...keywordGoals, ...categoryGoals]).slice(0, 5);
};

const enrichRiskStrategicGoals = <T extends { categoryName?: string; riskName?: string; strategicGoals?: string[] | null }>(
  item: T
): T & { strategicGoals: string[] } => {
  const existingGoals = normalizeStringArray(item.strategicGoals);

  return {
    ...item,
    strategicGoals:
      existingGoals.length > 0
        ? uniqueValues(existingGoals)
        : getFallbackStrategicGoals(item.categoryName, item.riskName)
  };
};

const enrichProposalStrategicGoals = <T extends { categoryName?: string; riskName?: string; strategicGoals?: string[] | null }>(
  item: T
): T & { strategicGoals: string[] } => {
  const existingGoals = normalizeStringArray(item.strategicGoals);

  return {
    ...item,
    strategicGoals:
      existingGoals.length > 0
        ? uniqueValues(existingGoals)
        : getFallbackStrategicGoals(item.categoryName, item.riskName)
  };
};

const createLog = ({
  requestId,
  riskName,
  action,
  actor,
  actorRole,
  owner,
  status,
  details
}: {
  requestId: string;
  riskName: string;
  action: string;
  actor: string;
  actorRole: 'initiator' | 'manager' | 'admin';
  owner: string;
  status: RequestWorkflowStatus;
  details: string;
}) => {
  mockLogs.unshift({
    id: `LOG-${String(mockLogs.length + 1).padStart(3, '0')}`,
    requestId,
    riskName,
    action,
    actor,
    actorRole,
    owner,
    status,
    createdAt: new Date().toISOString(),
    details
  });
};

const findRequestIndex = (id: string) => mockRiskRequests.findIndex(r => r.id === id);

export const handlers = [
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as { email: string; password: string };
    const user = mockUsers.find(u => u.email === body.email && u.password === body.password);

    if (!user) {
      return HttpResponse.json(
        { message: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      token: user.token,
      refreshToken: user.refreshToken,
      username: user.email,
      roles: [user.role],
      role: user.role,
      expiresAt: 3600
    });
  }),

  http.post(`${API_BASE}/auth/refresh`, async ({ request }) => {
    await delay(200);
    const body = (await request.json()) as { refreshToken: string };
    const user = mockUsers.find(u => u.refreshToken === body.refreshToken);

    if (!user) {
      return HttpResponse.json({ message: 'رمز التحديث غير صالح' }, { status: 401 });
    }

    return HttpResponse.json({
      token: `${user.token}-refreshed`,
      refreshToken: `${user.refreshToken}-new`,
      expiresAt: 3600
    });
  }),

  http.get(`${API_BASE}/category`, async () => {
    await delay(200);
    return HttpResponse.json(mockCategories);
  }),

  http.get(`${API_BASE}/category/:id`, async ({ params }) => {
    await delay(150);
    const category = mockCategories.find(c => c.id === Number(params.id));
    if (!category) return HttpResponse.json({ message: 'الفئة غير موجودة' }, { status: 404 });
    return HttpResponse.json(category);
  }),

  http.post(`${API_BASE}/category`, async ({ request }) => {
    await delay(300);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const body = (await request.json()) as { categoryName?: string };
    const categoryName = body.categoryName?.trim();

    if (!categoryName) {
      return HttpResponse.json({ message: 'اسم الفئة مطلوب' }, { status: 400 });
    }

    const exists = mockCategories.some(c => c.categoryName.trim() === categoryName);
    if (exists) {
      return HttpResponse.json({ message: 'هذه الفئة موجودة بالفعل' }, { status: 409 });
    }

    const newCategory = {
      id: mockCategories.length + 1,
      categoryName,
      risks: null
    };

    mockCategories.push(newCategory);

    return HttpResponse.json(
      { success: true, message: 'تمت إضافة الفئة بنجاح', data: newCategory },
      { status: 201 }
    );
  }),

  http.get(`${API_BASE}/responsible`, async () => {
    await delay(200);
    return HttpResponse.json(mockResponsible);
  }),

  http.post(`${API_BASE}/responsible`, async ({ request }) => {
    await delay(300);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const body = (await request.json()) as {
      entityName?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhoneNumber?: string;
    };

    const entityName = body.entityName?.trim();
    const contactName = body.contactName?.trim();
    const contactEmail = body.contactEmail?.trim() || '';
    const contactPhoneNumber = body.contactPhoneNumber?.trim();

    if (!entityName || !contactName || !contactPhoneNumber) {
      return HttpResponse.json(
        { message: 'اسم الجهة واسم الشخص المسؤول ورقم الهاتف مطلوبة' },
        { status: 400 }
      );
    }

    const newResponsible = {
      id: mockResponsible.length + 1,
      entityName,
      contactName,
      contactEmail,
      contactPhoneNumber,
      risk: null,
      requests: null
    };

    mockResponsible.push(newResponsible);

    return HttpResponse.json(
      { success: true, message: 'تمت إضافة الجهة المسؤولة بنجاح', data: newResponsible },
      { status: 201 }
    );
  }),

  http.get(`${API_BASE}/risk`, async () => {
    await delay(250);
    return HttpResponse.json(mockRisks.map(risk => enrichRiskStrategicGoals(risk)));
  }),

  http.post(`${API_BASE}/risk`, async ({ request }) => {
    await delay(350);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const body = (await request.json()) as any;
    const category = mockCategories.find(c => c.id === Number(body.categoryID));
    const responsible = body.responsibleId
      ? mockResponsible.find(r => r.id === Number(body.responsibleId))
      : null;

    if (!body.riskName?.trim()) {
      return HttpResponse.json({ message: 'اسم الخطر مطلوب' }, { status: 400 });
    }
    if (!body.department?.trim()) {
      return HttpResponse.json({ message: 'القسم مطلوب' }, { status: 400 });
    }
    if (!body.location?.trim()) {
      return HttpResponse.json({ message: 'مكان الخطر مطلوب' }, { status: 400 });
    }
    if (!category) {
      return HttpResponse.json({ message: 'الفئة غير موجودة' }, { status: 400 });
    }

    const strategicGoals = normalizeStringArray(body.strategicGoals);
    const finalStrategicGoals =
      strategicGoals.length > 0
        ? uniqueValues(strategicGoals)
        : getFallbackStrategicGoals(category.categoryName, body.riskName);

    const newRisk = {
      id: mockRisks.length + 1,
      department: body.department.trim(),
      riskName: body.riskName.trim(),
      riskDescription: body.riskDescription?.trim() || '',
      location: body.location.trim(),
      likelihood: Number(body.likelihood) || 1,
      impact: Number(body.impact) || 1,
      custom: true,
      userId: 1,
      categoryName: category.categoryName,
      categoryID: category.id,
      responsibleId: responsible?.id ?? null,
      user: null,
      responsible: null,
      riskCauses: normalizeStringArray(body.causes).length > 0 ? normalizeStringArray(body.causes) : null,
      riskActions: normalizeStringArray(body.responseActions).length > 0 ? normalizeStringArray(body.responseActions) : null,
      riskGoals: normalizeStringArray(body.preventiveActions).length > 0 ? normalizeStringArray(body.preventiveActions) : null,
      strategicGoals: finalStrategicGoals,
      requests: null
    };

    mockRisks.push(newRisk);

    return HttpResponse.json(
      {
        success: true,
        message: 'تمت إضافة المخاطرة إلى قاعدة البيانات',
        data: enrichRiskStrategicGoals(newRisk)
      },
      { status: 201 }
    );
  }),

  http.get(`${API_BASE}/requests`, async ({ request }) => {
    await delay(250);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const { username, role } = getCurrentUser();

    if (role === 'initiator') {
      return HttpResponse.json(mockRiskRequests.filter(r => r.submittedBy === username));
    }

    if (role === 'manager') {
      return HttpResponse.json(
        mockRiskRequests.filter(
          r =>
            r.currentReviewerRole === 'manager' &&
            r.status === 'pending'
        )
      );
    }

    return HttpResponse.json(
      mockRiskRequests.filter(
        r =>
          r.currentReviewerRole === 'admin' &&
          r.sentToAdmin === true &&
          r.status === 'pending'
      )
    );
  }),

  http.post(`${API_BASE}/requests`, async ({ request }) => {
    await delay(350);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const body = (await request.json()) as any;
    const { username, role } = getCurrentUser();

    if (role !== 'initiator') {
      return HttpResponse.json({ message: 'فقط ضابط الارتباط يستطيع تسجيل الطلب' }, { status: 403 });
    }

    const newRequest: WorkflowRequest = {
      id: `REQ-${String(mockRiskRequests.length + 1).padStart(3, '0')}`,
      mode: (body.mode || 'before') as 'before' | 'after',
      department: body.department || '',
      category: body.category || '',
      name: body.name || '',
      date: body.date || new Date().toISOString().split('T')[0],
      impact: Number(body.impact) || 1,
      likelihood: Number(body.likelihood) || 1,
      score: Number(body.score) || 1,
      postImpact: Number(body.postImpact) || 1,
      postLikelihood: Number(body.postLikelihood) || 1,
      postScore: Number(body.postScore) || 1,
      responsiblePerson: body.responsiblePerson || '',
      customResponsible: body.customResponsible || '',
      semester: (body.semester || 'first') as 'first' | 'second' | 'summer',
      mitigationActions: Array.isArray(body.mitigationActions) ? body.mitigationActions : [],
      submittedBy: username,
      status: 'pending',
      sentToAdmin: false,
      currentReviewerRole: 'manager',
      rejectionReason: '',
      rejectedByRole: undefined,
      evidence: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockRiskRequests.unshift(newRequest);

    createLog({
      requestId: newRequest.id,
      riskName: newRequest.name,
      action: 'إنشاء طلب',
      actor: username,
      actorRole: 'initiator',
      owner: username,
      status: newRequest.status,
      details: 'تم إنشاء الطلب وإرساله إلى المدير'
    });

    return HttpResponse.json(
      { success: true, message: 'تم تسجيل الطلب وإرساله إلى المدير', data: newRequest },
      { status: 201 }
    );
  }),

  http.patch(`${API_BASE}/requests/:id`, async ({ params, request }) => {
    await delay(300);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const body = (await request.json()) as any;
    const { username, role } = getCurrentUser();

    const idx = findRequestIndex(String(params.id));
    if (idx === -1) return HttpResponse.json({ message: 'الطلب غير موجود' }, { status: 404 });

    const current = mockRiskRequests[idx];

    if (role !== 'initiator' || current.submittedBy !== username) {
      return HttpResponse.json({ message: 'غير مصرح لك بتعديل هذا الطلب' }, { status: 403 });
    }

    if (current.status !== 'rejected') {
      return HttpResponse.json({ message: 'يسمح بالتعديل فقط على الطلبات المرفوضة' }, { status: 400 });
    }

    mockRiskRequests[idx] = {
      ...current,
      ...body,
      status: 'pending',
      sentToAdmin: false,
      currentReviewerRole: 'manager',
      rejectionReason: '',
      rejectedByRole: undefined,
      updatedAt: new Date().toISOString()
    };

    createLog({
      requestId: current.id,
      riskName: mockRiskRequests[idx].name,
      action: 'تعديل وإعادة إرسال',
      actor: username,
      actorRole: 'initiator',
      owner: username,
      status: 'pending',
      details: 'تم تعديل الطلب المرفوض وإعادة إرساله إلى المدير'
    });

    return HttpResponse.json({
      success: true,
      message: 'تم تعديل الطلب وإعادة إرساله إلى المدير',
      data: mockRiskRequests[idx]
    });
  }),

  http.patch(`${API_BASE}/requests/:id/open-review`, async ({ params, request }) => {
    await delay(200);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const { username } = getCurrentUser();
    const idx = findRequestIndex(String(params.id));
    if (idx === -1) return HttpResponse.json({ message: 'الطلب غير موجود' }, { status: 404 });

    mockRiskRequests[idx] = {
      ...mockRiskRequests[idx],
      updatedAt: new Date().toISOString()
    };

    createLog({
      requestId: mockRiskRequests[idx].id,
      riskName: mockRiskRequests[idx].name,
      action: 'فتح التفاصيل',
      actor: username,
      actorRole: (localStorage.getItem('userRole') as 'initiator' | 'manager' | 'admin') || 'manager',
      owner: mockRiskRequests[idx].submittedBy,
      status: mockRiskRequests[idx].status,
      details: 'تم فتح تفاصيل الطلب'
    });

    return HttpResponse.json({
      success: true,
      message: 'تم فتح تفاصيل الطلب',
      data: mockRiskRequests[idx]
    });
  }),

  http.patch(`${API_BASE}/requests/:id/close-review`, async ({ params, request }) => {
    await delay(180);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const idx = findRequestIndex(String(params.id));
    if (idx === -1) return HttpResponse.json({ message: 'الطلب غير موجود' }, { status: 404 });

    mockRiskRequests[idx] = {
      ...mockRiskRequests[idx],
      updatedAt: new Date().toISOString()
    };

    return HttpResponse.json({
      success: true,
      message: 'تم تحديث الطلب',
      data: mockRiskRequests[idx]
    });
  }),

  http.patch(`${API_BASE}/requests/:id/send-to-admin`, async ({ params, request }) => {
    await delay(300);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const { username, role } = getCurrentUser();
    if (role !== 'manager') {
      return HttpResponse.json({ message: 'فقط المدير يستطيع تحويل الطلب إلى الأدمن' }, { status: 403 });
    }

    const idx = findRequestIndex(String(params.id));
    if (idx === -1) return HttpResponse.json({ message: 'الطلب غير موجود' }, { status: 404 });

    const current = mockRiskRequests[idx];

    mockRiskRequests[idx] = {
      ...current,
      status: 'pending',
      sentToAdmin: true,
      currentReviewerRole: 'admin',
      updatedAt: new Date().toISOString()
    };

    createLog({
      requestId: current.id,
      riskName: current.name,
      action: 'تحويل إلى الأدمن',
      actor: username,
      actorRole: 'manager',
      owner: current.submittedBy,
      status: 'pending',
      details: 'تم تحويل الطلب إلى الأدمن'
    });

    return HttpResponse.json({
      success: true,
      message: 'تم تحويل الطلب إلى الأدمن',
      data: mockRiskRequests[idx]
    });
  }),

  http.patch(`${API_BASE}/requests/:id/reject-manager`, async ({ params, request }) => {
    await delay(300);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const { username, role } = getCurrentUser();
    if (role !== 'manager') {
      return HttpResponse.json({ message: 'فقط المدير يستطيع رفض الطلب' }, { status: 403 });
    }

    const body = (await request.json()) as { rejectionReason?: string };
    const idx = findRequestIndex(String(params.id));
    if (idx === -1) return HttpResponse.json({ message: 'الطلب غير موجود' }, { status: 404 });

    mockRiskRequests[idx] = {
      ...mockRiskRequests[idx],
      status: 'rejected',
      sentToAdmin: false,
      currentReviewerRole: 'initiator',
      rejectedByRole: 'manager',
      rejectionReason: body.rejectionReason || 'تم رفض الطلب من المدير',
      updatedAt: new Date().toISOString()
    };

    createLog({
      requestId: mockRiskRequests[idx].id,
      riskName: mockRiskRequests[idx].name,
      action: 'رفض من المدير',
      actor: username,
      actorRole: 'manager',
      owner: mockRiskRequests[idx].submittedBy,
      status: 'rejected',
      details: body.rejectionReason || 'تم رفض الطلب من المدير وإرجاعه إلى ضابط الارتباط'
    });

    return HttpResponse.json({
      success: true,
      message: 'تم رفض الطلب وإرجاعه إلى ضابط الارتباط',
      data: mockRiskRequests[idx]
    });
  }),

  http.patch(`${API_BASE}/requests/:id/accept-admin`, async ({ params, request }) => {
    await delay(300);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const { username, role } = getCurrentUser();
    if (role !== 'admin') {
      return HttpResponse.json({ message: 'فقط الأدمن يستطيع قبول الطلب' }, { status: 403 });
    }

    const idx = findRequestIndex(String(params.id));
    if (idx === -1) return HttpResponse.json({ message: 'الطلب غير موجود' }, { status: 404 });

    mockRiskRequests[idx] = {
      ...mockRiskRequests[idx],
      status: 'accepted',
      sentToAdmin: false,
      currentReviewerRole: 'initiator',
      updatedAt: new Date().toISOString()
    };

    createLog({
      requestId: mockRiskRequests[idx].id,
      riskName: mockRiskRequests[idx].name,
      action: 'قبول من الأدمن',
      actor: username,
      actorRole: 'admin',
      owner: mockRiskRequests[idx].submittedBy,
      status: 'accepted',
      details: 'تم قبول الطلب ويمكن الآن رفع الدليل'
    });

    return HttpResponse.json({
      success: true,
      message: 'تم قبول الطلب',
      data: mockRiskRequests[idx]
    });
  }),

  http.patch(`${API_BASE}/requests/:id/reject-admin`, async ({ params, request }) => {
    await delay(300);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const { username, role } = getCurrentUser();
    if (role !== 'admin') {
      return HttpResponse.json({ message: 'فقط الأدمن يستطيع رفض الطلب' }, { status: 403 });
    }

    const body = (await request.json()) as { rejectionReason?: string };
    const idx = findRequestIndex(String(params.id));
    if (idx === -1) return HttpResponse.json({ message: 'الطلب غير موجود' }, { status: 404 });

    mockRiskRequests[idx] = {
      ...mockRiskRequests[idx],
      status: 'rejected',
      sentToAdmin: false,
      currentReviewerRole: 'initiator',
      rejectedByRole: 'admin',
      rejectionReason: body.rejectionReason || 'تم رفض الطلب من الأدمن',
      updatedAt: new Date().toISOString()
    };

    createLog({
      requestId: mockRiskRequests[idx].id,
      riskName: mockRiskRequests[idx].name,
      action: 'رفض من الأدمن',
      actor: username,
      actorRole: 'admin',
      owner: mockRiskRequests[idx].submittedBy,
      status: 'rejected',
      details: body.rejectionReason || 'تم رفض الطلب من الأدمن وإرجاعه إلى ضابط الارتباط'
    });

    return HttpResponse.json({
      success: true,
      message: 'تم رفض الطلب وإرجاعه إلى ضابط الارتباط',
      data: mockRiskRequests[idx]
    });
  }),

  http.patch(`${API_BASE}/requests/:id/evidence`, async ({ params, request }) => {
    await delay(280);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const { username, role } = getCurrentUser();
    if (role !== 'initiator') {
      return HttpResponse.json({ message: 'فقط ضابط الارتباط يستطيع رفع الدليل' }, { status: 403 });
    }

    const body = (await request.json()) as { evidence?: string };
    const idx = findRequestIndex(String(params.id));
    if (idx === -1) return HttpResponse.json({ message: 'الطلب غير موجود' }, { status: 404 });

    if (mockRiskRequests[idx].submittedBy !== username) {
      return HttpResponse.json({ message: 'غير مصرح لك' }, { status: 403 });
    }

    if (mockRiskRequests[idx].status !== 'accepted') {
      return HttpResponse.json({ message: 'لا يمكن رفع الدليل إلا بعد قبول الطلب' }, { status: 400 });
    }

    mockRiskRequests[idx] = {
      ...mockRiskRequests[idx],
      evidence: body.evidence || '',
      updatedAt: new Date().toISOString()
    };

    createLog({
      requestId: mockRiskRequests[idx].id,
      riskName: mockRiskRequests[idx].name,
      action: 'رفع دليل',
      actor: username,
      actorRole: 'initiator',
      owner: username,
      status: mockRiskRequests[idx].status,
      details: 'تم رفع الدليل على الطلب المقبول'
    });

    return HttpResponse.json({
      success: true,
      message: 'تم حفظ الدليل بنجاح',
      data: mockRiskRequests[idx]
    });
  }),

  http.delete(`${API_BASE}/requests/:id`, async ({ params, request }) => {
    await delay(220);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const { username, role } = getCurrentUser();
    if (role !== 'initiator') {
      return HttpResponse.json({ message: 'فقط ضابط الارتباط يستطيع إلغاء الطلب' }, { status: 403 });
    }

    const idx = findRequestIndex(String(params.id));
    if (idx === -1) return HttpResponse.json({ message: 'الطلب غير موجود' }, { status: 404 });

    const current = mockRiskRequests[idx];

    if (current.submittedBy !== username || current.status !== 'rejected') {
      return HttpResponse.json({ message: 'يمكن إلغاء الطلبات المرفوضة فقط' }, { status: 400 });
    }

    mockRiskRequests.splice(idx, 1);

    createLog({
      requestId: current.id,
      riskName: current.name,
      action: 'إلغاء طلب',
      actor: username,
      actorRole: 'initiator',
      owner: username,
      status: 'rejected',
      details: 'تم إلغاء الطلب المرفوض نهائيًا'
    });

    return HttpResponse.json({
      success: true,
      message: 'تم إلغاء الطلب نهائيًا'
    });
  }),

  http.get(`${API_BASE}/logs/my`, async ({ request }) => {
    await delay(220);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const { username } = getCurrentUser();
    const personalLogs = mockLogs.filter(log => log.owner === username || log.actor === username);

    return HttpResponse.json(personalLogs);
  }),

  http.get(`${API_BASE}/logs`, async ({ request }) => {
    await delay(220);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const { role } = getCurrentUser();
    if (role !== 'admin') {
      return HttpResponse.json({ message: 'فقط الأدمن يستطيع مشاهدة جميع السجلات' }, { status: 403 });
    }

    return HttpResponse.json(mockLogs);
  }),

  http.post(`${API_BASE}/risk-proposals`, async ({ request }) => {
    await delay(350);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const body = (await request.json()) as any;
    const { username, role } = getCurrentUser();

    const initialStatus = role === 'manager' ? 'admin_review' : 'manager_review';

    const categoryName =
      body.categoryName ||
      mockCategories.find(c => c.id === Number(body.categoryID))?.categoryName ||
      'مخاطر تشغيلية';

    const providedStrategicGoals = normalizeStringArray(body.strategicGoals);
    const finalStrategicGoals =
      providedStrategicGoals.length > 0
        ? uniqueValues(providedStrategicGoals)
        : getFallbackStrategicGoals(categoryName, body.riskName);

    const newProposal = {
      id: `RP-${String(mockRiskProposals.length + 1).padStart(3, '0')}`,
      ...body,
      categoryName,
      proposedBy: username,
      proposedByRole: role,
      status: initialStatus,
      strategicGoals: finalStrategicGoals,
      submittedDate: new Date().toISOString().split('T')[0]
    };

    mockRiskProposals.unshift(newProposal);

    return HttpResponse.json(
      {
        success: true,
        message: 'تم إرسال المقترح بنجاح',
        data: enrichProposalStrategicGoals(newProposal)
      },
      { status: 201 }
    );
  }),

  http.get(`${API_BASE}/risk-proposals/my-proposals`, async ({ request }) => {
    await delay(220);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const { username } = getCurrentUser();
    return HttpResponse.json(
      mockRiskProposals
        .filter(p => p.proposedBy === username)
        .map(item => enrichProposalStrategicGoals(item))
    );
  }),

  http.get(`${API_BASE}/risk-proposals/for-manager`, async ({ request }) => {
    await delay(220);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    return HttpResponse.json(
      mockRiskProposals
        .filter(p => p.status === 'manager_review')
        .map(item => enrichProposalStrategicGoals(item))
    );
  }),

  http.get(`${API_BASE}/risk-proposals/for-admin`, async ({ request }) => {
    await delay(220);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    return HttpResponse.json(
      mockRiskProposals
        .filter(p => p.status === 'admin_review')
        .map(item => enrichProposalStrategicGoals(item))
    );
  }),

  http.patch(`${API_BASE}/risk-proposals/:id/send-to-admin`, async ({ params, request }) => {
    await delay(250);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const idx = mockRiskProposals.findIndex(p => p.id === params.id);
    if (idx === -1) return HttpResponse.json({ message: 'المقترح غير موجود' }, { status: 404 });

    mockRiskProposals[idx] = {
      ...mockRiskProposals[idx],
      strategicGoals: enrichProposalStrategicGoals(mockRiskProposals[idx]).strategicGoals,
      status: 'admin_review',
      reviewedBy: localStorage.getItem('username') || 'Unknown',
      reviewedDate: new Date().toISOString().split('T')[0]
    };

    return HttpResponse.json({
      success: true,
      message: 'تم إرسال المقترح إلى الأدمن',
      data: enrichProposalStrategicGoals(mockRiskProposals[idx])
    });
  }),

  http.patch(`${API_BASE}/risk-proposals/:id/reject`, async ({ params, request }) => {
    await delay(250);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const body = (await request.json()) as { rejectionReason: string };
    const idx = mockRiskProposals.findIndex(p => p.id === params.id);
    if (idx === -1) return HttpResponse.json({ message: 'المقترح غير موجود' }, { status: 404 });

    mockRiskProposals[idx] = {
      ...mockRiskProposals[idx],
      strategicGoals: enrichProposalStrategicGoals(mockRiskProposals[idx]).strategicGoals,
      status: 'rejected',
      rejectionReason: body.rejectionReason || 'تم رفض المقترح',
      reviewedBy: localStorage.getItem('username') || 'Unknown',
      reviewedDate: new Date().toISOString().split('T')[0]
    };

    return HttpResponse.json({
      success: true,
      message: 'تم رفض المقترح',
      data: enrichProposalStrategicGoals(mockRiskProposals[idx])
    });
  }),

  http.post(`${API_BASE}/risk-proposals/:id/accept`, async ({ params, request }) => {
    await delay(250);

    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'غير مصرح' }, { status: 401 });
    }

    const idx = mockRiskProposals.findIndex(p => p.id === params.id);
    if (idx === -1) return HttpResponse.json({ message: 'المقترح غير موجود' }, { status: 404 });

    mockRiskProposals[idx] = {
      ...mockRiskProposals[idx],
      strategicGoals: enrichProposalStrategicGoals(mockRiskProposals[idx]).strategicGoals,
      status: 'accepted',
      reviewedBy: localStorage.getItem('username') || 'Unknown',
      reviewedDate: new Date().toISOString().split('T')[0]
    };

    return HttpResponse.json({
      success: true,
      message: 'تم اعتماد المقترح بنجاح',
      data: enrichProposalStrategicGoals(mockRiskProposals[idx])
    });
  })
];