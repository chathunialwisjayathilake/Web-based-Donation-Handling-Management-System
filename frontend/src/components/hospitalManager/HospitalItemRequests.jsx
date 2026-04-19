import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import HospitalRequestTable from './HospitalRequestTable';
import CreateRequestModal from './CreateRequestModal';

const HospitalItemRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [hospitalId, setHospitalId] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get hospital ID
      const hospitalRes = await api.get(`/hospitals/user/${user.id}`);
      const hData = hospitalRes.data;
      const hId = hData._id || hData.id;
      setHospitalId(hId);

      if (!hId) {
        setError("No hospital profile found for your account.");
        setRequests([]);
        return;
      }

      // 2. Get requests
      const res = await api.get(`/hospital-requests/item/hospital/${hId}`);
      setRequests(res.data);
    } catch (error) {
      console.error("Error fetching item requests:", error);
      if (error.response?.status === 404) {
        setError("Your account is not linked to any registered hospital.");
      } else {
        setError("Failed to synchronize with the coordination server.");
      }
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user]);

  const handleDelete = async (requestId) => {
    if (!window.confirm("Are you sure you want to withdraw this coordination request?")) return;
    try {
      await api.delete(`/hospital-requests/item/${requestId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to withdraw request");
    }
  };

  return (
    <div className="p-10 space-y-10 max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 font-['Work_Sans']">
      <section className="flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">Item Requests</h1>
          <p className="text-slate-500 mt-3 font-medium text-lg">Propose new asset requirements to the central inventory manager.</p>
        </div>
        <button
          disabled={!hospitalId}
          onClick={() => {
            setEditingRequest(null);
            setIsModalOpen(true);
          }}
          className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
        >
          <span className="material-symbols-outlined font-bold">add_circle</span>
          New Asset Request
        </button>
      </section>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-red-50 border border-red-100 rounded-[24px] flex items-center gap-4 text-red-700"
        >
          <span className="material-symbols-outlined text-red-500">error</span>
          <div className="font-bold">{error}</div>
        </motion.div>
      )}

      <HospitalRequestTable
        requests={requests}
        loading={loading}
        title="Asset Coordination"
        icon="inventory_2"
        onDelete={handleDelete}
        onEdit={(req) => {
          setEditingRequest(req);
          setIsModalOpen(true);
        }}
      />

      <CreateRequestModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRequest(null);
        }}
        onSuccess={fetchData}
        type="ITEM"
        hospitalId={hospitalId}
        editRequest={editingRequest}
      />
    </div>
  );
};

export default HospitalItemRequests;
