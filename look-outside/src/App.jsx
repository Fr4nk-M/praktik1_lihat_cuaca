import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, Cloud, CloudRain, CloudLightning, Snowflake, Wind, 
  Droplets, Thermometer, MapPin, Search, Eye, Volume2, VolumeX, 
  Sparkles, ChevronRight, Lock, Unlock, Compass, RefreshCw, Layers,
  CloudSun, ShieldAlert, Navigation, ArrowDown, ArrowUp, Calendar
} from 'lucide-react';

// Open-Meteo Weather Code Mapping
const WEATHER_CODES = {
  0: { label: 'Clear Sky', icon: 'sunny', type: 'sunny', bg: 'from-amber-400 via-sky-300 to-sky-500' },
  1: { label: 'Mainly Clear', icon: 'partly_cloudy', type: 'sunny', bg: 'from-amber-200 via-sky-300 to-sky-400' },
  2: { label: 'Partly Cloudy', icon: 'partly_cloudy', type: 'cloudy', bg: 'from-sky-300 via-slate-300 to-blue-400' },
  3: { label: 'Overcast', icon: 'cloudy', type: 'cloudy', bg: 'from-slate-400 via-gray-400 to-slate-600' },
  45: { label: 'Foggy', icon: 'cloudy', type: 'cloudy', bg: 'from-gray-300 via-slate-300 to-gray-500' },
  48: { label: 'Depositing Rime Fog', icon: 'cloudy', type: 'cloudy', bg: 'from-gray-300 via-slate-300 to-gray-500' },
  51: { label: 'Light Drizzle', icon: 'rainy', type: 'rainy', bg: 'from-slate-500 via-blue-600 to-slate-700' },
  53: { label: 'Moderate Drizzle', icon: 'rainy', type: 'rainy', bg: 'from-slate-600 via-blue-700 to-slate-800' },
  55: { label: 'Dense Drizzle', icon: 'rainy', type: 'rainy', bg: 'from-slate-600 via-blue-700 to-slate-800' },
  61: { label: 'Slight Rain', icon: 'rainy', type: 'rainy', bg: 'from-slate-600 via-indigo-700 to-slate-800' },
  63: { label: 'Moderate Rain', icon: 'rainy', type: 'rainy', bg: 'from-slate-700 via-blue-800 to-slate-900' },
  65: { label: 'Heavy Rain', icon: 'rainy', type: 'rainy', bg: 'from-slate-800 via-blue-900 to-slate-950' },
  71: { label: 'Slight Snow', icon: 'snowy', type: 'snowy', bg: 'from-blue-100 via-slate-200 to-blue-300' },
  73: { label: 'Moderate Snow', icon: 'snowy', type: 'snowy', bg: 'from-blue-200 via-slate-300 to-blue-400' },
  75: { label: 'Heavy Snow', icon: 'snowy', type: 'snowy', bg: 'from-slate-300 via-blue-300 to-slate-500' },
  80: { label: 'Light Rain Showers', icon: 'rainy', type: 'rainy', bg: 'from-slate-500 via-blue-600 to-slate-700' },
  81: { label: 'Moderate Rain Showers', icon: 'rainy', type: 'rainy', bg: 'from-slate-600 via-blue-700 to-slate-800' },
  82: { label: 'Violent Rain Showers', icon: 'rainy', type: 'rainy', bg: 'from-slate-800 via-blue-900 to-slate-950' },
  95: { label: 'Thunderstorm', icon: 'stormy', type: 'stormy', bg: 'from-gray-900 via-indigo-950 to-slate-900' },
  96: { label: 'Thunderstorm with Hail', icon: 'stormy', type: 'stormy', bg: 'from-gray-900 via-purple-950 to-slate-900' },
  99: { label: 'Heavy Thunderstorm', icon: 'stormy', type: 'stormy', bg: 'from-slate-950 via-purple-950 to-black' },
};

