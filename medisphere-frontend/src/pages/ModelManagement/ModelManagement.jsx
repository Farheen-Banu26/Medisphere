import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RiGitBranchLine, RiSearchLine, RiFilterLine, RiAddLine,
  RiEditLine, RiDeleteBinLine, RiCheckLine,
} from 'react-icons/ri';
import modelService from '../../services/modelService';
import { useNotification } from '../../context/NotificationContext';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const frameworkOptions = [
  { value: '', label: 'All Frameworks' },
  { value: 'TensorFlow', label: 'TensorFlow' },
  { value: 'PyTorch', label: 'PyTorch' },
  { value: 'Scikit-Learn', label: 'Scikit-Learn' },
];

const StatusBadge = ({ status }) => {
  const map = {
    ACTIVE: 'badge-green',
    INACTIVE: 'badge-gray',
  };
  return <span className={`${map[status] || 'badge-gray'} text-[10px] uppercase font-semibold`}>{status || 'UNKNOWN'}</span>;
};

const formatDate = (createdAt) => createdAt ? new Date(createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const buildSummary = (models) => {
  const total = models.length;
  const activeModel = models.find((model) => model.status === 'ACTIVE');
  const bestAccuracy = Math.max(0, ...models.map((model) => model.accuracy || 0));
  const latestVersion = models
    .slice()
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0]?.version || '—';
  return { total, activeModel, bestAccuracy, latestVersion };
};

