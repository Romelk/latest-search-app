// ./src/components/AddReworkStepForm.jsx
import React, { useState, useMemo, useEffect } from 'react';

// --- Constants ---
const LANGUAGES = [ { code: 'en', name: 'English' }, { code: 'de', name: 'German' }, { code: 'cs', name: 'Czech' }, { code: 'pl', name: 'Polish' }];
const PRIMARY_LANG_CODE = 'en';
const WAREHOUSE_IDS = [ 'Warehouse_01', 'Warehouse_02', 'Warehouse_03', 'Warehouse_04', 'Warehouse_05', 'Warehouse_06', 'Warehouse_07'];
const COSTING_METHODS = [ { id: 'FIXED', name: 'Fixed Cost', unitLabel: '€' }, { id: 'PER_COLLI', name: 'Per Kolli', unitLabel: '€ / Kolli' }, { id: 'BY_VOLUME', name: 'By Volume (m³)', unitLabel: '€ / m³' }, { id: 'BY_WEIGHT', name: 'By Weight (kg)', unitLabel: '€ / kg' }, { id: 'BY_TIME_MIN', name: 'By Time (Minutes)', unitLabel: '€ / min' }];
const DEFAULT_COSTING_METHOD = 'FIXED';

// --- Helper Function ---
const getUnitLabel = (methodId) => {
    return COSTING_METHODS.find(m => m.id === methodId)?.unitLabel || '€';
};