// Fallback preset data for Medan and popular cities
const PRESET_CITIES = [
  { name: 'Medan', country: 'Indonesia', lat: 3.5952, lon: 98.6722 },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lon: 106.8456 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278 },
  { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060 },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
];

// Synthesizes soothing weather ambient sounds using standard Web Audio API without relying on external MP3 URLs
class WeatherSoundEngine {
  constructor() {
    this.ctx = null;
    this.rainGain = null;
    this.windGain = null;
    this.rainNode = null;
    this.windNode = null;
    this.isPlaying = false;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    
    // Master Rain Gain
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.rainGain.connect(this.ctx.destination);

    // Master Wind Gain
    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.windGain.connect(this.ctx.destination);
  }

  createNoiseBuffer() {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  startRain() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    this.stopAll();

    const buffer = this.createNoiseBuffer();
    this.rainNode = this.ctx.createBufferSource();
    this.rainNode.buffer = buffer;
    this.rainNode.loop = true;

    // Filter for rain sound
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);

    this.rainNode.connect(filter);
    filter.connect(this.rainGain);
    
    this.rainGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 1.5);
    this.rainNode.start();
    this.isPlaying = true;
  }

  startWind() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.stopAll();

    const buffer = this.createNoiseBuffer();
    this.windNode = this.ctx.createBufferSource();
    this.windNode.buffer = buffer;
    this.windNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    this.windNode.connect(filter);
    filter.connect(this.windGain);

    this.windGain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 2);
    this.windNode.start();
    this.isPlaying = true;
  }

  stopAll() {
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    }
    if (this.windGain && this.ctx) {
      this.windGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
    }
    this.isPlaying = false;
  }
}

const audioEngine = new WeatherSoundEngine();

