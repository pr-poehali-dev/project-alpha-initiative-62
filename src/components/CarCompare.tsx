import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const API_URL = "https://functions.poehali.dev/b0ddb1ea-2b53-4682-8c95-48f015cfff78";
const YEARS = Array.from({ length: 30 }, (_, i) => String(2024 - i));

interface CarSelection {
  make: string;
  model: string;
  year: string;
}

interface CarData {
  make: string;
  model: string;
  year: string;
  bodyClass?: string;
  [key: string]: string | undefined;
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
  const res = await fetch(`${API_URL}?action=specs&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=${year}`);
  const raw = await res.json();
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  return data.specs || { make, model, year };
}

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = query.length > 0
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase())).slice(0, 50)
    : options.slice(0, 80);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(v: string) {
    onChange(v);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 text-sm text-left flex justify-between items-center disabled:opacity-40 disabled:cursor-not-allowed hover:border-white/40 transition-colors"
      >
        <span className={value ? "text-white" : "text-white/40"}>{value || placeholder}</span>
        <Icon name="ChevronDown" size={16} />
      </button>

      {open && (
        <div className="absolute z-50 w-full bg-neutral-900 border border-white/20 mt-1 max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-white/10">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск..."
              className="w-full bg-white/10 text-white text-sm px-3 py-2 outline-none placeholder-white/30"
            />
          </div>
          <div className="overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-white/30 text-sm px-4 py-3">Ничего не найдено</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => select(o)}
                  className="w-full text-left text-white text-sm px-4 py-2.5 hover:bg-white/10 transition-colors"
                >
                  {o}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
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
      setModels([]);
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
          className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 text-sm focus:outline-none focus:border-white/40 appearance-none cursor-pointer"
          value={value.year}
          onChange={(e) => onChange({ ...value, year: e.target.value, model: "" })}
        >
          {YEARS.map((y) => (
            <option key={y} value={y} className="bg-neutral-900">{y}</option>
          ))}
        </select>

        <SearchableSelect
          options={makes}
          value={value.make}
          onChange={(m) => onChange({ ...value, make: m, model: "" })}
          placeholder="Выберите марку"
        />

        <SearchableSelect
          options={models}
          value={value.model}
          onChange={(m) => onChange({ ...value, model: m })}
          placeholder={loadingModels ? "Загрузка моделей..." : "Выберите модель"}
          disabled={!value.make || loadingModels}
        />
      </div>
    </div>
  );
}

const SPECS_LABELS: [string, string][] = [
  ["make", "Марка"],
  ["model", "Модель"],
  ["year", "Год"],
  ["bodyClass", "Тип кузова"],
];

export default function CarCompare({ onClose }: { onClose: () => void }) {
  const [makes, setMakes] = useState<string[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(true);
  const [carA, setCarA] = useState<CarSelection>({ make: "", model: "", year: "2023" });
  const [carB, setCarB] = useState<CarSelection>({ make: "", model: "", year: "2023" });
  const [result, setResult] = useState<{ a: CarData; b: CarData } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMakes().then(setMakes).finally(() => setLoadingMakes(false));
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

  return (
    <div className="fixed inset-0 z-50 bg-black/97 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-white text-2xl md:text-4xl font-bold uppercase tracking-tight">
              Сравнение авто
            </h2>
            {!loadingMakes && (
              <p className="text-white/30 text-xs mt-1 uppercase tracking-wide">
                {makes.length} марок в базе
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <Icon name="X" size={28} />
          </button>
        </div>

        {loadingMakes ? (
          <div className="text-center py-20">
            <div className="text-white/40 text-sm uppercase tracking-widest">Загружаем базу автомобилей...</div>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-8 mb-10">
              <CarSelector label="Автомобиль 1" makes={makes} value={carA} onChange={setCarA} />
              <div className="flex items-center justify-center py-4 md:py-0">
                <span className="text-white/20 text-3xl font-bold">VS</span>
              </div>
              <CarSelector label="Автомобиль 2" makes={makes} value={carB} onChange={setCarB} />
            </div>

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
                    Выберите марку и модель для обоих авто
                  </p>
                )}
              </div>
            )}

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
                      {SPECS_LABELS.map(([key, label], i) => {
                        const valA = result.a[key] || "—";
                        const valB = result.b[key] || "—";
                        const diff = valA !== valB && valA !== "—" && valB !== "—";
                        return (
                          <tr key={key} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                            <td className="text-white/40 text-xs uppercase tracking-wider py-4 pr-6">{label}</td>
                            <td className={`text-sm py-4 px-4 ${diff ? "text-yellow-300" : "text-white"}`}>{valA}</td>
                            <td className={`text-sm py-4 px-4 ${diff ? "text-yellow-300" : "text-white"}`}>{valB}</td>
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
          </>
        )}
      </div>
    </div>
  );
}
