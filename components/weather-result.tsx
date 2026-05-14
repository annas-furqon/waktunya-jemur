"use client";

import { Clock, Droplets, Thermometer, Wind, Cloud, MapPin } from "lucide-react";

interface ForecastItem {
  time: string;
  weather: string;
  temp: number;
  humidity: number;
  rainChance: number;
}

interface WeatherResultData {
  location: string;
  province?: string;
  kecamatan?: string;
  kotkab?: string;
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
  forecast: ForecastItem[];
  source?: string;
}

interface WeatherResultProps {
  data: WeatherResultData;
  isDark: boolean;
  onClose: () => void;
}

export function WeatherResult({ data, isDark, onClose }: WeatherResultProps) {
  const locationDisplay = [data.location, data.kotkab, data.province]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 2)
    .join(", ");

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className={`rounded-2xl border-2 p-5 shadow-xl backdrop-blur-md ${
          isDark
            ? "border-[#2A2A4A] bg-[#161D2E]/90 text-[#E0E0FF]"
            : "border-[#FFE082]/50 bg-white/90 text-[#2D3748]"
        }`}
      >
        {/* Big result */}
        <div className="mb-4 text-center">
          <div className="mb-1 flex items-center justify-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {locationDisplay || "Lokasi dipilih"}
            </span>
          </div>
          <div
            className={`mb-2 text-5xl font-extrabold tracking-tight ${
              data.good
                ? isDark
                  ? "text-[#7BC74D]"
                  : "text-[#2ECC71]"
                : isDark
                  ? "text-[#FF6B6B]"
                  : "text-[#E74C3C]"
            }`}
          >
            {data.good ? "IYA!" : "TIDAK"}
          </div>
          <p
            className={`text-lg font-bold ${
              isDark ? "text-[#FFFDE7]" : "text-[#2D3748]"
            }`}
          >
            {data.reason}
          </p>
        </div>

        {/* Casual suggestion */}
        <div
          className={`mb-4 rounded-xl p-4 ${
            isDark ? "bg-[#1A2340]/80" : "bg-[#FFF8E1]"
          }`}
        >
          <p className={`text-sm leading-relaxed ${isDark ? "text-[#E0E0FF]" : "text-[#5D4037]"}`}>
            {data.suggestion}
          </p>
        </div>

        {/* Weather details */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div
            className={`flex items-center gap-2 rounded-lg p-3 ${
              isDark ? "bg-[#1A2340]/60" : "bg-[#E3F2FD]"
            }`}
          >
            <Thermometer className={`h-5 w-5 ${isDark ? "text-[#FF6B6B]" : "text-[#E74C3C]"}`} />
            <div>
              <p className="text-xs text-muted-foreground">Suhu</p>
              <p className="text-sm font-bold">{Math.round(data.details.temp)}°C</p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 rounded-lg p-3 ${
              isDark ? "bg-[#1A2340]/60" : "bg-[#E3F2FD]"
            }`}
          >
            <Droplets className={`h-5 w-5 ${isDark ? "text-[#4ECDC4]" : "text-[#3498DB]"}`} />
            <div>
              <p className="text-xs text-muted-foreground">Kelembaban</p>
              <p className="text-sm font-bold">{data.details.humidity}%</p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 rounded-lg p-3 ${
              isDark ? "bg-[#1A2340]/60" : "bg-[#E3F2FD]"
            }`}
          >
            <Wind className={`h-5 w-5 ${isDark ? "text-[#FFE082]" : "text-[#27AE60]"}`} />
            <div>
              <p className="text-xs text-muted-foreground">Angin</p>
              <p className="text-sm font-bold">{data.details.windSpeed} km/j</p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 rounded-lg p-3 ${
              isDark ? "bg-[#1A2340]/60" : "bg-[#E3F2FD]"
            }`}
          >
            <Cloud className={`h-5 w-5 ${isDark ? "text-[#B0BEC5]" : "text-[#78909C]"}`} />
            <div>
              <p className="text-xs text-muted-foreground">Awan</p>
              <p className="text-sm font-bold">{data.details.cloudCover}%</p>
            </div>
          </div>
        </div>

        {/* Best times */}
        {data.bestTimes.length > 0 && (
          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <Clock className={`h-4 w-4 ${isDark ? "text-[#FFE082]" : "text-[#F39C12]"}`} />
              <p className={`text-sm font-bold ${isDark ? "text-[#FFFDE7]" : "text-[#2D3748]"}`}>
                Waktu yang disarankan:
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.bestTimes.map((time, i) => (
                <span
                  key={i}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isDark
                      ? "bg-[#FFE082]/20 text-[#FFE082]"
                      : "bg-[#FFE082] text-[#5D4037]"
                  }`}
                >
                  {time}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Forecast */}
        {data.forecast && data.forecast.length > 0 && (
          <div className="mb-4">
            <p className={`mb-2 text-sm font-bold ${isDark ? "text-[#FFFDE7]" : "text-[#2D3748]"}`}>
              Prakiraan beberapa jam ke depan:
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {data.forecast.map((item, i) => (
                <div
                  key={i}
                  className={`flex-shrink-0 rounded-lg p-2 text-center ${
                    isDark ? "bg-[#1A2340]/60" : "bg-[#E8F5E9]"
                  }`}
                  style={{ minWidth: "80px" }}
                >
                  <p className="text-xs font-bold">{item.time}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">{item.weather}</p>
                  <p className="text-sm font-bold">{item.temp}°C</p>
                  <p className="text-xs text-muted-foreground">
                    {typeof item.rainChance === "number" ? `${item.rainChance}%` : "-"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BMKG Attribution */}
        {data.source && (
          <p className={`mb-3 text-center text-xs ${isDark ? "text-[#546E7A]" : "text-[#90A4AE]"}`}>
            Sumber data: {data.source}
          </p>
        )}

        <button
          onClick={onClose}
          type="button"
          className={`w-full rounded-xl py-2.5 text-sm font-bold transition-colors ${
            isDark
              ? "bg-[#2A2A4A] text-[#E0E0FF] hover:bg-[#3A3A5A]"
              : "bg-[#E0E0E0] text-[#2D3748] hover:bg-[#D0D0D0]"
          }`}
        >
          Cek Lagi
        </button>
      </div>
    </div>
  );
}
