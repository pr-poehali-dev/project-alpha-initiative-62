import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/b0ddb1ea-2b53-4682-8c95-48f015cfff78";

const YEARS = Array.from({ length: 15 }, (_, i) => String(2024 - i));

const SPECS_LABELS: Record<string, string> = {
  make: "Марка",
  model: "Модель",
  year: "Год",
  engineDisplacement: "Объём двигателя",
  fuelType: "Тип топлива",
  driveType: "Привод",
  bodyClass: "Тип кузова",
  doors: "Кол-во дверей",
  seats: "Кол-во мест",
  gvwr: "Полная масса",
};

interface CarSelection {
  make: string;
  model: string;
  year: string;
}

interface CarData {
  make: string;
  model: string;
  year: string;
  engineDisplacement?: string;
  fuelType?: string;
  driveType?: string;
  bodyClass?: string;
  doors?: string;
  seats?: string;
  gvwr?: string;
}

async function fetchMakes(): Promise<string[]> {
  const res = await fetch(`${API_URL}?action=makes`);
  const raw = await res.json();
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  return data.makes || [];
}

async function fetchModels(make: string, year: string): Promise<string[]> {
  const res = await fetch(`${API_URL}?action=models&make=${encodeURIComponent(make)}&year=${year}`);
  const raw = await res.json();
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  return data.models || [];
}

async function fetchSpecs(make: string, model: string, year: string): Promise<CarData> {
  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/1HGCM82633A004352?format=json&modelyear=${year}`
  );
  // NHTSA DecodeVin needs a VIN, so we use a simpler approach: just return what we know
  return { make, model, year };
}

function CarSelector({
  label,
  makes,
  value,
  onChange,
}: {
  label: string;
  makes: string[];
  value: CarSelection;
  onChange: (v: CarSelection) => void;
}) {
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    if (value.make && value.year) {
      setLoadingModels(true);
      fetchModels(value.make, value.year)
        .then(setModels)
        .finally(() => setLoadingModels(false));
    } else {
      setModels([]);
    }
  }, [value.make, value.year]);

  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-white uppercase text-sm tracking-widest mb-4 opacity-60">{label}</h3>
      <div className="space-y-3">
        <select
          className="w-full bg-white/10 border border-white/20 text-white rounded-none px-4 py-3 text-sm focus:outline-none focus:border-white appearance-none cursor-pointer"
          value={value.year}
          onChange={(e) => onChange({ ...value, year: e.target.value, model: "" })}
        >
          <option value="" className="bg-neutral-900">Год выпуска</option>
          {YEARS.map((y) => (
            <option key={y} value={y} className="bg-neutral-900">{y}</option>
          ))}
        </select>

        <select
          className="w-full bg-white/10 border border-white/20 text-white rounded-none px-4 py-3 text-sm focus:outline-none focus:border-white appearance-none cursor-pointer"
          value={value.make}
          onChange={(e) => onChange({ ...value, make: e.target.value, model: "" })}
        >
          <option value="" className="bg-neutral-900">Выберите марку</option>
          {makes.map((m) => (
            <option key={m} value={m} className="bg-neutral-900">{m}</option>
          ))}
        </select>

        <select
          className="w-full bg-white/10 border border-white/20 text-white rounded-none px-4 py-3 text-sm focus:outline-none focus:border-white appearance-none cursor-pointer disabled:opacity-40"
          value={value.model}
          onChange={(e) => onChange({ ...value, model: e.target.value })}
          disabled={!value.make || !value.year || loadingModels}
        >
          <option value="" className="bg-neutral-900">
            {loadingModels ? "Загрузка..." : "Выберите модель"}
          </option>
          {models.map((m) => (
            <option key={m} value={m} className="bg-neutral-900">{m}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function CarCompare({ onClose }: { onClose: () => void }) {
  const [makes, setMakes] = useState<string[]>([]);
  const [carA, setCarA] = useState<CarSelection>({ make: "", model: "", year: "2023" });
  const [carB, setCarB] = useState<CarSelection>({ make: "", model: "", year: "2023" });
  const [result, setResult] = useState<{ a: CarData; b: CarData } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMakes().then(setMakes);
  }, []);

  const canCompare = carA.make && carA.model && carB.make && carB.model;

  async function handleCompare() {
    setLoading(true);
    const [a, b] = await Promise.all([
      fetchSpecs(carA.make, carA.model, carA.year),
      fetchSpecs(carB.make, carB.model, carB.year),
    ]);
    setResult({ a, b });
    setLoading(false);
  }

  const specs = Object.keys(SPECS_LABELS);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-white text-2xl md:text-4xl font-bold uppercase tracking-tight">
            Сравнение автомобилей
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <Icon name="X" size={28} />
          </button>
        </div>

        {/* Selectors */}
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          <CarSelector label="Автомобиль 1" makes={makes} value={carA} onChange={setCarA} />

          <div className="flex items-center justify-center">
            <span className="text-white/30 text-2xl font-bold">VS</span>
          </div>

          <CarSelector label="Автомобиль 2" makes={makes} value={carB} onChange={setCarB} />
        </div>

        {/* Compare Button */}
        {!result && (
          <div className="text-center">
            <button
              onClick={handleCompare}
              disabled={!canCompare || loading}
              className="bg-white text-black px-10 py-4 uppercase text-sm tracking-widest font-bold hover:bg-neutral-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? "Сравниваем..." : "Сравнить"}
            </button>
            {!canCompare && (
              <p className="text-white/30 text-xs mt-3 uppercase tracking-wide">
                Выберите марку и модель для обоих автомобилей
              </p>
            )}
          </div>
        )}

        {/* Results Table */}
        {result && (
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-white/40 text-xs uppercase tracking-widest text-left py-4 pr-6 w-1/3">
                      Параметр
                    </th>
                    <th className="text-white text-sm uppercase tracking-wide text-left py-4 px-4">
                      {result.a.make} {result.a.model}
                      <span className="text-white/40 text-xs ml-2">{result.a.year}</span>
                    </th>
                    <th className="text-white text-sm uppercase tracking-wide text-left py-4 px-4">
                      {result.b.make} {result.b.model}
                      <span className="text-white/40 text-xs ml-2">{result.b.year}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {specs.map((key, i) => {
                    const valA = result.a[key as keyof CarData] || "—";
                    const valB = result.b[key as keyof CarData] || "—";
                    return (
                      <tr
                        key={key}
                        className={`border-b border-white/5 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}
                      >
                        <td className="text-white/40 text-xs uppercase tracking-wider py-4 pr-6">
                          {SPECS_LABELS[key]}
                        </td>
                        <td className="text-white text-sm py-4 px-4">{valA}</td>
                        <td className="text-white text-sm py-4 px-4">{valB}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="text-center mt-10">
              <button
                onClick={() => setResult(null)}
                className="border border-white/30 text-white/60 hover:text-white hover:border-white px-8 py-3 uppercase text-xs tracking-widest transition-colors"
              >
                Сравнить другие авто
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