export const ModelManagement = () => {
  const { notify } = useNotification();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [frameworkFilter, setFrameworkFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editModel, setEditModel] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await modelService.getAllModels();
      setModels(response.data || []);
    } catch (err) {
      notify.error('Unable to load models', err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const filteredModels = useMemo(() => models.filter((model) => {
    const searchText = `${model.modelName || ''} ${model.modelId || ''}`.toLowerCase();
    const matchesSearch = !search || searchText.includes(search.toLowerCase());
    const matchesFramework = !frameworkFilter || model.framework === frameworkFilter;
    const matchesStatus = !statusFilter || model.status === statusFilter;
    return matchesSearch && matchesFramework && matchesStatus;
  }), [models, search, frameworkFilter, statusFilter]);

  const summary = buildSummary(models);

  const handleOpenAdd = () => {
    setEditModel(null);
    setShowModal(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const form = event.target;
    const payload = {
      modelId: form.modelId.value.trim(),
      modelName: form.modelName.value.trim(),
      version: form.version.value.trim(),
      framework: form.framework.value.trim(),
      accuracy: Number(form.accuracy.value),
      precision: Number(form.precision.value),
      recall: Number(form.recall.value),
      status: form.status.value,
      description: form.description.value.trim(),
    };

    setSaving(true);
    try {
      if (editModel) {
        await modelService.updateModel(editModel.modelId, payload);
        notify.success('Model updated', `${payload.modelName} updated successfully.`);
      } else {
        await modelService.createModel(payload);
        notify.success('Model added', `${payload.modelName} added successfully.`);
      }
      setShowModal(false);
      fetchModels();
    } catch (err) {
      notify.error('Save failed', err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await modelService.deleteModel(deleteTarget.modelId);
      notify.success('Model deleted', `${deleteTarget.modelName} removed.`);
      setDeleteTarget(null);
      fetchModels();
    } catch (err) {
      notify.error('Delete failed', err.response?.data?.error || err.message);
    }
  };

  const handleActivate = async (modelId) => {
    try {
      await modelService.activateModel(modelId);
      notify.success('Model activated', 'The selected model is now active.');
      fetchModels();
    } catch (err) {
      notify.error('Activation failed', err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <RiGitBranchLine className="w-6 h-6 text-blue-400" /> Model Management
        </h1>
        <p className="page-subtitle">Register and manage AI model metadata, versions, and deployment status.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className="card-lg border border-[#1F2937] p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Models</p>
          <p className="text-3xl font-bold text-white mt-3">{summary.total}</p>
          <p className="text-sm text-gray-400 mt-2">All registered AI models in the registry.</p>
        </div>
        <div className="card-lg border border-[#1F2937] p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Model</p>
          <p className="text-3xl font-bold text-white mt-3">{summary.activeModel?.modelName || 'None'}</p>
          <p className="text-sm text-gray-400 mt-2">Currently deployed model version.</p>
        </div>
        <div className="card-lg border border-[#1F2937] p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Best Accuracy</p>
          <p className="text-3xl font-bold text-white mt-3">{summary.bestAccuracy.toFixed(1)}%</p>
          <p className="text-sm text-gray-400 mt-2">Highest accuracy across all models.</p>
        </div>
        <div className="card-lg border border-[#1F2937] p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Latest Version</p>
          <p className="text-3xl font-bold text-white mt-3">{summary.latestVersion}</p>
          <p className="text-sm text-gray-400 mt-2">Most recently registered version.</p>
        </div>
      </div>

      <div className="card-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Model Registry</p>
            <h2 className="text-xl font-bold text-white">Registered AI Models</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                className="form-input pl-9"
                placeholder="Search by model name or ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="form-select w-40" value={frameworkFilter} onChange={(e) => setFrameworkFilter(e.target.value)}>
              {frameworkOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select className="form-select w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button type="button" onClick={handleOpenAdd} className="btn-primary btn-sm inline-flex items-center gap-2">
              <RiAddLine className="w-4 h-4" /> Add Model
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading models from backend…</div>
          ) : models.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <RiGitBranchLine className="w-16 h-16 text-gray-600 mx-auto" />
              <p className="text-lg font-bold text-gray-200">No AI models have been registered yet.</p>
              <p className="text-sm text-gray-400">Create your first model metadata record to start version tracking.</p>
              <button onClick={handleOpenAdd} className="btn-primary btn-sm mt-2">Add First Model</button>
            </div>
          ) : (
            <table className="data-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Model Name</th>
                  <th>Version</th>
                  <th>Framework</th>
                  <th>Accuracy</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredModels.map((model) => (
                  <tr key={model.modelId}>
                    <td>{model.modelName}</td>
                    <td>{model.version}</td>
                    <td>{model.framework}</td>
                    <td>{model.accuracy?.toFixed(1)}%</td>
                    <td>{model.precision?.toFixed(1)}%</td>
                    <td>{model.recall?.toFixed(1)}%</td>
                    <td><StatusBadge status={model.status} /></td>
                    <td>{formatDate(model.createdAt)}</td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <button type="button" className="btn-outline btn-sm" onClick={() => { setEditModel(model); setShowModal(true); }}>
                          <RiEditLine className="w-4 h-4" />
                        </button>
                        <button type="button" className="btn-outline btn-sm" onClick={() => handleActivate(model.modelId)}>
                          <RiCheckLine className="w-4 h-4" />
                        </button>
                        <button type="button" className="btn-outline btn-sm text-red-400 hover:text-red-300" onClick={() => setDeleteTarget(model)}>
                          <RiDeleteBinLine className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-lg max-w-3xl w-full animate-slide-up border border-[#1F2937]">
            <form onSubmit={handleSave} className="space-y-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{editModel ? 'Edit Model' : 'New Model'}</p>
                  <h2 className="text-xl font-bold text-white">{editModel ? editModel.modelName : 'Add a new AI model'}</h2>
                </div>
                <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">Cancel</button>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <label className="form-label">Model ID</label>
                  <input name="modelId" defaultValue={editModel?.modelId || ''} className="form-input" placeholder="MODEL-001" required />
                </div>
                <div>
                  <label className="form-label">Model Name</label>
                  <input name="modelName" defaultValue={editModel?.modelName || ''} className="form-input" placeholder="Heart Disease Predictor" required />
                </div>
                <div>
                  <label className="form-label">Version</label>
                  <input name="version" defaultValue={editModel?.version || ''} className="form-input" placeholder="v1.0.0" required />
                </div>
                <div>
                  <label className="form-label">Framework</label>
                  <input name="framework" defaultValue={editModel?.framework || ''} className="form-input" placeholder="TensorFlow" required />
                </div>
                <div>
                  <label className="form-label">Accuracy (%)</label>
                  <input type="number" min="0" max="100" step="0.1" name="accuracy" defaultValue={editModel?.accuracy ?? ''} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Precision (%)</label>
                  <input type="number" min="0" max="100" step="0.1" name="precision" defaultValue={editModel?.precision ?? ''} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Recall (%)</label>
                  <input type="number" min="0" max="100" step="0.1" name="recall" defaultValue={editModel?.recall ?? ''} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select name="status" defaultValue={editModel?.status || 'INACTIVE'} className="form-select">
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="ACTIVE">ACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea name="description" defaultValue={editModel?.description || ''} className="form-input h-24 resize-none" placeholder="Describe the model and its clinical purpose." />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline btn-sm">Cancel</button>
                <button type="submit" className="btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : editModel ? 'Save Changes' : 'Create Model'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="card-lg max-w-md w-full animate-slide-up border border-[#1F2937] p-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Delete Model</p>
            <h3 className="text-xl font-bold text-white mt-2">Remove {deleteTarget.modelName}?</h3>
            <p className="text-sm text-gray-400 mt-3">This will permanently delete the model metadata record from the registry.</p>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="btn-outline btn-sm flex-1">Cancel</button>
              <button type="button" onClick={handleDelete} className="btn-danger btn-sm flex-1">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelManagement;