export default function App() {
  // Window State
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [windowStyle, setWindowStyle] = useState('modern'); // 'modern', 'wood', 'arched'
  
  // Weather Search & Data
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(PRESET_CITIES[0]); // Default Medan
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [unit, setUnit] = useState('C'); // 'C' or 'F'
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [aiAdvice, setAiAdvice] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  // Canvas for Glass Raindrops
  const canvasRef = useRef(null);

  const fetchWeatherForCity = async (city) => {
    setIsLoadingWeather(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum&timezone=auto`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.current) {
        const code = data.current.weather_code;
        const mapped = WEATHER_CODES[code] || WEATHER_CODES[0];

        // Format hourly data
        const currentHourIndex = new Date().getHours();
        const hourlyList = [];
        for (let i = currentHourIndex; i < currentHourIndex + 12; i++) {
          if (data.hourly && data.hourly.time[i]) {
            const timeStr = new Date(data.hourly.time[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const hCode = data.hourly.weather_code[i];
            hourlyList.push({
              time: timeStr,
              temp: Math.round(data.hourly.temperature_2m[i]),
              pop: data.hourly.precipitation_probability ? data.hourly.precipitation_probability[i] : 0,
              code: hCode
            });
          }
        }

        // Format daily data
        const dailyList = [];
        if (data.daily && data.daily.time) {
          for (let d = 0; d < 5; d++) {
            if (data.daily.time[d]) {
              const dayName = d === 0 ? 'Today' : new Date(data.daily.time[d]).toLocaleDateString('en-US', { weekday: 'short' });
              dailyList.push({
                day: dayName,
                max: Math.round(data.daily.temperature_2m_max[d]),
                min: Math.round(data.daily.temperature_2m_min[d]),
                code: data.daily.weather_code[d]
              });
            }
          }
        }

        const formatted = {
          location: `${city.name}, ${city.country}`,
          temp: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          humidity: data.current.relative_humidity_2m,
          wind: Math.round(data.current.wind_speed_10m),
          pressure: Math.round(data.current.surface_pressure),
          uvIndex: data.daily?.uv_index_max?.[0] ? Math.round(data.daily.uv_index_max[0]) : 5,
          high: data.daily?.temperature_2m_max?.[0] ? Math.round(data.daily.temperature_2m_max[0]) : Math.round(data.current.temperature_2m) + 3,
          low: data.daily?.temperature_2m_min?.[0] ? Math.round(data.daily.temperature_2m_min[0]) : Math.round(data.current.temperature_2m) - 4,
          condition: mapped.label,
          type: mapped.type,
          bg: mapped.bg,
          isDay: data.current.is_day === 1,
          hourly: hourlyList,
          daily: dailyList
        };

        setWeatherData(formatted);
        triggerAiInsight(formatted);
      }
    } catch (err) {
      console.error("Failed to fetch weather:", err);
      // Fallback mock weather for smooth experience
      setWeatherData({
        location: `${city.name}, ${city.country}`,
        temp: 28,
        feelsLike: 31,
        humidity: 78,
        wind: 12,
        pressure: 1012,
        uvIndex: 7,
        high: 32,
        low: 24,
        condition: 'Mostly Cloudy with Breeze',
        type: 'cloudy',
        bg: 'from-sky-300 via-slate-300 to-blue-400',
        isDay: true,
        hourly: [
          { time: '08 AM', temp: 27, pop: 10, code: 2 },
          { time: '10 AM', temp: 29, pop: 20, code: 2 },
          { time: '12 PM', temp: 31, pop: 15, code: 1 },
          { time: '02 PM', temp: 30, pop: 60, code: 61 },
          { time: '04 PM', temp: 28, pop: 80, code: 63 },
          { time: '06 PM', temp: 26, pop: 30, code: 2 }
        ],
        daily: [
          { day: 'Today', max: 32, min: 24, code: 61 },
          { day: 'Thu', max: 31, min: 25, code: 2 },
          { day: 'Fri', max: 33, min: 24, code: 0 },
          { day: 'Sat', max: 29, min: 23, code: 95 },
          { day: 'Sun', max: 30, min: 24, code: 3 }
        ]
      });
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchWeatherForCity(selectedCity);
  }, []);

  const triggerAiInsight = async (w) => {
    setLoadingAi(true);
    setAiAdvice('');
    try {
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
      const prompt = `Give a friendly 2-sentence outdoor tip and clothing advice for someone looking out their window in ${w.location}. Current weather is ${w.temp}°C, ${w.condition}, Humidity ${w.humidity}%. Keep it lighthearted and catchy!`;
      
      const payload = { contents: [{ parts: [{ text: prompt }] }] };
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setAiAdvice(text);
      } else {
        setAiAdvice(`Perfect day to open the window and enjoy the ${w.condition.toLowerCase()} view! Don't forget your essentials if stepping outside.`);
      }
    } catch (e) {
      setAiAdvice(`It's ${w.temp}°C and ${w.condition}. A lovely mood to take a moment and look outside!`);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item) => {
    const cityObj = {
      name: item.name,
      country: item.country || item.admin1 || '',
      lat: item.latitude,
      lon: item.longitude
    };
    setSelectedCity(cityObj);
    setSearchResults([]);
    setSearchQuery('');
    fetchWeatherForCity(cityObj);
  };

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    if (nextState && weatherData) {
      if (weatherData.type === 'rainy' || weatherData.type === 'stormy') {
        audioEngine.startRain();
      } else {
        audioEngine.startWind();
      }
    } else {
      audioEngine.stopAll();
    }
  };

  useEffect(() => {
    if (soundEnabled && weatherData && isWindowOpen) {
      if (weatherData.type === 'rainy' || weatherData.type === 'stormy') {
        audioEngine.startRain();
      } else {
        audioEngine.startWind();
      }
    } else {
      audioEngine.stopAll();
    }
  }, [weatherData, isWindowOpen, soundEnabled]);

  useEffect(() => {
    if (!isWindowOpen || !weatherData) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = canvas.width = canvas.parentElement.clientWidth;
    let height = canvas.height = canvas.parentElement.clientHeight;

    const handleResize = () => {
      if (canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // Particle rain drops on glass
    const drops = [];
    const numDrops = weatherData.type === 'rainy' ? 70 : weatherData.type === 'stormy' ? 120 : 0;

    for (let i = 0; i < numDrops; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 15 + 10,
        speed: Math.random() * 8 + 4,
        opacity: Math.random() * 0.5 + 0.3
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (weatherData.type === 'rainy' || weatherData.type === 'stormy') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';

        drops.forEach(d => {
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + 1, d.y + d.length);
          ctx.stroke();

          d.y += d.speed;
          if (d.y > height) {
            d.y = -d.length;
            d.x = Math.random() * width;
          }
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isWindowOpen, weatherData]);

  // Temperature unit converter helper
  const formatTemp = (celsius) => {
    if (unit === 'F') {
      return Math.round((celsius * 9) / 5 + 32) + '°F';
    }
    return celsius + '°C';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-between selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="w-full max-w-6xl px-4 py-4 flex items-center justify-between border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 bg-slate-950/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Eye className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
              Look Outside
            </h1>
            <p className="text-xs text-slate-400">Interactive Window Weather</p>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center space-x-3">
          {/* Audio toggle */}
          <button
            onClick={toggleSound}
            className={`p-2.5 rounded-xl border transition-all ${
              soundEnabled 
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-md shadow-cyan-500/10' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Ambient Audio"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Unit selector */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setUnit('C')}
              className={`px-3 py-1.5 rounded-lg transition-all ${unit === 'C' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              °C
            </button>
            <button
              onClick={() => setUnit('F')}
              className={`px-3 py-1.5 rounded-lg transition-all ${unit === 'F' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              °F
            </button>
          </div>

          {/* Window trigger status pill */}
          <div className={`hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium border ${
            isWindowOpen 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            {isWindowOpen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isWindowOpen ? 'Window Unlocked' : 'Window Closed'}</span>
          </div>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="w-full max-w-6xl mx-auto px-4 py-6 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        
        {}
        {/* LEFT COLUMN: ROOM SCENE & INTERACTIVE WINDOW */}
        <section className="min-w-0 w-full flex flex-col items-center justify-center bg-slate-900/60 rounded-3xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden min-h-[480px]">
          
          {/* Room Background Wall Lighting */}
          <div 
            className={`absolute inset-0 transition-all duration-1000 opacity-40 pointer-events-none ${
              isWindowOpen && weatherData ? `bg-gradient-to-b ${weatherData.bg}` : 'bg-gradient-to-b from-slate-950 to-slate-900'
            }`} 
          />

          {/* Lecturer Task Interaction Banner / Hint */}
          <div className="z-10 mb-4 text-center">
            {!isWindowOpen ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-sm font-medium animate-bounce shadow-lg">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Pull the curtain cord to open the window and activate the weather dashboard!
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-sm font-medium">
                <Eye className="w-4 h-4 text-cyan-400" />
                Looking outside at {weatherData ? weatherData.location : selectedCity.name}
              </div>
            )}
          </div>

          {/* WINDOW FRAME & SKY CANVAS CONTAINER */}
          <div className="relative w-full max-w-md mx-auto aspect-[4/5] rounded-3xl border-8 border-amber-950/80 shadow-2xl overflow-hidden bg-slate-950 flex flex-col shrink-0">
            
            {/* The Outdoor View Canvas (Visible when opened or partially behind translucent curtains) */}
            <div className={`absolute inset-0 transition-all duration-1000 flex flex-col justify-between p-6 ${
              weatherData ? `bg-gradient-to-b ${weatherData.bg}` : 'bg-gradient-to-b from-sky-400 to-blue-600'
            }`}>

              {/* Dynamic Outdoor Weather Visuals */}
              {isWindowOpen && weatherData && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  
                  {/* SUN / SUNBEAMS */}
                  {weatherData.type === 'sunny' && (
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-300 rounded-full blur-2xl opacity-70 animate-pulse" />
                  )}

                  {/* MOVING CLOUDS */}
                  {(weatherData.type === 'cloudy' || weatherData.type === 'rainy' || weatherData.type === 'stormy') && (
                    <>
                      <Cloud className="absolute top-8 left-4 w-24 h-24 text-white/30 animate-[bounce_8s_infinite]" />
                      <Cloud className="absolute top-20 right-2 w-36 h-36 text-slate-100/20 animate-[pulse_6s_infinite]" />
                    </>
                  )}

                  {/* LIGHTNING FLASH OVERLAY */}
                  {weatherData.type === 'stormy' && (
                    <div className="absolute inset-0 bg-white/20 animate-[ping_3s_infinite] pointer-events-none" />
                  )}

                  {/* GLASS RAINDROP CANVAS */}
                  <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                </div>
              )}

              {/* Outside Landscape Horizon Silhouette */}
              <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent pointer-events-none flex items-end justify-center pb-2">
                {/* Silhouette trees / city shapes */}
                <div className="flex items-end gap-3 text-slate-800/60 opacity-80">
                  <div className="w-6 h-16 bg-current rounded-t-full" />
                  <div className="w-10 h-24 bg-current rounded-t-lg" />
                  <div className="w-8 h-20 bg-current rounded-t-full" />
                  <div className="w-12 h-28 bg-current rounded-t-xl" />
                  <div className="w-7 h-14 bg-current rounded-t-full" />
                </div>
              </div>

              {/* Temperature Badge Overlay directly inside window */}
              {isWindowOpen && weatherData && (
                <div className="z-10 self-start bg-slate-950/40 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 text-white flex items-center gap-2">
                  <span className="text-lg font-bold">{formatTemp(weatherData.temp)}</span>
                  <span className="text-xs text-slate-200 capitalize">{weatherData.condition}</span>
                </div>
              )}
            </div>

            {/* Glass Pane Divider Grids */}
            <div className="absolute inset-0 pointer-events-none border-4 border-amber-950/40 z-10 flex">
              <div className="w-1/2 h-full border-r-4 border-amber-950/40" />
              <div className="w-1/2 h-full" />
              <div className="absolute top-1/2 inset-x-0 border-b-4 border-amber-950/40" />
            </div>

            {/* CURTAINS & INTERACTIVE PULL HANDLE */}
            {/* Left Curtain */}
            <div 
              className={`absolute top-0 left-0 bottom-0 w-1/2 bg-gradient-to-r from-red-900 via-rose-950 to-red-900 border-r border-amber-900/50 shadow-2xl z-20 transition-transform duration-1000 ease-in-out origin-left ${
                isWindowOpen ? '-translate-x-[85%]' : 'translate-x-0'
              }`}
            >
              {/* Curtain folds decoration */}
              <div className="w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.4)_50%,transparent_100%)] bg-[length:20px_100%]" />
            </div>

            {/* Right Curtain */}
            <div 
              className={`absolute top-0 right-0 bottom-0 w-1/2 bg-gradient-to-l from-red-900 via-rose-950 to-red-900 border-l border-amber-900/50 shadow-2xl z-20 transition-transform duration-1000 ease-in-out origin-right ${
                isWindowOpen ? 'translate-x-[85%]' : 'translate-x-0'
              }`}
            >
              <div className="w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.4)_50%,transparent_100%)] bg-[length:20px_100%]" />
            </div>

            {/* PULL CORD / HANDLE INTERACTION BUTTON */}
            <div className="absolute right-6 top-1/3 z-30 flex flex-col items-center">
              {/* Cord Line */}
              <div className="w-1 bg-amber-200/60 h-24 shadow-md" />
              {/* Pull Knob Button */}
              <button
                onClick={() => setIsWindowOpen(!isWindowOpen)}
                className="group relative -mt-1 p-3 bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 rounded-full shadow-2xl border-2 border-amber-200 transition-transform active:scale-90 flex items-center justify-center cursor-pointer"
                title={isWindowOpen ? "Close Window" : "Open Window"}
              >
                <div className="w-3 h-3 rounded-full bg-amber-950" />
                <span className="absolute left-full ml-3 px-3 py-1 bg-amber-500 text-amber-950 text-xs font-bold rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {isWindowOpen ? 'Click to Close Window' : 'Pull to Open Window'}
                </span>
              </button>
            </div>

            {/* Indoor Window Sill with Decorative Plant */}
            <div className="mt-auto h-10 bg-amber-950 border-t-4 border-amber-900 shadow-inner z-30 flex items-center justify-between px-6">
              {/* Potted Plant SVG */}
              <div className="w-8 h-8 -mt-6 flex flex-col items-center">
                <div className="text-emerald-500 flex -space-x-1">
                  <div className="w-3 h-4 bg-emerald-500 rounded-t-full rotate-[-20deg]" />
                  <div className="w-3 h-5 bg-emerald-400 rounded-t-full" />
                  <div className="w-3 h-4 bg-emerald-500 rounded-t-full rotate-[20deg]" />
                </div>
                <div className="w-5 h-4 bg-amber-800 rounded-b-md border border-amber-700" />
              </div>
              <span className="text-[10px] text-amber-300/60 font-mono tracking-widest uppercase">
                {isWindowOpen ? 'Window Open' : 'Window Closed'}
              </span>
            </div>
          </div>
        </section>

        {}
        {/* RIGHT COLUMN: WEATHER SEARCH & DASHBOARD (ACTIVATED BY WINDOW) */}
        <section className="min-w-0 w-full flex flex-col justify-between bg-slate-900/60 rounded-3xl p-6 border border-slate-800 shadow-2xl relative">
          
          {/* LOCKED / CLOSED WINDOW OVERLAY */}
          {!isWindowOpen && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl z-30 flex flex-col items-center justify-center p-8 text-center border border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-amber-400 shadow-xl">
                <Lock className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Weather Dashboard Locked</h3>
              <p className="text-slate-400 max-w-sm text-sm mb-6">
                You haven't opened the window yet! Pull the curtain cord on the window to look outside and activate the weather forecast system.
              </p>
              <button
                onClick={() => setIsWindowOpen(true)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-cyan-500 text-slate-950 font-bold hover:brightness-110 transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Unlock className="w-5 h-5" />
                Open Window Now
              </button>
            </div>
          )}

          {/* ACTIVE WEATHER INTERFACE */}
          <div className="space-y-6">
            
            {/* Search Input & Quick Preset Buttons */}
            <div>
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="relative flex items-center">
                  <MapPin className="absolute left-4 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search city (e.g., Medan, Tokyo, Paris)..."
                    className="w-full pl-12 pr-28 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm focus:outline-none focus:border-cyan-500 text-white placeholder-slate-500 transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="absolute right-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Check</span>
                  </button>
                </div>
              </form>

              {/* Autocomplete Search Dropdown */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative z-40">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectSearchResult(item)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-900 text-sm text-slate-200 border-b border-slate-900 last:border-none flex items-center justify-between transition-colors"
                    >
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-slate-500">{item.country || item.admin1}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* City Quick Pills */}
              <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs text-slate-500 whitespace-nowrap">Presets:</span>
                {PRESET_CITIES.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setSelectedCity(c);
                      fetchWeatherForCity(c);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                      selectedCity.name === c.name 
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' 
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    📍 {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* MAIN WEATHER RESULT CARD */}
            {isLoadingWeather ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                <p className="text-sm">Fetching weather outside...</p>
              </div>
            ) : weatherData ? (
              <div className="space-y-6">
                
                {/* Temperature & Main Display */}
                <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-6 rounded-2xl border border-slate-800/80 shadow-xl relative overflow-hidden">
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                        {weatherData.location}
                      </div>
                      <div className="text-5xl font-extrabold text-white tracking-tight my-2">
                        {formatTemp(weatherData.temp)}
                      </div>
                      <div className="text-sm font-medium text-cyan-300 capitalize flex items-center gap-2">
                        {weatherData.type === 'sunny' && <Sun className="w-4 h-4 text-amber-400" />}
                        {weatherData.type === 'cloudy' && <Cloud className="w-4 h-4 text-slate-300" />}
                        {weatherData.type === 'rainy' && <CloudRain className="w-4 h-4 text-blue-400" />}
                        {weatherData.type === 'stormy' && <CloudLightning className="w-4 h-4 text-purple-400" />}
                        {weatherData.condition}
                      </div>
                    </div>

                    {/* High & Low Temp Pill */}
                    <div className="text-right space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300">
                        <ArrowUp className="w-3.5 h-3.5 text-rose-400" />
                        <span>H: {formatTemp(weatherData.high)}</span>
                      </div>
                      <br />
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300">
                        <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                        <span>L: {formatTemp(weatherData.low)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Weather Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-800/60 text-xs">
                    <div className="flex items-center gap-2 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                      <Droplets className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="text-slate-400">Humidity</div>
                        <div className="font-bold text-slate-200">{weatherData.humidity}%</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                      <Wind className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-slate-400">Wind</div>
                        <div className="font-bold text-slate-200">{weatherData.wind} km/h</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                      <Sun className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-slate-400">UV Index</div>
                        <div className="font-bold text-slate-200">{weatherData.uvIndex} / 10</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Weather Outdoor Recommendation */}
                <div className="bg-cyan-950/30 border border-cyan-800/40 p-4 rounded-2xl flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">
                      Look Outside AI Tip
                    </div>
                    <p className="text-xs text-cyan-100 leading-relaxed">
                      {loadingAi ? 'Asking Gemini weather assistant...' : aiAdvice}
                    </p>
                  </div>
                </div>

                {}
                {/* 12-HOUR HOURLY FORECAST SLIDER */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                    Hourly Forecast
                  </h4>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {weatherData.hourly && weatherData.hourly.map((h, i) => (
                      <div key={i} className="min-w-[70px] bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col items-center justify-between text-center space-y-2">
                        <span className="text-[11px] text-slate-400">{h.time}</span>
                        <div className="my-1">
                          {h.code === 0 && <Sun className="w-5 h-5 text-amber-400" />}
                          {(h.code === 1 || h.code === 2) && <CloudSun className="w-5 h-5 text-slate-300" />}
                          {h.code >= 3 && h.code < 60 && <Cloud className="w-5 h-5 text-slate-400" />}
                          {h.code >= 60 && h.code < 90 && <CloudRain className="w-5 h-5 text-blue-400" />}
                          {h.code >= 90 && <CloudLightning className="w-5 h-5 text-purple-400" />}
                        </div>
                        <span className="text-xs font-bold text-white">{formatTemp(h.temp)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5-DAY FORECAST LIST */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    5-Day Outlook
                  </h4>
                  <div className="space-y-2">
                    {weatherData.daily && weatherData.daily.map((d, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 text-xs">
                        <span className="font-semibold text-slate-300 w-16">{d.day}</span>
                        <div className="flex items-center gap-2">
                          {d.code === 0 && <Sun className="w-4 h-4 text-amber-400" />}
                          {d.code >= 1 && d.code <= 3 && <Cloud className="w-4 h-4 text-slate-400" />}
                          {d.code >= 51 && <CloudRain className="w-4 h-4 text-blue-400" />}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-100 font-bold">{formatTemp(d.max)}</span>
                          <span className="text-slate-500">{formatTemp(d.min)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : null}

          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-slate-800/60 text-center text-[11px] text-slate-500">
            Window Weather Project • Powered by Open-Meteo & Gemini AI
          </div>
        </section>

      </main>
    </div>
  );
}
