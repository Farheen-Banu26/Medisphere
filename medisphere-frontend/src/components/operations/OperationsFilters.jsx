import { memo } from 'react';

export const OperationsFilters = memo(function OperationsFilters({ searchTerm, onSearchChange, riskFilter, onRiskChange, genderFilter, onGenderChange, bloodGroupFilter, onBloodGroupChange, predictionFilter, onPredictionChange, patients = [] }) {
  const uniqueGenders = Array.from(new Set(patients.map((p) => p.gender).filter(Boolean)));
  const uniqueBloodGroups = Array.from(new Set(patients.map((p) => p.bloodGroup).filter(Boolean)));
  const uniquePredictionStatuses = Array.from(new Set(patients.map((p) => p.predictionStatus).filter(Boolean)));

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <label className="block">
        <span className="form-label">Search patient</span>
        <input aria-label="Search patient" className="form-input" value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} placeholder="Patient name or ID" />
      </label>
      <label className="block">
        <span className="form-label">Risk</span>
        <select aria-label="Filter by risk" className="form-select" value={riskFilter} onChange={(e) => onRiskChange(e.target.value)}>
          <option value="">All</option>
          <option value="low">Low</option>
          <option value="moderate">Moderate</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </label>
      <label className="block">
        <span className="form-label">Gender</span>
        <select aria-label="Filter by gender" className="form-select" value={genderFilter} onChange={(e) => onGenderChange(e.target.value)}>
          <option value="">All</option>
          {uniqueGenders.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="form-label">Blood group</span>
        <select aria-label="Filter by blood group" className="form-select" value={bloodGroupFilter} onChange={(e) => onBloodGroupChange(e.target.value)}>
          <option value="">All</option>
          {uniqueBloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="form-label">Prediction status</span>
        <select aria-label="Filter by prediction status" className="form-select" value={predictionFilter} onChange={(e) => onPredictionChange(e.target.value)}>
          <option value="">All</option>
          {uniquePredictionStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
    </div>
  );
});

export default OperationsFilters;
