import React, { useState, useEffect, useMemo } from 'react';
import { calculatorAPI } from '../services/calculatorService';
import {
  Users,
  Calendar,
  Clock,
  Briefcase,
  Save,
  RotateCcw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Palmtree,
  ChevronDown,
} from 'lucide-react';

// --- Components ---

const Card = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-colors duration-300 ${className}`}
  >
    {children}
  </div>
);

const InputGroup = ({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix = '',
  customScale,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max: number;
  step?: number;
  suffix?: string;
  customScale?: number[];
}) => (
  <div className="mb-6 last:mb-0">
    <div className="flex justify-between items-end mb-2">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <span className="text-xl font-bold text-cyan-600 dark:text-cyan-400 leading-none">
        {value}
        {suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-600 dark:accent-cyan-400 hover:accent-cyan-500 dark:hover:accent-cyan-300 block"
    />
    <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
      {customScale ? (
        customScale.map((scaleVal, idx) => <span key={idx}>{scaleVal}</span>)
      ) : (
        <>
          <span>{min}</span>
          <span>{Math.round(min + (max - min) * 0.5)}</span>
          <span>{max}</span>
        </>
      )}
    </div>
  </div>
);

const StatBox = ({
  label,
  value,
  subtext,
  highlight = false,
  valueSize = 'text-2xl',
}: {
  label: string;
  value: string | number;
  subtext?: string;
  highlight?: boolean;
  valueSize?: string;
}) => (
  <div
    className={`px-4 py-3 rounded-lg border transition-colors duration-300 ${
      highlight
        ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-500/30'
        : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
    }`}
  >
    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
      {label}
    </div>
    <div
      className={`${valueSize} font-bold leading-tight ${highlight ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-900 dark:text-slate-200'}`}
    >
      {value}
    </div>
    {subtext && (
      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
        {subtext}
      </div>
    )}
  </div>
);

// --- Main Component ---

