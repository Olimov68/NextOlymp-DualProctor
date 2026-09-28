import React, { useState } from 'react';
import { Database, Play, Copy, Check, ExternalLink, Code2, RefreshCw } from 'lucide-react';
import { apiClient } from '../../services/api';

interface Endpoint {
  id: string;
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  category: string;
  title: string;
  description: string;
  defaultParams?: string;
  defaultBody?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    id: 'auth_post',
    method: 'POST',
    path: '/auth.php',
    category: '1. Avtorizatsiya (Auth)',
    title: 'Tizimga kirish (Login) / Ro\'yxatdan o\'tish (Register)',
    description: 'MySQL users jadvalidan foydalanuvchini tekshiradi yoki yangi hisob ochadi va JWT token qaytaradi.',
    defaultBody: JSON.stringify({
      action: 'login',
      email: 'user@nextolymp.uz',
      password: 'password123'
    }, null, 2)
  },
  {
    id: 'olympiads_get',
    method: 'GET',
    path: '/olympiads.php',
    category: '2. Olimpiadalar (Olympiads)',
    title: 'Olimpiadalar va savollar ro\'yxatini olish',
    description: 'MySQL olympiads jadvalidan barcha musobaqalar va biriktirilgan savollarni qaytaradi.',
    defaultParams: '',
  },
  {
    id: 'olympiads_post',
    method: 'POST',
    path: '/olympiads.php',
    category: '2. Olimpiadalar (Olympiads)',
    title: 'Olimpiada yaratish yoki tahrirlash',
    description: 'Yangi olimpiada ma\'lumotlarini MySQL olympiads jadvaliga yozadi.',
    defaultBody: JSON.stringify({
      title: 'Matematika Respublika Olimpiadasi',
      category: 'math',
      duration_minutes: 60,
      price: 0
    }, null, 2)
  },
  {
    id: 'submissions_post',
    method: 'POST',
    path: '/submissions.php',
    category: '3. Natijalar va Rasch Modeli (Submissions)',
    title: 'Test topshirish va Rasch bali (theta) hisoblash',
    description: 'Javoblarni qabul qilib, Rasch modeli (theta) bo\'yicha baholaydi va submissions jadvaliga saqlaydi.',
    defaultBody: JSON.stringify({
      user_id: 1,
      olympiad_id: 1,
      score: 85,
      total_questions: 25,
      answers: { "1": "A", "2": "C", "3": "B" }
    }, null, 2)
  },
  {
    id: 'leaderboard_get',
    method: 'GET',
    path: '/leaderboard.php',
    category: '4. Jonli Reyting (Leaderboard)',
    title: 'Jonli reyting (Respublika, viloyat va maktablar kesimida)',
    description: 'MySQL foydalanuvchilarining to\'plagan ballari bo\'yicha respublika reytingini qaytaradi.',
    defaultParams: '',
  },
  {
    id: 'security_get',
    method: 'GET',
    path: '/security.php',
    category: '5. Kiberxavfsizlik (Security Logs)',
    title: 'Anti-Cheat va kiberxavfsizlik jurnali (Grafiklar)',
    description: 'Barcha qayd etilgan qoidabuzarliklar va statistikani qaytaradi.',
    defaultParams: '',
  },
  {
    id: 'security_post',
    method: 'POST',
    path: '/security.php',
    category: '5. Kiberxavfsizlik (Security Logs)',
    title: 'Qoidabuzarlik hodisasini qayd etish',
    description: 'Oynani almashtirish (tab_switch) yoki boshqa shubhali harakatni MySQL security_logs ga yozadi.',
    defaultBody: JSON.stringify({
      user_id: 1,
      event_type: 'tab_switch',
      details: 'Brauzer oynasidan chiqib boshqa ilovaga o\'tdi',
      severity: 'medium'
    }, null, 2)
  },
  {
    id: 'payments_get',
    method: 'GET',
    path: '/payments.php',
    category: '6. To\'lovlar (Payments)',
    title: 'To\'lovlar ro\'yxati va tranzaksiyalar',
    description: 'Click, Payme va Uzum orqali amalga oshirilgan to\'lovlar ro\'yxatini qaytaradi.',
    defaultParams: '',
  },
  {
    id: 'notifications_get',
    method: 'GET',
    path: '/notifications.php',
    category: '7. Xabarnomalar (Notifications)',
    title: 'Tizim xabarnomalarini olish',
    description: 'Foydalanuvchilarga chiqariladigan tizim xabarnomalari ro\'yxati.',
    defaultParams: '',
  }
];

