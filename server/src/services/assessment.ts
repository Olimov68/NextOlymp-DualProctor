export type ExamKind = 'olympiad' | 'level_test' | 'national_certificate';
export type AttemptMode = 'competitive' | 'practice';

/** Fixed, externally calibrated dichotomous items. No automatic/guessed calibration. */
export interface RaschConfig {
  version: string;
  source: string;
  model: '1PL';
  estimator: 'EAP';
  priorMean: number;
  priorSd: number;
  itemDifficulties: Record<string, number>;
}
export interface RaschResult {
  status: 'pending_calibration' | 'estimated';
  theta: number | null;
  posteriorSd: number | null;
  calibrationVersion: string | null;
  method: 'Rasch-1PL-EAP';
  officialEquivalent: false;
}
export function examKind(exam: { kind?: ExamKind }): ExamKind {
  // Legacy exams are not silently reclassified from their names/IDs.
  return exam.kind ?? 'olympiad';
}
export function practiceAvailable(exam: { kind?: ExamKind; practiceEnabled?: boolean; endTime: string; isAlwaysOpen?: boolean }): boolean {
  return exam.practiceEnabled === true && (examKind(exam) === 'level_test' ||
    (!exam.isAlwaysOpen && Number.isFinite(Date.parse(exam.endTime)) && Date.now() >= Date.parse(exam.endTime)));
}
export function validateRaschConfig(value: unknown, questionIds: string[]): string | undefined {
  if (value === undefined || value === null) return;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Rasch konfiguratsiyasi noto‘g‘ri';
  const c = value as Partial<RaschConfig>;
  if (c.model !== '1PL' || c.estimator !== 'EAP') return 'Faqat kalibrlangan dixotomik 1PL / EAP qo‘llanadi';
  if (typeof c.version !== 'string' || !c.version.trim() || c.version.length > 100 ||
      typeof c.source !== 'string' || !c.source.trim() || c.source.length > 1000) return 'Kalibrlash versiyasi va manbasi majburiy';
  if (!Number.isFinite(c.priorMean) || Math.abs(c.priorMean!) > 3 || !Number.isFinite(c.priorSd) ||
      c.priorSd! < 0.2 || c.priorSd! > 2) return 'EAP prior parametrlari noto‘g‘ri';
  if (!c.itemDifficulties || typeof c.itemDifficulties !== 'object' || Array.isArray(c.itemDifficulties) ||
      !questionIds.length || Object.keys(c.itemDifficulties).length !== questionIds.length ||
      questionIds.some(id => !Object.prototype.hasOwnProperty.call(c.itemDifficulties, id) ||
        !Number.isFinite(c.itemDifficulties![id]) || Math.abs(c.itemDifficulties![id]) > 8)) {
    return 'Har bir savol uchun aynan o‘z IDsi bilan kalibrlangan b parametri (-8…8) kerak';
  }
}

/** Numerical posterior integration, not logit(raw percentage). No official scale is fabricated.
 * P(X=1|theta,b)=logistic(theta-b). Bounds cover >=8 prior SDs for allowed priors.
 * Omitted answers count as incorrect under this explicitly labelled platform practice model.
 */
export function estimateRasch(responses: Array<{ questionId: string; isCorrect: boolean }>, config?: RaschConfig | null): RaschResult {
  const pending: RaschResult = { status: 'pending_calibration', theta: null, posteriorSd: null,
    calibrationVersion: null, method: 'Rasch-1PL-EAP', officialEquivalent: false };
  if (!config || validateRaschConfig(config, responses.map(r => r.questionId))) return pending;
  const grid: Array<{ theta: number; logWeight: number }> = [];
  for (let i = 0; i <= 800; i++) {
    const theta = -20 + i * 0.05;
    let logWeight = -0.5 * ((theta - config.priorMean) / config.priorSd) ** 2;
    for (const r of responses) {
      const z = theta - config.itemDifficulties[r.questionId];
      logWeight += r.isCorrect ? -Math.log1p(Math.exp(-z)) : -Math.log1p(Math.exp(z));
    }
    grid.push({ theta, logWeight });
  }
  const peak = Math.max(...grid.map(g => g.logWeight));
  const weights = grid.map(g => Math.exp(g.logWeight - peak));
  const mass = weights.reduce((a, b) => a + b, 0);
  const theta = grid.reduce((sum, g, i) => sum + g.theta * weights[i], 0) / mass;
  const variance = grid.reduce((sum, g, i) => sum + (g.theta - theta) ** 2 * weights[i], 0) / mass;
  return { ...pending, status: 'estimated', theta, posteriorSd: Math.sqrt(variance), calibrationVersion: config.version };
}
