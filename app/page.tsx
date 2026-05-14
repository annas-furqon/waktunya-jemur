"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Loader2, Sun } from "lucide-react";
import { DayScene } from "@/components/day-scene";
import { NightScene } from "@/components/night-scene";
import { WeatherResult } from "@/components/weather-result";
import { CoffeeButton } from "@/components/coffee-button";

interface WeatherData {
  location: string;
  province?: string;
  district?: string;
  sub_district?: string;
  currentHour: number;
  good: boolean;
  reason: string;
  suggestion: string;
  bestTimes: string[];
  details: {
    temp: number;
    humidity: number;
    windSpeed: number;
    cloudCover: number;
    weatherMain: string;
    weatherDesc: string;
  };
  forecast: {
    time: string;
    weather: string;
    temp: number;
    humidity: number;
    rainChance: number;
  }[];
  source?: string;
}

interface SearchSuggestion {
  id: string;
  display_name: string;
  province: string;
  district: string;
  sub_district: string;
  full_path: string;
  match_field?: 'province' | 'district' | 'sub_district' | 'village';
}

function getIndonesiaHour(): number {
  const now = new Date();
  const wibOffset = 7 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const wibMinutes = (utcMinutes + wibOffset) % (24 * 60);
  return Math.floor(wibMinutes / 60);
}

function generateUserId(): string {
  if (typeof window === "undefined") return "";
  let uid = localStorage.getItem("jemur-uid");
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem("jemur-uid", uid);
  }
  return uid;
}

export default function Page() {
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [error, setError] = useState("");
  const [, setUserId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Auto dark mode based on Indonesia time
  useEffect(() => {
    const hour = getIndonesiaHour();
    setIsDark(hour < 6 || hour >= 18);

    const interval = setInterval(() => {
      const h = getIndonesiaHour();
      setIsDark(h < 6 || h >= 18);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Apply dark class to html
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Generate unique ID
  useEffect(() => {
    setUserId(generateUserId());
  }, []);



  // Search suggestions via database
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const selectSuggestion = (item: { id: string; display_name: string; full_path: string }) => {
    setSearchQuery(item.full_path);
    setSelectedLocationId(item.id);
    setShowSuggestions(false);
    setSuggestions([]);
    setWeatherData(null);
    setError("");
  };

  const checkWeather = async () => {
    if (!selectedLocationId) {
      setError("Pilih lokasi terlebih dahulu!");
      return;
    }

    setIsLoading(true);
    setError("");
    setWeatherData(null);

    try {
      const formattedId = selectedLocationId.replace(/-/g, ".");
      const res = await fetch(`/api/weather?id=${encodeURIComponent(formattedId)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal mengambil data cuaca");
        return;
      }

      setWeatherData(data);
    } catch {
      setError("Koneksi gagal. Coba lagi ya!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden">
      {/* Background scene */}
      {isDark ? <NightScene /> : <DayScene />}

      {/* Content overlay */}
      <div className="relative z-10 flex flex-1 flex-col items-center px-4 py-6">
        {/* Title */}
        <div className="mb-4 text-center">
          <h1
            className={`text-3xl font-extrabold tracking-tight md:text-4xl ${
              isDark ? "text-[#FFFDE7]" : "text-[#2D3748]"
            }`}
          >
            <Sun className={`mb-1 mr-2 inline h-7 w-7 ${isDark ? "text-[#FFE082]" : "text-[#FFD93D]"}`} />
            Jemur Yuk!
          </h1>
          <p className={`mt-1 text-sm ${isDark ? "text-[#B0BEC5]" : "text-[#546E7A]"}`}>
            Cek cuaca buat jemur baju, gak perlu ribet!
          </p>
        </div>

        {/* Search box */}
        <div className="relative mb-4 w-full max-w-md">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Cari lokasi... (contoh: Bandung)"
              className={`w-full rounded-xl border-2 py-3 pr-4 pl-10 text-sm font-medium shadow-md outline-none transition-all placeholder:text-muted-foreground focus:ring-2 ${
                isDark
                  ? "border-[#2A2A4A] bg-[#1A2340]/90 text-[#E0E0FF] focus:border-[#FFE082] focus:ring-[#FFE082]/30"
                  : "border-[#FFE082]/50 bg-white/90 text-[#2D3748] focus:border-[#FFD93D] focus:ring-[#FFD93D]/30"
              }`}
              aria-label="Cari lokasi di Indonesia"
            />
            {isSearching && (
              <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search suggestions */}
          {showSuggestions && (
            <div
              className={`absolute top-full z-50 mt-1 w-full rounded-xl border-2 shadow-lg max-h-64 overflow-y-auto ${
                isDark
                  ? "border-[#2A2A4A] bg-[#161D2E]"
                  : "border-[#FFE082]/50 bg-white"
              }`}
            >
              {suggestions.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectSuggestion(item)}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    isDark
                      ? "text-[#E0E0FF] hover:bg-[#1A2340]"
                      : "text-[#2D3748] hover:bg-[#FFF8E1]"
                  }`}
                >
                  <div className="font-semibold">{item.display_name}</div>
                  <div className={`text-xs mt-1 ${isDark ? "text-[#9ABED5]" : "text-[#666666]"}`}>
                    {item.province} → {item.district} → {item.sub_district}
                  </div>
                  {item.match_field && (
                    <div className={`text-[10px] mt-1 font-medium ${
                      isDark
                        ? "text-[#FFE082]"
                        : "text-[#FF6B6B]"
                    }`}>
                      {item.match_field === 'province' && '📍 Provinsi'}
                      {item.match_field === 'district' && '📍 Kabupaten'}
                      {item.match_field === 'sub_district' && '📍 Kecamatan'}
                      {item.match_field === 'village' && '📍 Desa/Kelurahan'}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Check button */}
        <button
          type="button"
          onClick={checkWeather}
          disabled={isLoading}
          className={`mb-4 w-full max-w-md rounded-xl py-3.5 text-base font-extrabold shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 ${
            isDark
              ? "bg-[#FFE082] text-[#3E2723] hover:bg-[#FFD54F]"
              : "bg-[#FF6B6B] text-white hover:bg-[#FF5252]"
          }`}
          aria-label="Cek apakah cocok untuk jemur baju"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Lagi ngecek...
            </span>
          ) : (
            "Cek Sekarang!"
          )}
        </button>

        {/* Error */}
        {error && (
          <div
            className={`mb-4 w-full max-w-md rounded-xl p-4 text-center text-sm font-medium ${
              isDark
                ? "bg-[#FF6B6B]/20 text-[#FF6B6B]"
                : "bg-[#FFEBEE] text-[#C62828]"
            }`}
          >
            {error}
          </div>
        )}

        {/* Result */}
        {weatherData && (
          <div className="mb-4 w-full max-w-md">
            <WeatherResult
              data={weatherData}
              isDark={isDark}
              onClose={() => setWeatherData(null)}
            />
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Coffee button */}
        <div className="mt-4">
          <CoffeeButton isDark={isDark} />
        </div>

        {/* Footer */}
        <p className={`mt-3 text-center text-xs ${isDark ? "text-[#546E7A]" : "text-[#90A4AE]"}`}>
          Data cuaca dari BMKG.
        </p>
      </div>
    </main>
  );
}
