import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Line,
} from "recharts";

type DistributionPoint = {
  pulls: number;
  frequency: number;
};

type SimulationResult = {
  averagePulls: number;
  averageCost: number;
  minPulls: number;
  maxPulls: number;
  distribution: DistributionPoint[];
};

// Aumenta este valor para una distribución más suave.
// 100_000 sigue siendo manejable en la mayoría de equipos modernos,
// pero si notas bloqueos puedes bajarlo a 50_000.
const ITERATIONS = 100_000;
const OROBERYL_PER_PULL = 500;

function simulateIteration(desiredCopies: number): number {
  let pulls = 0;
  let copies = 0;
  let pity_counter = 0;
  let spark_counter = 0;
  let current_spark_limit = 120;

  while (copies < desiredCopies) {
    pulls += 1;
    pity_counter += 1;
    spark_counter += 1;

    if (spark_counter === current_spark_limit) {
      copies += 1;
      pity_counter = 0;
      spark_counter = 0;
      current_spark_limit = 240;
      continue;
    }

    let probability: number;

    if (pity_counter <= 65) {
      probability = 0.008;
    } else {
      probability = 0.008 + 0.05 * (pity_counter - 65);
      if (pity_counter === 80) {
        probability = 1.0;
      } else if (probability > 1.0) {
        probability = 1.0;
      }
    }

    const rngSixStar = Math.random();
    if (rngSixStar <= probability) {
      pity_counter = 0;

      const rngFiftyFifty = Math.random();
      if (rngFiftyFifty <= 0.5) {
        copies += 1;
        spark_counter = 0;
        current_spark_limit = 240;
      } else {
      }
    }
  }

  return pulls;
}

function buildDistribution(pullsArray: number[]): DistributionPoint[] {
  const freqMap: Record<number, number> = {};
  let min = Infinity;
  let max = -Infinity;

  for (const pulls of pullsArray) {
    freqMap[pulls] = (freqMap[pulls] ?? 0) + 1;
    if (pulls < min) min = pulls;
    if (pulls > max) max = pulls;
  }

  const distribution: DistributionPoint[] = [];
  for (let p = min; p <= max; p++) {
    const f = freqMap[p] ?? 0;
    if (f <= 0) continue;
    distribution.push({ pulls: p, frequency: f });
  }

  return distribution;
}

function runSimulation(desiredCopies: number): SimulationResult {
  const pullsArray: number[] = [];

  for (let i = 0; i < ITERATIONS; i++) {
    const pulls = simulateIteration(desiredCopies);
    pullsArray.push(pulls);
  }

  const totalPulls = pullsArray.reduce((acc, v) => acc + v, 0);
  const averagePulls = totalPulls / pullsArray.length;
  const averageCost = averagePulls * OROBERYL_PER_PULL;
  const minPulls = Math.min(...pullsArray);
  const maxPulls = Math.max(...pullsArray);
  const distribution = buildDistribution(pullsArray);

  return {
    averagePulls,
    averageCost,
    minPulls,
    maxPulls,
    distribution,
  };
}