export const SwaggerPage: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS[0]);
  const [queryParams, setQueryParams] = useState<string>('');
  const [requestBody, setRequestBody] = useState<string>(ENDPOINTS[0].defaultBody || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const handleSelect = (ep: Endpoint) => {
    setSelectedEndpoint(ep);
    setQueryParams(ep.defaultParams || '');
    setRequestBody(ep.defaultBody || '');
    setResponseStatus(null);
    setResponseData(null);
  };

  const handleExecute = async () => {
    setLoading(true);
    setResponseStatus(null);
    setResponseData(null);

    try {
      const url = queryParams ? `${selectedEndpoint.path}?${queryParams}` : selectedEndpoint.path;
      let data: any;

      if (selectedEndpoint.method === 'GET') {
        data = await apiClient.get(url);
      } else if (selectedEndpoint.method === 'POST') {
        const bodyObj = requestBody.trim() ? JSON.parse(requestBody) : {};
        data = await apiClient.post(url, bodyObj);
      } else {
        data = await apiClient.delete(url);
      }

      setResponseStatus(200);
      setResponseData(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponseStatus(400);
      setResponseData(JSON.stringify({ status: 'error', message: err.message || 'Xatolik yuz berdi' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (responseData) {
      navigator.clipboard.writeText(responseData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getMethodBadge = (m: string) => {
    switch (m) {
      case 'GET':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'POST':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#070D1E] text-slate-100 flex flex-col font-sans">
      
      <header className="border-b border-slate-800/80 bg-[#0B1329] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">NextOlymp Unified API Explorer</h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                MySQL Live
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                7 Ta Modul
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Barcha so'rovlar to'g'ridan-to'g'ri UzCloud MySQL serveriga yuboriladi va saqlanadi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/api/swagger.json"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700/60 transition-all"
          >
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            <span>swagger.json</span>
          </a>
          <a
            href="/api/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <span>Klassik Swagger UI</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 px-1">
            Yagona Backend API Modullari ({ENDPOINTS.length})
          </div>

          <div className="space-y-2">
            {ENDPOINTS.map((ep) => {
              const isSelected = selectedEndpoint.id === ep.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelect(ep)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500/50 shadow-md shadow-indigo-950/40'
                      : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${getMethodBadge(
                        ep.method
                      )}`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-xs font-mono text-slate-300 truncate">/api{ep.path}</span>
                  </div>
                  <div className="text-xs text-slate-200 font-medium">{ep.title}</div>
                  <div className="text-[11px] text-slate-400 truncate">{ep.category}</div>
                </button>
              );
            })}
          </div>
        </div>

        
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold border ${getMethodBadge(
                    selectedEndpoint.method
                  )}`}
                >
                  {selectedEndpoint.method}
                </span>
                <span className="text-sm font-mono text-white font-semibold">/api{selectedEndpoint.path}</span>
              </div>
              <button
                onClick={handleExecute}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{loading ? "Yuborilmoqda..." : "So'rovni bajarish (Execute)"}</span>
              </button>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">{selectedEndpoint.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedEndpoint.description}</p>
            </div>

            
            {selectedEndpoint.method !== 'GET' && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-300">Request Body (JSON):</div>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  rows={8}
                  className="w-full bg-[#050B1E] border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            )}
          </div>

          
          <div className="flex-1 min-h-[320px] rounded-2xl bg-slate-900/60 border border-slate-800 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-300">Server Javobi (Response):</span>
                {responseStatus !== null && (
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                      responseStatus >= 200 && responseStatus < 300
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {responseStatus} {responseStatus === 200 ? 'OK' : 'Error'}
                  </span>
                )}
              </div>

              {responseData && (
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/50 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Nusxa olindi' : 'Nusxalash'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 w-full bg-[#050B1E] rounded-xl border border-slate-800/80 p-4 font-mono text-xs overflow-auto max-h-[480px]">
              {responseData ? (
                <pre className="text-slate-200 whitespace-pre-wrap">{responseData}</pre>
              ) : (
                <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-slate-500 text-xs">
                  <Play className="w-6 h-6 mb-2 stroke-1" />
                  <span>"So'rovni bajarish" tugmasini bosing — serverdan MySQL ma'lumotlari bu yerda chiqadi</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
