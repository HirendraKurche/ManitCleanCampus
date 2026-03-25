// pages/student/SubmitComplaintPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraCapture from '../../components/CameraCapture';
import useGPS from '../../hooks/useGPS';
import api from '../../utils/api';
import { uploadToCloudinary } from '../../utils/cloudinaryUpload';

const INDOOR_LOCATIONS = {
    'Academic Block A':  ['Men\'s Washroom', 'Women\'s Washroom', 'Corridor', 'Lobby', 'Classroom'],
    'Academic Block B':  ['Men\'s Washroom', 'Women\'s Washroom', 'Corridor', 'Lobby', 'Classroom'],
    'Library':           ['Ground Floor', 'First Floor', 'Reading Room', 'Washroom'],
    'Hostel Block 1':    ['Common Washroom', 'Corridor', 'Common Room'],
    'Hostel Block 2':    ['Common Washroom', 'Corridor', 'Common Room'],
    'Cafeteria':         ['Dining Hall', 'Kitchen Area', 'Washroom'],
    'Sports Complex':    ['Changing Room', 'Washroom', 'Ground'],
    'Admin Building':    ['Washroom', 'Corridor', 'Lobby'],
};

const CATEGORIES = [
    { value: 'cleaning',   label: 'Cleaning',    color: 'from-blue-600 to-blue-500' },
    { value: 'garbage',    label: 'Garbage',     color: 'from-amber-600 to-amber-500' },
    { value: 'water',      label: 'Water Issue', color: 'from-cyan-600 to-cyan-500' },
    { value: 'electrical', label: 'Electrical',  color: 'from-yellow-600 to-yellow-500' },
    { value: 'other',      label: 'Other',       color: 'from-slate-600 to-slate-500' },
];

export default function SubmitComplaintPage() {
    const navigate = useNavigate();
    const { latitude, longitude, refresh: refreshGPS } = useGPS();
    const [step, setStep] = useState('form');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [photoBlob, setPhotoBlob] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [building, setBuilding] = useState('');
    const [area, setArea] = useState('');
    const [error, setError] = useState('');
    const [duplicateData, setDuplicateData] = useState(null);
    const [upvoted, setUpvoted] = useState(false);

    const handlePhotoCapture = (blob) => {
        setPhotoBlob(blob);
        setPhotoPreview(URL.createObjectURL(blob));
    };

    const handleSubmit = async () => {
        if (!category) { setError('Please select a category'); return; }
        setError('');
        setStep('uploading');
        refreshGPS();
        try {
            let photoUrl = null;
            if (photoBlob) {
                photoUrl = await uploadToCloudinary(photoBlob, { folder: 'facility/complaints' });
            }
            const payload = {
                category, description, photoUrl,
                gps: latitude && longitude ? { latitude, longitude } : undefined,
                indoorLocation: building ? { building, area } : undefined,
            };
            const { data } = await api.post('/api/complaints', payload);
            if (data.isDuplicate) {
                setDuplicateData(data.existingComplaint);
                setStep('duplicate');
            } else {
                setStep('success');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit complaint');
            setStep('form');
        }
    };

    const handleUpvote = async () => {
        try {
            await api.post(`/api/complaints/${duplicateData._id}/upvote`);
            setUpvoted(true);
        } catch (err) { setUpvoted(true); }
    };

    if (step === 'success') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-white">Complaint Submitted!</h2>
                <p className="text-slate-400 text-sm max-w-xs">Your complaint has been received. A supervisor will assign it to a worker shortly.</p>
                <button onClick={() => navigate('/student/complaints')} className="py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-[1.02]">
                    View My Complaints
                </button>
            </div>
        );
    }

    if (step === 'duplicate') {
        const STATUS_COLORS = { submitted: 'bg-blue-500/20 text-blue-400', assigned: 'bg-purple-500/20 text-purple-400', in_progress: 'bg-amber-500/20 text-amber-400', completed: 'bg-emerald-500/20 text-emerald-400', verified: 'bg-teal-500/20 text-teal-400' };
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-white">Similar complaint found</h1>
                    <p className="text-slate-400 text-sm mt-1">Someone has already reported this issue nearby. Upvote it to increase priority instead.</p>
                </div>
                <div className="bg-slate-900/60 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-white font-medium capitalize">{duplicateData.category}</p>
                            {duplicateData.description && (<p className="text-slate-400 text-sm mt-1">{duplicateData.description}</p>)}
                            {duplicateData.indoorLocation?.building && (<p className="text-slate-500 text-xs mt-1">{duplicateData.indoorLocation.building}{duplicateData.indoorLocation.area ? ` — ${duplicateData.indoorLocation.area}` : ''}</p>)}
                        </div>
                        <span className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${STATUS_COLORS[duplicateData.status] || 'bg-slate-700 text-slate-300'}`}>{duplicateData.status.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-xs">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                        {duplicateData.upvoteCount} {duplicateData.upvoteCount === 1 ? 'upvote' : 'upvotes'}
                    </div>
                    <button onClick={handleUpvote} disabled={upvoted} className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${upvoted ? 'bg-emerald-500/20 text-emerald-400 cursor-default' : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:scale-[1.02]'}`}>
                        {upvoted ? '✓ Upvoted — thanks!' : 'Upvote this complaint'}
                    </button>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setStep('form')} className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors">Back</button>
                    <button onClick={() => navigate('/student/complaints')} className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors">My complaints</button>
                </div>
            </div>
        );
    }

    if (step === 'uploading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <svg className="w-10 h-10 animate-spin text-purple-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-slate-400">Submitting complaint...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-white">Report an Issue</h1>
                <p className="text-slate-400 text-sm mt-1">Help us keep the campus clean</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-white font-medium text-sm">Category</h3>
                <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => (
                        <button key={cat.value} onClick={() => setCategory(cat.value)} className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${category === cat.value ? `bg-gradient-to-r ${cat.color} text-white shadow-lg scale-[1.02]` : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 border border-slate-700'}`}>{cat.label}</button>
                    ))}
                </div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-white font-medium text-sm">Location</h3>
                <select value={building} onChange={(e) => { setBuilding(e.target.value); setArea(''); }} className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all">
                    <option value="">Select building</option>
                    {Object.keys(INDOOR_LOCATIONS).map((b) => (<option key={b} value={b}>{b}</option>))}
                </select>
                {building && (
                    <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all">
                        <option value="">Select area</option>
                        {INDOOR_LOCATIONS[building].map((a) => (<option key={a} value={a}>{a}</option>))}
                    </select>
                )}
                {latitude && (<p className="text-slate-600 text-xs">GPS captured: {latitude.toFixed(5)}, {longitude.toFixed(5)}</p>)}
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <h3 className="text-white font-medium text-sm">Description (optional)</h3>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue..." rows={3} maxLength={500} className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none" />
                <p className="text-slate-600 text-xs text-right">{description.length}/500</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h3 className="text-white font-medium text-sm">Photo (recommended)</h3>
                {photoPreview ? (
                    <div className="space-y-2">
                        <img src={photoPreview} alt="Issue" className="w-full rounded-xl border border-slate-700" />
                        <button onClick={() => { setPhotoBlob(null); setPhotoPreview(null); }} className="w-full py-2 text-slate-500 text-sm hover:text-slate-300 transition-colors">Remove photo</button>
                    </div>
                ) : (
                    <CameraCapture onCapture={handlePhotoCapture} label="Take Photo of Issue" facingMode="environment" autoStart={false} />
                )}
            </div>
            {error && (<div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>)}
            <button onClick={handleSubmit} disabled={!category} className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-600/25 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]">
                Submit Complaint
            </button>
        </div>
    );
}
