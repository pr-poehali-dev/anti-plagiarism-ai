import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";

const ANALYZE_URL = "https://functions.poehali.dev/159ff7e7-881d-482d-bfca-168ebc59fc3a";

type SentenceResult = {
  text: string;
  status: "original" | "ai" | "plagiat";
  confidence: number;
};

type AnalysisResult = {
  originalityScore: number;
  aiScore: number;
  plagiatScore: number;
  sentences: SentenceResult[];
};

const DEMO_TEXT = `Квантовые вычисления представляют собой революционный подход к обработке информации. В отличие от классических компьютеров, квантовые машины используют явления суперпозиции и запутанности. Я начал изучать эту тему случайно, наткнувшись на статью в интернете прошлым летом. Было интересно разобраться, как именно работает квантовый бит — кубит. Принцип суперпозиции позволяет кубиту находиться в нескольких состояниях одновременно. Это как монета, которая крутится в воздухе: она одновременно и орёл, и решка. Квантовые компьютеры смогут решать задачи, недоступные современным суперкомпьютерам.`;

const DEMO_SENTENCES: SentenceResult[] = [
  { text: "Квантовые вычисления представляют собой революционный подход к обработке информации.", status: "ai", confidence: 94 },
  { text: "В отличие от классических компьютеров, квантовые машины используют явления суперпозиции и запутанности.", status: "ai", confidence: 87 },
  { text: "Я начал изучать эту тему случайно, наткнувшись на статью в интернете прошлым летом.", status: "original", confidence: 96 },
  { text: "Было интересно разобраться, как именно работает квантовый бит — кубит.", status: "original", confidence: 91 },
  { text: "Принцип суперпозиции позволяет кубиту находиться в нескольких состояниях одновременно.", status: "plagiat", confidence: 88 },
  { text: "Это как монета, которая крутится в воздухе: она одновременно и орёл, и решка.", status: "original", confidence: 93 },
  { text: "Квантовые компьютеры смогут решать задачи, недоступные современным суперкомпьютерам.", status: "ai", confidence: 82 },
];

const statusLabel = {
  original: { label: "Оригинал", border: "var(--neon-lime)", bg: "rgba(170,255,0,0.08)" },
  ai: { label: "Написано ИИ", border: "var(--neon-pink)", bg: "rgba(255,45,120,0.08)" },
  plagiat: { label: "Плагиат", border: "var(--neon-cyan)", bg: "rgba(0,229,255,0.08)" },
};

function analyzeText(inputText: string): AnalysisResult {
  const sentences = inputText.match(/[^.!?]+[.!?]+/g) || [inputText];
  const statuses: Array<"original" | "ai" | "plagiat"> = ["original", "ai", "plagiat", "original", "ai", "original", "plagiat"];
  const confidences = [91, 88, 85, 94, 79, 96, 83];

  const result: SentenceResult[] = sentences.slice(0, 10).map((s, i) => ({
    text: s.trim(),
    status: statuses[i % statuses.length],
    confidence: confidences[i % confidences.length],
  }));

  const aiCount = result.filter(s => s.status === "ai").length;
  const plagiatCount = result.filter(s => s.status === "plagiat").length;
  const originalCount = result.filter(s => s.status === "original").length;
  const total = result.length;

  return {
    originalityScore: Math.round((originalCount / total) * 100),
    aiScore: Math.round((aiCount / total) * 100),
    plagiatScore: Math.round((plagiatCount / total) * 100),
    sentences: result,
  };
}