// --- Component ---
function AddReworkStepForm({ onStepAdd, onCancel }) {
    // --- State ---
    const [activeLang, setActiveLang] = useState(PRIMARY_LANG_CODE);
    const [stepName, setStepName] = useState(() => LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang.code]: '' }), {}));
    const [stepDescription, setStepDescription] = useState(() => LANGUAGES.reduce((acc, lang) => ({ ...acc, [lang.code]: '' }), {}));
    const [costingMethod, setCostingMethod] = useState(DEFAULT_COSTING_METHOD);
    const [defaultRate, setDefaultRate] = useState('');
    const [warehouseRates, setWarehouseRates] = useState(() => WAREHOUSE_IDS.reduce((acc, id) => ({ ...acc, [id]: '' }), {}));

    const currentUnitLabel = useMemo(() => getUnitLabel(costingMethod), [costingMethod]);

    // --- Handlers ---
    const handleTextChange = (fieldSetter, value) => {
        fieldSetter(prevState => ({ ...prevState, [activeLang]: value }));
    };
    const sanitizeRate = (value) => {
        const sanitized = String(value).replace(/[^0-9.]/g, '');
        return (sanitized.match(/\./g) || []).length > 1 ? sanitized.substring(0, sanitized.lastIndexOf('.')) : sanitized;
    };
    const handleDefaultRateChange = (value) => { setDefaultRate(sanitizeRate(value)); };
    const handleWarehouseRateChange = (warehouseId, value) => { setWarehouseRates(prevRates => ({ ...prevRates, [warehouseId]: sanitizeRate(value) })); };
    const handleApplyDefaultRate = (mode) => {
        const rateToApply = String(defaultRate).trim();
        if (rateToApply === '' || isNaN(parseFloat(rateToApply))) return;
        setWarehouseRates(prevRates => {
            const newRates = { ...prevRates };
            WAREHOUSE_IDS.forEach(id => {
                if (mode === 'all' || (mode === 'empty' && String(newRates[id]).trim() === '')) { newRates[id] = rateToApply; }
            }); return newRates;
        });
    };
    const handleSubmit = (event) => {
        event.preventDefault();
        if (!stepName[PRIMARY_LANG_CODE]?.trim()) { alert(`Step Name in ${LANGUAGES.find(l=>l.code === PRIMARY_LANG_CODE)?.name} is required.`); setActiveLang(PRIMARY_LANG_CODE); document.getElementById(`stepName-${PRIMARY_LANG_CODE}`)?.focus(); return; }
        const missingRateWarehouse = WAREHOUSE_IDS.find(id => { const rate = String(warehouseRates[id]).trim(); return rate === '' || isNaN(parseFloat(rate)); });
        if (missingRateWarehouse) { alert(`Rate for ${missingRateWarehouse.replace('_', ' ')} is required and must be a valid number.`); document.getElementById(`rate-${missingRateWarehouse}`)?.focus(); return; }

        const finalWarehouseRates = Object.entries(warehouseRates).reduce((acc, [id, rate]) => { acc[id] = parseFloat(String(rate).trim()) || 0; return acc; }, {});
        const newStepData = { id: `step_${Date.now()}`, name: stepName, description: stepDescription, costingMethod: costingMethod, warehouseRates: finalWarehouseRates };
        onStepAdd(newStepData);
        alert("Step added successfully!");
        onCancel();
    };
    const langHasContent = (langCode) => stepName[langCode]?.trim() || stepDescription[langCode]?.trim();

    // --- JSX ---
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto z-50 flex justify-center items-start p-4 pt-10">
            <div className="relative bg-gray-100 rounded-lg shadow-xl w-full max-w-5xl">
                <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none" aria-label="Close form"> <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> </svg> </button>
                <div className="p-4 sm:p-6 lg:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* --- Card 1: Step Details & Translations --- */}
                        <div className="bg-white shadow-md rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Step Details & Translations</h2>
                            <p className="text-sm text-gray-600 mb-4"> Provide details in English (required <span className="text-red-500">*</span>). Use tabs below for optional German, Czech, and Polish translations. </p>
                            {/* == Tabs START == */}
                            <div className="mb-4 border-b border-gray-200">
                                <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                                    {LANGUAGES.map((lang) => (
                                        <button key={lang.code} type="button" onClick={() => setActiveLang(lang.code)} className={`relative group whitespace-nowrap py-3 px-3 border-b-2 font-medium text-sm focus:outline-none ${ activeLang === lang.code ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' }`} aria-current={activeLang === lang.code ? 'page' : undefined}>
                                            {lang.name} {langHasContent(lang.code) && activeLang !== lang.code && ( <span className="absolute top-2 right-1 block h-2 w-2 rounded-full bg-sky-500 ring-1 ring-white"></span> )}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                            {/* == Tabs END == */}
                            {/* == Inputs START == */}
                            <div className="space-y-4 pt-2">
                                <div>
                                    <label htmlFor={`stepName-${activeLang}`} className="block text-sm font-medium text-gray-700"> Step Name {activeLang === PRIMARY_LANG_CODE && <span className="text-red-500">*</span>} </label>
                                    <input type="text" id={`stepName-${activeLang}`} value={stepName[activeLang]} onChange={(e) => handleTextChange(setStepName, e.target.value)} required={activeLang === PRIMARY_LANG_CODE} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder={`Name in ${LANGUAGES.find(l => l.code === activeLang)?.name}`} />
                                </div>
                                <div>
                                    <label htmlFor={`stepDescription-${activeLang}`} className="block text-sm font-medium text-gray-700"> Step Description </label>
                                    <textarea id={`stepDescription-${activeLang}`} rows="4" value={stepDescription[activeLang]} onChange={(e) => handleTextChange(setStepDescription, e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder={`Description in ${LANGUAGES.find(l => l.code === activeLang)?.name}...`} ></textarea>
                                </div>
                            </div>
                            {/* == Inputs END == */}
                        </div>

                        {/* --- Card 2: Costing Rules --- */}
                        <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900">Costing Rules</h2>
                            {/* == Global Method START == */}
                            <div>
                                <label htmlFor="costingMethod" className="block text-sm font-medium text-gray-700"> Costing Method <span className="text-red-500">*</span> </label>
                                <select id="costingMethod" value={costingMethod} onChange={(e) => setCostingMethod(e.target.value)} className="mt-1 block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" >
                                    {COSTING_METHODS.map(method => ( <option key={method.id} value={method.id}>{method.name}</option> ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">Select the single method used to calculate cost for this step.</p>
                            </div>
                            {/* == Global Method END == */}
                            {/* == Default Rate START == */}
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                <div className="flex flex-wrap items-end gap-4">
                                    <div className="flex-1 min-w-[150px]">
                                        <label htmlFor="defaultRate" className="block text-sm font-medium text-gray-700"> Default Rate ({currentUnitLabel}) </label>
                                        <input type="number" inputMode="decimal" step="0.01" id="defaultRate" value={defaultRate} onChange={(e) => handleDefaultRateChange(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., 15.00" />
                                    </div>
                                    <div className="flex gap-2 flex-wrap pt-5">
                                        <button type="button" onClick={() => handleApplyDefaultRate('all')} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"> Apply to All </button>
                                        <button type="button" onClick={() => handleApplyDefaultRate('empty')} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"> Apply to Empty </button>
                                    </div>
                                </div>
                            </div>
                            {/* == Default Rate END == */}
                            {/* == Individual Rates Grid START == */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3"> Individual Warehouse Rates <span className="text-red-500">*</span> (Rate required per warehouse, unit based on method above) </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {WAREHOUSE_IDS.map((warehouseId) => (
                                        <div key={warehouseId} className="bg-white p-3 border border-gray-200 rounded-md">
                                            <label htmlFor={`rate-${warehouseId}`} className="block text-sm font-semibold text-gray-800 mb-1.5"> {warehouseId.replace('_', ' ')} </label>
                                            <input type="number" inputMode="decimal" step="0.01" id={`rate-${warehouseId}`} value={warehouseRates[warehouseId] || ''} onChange={(e) => handleWarehouseRateChange(warehouseId, e.target.value)} required className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="0.00" />
                                            <p className="mt-1 text-xs text-gray-500">Unit: {currentUnitLabel}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* == Individual Rates Grid END == */}
                        </div>
                        {/* --- Submit/Cancel Buttons --- */}
                        <div className="flex justify-end items-center pt-2 space-x-4">
                            <button type="button" onClick={onCancel} className="py-2 px-6 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" > Cancel </button>
                            <button type="submit" className="inline-flex justify-center py-2 px-8 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" > Add Step </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default AddReworkStepForm;