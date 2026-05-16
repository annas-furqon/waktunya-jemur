import { NextRequest, NextResponse } from "next/server";
import { openDatabase } from "@/lib/sqlite";
import path from "path";

// BMKG weather code descriptions
const WEATHER_CODES: Record<number, { id: string; en: string; isRain: boolean }> = {
  0: { id: "Cerah", en: "Clear", isRain: false },
  1: { id: "Cerah Berawan", en: "Partly Cloudy", isRain: false },
  2: { id: "Cerah Berawan", en: "Partly Cloudy", isRain: false },
  3: { id: "Berawan", en: "Mostly Cloudy", isRain: false },
  4: { id: "Berawan Tebal", en: "Overcast", isRain: false },
  5: { id: "Udara Kabur", en: "Haze", isRain: false },
  10: { id: "Asap", en: "Smoke", isRain: false },
  45: { id: "Kabut", en: "Fog", isRain: false },
  60: { id: "Hujan Ringan", en: "Light Rain", isRain: true },
  61: { id: "Hujan Sedang", en: "Rain", isRain: true },
  63: { id: "Hujan Lebat", en: "Heavy Rain", isRain: true },
  80: { id: "Hujan Lokal", en: "Isolated Shower", isRain: true },
  95: { id: "Hujan Petir", en: "Severe Thunderstorm", isRain: true },
  97: { id: "Hujan Petir", en: "Severe Thunderstorm", isRain: true },
};

interface BmkgCuaca {
  datetime: string;
  utc_datetime: string;
  local_datetime: string;
  t: number;
  hu: number;
  ws: number;
  wd: string;
  wd_deg?: number;
  wd_to?: string;
  weather: number;
  weather_desc: string;
  weather_desc_en: string;
  tcc: number;
  tp?: number;
  vs: number;
  vs_text: string;
  time_index?: string;
  analysis_date?: string;
  image?: string;
}

interface BmkgLokasi {
  adm1: string;
  adm2: string;
  adm3: string;
  adm4: string;
  provinsi: string;
  kotkab: string;
  kecamatan: string;
  desa: string;
  lat: number;
  lon: number;
  timezone: string;
  type?: string;
}

interface BmkgDataItem {
  lokasi: BmkgLokasi;
  cuaca: BmkgCuaca[][];
}

interface BmkgResponse {
  lokasi: BmkgLokasi[];
  data: BmkgDataItem[];
}

function getIndonesiaHour(): number {
  const now = new Date();
  const wibOffset = 7 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const wibMinutes = (utcMinutes + wibOffset) % (24 * 60);
  return Math.floor(wibMinutes / 60);
}

function getCurrentCuaca(cuacaArrays: BmkgCuaca[][]): BmkgCuaca | null {
  const now = new Date();
  const allCuaca = cuacaArrays.flat();

  // Sort by local_datetime
  allCuaca.sort((a, b) =>
    new Date(a.local_datetime).getTime() - new Date(b.local_datetime).getTime()
  );

  // Find the forecast closest to now
  let closest: BmkgCuaca | null = null;
  let minDiff = Number.MAX_VALUE;

  for (const c of allCuaca) {
    const forecastTime = new Date(c.local_datetime).getTime();
    const diff = Math.abs(forecastTime - now.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = c;
    }
  }

  return closest;
}

function getUpcomingForecasts(cuacaArrays: BmkgCuaca[][], count: number): BmkgCuaca[] {
  const now = new Date();
  const allCuaca = cuacaArrays.flat();

  // Get forecasts that are in the future or very recent
  const upcoming = allCuaca
    .filter((c) => new Date(c.local_datetime).getTime() > now.getTime() - 3600000)
    .sort((a, b) =>
      new Date(a.local_datetime).getTime() - new Date(b.local_datetime).getTime()
    );

  return upcoming.slice(0, count);
}

