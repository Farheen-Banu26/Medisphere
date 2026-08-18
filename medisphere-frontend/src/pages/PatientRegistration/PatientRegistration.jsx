// src/pages/PatientRegistration/PatientRegistration.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  RiUserLine, RiPhoneLine, RiMedicineBottleLine, RiShieldLine,
  RiAlertLine, RiCheckLine, RiArrowLeftLine, RiArrowRightLine,
  RiHospitalLine,
} from 'react-icons/ri';
import { patientService } from '../../services/patientService';
import { useNotification } from '../../context/NotificationContext';

const STEPS = [
  { id: 1, label: 'Personal',   icon: RiUserLine           },
  { id: 2, label: 'Contact',    icon: RiPhoneLine          },
  { id: 3, label: 'Medical',    icon: RiMedicineBottleLine },
  { id: 4, label: 'Insurance',  icon: RiShieldLine         },
  { id: 5, label: 'Emergency',  icon: RiAlertLine          },
];

const schema = z.object({
  patientId:      z.string().min(1, 'Patient ID is required'),
  firstName:      z.string().min(2, 'First name must be at least 2 characters'),
  lastName:       z.string().min(2, 'Last name required'),
  gender:         z.string().min(1, 'Gender is required'),
  dob:            z.string().min(1, 'Date of birth is required'),
  email:          z.string().email('Invalid email address'),
  phone:          z.string().min(10, 'Valid phone number required'),
  address:        z.string().min(5, 'Address required'),
  bloodGroup:     z.string().optional(),
  allergies:      z.string().optional(),
  conditions:     z.string().optional(),
  medications:    z.string().optional(),
  insuranceId:    z.string().optional(),
  insuranceProv:  z.string().optional(),
  emergencyName:  z.string().optional(),
  emergencyRel:   z.string().optional(),
  emergencyPhone: z.string().optional(),
});

const stepFields = {
  1: ['patientId', 'firstName', 'lastName', 'gender', 'dob'],
  2: ['email', 'phone', 'address'],
  3: ['bloodGroup', 'allergies', 'conditions', 'medications'],
  4: ['insuranceId', 'insuranceProv'],
  5: ['emergencyName', 'emergencyRel', 'emergencyPhone'],
};

const Field = ({ label, id, error, required, children }) => (
  <div>
    <label htmlFor={id} className="form-label">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="form-error mt-1"><RiAlertLine className="w-3 h-3" />{error}</p>}
  </div>
);

