import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { DollarSign, FileText, Plus, Trash2, Save, CheckCircle2 } from "lucide-react";

const ServiceFeeAndPolicyPanel = () => {
  const [serviceFee, setServiceFee] = useState("");
  const [policies, setPolicies] = useState([]);
  const [newPolicy, setNewPolicy] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  

  // Load settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const ref = doc(db, "servicepolicy", "main");
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setServiceFee(data.servicefee ?? "");
          setPolicies(data.policies ?? []); // array of policy strings
        }
      } catch (error) {
        console.error("Error loading service policy:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);
      const ref = doc(db, "servicepolicy", "main");

      await updateDoc(ref, {
        servicefee: Number(serviceFee),
        policies: policies,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error updating service policy:", error);
      alert("Failed to update. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPolicy = () => {
    if (!newPolicy.trim()) return;
    setPolicies([...policies, newPolicy.trim()]);
    setNewPolicy("");
  };

  const handleDeletePolicy = (index) => {
    setPolicies(policies.filter((_, i) => i !== index));
  };

  const handleUpdatePolicy = (index, value) => {
    const updated = [...policies];
    updated[index] = value;
    setPolicies(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white rounded-3xl py-8 px-4 sm:py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">
              Service Configuration
            </h1>
          </div>
          <p className="text-slate-600 text-lg ml-0 sm:ml-15">
            Manage your monthly service fees and compliance policies
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all duration-300 hover:shadow-3xl">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>

          <div className="p-6 sm:p-10">
            {/* Service Fee Section */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold text-xl">
                    Monthly Service Fee
                  </label>
                  <p className="text-sm text-slate-500">Set your monthly hosting fee</p>
                </div>
              </div>

              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl group-focus-within:text-emerald-600 transition-colors">
                  ₱
                </span>
                <input
                  type="number"
                  value={serviceFee}
                  onChange={(e) => setServiceFee(e.target.value)}
                  placeholder="0.00"
                  className="w-full border-2 border-slate-200 rounded-2xl pl-12 pr-6 py-5 text-xl font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="relative my-12">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-slate-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                  Policies
                </span>
              </div>
            </div>

            {/* Policies Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <label className="block text-slate-800 font-bold text-xl">
                    Host Policies
                  </label>
                  <p className="text-sm text-slate-500">Displayed during guest registration</p>
                </div>
              </div>

              {/* Existing Policies */}
              {policies.length > 0 ? (
                <div
    className="space-y-4 mb-6 overflow-y-auto pr-2"
    style={{
      maxHeight: "350px", // adjust height as needed
    }}
  >
                  {policies.map((policy, index) => (
                    <div
                      key={index}
                      className="group relative bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center font-bold text-sm mt-1">
                          {index + 1}
                        </div>
                        
                        <textarea
                          value={policy}
                          onChange={(e) => handleUpdatePolicy(index, e.target.value)}
                          rows={2}
                          className="flex-1 bg-transparent outline-none resize-none text-slate-700 font-medium leading-relaxed"
                        />

                        <button
                          onClick={() => handleDeletePolicy(index)}
                          className="flex-shrink-0 w-10 h-10 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center text-red-500 hover:bg-red-50 hover:border-red-300 transition-all opacity-0 group-hover:opacity-100"
                          title="Delete policy"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-6 p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-center">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No policies yet</p>
                  <p className="text-sm text-slate-400">Add your first policy below</p>
                </div>
              )}

              {/* Add New Policy */}
              <div className="bg-gradient-to-br from-white to-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Plus className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-slate-700">Add New Policy</span>
                </div>
                
                <textarea
                  rows={3}
                  value={newPolicy}
                  onChange={(e) => setNewPolicy(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleAddPolicy();
                    }
                  }}
                  placeholder="Type your policy here... (Ctrl+Enter to add)"
                  className="w-full outline-none resize-none bg-white border-2 border-slate-200 rounded-xl p-4 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all"
                />

                <button
                  onClick={handleAddPolicy}
                  disabled={!newPolicy.trim()}
                  className="mt-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Policy
                </button>
              </div>
            </div>

            {/* Error Message */}
            

            {/* Save Button */}
            <div className="mt-8">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full py-5 rounded-2xl font-bold text-white text-lg transition-all flex items-center justify-center gap-3 ${
                  saving
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:scale-[1.02] shadow-xl hover:shadow-2xl active:scale-[0.98]"
                }`}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>

              {saved && (
                <div className="mt-4 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-center justify-center gap-3 animate-pulse">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <p className="text-emerald-700 font-semibold">Changes saved successfully!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Helper Text */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            Changes will be reflected immediately after saving
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceFeeAndPolicyPanel;
