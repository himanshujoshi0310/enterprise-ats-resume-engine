
import React from 'react';

interface ScoreMeterProps {
  score: number;
  label: string;
}

const ScoreMeter: React.FC<ScoreMeterProps> = ({ score, label }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="relative flex items-center justify-center">
        <svg className="w-40 h-40 transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            className="text-slate-100"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1.5s ease-out' }}
            className={`${
              score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-rose-500'
            }`}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-4xl font-bold text-slate-800">{score}</span>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">/ 100</span>
        </div>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-700">{label}</h3>
    </div>
  );
};

export default ScoreMeter;
