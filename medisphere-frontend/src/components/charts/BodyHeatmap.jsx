// src/components/charts/BodyHeatmap.jsx
// 2D Medical Body Heatmap — SVG based, color-coded risk regions
// Risk values are passed as props; when 0/null they show gray (no data)
// Future: populate from backend risk data

import { useState } from 'react';

const RISK_COLORS = {
  normal:   { fill: '#d1fae5', stroke: '#10B981', label: 'Normal',   text: '#065f46' },
  mild:     { fill: '#fef3c7', stroke: '#F59E0B', label: 'Mild Risk', text: '#78350f' },
  moderate: { fill: '#fed7aa', stroke: '#F97316', label: 'Moderate',  text: '#7c2d12' },
  high:     { fill: '#fee2e2', stroke: '#EF4444', label: 'High Risk', text: '#7f1d1d' },
  none:     { fill: '#f1f5f9', stroke: '#cbd5e1', label: 'No Data',   text: '#64748b' },
};

const getRiskLevel = (score) => {
  if (score === null || score === undefined) return 'none';
  if (score < 25) return 'normal';
  if (score < 50) return 'mild';
  if (score < 75) return 'moderate';
  return 'high';
};

const RegionPath = ({ id, d, cx, cy, label, risk, onHover, hovered }) => {
  const level = getRiskLevel(risk);
  const color = RISK_COLORS[level];
  const isHovered = hovered === id;
  return (
    <g
      onMouseEnter={() => onHover({ id, label, risk, level })}
      onMouseLeave={() => onHover(null)}
      className="cursor-pointer"
    >
      <path
        d={d}
        fill={color.fill}
        stroke={color.stroke}
        strokeWidth={isHovered ? 2 : 1}
        opacity={isHovered ? 1 : 0.85}
        className="transition-all duration-200"
      />
      <text x={cx} y={cy} textAnchor="middle" fontSize="8" fill={color.text} fontWeight="600" className="select-none pointer-events-none">
        {label}
      </text>
    </g>
  );
};

export const BodyHeatmap = ({ risks = {} }) => {
  const [tooltip, setTooltip] = useState(null);
  const [hovered, setHovered] = useState(null);

  const handleHover = (info) => {
    setTooltip(info);
    setHovered(info?.id || null);
  };

  // Front body regions
  const frontRegions = [
    { id: 'head',      d: 'M 100 20 C 80 20 65 35 65 55 C 65 75 80 88 100 88 C 120 88 135 75 135 55 C 135 35 120 20 100 20 Z', cx: 100, cy: 55, label: 'Head' },
    { id: 'neck',      d: 'M 88 88 L 112 88 L 115 105 L 85 105 Z', cx: 100, cy: 96, label: 'Neck' },
    { id: 'chest',     d: 'M 75 105 C 65 108 57 115 55 130 L 50 165 L 150 165 L 145 130 C 143 115 135 108 125 105 L 115 105 L 85 105 Z', cx: 100, cy: 138, label: 'Chest' },
    { id: 'abdomen',   d: 'M 50 165 L 50 200 C 50 215 60 220 75 220 L 125 220 C 140 220 150 215 150 200 L 150 165 Z', cx: 100, cy: 193, label: 'Abdomen' },
    { id: 'pelvis',    d: 'M 60 220 L 140 220 L 145 245 L 55 245 Z', cx: 100, cy: 233, label: 'Pelvis' },
    { id: 'leftArm',   d: 'M 50 107 L 35 108 C 25 110 18 120 15 135 L 10 180 L 35 180 L 40 140 L 50 135 Z', cx: 25, cy: 143, label: 'L.Arm' },
    { id: 'rightArm',  d: 'M 150 107 L 165 108 C 175 110 182 120 185 135 L 190 180 L 165 180 L 160 140 L 150 135 Z', cx: 175, cy: 143, label: 'R.Arm' },
    { id: 'leftHand',  d: 'M 10 180 L 35 180 L 38 205 C 38 215 30 220 20 218 L 8 215 Z', cx: 23, cy: 199, label: 'L.Hand' },
    { id: 'rightHand', d: 'M 165 180 L 190 180 L 192 215 L 180 218 C 170 220 162 215 162 205 Z', cx: 177, cy: 199, label: 'R.Hand' },
    { id: 'leftLeg',   d: 'M 60 245 L 95 245 L 95 340 L 58 340 Z', cx: 77, cy: 293, label: 'L.Leg' },
    { id: 'rightLeg',  d: 'M 105 245 L 140 245 L 142 340 L 105 340 Z', cx: 123, cy: 293, label: 'R.Leg' },
    { id: 'leftFoot',  d: 'M 58 340 L 95 340 L 95 360 L 48 360 Z', cx: 72, cy: 350, label: 'L.Foot' },
    { id: 'rightFoot', d: 'M 105 340 L 142 340 L 152 360 L 105 360 Z', cx: 128, cy: 350, label: 'R.Foot' },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {Object.entries(RISK_COLORS).map(([key, val]) => (
          key !== 'none' && (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: val.fill, border: `1.5px solid ${val.stroke}` }} />
              <span className="text-xs text-gray-400">{val.label}</span>
            </div>
          )
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-surface-2 border border-gray-300" />
          <span className="text-xs text-gray-400">No Data</span>
        </div>
      </div>

      {/* SVG Body */}
      <div className="relative">
        <svg viewBox="0 0 200 375" width="200" height="375" className="drop-shadow-sm">
          {/* Body outline background */}
          <ellipse cx="100" cy="55" rx="38" ry="38" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
          {frontRegions.map((region) => (
            <RegionPath
              key={region.id}
              {...region}
              risk={risks[region.id] ?? null}
              onHover={handleHover}
              hovered={hovered}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute top-0 left-full ml-3 bg-surface border border-white/10 rounded-xl shadow-card-lg p-3 z-10 min-w-[140px] animate-fade-in"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          >
            <p className="text-sm font-bold text-gray-200">{tooltip.label}</p>
            <div className="mt-1.5 space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: RISK_COLORS[tooltip.level]?.fill, border: `1.5px solid ${RISK_COLORS[tooltip.level]?.stroke}` }}
                />
                <span className="text-xs font-semibold" style={{ color: RISK_COLORS[tooltip.level]?.text }}>
                  {RISK_COLORS[tooltip.level]?.label}
                </span>
              </div>
              {tooltip.risk !== null && tooltip.risk !== undefined && (
                <p className="text-xs text-gray-400">Risk: {tooltip.risk}</p>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 text-center">Hover over body regions for details</p>
    </div>
  );
};

export default BodyHeatmap;