function isGoodForDrying(
  cuaca: BmkgCuaca,
  hour: number
): {
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
} {
  const temp = cuaca.t;
  const humidity = cuaca.hu;
  const windSpeed = cuaca.ws;
  const cloudCover = cuaca.tcc;
  const weatherCode = cuaca.weather;
  const weatherDesc = cuaca.weather_desc;

  const weatherInfo = WEATHER_CODES[weatherCode] || { id: weatherDesc, en: cuaca.weather_desc_en, isRain: false };
  const isRaining = weatherInfo.isRain;

  const details = {
    temp,
    humidity,
    windSpeed,
    cloudCover,
    weatherMain: weatherInfo.id,
    weatherDesc,
  };

  const isNight = hour < 6 || hour >= 18;
  const isTooHumid = humidity > 85;
  const isTooCloudy = cloudCover > 80;

  if (isRaining) {
    return {
      good: false,
      reason: "Lagi hujan nih!",
      suggestion:
        "Wah sayang banget, BMKG bilang lagi " + weatherDesc.toLowerCase() + " di daerah kamu. Mending tunda dulu ya jemurnya. Coba cek lagi nanti, siapa tau langitnya udah cerah! Kalau nekat jemur sekarang, baju kamu malah ikut mandi hujan dong.",
      bestTimes: getNextGoodTimes(hour, true),
      details,
    };
  }

  if (isNight && hour >= 22) {
    return {
      good: false,
      reason: "Udah malem banget!",
      suggestion:
        "Halo night owl! Jam segini mah baju gak bakal kering, malah bisa lembab kena embun. Mending jemur besok pagi aja ya sekitar jam 8-9, dijamin kering sempurna! Sekarang mending tidur aja deh, biar besok semangat jemurnya.",
      bestTimes: ["Besok 08:00 - 11:00", "Besok 12:00 - 15:00"],
      details,
    };
  }

  if (isNight && hour >= 18) {
    return {
      good: false,
      reason: "Udah sore menjelang malam",
      suggestion:
        "Wah kamu telat jemur pakaian! Matahari udah pulang ke peraduannya. Mungkin kamu bisa coba besok pagi aja, hasilnya pasti lebih bagus. Nanti tengah malam kayanya engga hujan sih, tapi ya tetep gak ada matahari kan.",
      bestTimes: ["Besok 08:00 - 11:00", "Besok 12:00 - 15:00"],
      details,
    };
  }

  if (isNight && hour < 6) {
    return {
      good: false,
      reason: "Masih subuh, matahari belum muncul",
      suggestion:
        "Kamu rajin banget sih! Tapi matahari masih bobo nih. Tunggu sekitar jam 7-8 pagi baru jemur ya, biar dapet sinar matahari pagi yang paling bagus buat baju. Sambil nunggu, ngopi dulu aja!",
      bestTimes: ["Hari ini 08:00 - 11:00", "Hari ini 12:00 - 15:00"],
      details,
    };
  }

  if (isTooHumid && isTooCloudy) {
    return {
      good: false,
      reason: "Kelembaban tinggi dan mendung",
      suggestion:
        "Waduh, langitnya mendung dan udaranya lembab banget. Kalau jemur sekarang, baju bakal lama keringnya dan bisa bau apek. Tunggu cuacanya membaik ya! BMKG bilang tutupan awannya " + cloudCover + "% tuh, tebal banget.",
      bestTimes: getNextGoodTimes(hour, false),
      details,
    };
  }

  if (isTooHumid) {
    return {
      good: false,
      reason: "Kelembaban udara terlalu tinggi",
      suggestion:
        "Udaranya lagi lembab banget nih, kelembaban " + humidity + "%. Jemur sekarang bisa-bisa baju malah bau apek. Coba tunggu kelembaban turun dulu ya, biasanya siang agak siang lebih baik.",
      bestTimes: getNextGoodTimes(hour, false),
      details,
    };
  }

  if (hour >= 6 && hour < 8) {
    return {
      good: true,
      reason: "Pagi yang cerah, waktu bagus buat jemur!",
      suggestion:
        "Timing yang pas nih! Matahari pagi lagi hangat-hangatnya, BMKG bilang cuacanya " + weatherDesc.toLowerCase() + ". Jemur sekarang, nanti siang udah kering deh. Baju kamu bakal wangi sinar matahari!",
      bestTimes: ["Sekarang!", "08:00 - 11:00"],
      details,
    };
  }

  if (hour >= 8 && hour < 11) {
    return {
      good: true,
      reason: "Waktu TERBAIK buat jemur!",
      suggestion:
        "INI DIA waktu paling oke buat jemur baju! Matahari lagi semangat-semangatnya dan cuaca " + weatherDesc.toLowerCase() + ". Gas jemur sekarang, dijamin kering dan wangi! Angin juga " + windSpeed + " km/jam, lumayan buat bantu keringin.",
      bestTimes: ["Sekarang!"],
      details,
    };
  }

  if (hour >= 11 && hour < 14) {
    return {
      good: true,
      reason: "Matahari lagi terik-teriknya!",
      suggestion:
        "Siang bolong gini matahari lagi gahar, suhu " + temp + "°C. Baju bakal super cepet keringnya! Tapi hati-hati, baju warna bisa luntur kalau terlalu lama dijemur langsung. 2-3 jam udah cukup kok!",
      bestTimes: ["Sekarang!", "Angkat sekitar jam 14:00-15:00"],
      details,
    };
  }

  if (hour >= 14 && hour < 16) {
    return {
      good: true,
      reason: "Masih bisa jemur kok!",
      suggestion:
        "Masih keburu jemur nih, tapi agak telat dikit ya. Cuacanya " + weatherDesc.toLowerCase() + " dan suhu masih " + temp + "°C. Kalau bajunya gak terlalu tebel, harusnya masih bisa kering sebelum sore. Cus langsung jemur!",
      bestTimes: ["Sekarang!", "Angkat sebelum jam 17:00"],
      details,
    };
  }

  if (hour >= 16 && hour < 18) {
    return {
      good: false,
      reason: "Udah sore, matahari mulai redup",
      suggestion:
        "Wah kamu telat jemur pakaian! Matahari udah mau pamit nih. Mungkin kamu bisa coba besok pagi aja, hasilnya pasti lebih bagus. Sabar ya, besok pagi BMKG prediksi cuacanya lumayan kok!",
      bestTimes: ["Besok 08:00 - 11:00", "Besok 12:00 - 15:00"],
      details,
    };
  }

  return {
    good: true,
    reason: "Cuaca cukup oke!",
    suggestion:
      "Cuacanya lumayan buat jemur. BMKG bilang " + weatherDesc.toLowerCase() + " dengan suhu " + temp + "°C. Gas aja langsung jemur sekarang!",
    bestTimes: getNextGoodTimes(hour, false),
    details,
  };
}