export const App: React.FC = () => {
  const [desiredCopies, setDesiredCopies] = useState<number>(1);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (Number.isNaN(value)) return;
    const clamped = Math.min(6, Math.max(1, value));
    setDesiredCopies(clamped);
  };

  const handleSimulate = () => {
    setError(null);

    if (desiredCopies < 1 || desiredCopies > 6) {
      setError("Las copias deseadas deben estar entre 1 y 6.");
      return;
    }

    setIsSimulating(true);

    setTimeout(() => {
      const simulationResult = runSimulation(desiredCopies);
      setResult(simulationResult);
      setIsSimulating(false);
    }, 10);
  };

  const accent = "#4ade80"; // verde lima suave

  return (
    <div className="min-h-screen bg-[#050608] text-gray-100">
      <div className="max-w-5xl mx-auto px-5 py-10 md:py-14 space-y-10">
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Simulador de gacha
          </h1>
          <p className="text-sm md:text-base text-gray-400 max-w-2xl">
            Calcula, mediante simulación Monte Carlo, la distribución de tiradas
            necesarias para obtener el personaje promocional de
            <span className="text-gray-200 font-medium">
              {" "}
              Arknights: Endfield
            </span>
            , incluyendo media, coste estimado y variabilidad.
          </p>
        </header>

        <main className="space-y-8">
          {/* Controles superiores */}
          <section className="flex flex-col md:flex-row md:items-end gap-6">
            <div className="flex-1 space-y-3">
              <label className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                Copias deseadas (1 - 6)
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="copies"
                  type="number"
                  min={1}
                  max={6}
                  value={desiredCopies}
                  onChange={handleInputChange}
                  className="w-24 bg-[#050608] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] transition"
                  style={{ ["--accent-color" as any]: accent }}
                />
                <span className="text-xs text-gray-500">
                  Entre 1 y 6 copias del personaje promocional.
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                {ITERATIONS.toLocaleString("es-ES")} iteraciones ·{" "}
                {OROBERYL_PER_PULL} Oroberyl por tirada.
              </p>
            </div>

            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={handleSimulate}
                disabled={isSimulating}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-medium tracking-wide border border-transparent transition-colors"
                style={{
                  backgroundColor: isSimulating ? "#16a34a33" : accent,
                  color: "#020617",
                }}
              >
                {isSimulating && (
                  <span className="mr-2 h-4 w-4 border-2 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin" />
                )}
                {isSimulating
                  ? "Simulando…"
                  : `Simular (${ITERATIONS.toLocaleString("es-ES")} iteraciones)`}
              </button>
            </div>
          </section>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 rounded-md px-3 py-1.5 inline-block">
              {error}
            </p>
          )}

          {/* Resultados resumidos */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              Resultados
            </h2>

            {!result && !isSimulating && (
              <p className="text-sm text-gray-400">
                Lanza la simulación para ver la media de tiradas, el coste
                aproximado en Oroberyl y la distribución completa de
                resultados.
              </p>
            )}

            {isSimulating && (
              <p className="text-sm text-gray-400 animate-pulse">
                Ejecutando {ITERATIONS.toLocaleString("es-ES")} iteraciones…
                Esto puede tardar unos segundos.
              </p>
            )}

            {result && !isSimulating && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl bg-[#0b0e12] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">
                    Media de tiradas
                  </div>
                  <div className="mt-1 text-xl font-semibold text-gray-100">
                    {result.averagePulls.toFixed(1)}
                  </div>
                </div>

                <div className="rounded-xl bg-[#0b0e12] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">
                    Coste medio
                  </div>
                  <div className="mt-1 text-xl font-semibold text-gray-100">
                    {result.averageCost.toLocaleString("es-ES", {
                      maximumFractionDigits: 0,
                    })}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Oroberyl
                  </div>
                </div>

                <div className="rounded-xl bg-[#0b0e12] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">
                    Mejor caso
                  </div>
                  <div className="mt-1 text-xl font-semibold text-gray-100">
                    {result.minPulls.toLocaleString("es-ES")}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    tiradas mínimas
                  </div>
                </div>

                <div className="rounded-xl bg-[#0b0e12] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">
                    Peor caso
                  </div>
                  <div className="mt-1 text-xl font-semibold text-gray-100">
                    {result.maxPulls.toLocaleString("es-ES")}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    tiradas máximas
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Gráfica de distribución */}
          {result && !isSimulating && result.distribution.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                  Distribución de tiradas
                </h2>
                <p className="text-[11px] text-gray-500">
                  Eje X: tiradas · Eje Y: frecuencia (sobre{" "}
                  {ITERATIONS.toLocaleString("es-ES")} iteraciones)
                </p>
              </div>

              <div className="h-72 w-full rounded-2xl bg-[#050608] border border-gray-800/80 px-3 py-3 md:px-4 md:py-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.distribution}>
                    <defs>
                      <linearGradient id="distFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="#111827"
                      strokeOpacity={0.7}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="pulls"
                      stroke="#6b7280"
                      tickLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      tickLine={false}
                      tickMargin={8}
                      tick={{ fontSize: 11 }}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#020617",
                        borderRadius: 8,
                        border: "1px solid #1f2937",
                        fontSize: 11,
                      }}
                      labelStyle={{ color: "#e5e7eb", marginBottom: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke="#e5e7eb"
                      strokeWidth={1.5}
                      dot={false}
                      name="ECDF (acumulado)"
                    />
                    <Area
                      type="monotone"
                      dataKey="frequency"
                      stroke={accent}
                      strokeWidth={1}
                      fill="url(#distFill)"
                      name="Frecuencia"
                    />
                    <ReferenceLine
                      x={result.averagePulls}
                      stroke={accent}
                      strokeDasharray="3 3"
                      label={{
                        value: `Media (${result.averagePulls.toFixed(1)})`,
                        position: "top",
                        fill: "#9ca3af",
                        fontSize: 11,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          <footer className="pt-4 border-t border-gray-900 text-[11px] text-gray-500">
            Simulación Monte Carlo basada en las reglas de pity y spark del
            banner. Los resultados son aproximados y varían entre ejecuciones.
          </footer>
        </main>
      </div>
    </div>
  );
};