const CapacityCalculator: React.FC = () => {
  // --- State Management ---
  const defaultState = {
    numClients: 500,
    meetingsPerClient: 2,
    minutesPerMeeting: 45,
    workDaysPerWeek: 5,
    weeksPerYear: 50,
    hoursPerDay: 8,
    startHour: 9, // 9 AM
    endHour: 17, // 5 PM
    notes: '',
  };

  const [inputs, setInputs] = useState(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // --- Persistence ---

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = await calculatorAPI.get();
        if (savedData) {
          // Merge with default state to handle potential missing keys in future updates
          setInputs((prev) => ({ ...prev, ...savedData }));
        }
      } catch (error) {
        console.error('Failed to load calculator data:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // Auto-save with debounce
  useEffect(() => {
    if (!isLoaded) return;

    const timeoutId = setTimeout(async () => {
      try {
        await calculatorAPI.save(inputs);
        // Only show success for manual saves or major intervals to avoid flickering,

        // but here we just save silently for auto-save
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [inputs, isLoaded]);

  const handleReset = async () => {
    if (window.confirm('Reset all data to defaults?')) {
      setInputs(defaultState);
      // Immediately save the reset state
      await calculatorAPI.save(defaultState);
    }
  };

  const handleManualSave = async () => {
    try {
      await calculatorAPI.save(inputs);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Manual save failed:', error);
    }
  };

  // --- Calculations ---
  const stats = useMemo(() => {
    const workDaysPerYear = inputs.weeksPerYear * inputs.workDaysPerWeek;
    const totalMeetingsYear = inputs.numClients * inputs.meetingsPerClient;
    const meetingsPerMonth = totalMeetingsYear / 12;
    const meetingsPerWeek = totalMeetingsYear / inputs.weeksPerYear;
    const meetingsPerDay = totalMeetingsYear / workDaysPerYear;
    const ptoWeeks = 52 - inputs.weeksPerYear;

    // Capacity Logic
    const totalMeetingMinutesPerYear =
      totalMeetingsYear * inputs.minutesPerMeeting;
    const totalWorkMinutesAvailable = workDaysPerYear * inputs.hoursPerDay * 60;
    const capacityPercentage =
      totalWorkMinutesAvailable > 0
        ? (totalMeetingMinutesPerYear / totalWorkMinutesAvailable) * 100
        : 100;

    return {
      workDaysPerYear,
      totalMeetingsYear,
      meetingsPerMonth,
      meetingsPerWeek,
      meetingsPerDay,
      capacityPercentage,
      ptoWeeks,
    };
  }, [inputs]);

  // --- Helpers ---
  const updateInput = (
    key: keyof typeof defaultState,
    value: number | string
  ) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const getCapacityColor = (pct: number) => {
    if (pct < 50)
      return 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30';
    if (pct < 80) return 'text-amber-400 bg-amber-950/30 border-amber-500/30';
    return 'text-rose-400 bg-rose-950/30 border-rose-500/30';
  };

  const getBarColor = (pct: number) => {
    if (pct < 50) return 'bg-emerald-500';
    if (pct < 80) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const formatTime = (decimalTime: number) => {
    const h = Math.floor(decimalTime);
    const m = (decimalTime - h) * 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h > 12 ? h - 12 : h;
    const minStr = m === 0 ? '00' : m.toString();
    return `${hour12}:${minStr} ${ampm}`;
  };

  // --- Visual Component: Representative Week ---
  const WeekVisual = () => {
    const start = inputs.startHour;
    const end = inputs.endHour;

    // Scale Definition: 1 hour = 40 pixels
    const pixelsPerHour = 40;
    const hoursInView = end - start;
    const totalContainerHeight = hoursInView * pixelsPerHour;

    // Calculate Block Height based on Meeting Duration
    const blockHeight = (inputs.minutesPerMeeting / 60) * pixelsPerHour;

    const daysToShow = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const meetingsPerActiveDay = stats.meetingsPerWeek / inputs.workDaysPerWeek;
    const visualBlockCount = Math.round(meetingsPerActiveDay);

    const startTimeOptions = [];
    for (let i = 7; i <= 10; i += 0.5) startTimeOptions.push(i);

    const endTimeOptions = [];
    for (let i = 15; i <= 19; i += 0.5) endTimeOptions.push(i);

    return (
      <div>
        <h3 className="text-sm font-bold text-slate-400 dark:text-slate-300 flex items-center justify-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />{' '}
          Representative Week Load
        </h3>

        {/* Dropdown Controls */}
        <div className="flex justify-center items-center mb-6">
          <div className="flex gap-4 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-wide">
                Start
              </label>
              <div className="relative">
                <select
                  value={inputs.startHour}
                  onChange={(e) =>
                    updateInput('startHour', parseFloat(e.target.value))
                  }
                  className="appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 pr-6 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer text-xs text-slate-700 dark:text-slate-200"
                >
                  {startTimeOptions.map((t) => (
                    <option key={t} value={t}>
                      {formatTime(t)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-1.5 top-2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-slate-500 uppercase tracking-wide">
                End
              </label>
              <div className="relative">
                <select
                  value={inputs.endHour}
                  onChange={(e) =>
                    updateInput('endHour', parseFloat(e.target.value))
                  }
                  className="appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 pr-6 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer text-xs text-slate-700 dark:text-slate-200"
                >
                  {endTimeOptions.map((t) => (
                    <option key={t} value={t}>
                      {formatTime(t)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-1.5 top-2 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Time Labels Sidebar */}
          <div
            className="flex flex-col justify-between pt-6 pb-0 w-12 flex-shrink-0 relative"
            style={{ height: `${totalContainerHeight + 25}px` }}
          >
            <div className="text-[10px] text-right pr-2 text-slate-400 dark:text-slate-500 font-bold -mt-2">
              {formatTime(inputs.startHour)}
            </div>
            <div className="text-[10px] text-right pr-2 text-slate-400 dark:text-slate-500 font-bold -mb-2">
              {formatTime(inputs.endHour)}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-6 gap-1 mb-1 pl-1">
              {daysToShow.map((day, idx) => (
                <div
                  key={day}
                  className={`text-[10px] text-center font-medium ${idx >= inputs.workDaysPerWeek ? 'text-slate-400 dark:text-slate-600' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-6 gap-1 pl-1">
              {daysToShow.map((day, dayIdx) => {
                const isActiveDay = dayIdx < inputs.workDaysPerWeek;

                return (
                  <div
                    key={day}
                    className={`relative rounded-sm border ${isActiveDay ? 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800' : 'bg-slate-50 dark:bg-slate-950/30 border-transparent'}`}
                    style={{ height: `${totalContainerHeight}px` }}
                  >
                    {isActiveDay && (
                      <div className="flex flex-col gap-[2px] p-[2px]">
                        {Array.from({ length: visualBlockCount }).map(
                          (_, i) => (
                            <div
                              key={i}
                              className="w-full bg-cyan-500 dark:bg-cyan-600 border border-cyan-400 dark:border-cyan-500 rounded-[1px] shadow-sm flex-shrink-0 opacity-80"
                              style={{
                                height: `${Math.max(2, blockHeight - 2)}px`,
                              }}
                              title={`Meeting ${i + 1}: ${inputs.minutesPerMeeting} mins`}
                            />
                          )
                        )}
                      </div>
                    )}

                    {!isActiveDay && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                        <div className="w-full h-[1px] bg-slate-300 dark:bg-slate-700 rotate-45 transform scale-150"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 text-[10px] text-slate-400 dark:text-slate-500 italic border-t border-slate-200 dark:border-slate-800 pt-2 ml-14">
          *Visualization range: {formatTime(inputs.startHour)} to{' '}
          {formatTime(inputs.endHour)}. Each block represents one{' '}
          {inputs.minutesPerMeeting}-minute meeting.
        </div>
      </div>
    );
  };

  if (!isLoaded)
    return <div className="p-10 text-center text-slate-500">Loading...</div>;

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 py-4 px-6 flex justify-between items-center shrink-0 shadow-md z-10 transition-colors duration-300">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-50 dark:bg-cyan-500/10 p-2 rounded-lg border border-cyan-200 dark:border-cyan-500/50 shadow-sm dark:shadow-[0_0_10px_rgba(34,211,238,0.2)]">
            <TrendingUp className="text-cyan-600 dark:text-cyan-400 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Practice Capacity
              <span className="text-[10px] align-top bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 px-1.5 py-0.5 rounded font-bold tracking-wider">
                TOOL
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Model practice efficiency and client load
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Controls */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">
                <Users className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>Practice Variables</span>
              </div>

              <InputGroup
                label="Number of Clients"
                value={inputs.numClients}
                min={50}
                max={1000}
                step={10}
                customScale={[50, 250, 500, 750, 1000]}
                onChange={(v) => updateInput('numClients', v)}
              />

              <InputGroup
                label="Meetings / Client / Year"
                value={inputs.meetingsPerClient}
                min={2}
                max={10}
                step={1}
                customScale={[2, 4, 6, 8, 10]}
                onChange={(v) => updateInput('meetingsPerClient', v)}
              />

              <InputGroup
                label="Minutes per Meeting"
                value={inputs.minutesPerMeeting}
                min={15}
                max={90}
                step={5}
                suffix=" min"
                customScale={[15, 30, 45, 60, 75, 90]}
                onChange={(v) => updateInput('minutesPerMeeting', v)}
              />

              <div className="my-6 border-t border-slate-200 dark:border-slate-800"></div>

              <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-200 font-semibold">
                <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>Time Constraints</span>
              </div>

              <InputGroup
                label="Work Hours / Day"
                value={inputs.hoursPerDay}
                min={4}
                max={12}
                step={0.5}
                suffix=" hrs"
                customScale={[4, 6, 8, 10, 12]}
                onChange={(v) => updateInput('hoursPerDay', v)}
              />

              <InputGroup
                label="Work Days / Week"
                value={inputs.workDaysPerWeek}
                min={3}
                max={6}
                step={0.5}
                customScale={[3, 4, 5, 6]}
                onChange={(v) => updateInput('workDaysPerWeek', v)}
              />

              <InputGroup
                label="Weeks / Year"
                value={inputs.weeksPerYear}
                min={40}
                max={52}
                step={1}
                customScale={[40, 42, 44, 46, 48, 50, 52]}
                onChange={(v) => updateInput('weeksPerYear', v)}
              />
            </Card>
          </div>

          {/* RIGHT COLUMN: Output & Visualization */}
          <div className="lg:col-span-8 space-y-6">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox
                label="Mtgs / Week"
                value={stats.meetingsPerWeek.toFixed(1)}
                highlight={true}
                valueSize="text-3xl"
              />
              <StatBox
                label="Mtgs / Day"
                value={stats.meetingsPerDay.toFixed(1)}
              />
              <StatBox
                label="Mtgs / Month"
                value={stats.meetingsPerMonth.toFixed(1)}
              />
              <StatBox
                label="Total Mtgs/Year"
                value={stats.totalMeetingsYear.toLocaleString()}
              />
            </div>

            {/* Capacity Meter */}
            <Card className="p-5 relative overflow-hidden">
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200">
                    Meeting Capacity Load
                  </h3>
                  <div className="flex flex-col mt-2 gap-1">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 inline-block self-start">
                      <span className="text-slate-900 dark:text-slate-200 font-bold">
                        {Math.round(
                          (stats.totalMeetingsYear * inputs.minutesPerMeeting) /
                            60
                        ).toLocaleString()}
                      </span>{' '}
                      Client Mtg Hours
                      <span className="mx-2 text-slate-400 dark:text-slate-600">
                        /
                      </span>
                      <span className="text-slate-900 dark:text-slate-200 font-bold">
                        {Math.round(
                          stats.workDaysPerYear * inputs.hoursPerDay
                        ).toLocaleString()}
                      </span>{' '}
                      Total Work Hours
                    </div>
                  </div>
                </div>
                <div
                  className={`text-2xl font-bold px-3 py-1 rounded-lg border ${getCapacityColor(stats.capacityPercentage)}`}
                >
                  {stats.capacityPercentage.toFixed(1)}%
                </div>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-900/50 rounded-full h-4 overflow-hidden mb-2 border border-slate-300 dark:border-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${getBarColor(stats.capacityPercentage)}`}
                  style={{
                    width: `${Math.min(stats.capacityPercentage, 100)}%`,
                  }}
                ></div>
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wide">
                <span>0% (Empty Practice)</span>
                <span>50% (Balanced)</span>
                <span>100% (Burnout)</span>
              </div>

              {stats.capacityPercentage > 80 && (
                <div className="mt-4 flex gap-3 items-start p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 text-sm rounded-lg border border-rose-200 dark:border-rose-900/50">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
                  <div>
                    <strong className="block mb-0.5 text-rose-900 dark:text-rose-200">
                      High Capacity Warning
                    </strong>
                    You are spending over 80% of your available work hours in
                    meetings. This leaves little time for research, admin, or
                    business development.
                  </div>
                </div>
              )}
            </Card>

            {/* Strategy Notes */}
            <Card className="p-4 bg-cyan-50 dark:bg-cyan-950/10 border-cyan-100 dark:border-cyan-900/30">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                  <Briefcase className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-sm">Strategy Notes</span>
                </div>
                <button
                  onClick={handleManualSave}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                    saveSuccess
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3" />
                      Save Notes
                    </>
                  )}
                </button>
              </div>
              <textarea
                className="w-full p-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 min-h-[80px]"
                placeholder="Type your capacity planning notes here..."
                value={inputs.notes}
                onChange={(e) => updateInput('notes', e.target.value)}
              />
            </Card>

            {/* Calendar Visualization */}
            <Card className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200 mb-4">
                    Calculated Work Schedule
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400">
                        Work Days / Year
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-200">
                        {stats.workDaysPerYear}
                      </span>
                    </li>
                    <li className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400">
                        Work Hours / Day
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-200">
                        {inputs.hoursPerDay} hrs
                      </span>
                    </li>
                    <li className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400">
                        Meeting Hours / Day
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-200">
                        {(
                          (stats.meetingsPerDay * inputs.minutesPerMeeting) /
                          60
                        ).toFixed(1)}{' '}
                        hrs
                      </span>
                    </li>
                    <li className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400">
                        Meeting Hours / Week
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-200">
                        {(
                          (stats.meetingsPerWeek * inputs.minutesPerMeeting) /
                          60
                        ).toFixed(1)}{' '}
                        hrs
                      </span>
                    </li>
                    <li className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-100 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400">
                        Admin/Free Hours / Week
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-200">
                        {Math.max(
                          0,
                          inputs.workDaysPerWeek * inputs.hoursPerDay -
                            (stats.meetingsPerWeek * inputs.minutesPerMeeting) /
                              60
                        ).toFixed(1)}{' '}
                        hrs
                      </span>
                    </li>
                    <li className="flex justify-between p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded border border-cyan-100 dark:border-cyan-900/30">
                      <span className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
                        <Palmtree className="w-4 h-4" />
                        Implied PTO
                      </span>
                      <span className="font-bold text-cyan-900 dark:text-cyan-100">
                        {stats.ptoWeeks} weeks / year
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="flex-1 border-l border-slate-200 dark:border-slate-800 pl-0 md:pl-8 pt-4 md:pt-0">
                  <WeekVisual />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CapacityCalculator;