function getNextGoodTimes(currentHour: number, isRaining: boolean): string[] {
  const times: string[] = [];
  if (isRaining) {
    if (currentHour < 14) {
      times.push("Coba cek lagi jam 14:00 - 16:00");
    }
    times.push("Besok 08:00 - 11:00");
    times.push("Besok 12:00 - 15:00");
  } else {
    if (currentHour < 8) {
      times.push("Hari ini 08:00 - 11:00");
    }
    if (currentHour < 11) {
      times.push("Hari ini 11:00 - 14:00");
    }
    if (currentHour < 15) {
      times.push("Hari ini sebelum jam 16:00");
    }
    if (times.length === 0) {
      times.push("Besok 08:00 - 11:00");
      times.push("Besok 12:00 - 15:00");
    }
  }
  return times;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let locationId = searchParams.get("id");

    if (!locationId) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 }
      );
    }

    // Validate location code has 4 parts (village level: XX.XX.XX.XXXX)
    const codeParts = locationId.split(".");
    if (codeParts.length !== 4) {
      return NextResponse.json(
        { error: "Location must be a village-level code (format: XX.XX.XX.XXXX)" },
        { status: 400 }
      );
    }

    // Validate location exists in SQLite database
    const db = await openDatabase("data/wilayah.db");

    const stmt = db.prepare(
      "SELECT kode, nama, province_name, district_name, sub_district_name FROM wilayah WHERE kode = ?"
    );
    stmt.bind([locationId]);

    let location: {
      kode: string;
      nama: string;
      province_name: string;
      district_name: string;
      sub_district_name: string;
    } | null = null;

    if (stmt.step()) {
      location = stmt.getAsObject() as any;
    }
    stmt.free();
    db.close();

    if (!location) {
      return NextResponse.json(
        { error: "Location not found in database" },
        { status: 404 }
      );
    }

    // Use the location code for BMKG API (already in dot format)
    const provinceCode = locationId;

    // Fetch weather from BMKG using location code (adm4)
    const bmkgUrl = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${provinceCode}`;
    
    const bmkgRes = await fetch(bmkgUrl, {
      headers: {
        "User-Agent": "JemurYuk/1.0",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!bmkgRes.ok) {
      throw new Error(`BMKG API error: ${bmkgRes.status}`);
    }

    const bmkgData = (await bmkgRes.json()) as BmkgResponse;

    if (!bmkgData || !bmkgData.data || bmkgData.data.length === 0) {
      throw new Error("Data BMKG kosong");
    }

    // Use the first data item (closest match)
    const closestItem = bmkgData.data[0];

    // Get current weather and forecast
    const currentCuaca = getCurrentCuaca(closestItem.cuaca);
    if (!currentCuaca) {
      throw new Error("Data prakiraan cuaca tidak tersedia");
    }

    const hour = getIndonesiaHour();
    const result = isGoodForDrying(currentCuaca, hour);

    // Get upcoming forecasts
    const upcomingCuaca = getUpcomingForecasts(closestItem.cuaca, 6);
    const forecast = upcomingCuaca.map((c) => {
      const localTime = new Date(c.local_datetime);
      return {
        time: localTime.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: closestItem.lokasi.timezone || "Asia/Jakarta",
        }),
        weather: c.weather_desc,
        temp: Math.round(c.t),
        humidity: c.hu,
        rainChance: c.tp != null ? c.tp : (WEATHER_CODES[c.weather]?.isRain ? 80 : 10),
      };
    });

    return NextResponse.json({
      location: location.nama,
      province: location.province_name,
      district: location.district_name,
      sub_district: location.sub_district_name,
      currentHour: hour,
      ...result,
      forecast,
      source: "BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)",
    });
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      {
        error:
          "Gagal mengambil data cuaca dari BMKG. Pastikan lokasi berada di wilayah Indonesia dan coba lagi ya!",
      },
      { status: 500 }
    );
  }
}