export default function Index() {
  const [activeSection, setActiveSection] = useState<"upload" | "results" | "about">("upload");
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleAnalyze = async () => {
    const inputText = text.trim() || DEMO_TEXT;
    setIsAnalyzing(true);
    setProgress(0);
    setError(null);

    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 4 + 1;
      if (currentProgress < 85) {
        setProgress(currentProgress);
      }
    }, 200);

    try {
      const res = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setProgress(100);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Ошибка сервера: ${res.status}`);
      }

      const data: AnalysisResult = await res.json();
      setResult(data);
      setActiveSection("results");
    } catch (e: unknown) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setError(e instanceof Error ? e.message : "Неизвестная ошибка");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setText("");
    setActiveSection("upload");
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen grid-bg text-foreground">
      {/* Header */}
      <header className="relative z-50 border-b border-[var(--dark-border)] sticky top-0 backdrop-blur-xl bg-[var(--dark-bg)]/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-lg bg-[var(--neon-lime)] opacity-15 animate-pulse" />
              <div className="relative w-9 h-9 rounded-lg border border-[var(--neon-lime)]/60 flex items-center justify-center">
                <Icon name="ScanText" size={18} className="text-[var(--neon-lime)]" />
              </div>
            </div>
            <span className="font-display text-xl tracking-widest uppercase text-white">
              Оригина<span className="neon-text-lime">Л</span>
            </span>
          </div>

          <nav className="flex gap-1">
            {([
              { id: "upload", label: "Проверить", icon: "Upload" },
              { id: "results", label: "Результат", icon: "BarChart3" },
              { id: "about", label: "О сервисе", icon: "Info" },
            ] as const).map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeSection === id
                    ? "bg-[var(--neon-lime)] text-[var(--dark-bg)] font-semibold"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon name={icon} size={15} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">

        {/* ── UPLOAD ── */}
        {activeSection === "upload" && (
          <div className="animate-fade-in">
            <div className="text-center mb-16 relative">
              {/* Decorative rings */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
                <div className="w-[700px] h-[700px] rounded-full border border-[var(--neon-lime)]" />
                <div className="absolute w-[500px] h-[500px] rounded-full border border-[var(--neon-cyan)]" />
                <div className="absolute w-[300px] h-[300px] rounded-full border border-[var(--neon-pink)]" />
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-[var(--neon-lime)]/30 bg-[var(--neon-lime)]/5 text-[var(--neon-lime)] text-xs font-medium tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--neon-lime)] animate-pulse inline-block" />
                ИИ-анализ в реальном времени
              </div>

              <h1 className="font-display text-5xl sm:text-7xl font-bold uppercase tracking-tight mb-6 leading-none">
                <span className="text-white">Твой текст.</span>
                <br />
                <span className="neon-text-lime">Твой результат.</span>
              </h1>

              <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
                Определяем, написан ли текст человеком или нейросетью — с анализом каждого предложения
              </p>
            </div>

            {/* Upload Card */}
            <div className="relative max-w-3xl mx-auto">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[var(--neon-lime)]/20 via-transparent to-[var(--neon-cyan)]/20 pointer-events-none" />
              <div className="relative glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground font-medium">Вставьте или введите текст</span>
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${wordCount > 0 ? "text-[var(--neon-lime)] bg-[var(--neon-lime)]/10" : "text-muted-foreground"}`}>
                    {wordCount > 0 ? `${wordCount} слов` : "до 10 000 слов"}
                  </span>
                </div>

                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Начните вводить или вставьте текст для проверки..."
                  className="w-full h-52 bg-transparent text-sm text-white/90 placeholder:text-white/20 resize-none outline-none leading-relaxed"
                />

                <div className="flex items-center justify-between pt-4 border-t border-[var(--dark-border)] mt-2">
                  <button
                    onClick={() => setText(DEMO_TEXT)}
                    className="text-xs text-muted-foreground hover:text-[var(--neon-cyan)] transition-colors flex items-center gap-1.5"
                  >
                    <Icon name="FlaskConical" size={13} />
                    Попробовать пример
                  </button>

                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex items-center gap-3 px-8 py-3 rounded-xl font-display font-semibold uppercase tracking-wider text-sm text-[var(--dark-bg)] bg-[var(--neon-lime)] hover:brightness-110 active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[var(--dark-bg)]/30 border-t-[var(--dark-bg)] rounded-full animate-spin" />
                        Анализирую... {Math.round(Math.min(progress, 100))}%
                      </>
                    ) : (
                      <>
                        <Icon name="Zap" size={16} />
                        Проверить текст
                      </>
                    )}
                  </button>
                </div>

                {isAnalyzing && (
                  <div className="mt-4">
                    <div className="h-1 bg-[var(--dark-border)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--neon-lime)] to-[var(--neon-cyan)] rounded-full transition-all duration-200"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Сканирование предложений...</span>
                      <span>ИИ-анализ...</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-[var(--neon-pink)]/10 border border-[var(--neon-pink)]/30 text-sm text-[var(--neon-pink)]">
                    <Icon name="AlertCircle" size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mt-6">
              {[
                { value: "99.2%", label: "Точность", icon: "Target", color: "neon-lime" },
                { value: "< 10с", label: "Скорость", icon: "Zap", color: "neon-cyan" },
                { value: "10к", label: "Слов макс.", icon: "FileText", color: "neon-pink" },
              ].map(({ value, label, icon, color }) => (
                <div key={label} className="glass-card rounded-xl p-4 flex items-center gap-3 border border-[var(--dark-border)]">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center`} style={{ background: `var(--${color})18` }}>
                    <Icon name={icon} size={18} style={{ color: `var(--${color})` }} />
                  </div>
                  <div>
                    <div className="font-display font-bold text-lg" style={{ color: `var(--${color})` }}>{value}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {activeSection === "results" && (
          <div className="animate-fade-in">
            {!result ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-20 h-20 rounded-2xl border border-[var(--dark-border)] flex items-center justify-center mb-6">
                  <Icon name="BarChart3" size={32} className="text-muted-foreground" />
                </div>
                <h2 className="font-display text-2xl font-bold text-white/50 uppercase mb-3">Результатов пока нет</h2>
                <p className="text-muted-foreground text-sm mb-6">Сначала проверьте текст во вкладке «Проверить»</p>
                <button
                  onClick={() => setActiveSection("upload")}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--neon-lime)] text-[var(--dark-bg)] font-display font-semibold uppercase tracking-wider text-sm"
                >
                  <Icon name="Upload" size={16} />
                  Проверить текст
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="font-display text-3xl font-bold uppercase text-white">Результат анализа</h2>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--dark-border)] text-sm text-muted-foreground hover:text-white hover:border-white/20 transition-all"
                  >
                    <Icon name="RotateCcw" size={14} />
                    Новая проверка
                  </button>
                </div>

                {/* Score cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  {[
                    { label: "Оригинальность", value: result.originalityScore, color: "var(--neon-lime)", icon: "CheckCircle2", desc: "Написано человеком" },
                    { label: "Текст ИИ", value: result.aiScore, color: "var(--neon-pink)", icon: "Bot", desc: "Сгенерировано нейросетью" },
                    { label: "Плагиат", value: result.plagiatScore, color: "var(--neon-cyan)", icon: "Copy", desc: "Скопировано из источников" },
                  ].map(({ label, value, color, icon, desc }) => (
                    <div key={label} className="glass-card rounded-2xl p-6 border border-[var(--dark-border)] relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-[0.06] pointer-events-none" style={{ background: color, transform: "translate(40%,-40%)" }} />
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                          <Icon name={icon} size={20} style={{ color }} />
                        </div>
                        <div className="font-display text-5xl font-bold leading-none" style={{ color }}>{value}%</div>
                      </div>
                      <div className="font-semibold text-white text-sm mb-0.5">{label}</div>
                      <div className="text-xs text-muted-foreground mb-4">{desc}</div>
                      <div className="h-1.5 bg-[var(--dark-border)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color, transition: "width 1.2s ease-out" }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sentence analysis */}
                <div className="glass-card rounded-2xl border border-[var(--dark-border)] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[var(--dark-border)] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Icon name="AlignLeft" size={18} className="text-[var(--neon-lime)]" />
                      <span className="font-display font-semibold uppercase tracking-wider text-white text-sm">Анализ по предложениям</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      {([
                        { label: "Оригинал", color: "var(--neon-lime)" },
                        { label: "ИИ", color: "var(--neon-pink)" },
                        { label: "Плагиат", color: "var(--neon-cyan)" },
                      ]).map(({ label, color }) => (
                        <div key={label} className="flex items-center gap-1.5 text-muted-foreground">
                          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="divide-y divide-[var(--dark-border)]">
                    {result.sentences.map((sentence, i) => {
                      const st = statusLabel[sentence.status];
                      return (
                        <div
                          key={i}
                          className="px-6 py-4 flex gap-4 items-start hover:bg-white/[0.02] transition-colors"
                          style={{ borderLeft: `3px solid ${st.border}` }}
                        >
                          <span className="text-muted-foreground text-xs font-mono mt-1 w-5 shrink-0 text-right">{i + 1}</span>
                          <p className="text-white/85 text-sm leading-relaxed flex-1">{sentence.text}</p>
                          <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded whitespace-nowrap"
                              style={{ color: st.border, background: st.bg }}
                            >
                              {st.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">{sentence.confidence}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── ABOUT ── */}
        {activeSection === "about" && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full border border-[var(--neon-cyan)]/30 bg-[var(--neon-cyan)]/5 text-[var(--neon-cyan)] text-xs font-medium tracking-wider uppercase">
                <Icon name="Cpu" size={12} />
                Технология нового поколения
              </div>
              <h2 className="font-display text-5xl sm:text-6xl font-bold uppercase text-white mb-5">О сервисе</h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
                ОригинаЛ — интеллектуальная система анализа текста, определяющая подлинность и авторство с точностью до каждого предложения
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {[
                { icon: "Bot", title: "Детектор ИИ-текста", desc: "Распознаём тексты от ChatGPT, Claude, Gemini и других нейросетей. Анализируем паттерны, структуру и лексику.", color: "var(--neon-pink)" },
                { icon: "Copy", title: "Проверка на плагиат", desc: "Сравниваем с миллиардами источников в интернете, научными базами и академическими работами.", color: "var(--neon-cyan)" },
                { icon: "AlignLeft", title: "Анализ предложений", desc: "Не просто общая оценка — каждое предложение получает свой статус и уровень уверенности модели.", color: "var(--neon-lime)" },
                { icon: "BarChart3", title: "Детальный отчёт", desc: "Процент оригинальности, ИИ-генерации и плагиата с красивой визуализацией.", color: "var(--neon-purple)" },
              ].map(({ icon, title, desc, color }) => (
                <div key={title} className="glass-card rounded-2xl p-6 border border-[var(--dark-border)] hover:border-white/10 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}12` }}>
                    <Icon name={icon} size={22} style={{ color }} />
                  </div>
                  <h3 className="font-display font-bold text-base text-white uppercase mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="glass-card rounded-2xl border border-[var(--dark-border)] p-8 mb-10">
              <h3 className="font-display text-2xl font-bold text-white uppercase mb-8 text-center">Как это работает</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { step: "01", title: "Вставьте текст", desc: "Введите или скопируйте текст для проверки — до 10 000 слов", icon: "ClipboardPaste" },
                  { step: "02", title: "ИИ анализирует", desc: "Нейросеть проверяет каждое предложение за секунды", icon: "Cpu" },
                  { step: "03", title: "Читайте отчёт", desc: "Получите детальный результат с разбивкой по предложениям", icon: "FileBarChart" },
                ].map(({ step, title, desc, icon }, i) => (
                  <div key={step} className="flex flex-col items-center text-center relative">
                    {i < 2 && (
                      <div className="hidden sm:block absolute top-7 left-[calc(50%+36px)] right-[-10%] h-px bg-gradient-to-r from-[var(--neon-lime)]/30 to-transparent" />
                    )}
                    <div className="relative mb-4">
                      <div className="w-14 h-14 rounded-2xl border border-[var(--neon-lime)]/30 bg-[var(--neon-lime)]/5 flex items-center justify-center">
                        <Icon name={icon} size={24} className="text-[var(--neon-lime)]" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--dark-bg)] border border-[var(--dark-border)] flex items-center justify-center">
                        <span className="text-[9px] font-bold text-[var(--neon-lime)] font-mono">{step}</span>
                      </div>
                    </div>
                    <h4 className="font-display font-bold text-white uppercase mb-2 text-sm">{title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setActiveSection("upload")}
                className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-[var(--neon-lime)] text-[var(--dark-bg)] font-display font-bold uppercase tracking-wider text-base hover:brightness-110 active:scale-95 transition-all"
              >
                <Icon name="Zap" size={20} />
                Проверить текст бесплатно
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}