export const PatientRegistration = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [step, setStep]       = useState(1);
  const [submitting, setSub]  = useState(false);
  const [submitted, setSub2]  = useState(false);

  const { register, handleSubmit, trigger, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const advance = async () => {
    const valid = await trigger(stepFields[step]);
    if (valid) setStep(s => Math.min(5, s + 1));
  };

  const handleFormSubmit = handleSubmit(async (data, event) => {
    if (step < 5) {
      event?.preventDefault();
      await advance();
      return;
    }
    await onSubmit(data);
  });

  const onSubmit = async (data) => {
    setSub(true);
    try {
      const payload = {
        patientId:     data.patientId,
        firstName:     data.firstName,
        lastName:      data.lastName,
        gender:        data.gender,
        dob:           data.dob,
        email:         data.email,
        phone:         data.phone,
        address:       data.address,
        bloodGroup:    data.bloodGroup,
        allergies:     data.allergies ? data.allergies.split(',').map(a => a.trim()) : [],
        conditions:    data.conditions,
        medications:   data.medications ? data.medications.split(',').map(m => m.trim()) : [],
        insuranceId:   data.insuranceId,
        insuranceProv: data.insuranceProv,
        emergencyContact: {
          name:         data.emergencyName,
          relationship: data.emergencyRel,
          phone:        data.emergencyPhone,
        },
      };
      await patientService.registerPatient(payload);
      notify.success('Patient Registered', `${data.firstName} ${data.lastName} has been successfully onboarded.`);
      setSub2(true);
    } catch (err) {
      notify.error('Registration Failed', err.response?.data?.message || err.message);
    } finally {
      setSub(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 animate-slide-up">
        <div className="w-20 h-20 bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <RiCheckLine className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Patient Registered Successfully</h2>
        <p className="text-gray-400 mb-8">The patient has been onboarded into the MediSphere Digital Twin platform.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/doctor/patients')} className="btn-outline">View All Patients</button>
          <button onClick={() => { setSub2(false); setStep(1); }} className="btn-primary">Register Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <RiHospitalLine className="w-6 h-6 text-blue-400" />
          Patient Registration
        </h1>
        <p className="page-subtitle">Onboard a new patient into the Healthcare Digital Twin Platform</p>
      </div>

      {/* Step Indicators */}
      <div className="card p-4">
        <div className="flex items-center justify-between relative">
          {/* Progress line */}
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-[#1F2937] z-0">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          {STEPS.map((s) => {
            const done   = step > s.id;
            const active = step === s.id;
            return (
              <div key={s.id} className="flex flex-col items-center gap-1.5 z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  done   ? 'bg-green-600 border-green-600' :
                  active ? 'bg-blue-600 border-blue-600 shadow-glow-blue' :
                           'bg-surface-2 border-[#1F2937]'
                }`}>
                  {done ? (
                    <RiCheckLine className="w-5 h-5 text-white" />
                  ) : (
                    <s.icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-600'}`} />
                  )}
                </div>
                <span className={`text-[10px] font-semibold hidden sm:block ${active ? 'text-blue-400' : done ? 'text-green-400' : 'text-gray-600'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Card */}
      <div className="card-lg">
        <h2 className="section-title mb-5 flex items-center gap-2">
          {(() => { const S = STEPS[step - 1]; return <S.icon className="w-5 h-5 text-blue-400" />; })()}
          {STEPS[step - 1].label} Information
        </h2>

        <form onSubmit={handleFormSubmit} className="space-y-5">

          {/* STEP 1 – Personal */}
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Patient ID" id="patientId" error={errors.patientId?.message} required>
                <input id="patientId" {...register('patientId')} className="form-input" placeholder="e.g. P001" />
              </Field>
              <Field label="First Name" id="firstName" error={errors.firstName?.message} required>
                <input id="firstName" {...register('firstName')} className="form-input" placeholder="First name" />
              </Field>
              <Field label="Last Name" id="lastName" error={errors.lastName?.message} required>
                <input id="lastName" {...register('lastName')} className="form-input" placeholder="Last name" />
              </Field>
              <Field label="Gender" id="gender" error={errors.gender?.message} required>
                <select id="gender" {...register('gender')} className="form-select">
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Date of Birth" id="dob" error={errors.dob?.message} required>
                <input id="dob" type="date" {...register('dob')} className="form-input" />
              </Field>
            </div>
          )}

          {/* STEP 2 – Contact */}
          {step === 2 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Email Address" id="email" error={errors.email?.message} required>
                <input id="email" type="email" {...register('email')} className="form-input" placeholder="patient@example.com" />
              </Field>
              <Field label="Phone Number" id="phone" error={errors.phone?.message} required>
                <input id="phone" {...register('phone')} className="form-input" placeholder="+91 9876543210" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Full Address" id="address" error={errors.address?.message} required>
                  <textarea id="address" {...register('address')} rows={3} className="form-textarea" placeholder="Street, City, State, ZIP" />
                </Field>
              </div>
            </div>
          )}

          {/* STEP 3 – Medical */}
          {step === 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Blood Group" id="bloodGroup" error={errors.bloodGroup?.message}>
                <select id="bloodGroup" {...register('bloodGroup')} className="form-select">
                  <option value="">Select blood group</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Known Allergies" id="allergies">
                <input id="allergies" {...register('allergies')} className="form-input" placeholder="Penicillin, Peanuts (comma-separated)" />
              </Field>
              <Field label="Chronic Conditions" id="conditions">
                <input id="conditions" {...register('conditions')} className="form-input" placeholder="Hypertension, Diabetes…" />
              </Field>
              <Field label="Current Medications" id="medications">
                <input id="medications" {...register('medications')} className="form-input" placeholder="Metformin 500mg, … (comma-separated)" />
              </Field>
            </div>
          )}

          {/* STEP 4 – Insurance */}
          {step === 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Insurance Provider" id="insuranceProv">
                <input id="insuranceProv" {...register('insuranceProv')} className="form-input" placeholder="Star Health, ICICI Lombard…" />
              </Field>
              <Field label="Insurance / Policy ID" id="insuranceId">
                <input id="insuranceId" {...register('insuranceId')} className="form-input" placeholder="POL-XXXXXX" />
              </Field>
            </div>
          )}

          {/* STEP 5 – Emergency */}
          {step === 5 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Emergency Contact Name" id="emergencyName">
                <input id="emergencyName" {...register('emergencyName')} className="form-input" placeholder="Contact person name" />
              </Field>
              <Field label="Relationship" id="emergencyRel">
                <input id="emergencyRel" {...register('emergencyRel')} className="form-input" placeholder="Spouse, Parent…" />
              </Field>
              <Field label="Emergency Phone" id="emergencyPhone">
                <input id="emergencyPhone" {...register('emergencyPhone')} className="form-input" placeholder="+91 9876543210" />
              </Field>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1F2937] mt-2">
            <button
              type="button"
              onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/doctor/patients')}
              className="btn-outline"
            >
              <RiArrowLeftLine className="w-4 h-4" />
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            {step < 5 ? (
              <button type="button" onClick={advance} className="btn-primary">
                Next <RiArrowRightLine className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Registering…</>
                ) : (
                  <><RiCheckLine className="w-4 h-4" /> Register Patient</>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientRegistration;
