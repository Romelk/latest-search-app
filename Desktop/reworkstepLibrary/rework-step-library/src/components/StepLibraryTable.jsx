// ./src/components/StepLibraryTable.jsx
import React from 'react';

// --- Constants & Helpers ---
const COSTING_METHODS = [ { id: 'FIXED', name: 'Fixed Cost', unitLabel: '€' }, { id: 'PER_COLLI', name: 'Per Kolli', unitLabel: '€ / Kolli' }, { id: 'BY_VOLUME', name: 'By Volume (m³)', unitLabel: '€ / m³' }, { id: 'BY_WEIGHT', name: 'By Weight (kg)', unitLabel: '€ / kg' }, { id: 'BY_TIME_MIN', name: 'By Time (Minutes)', unitLabel: '€ / min' }];
const PRIMARY_LANG_CODE = 'en';

const getCostingMethodInfo = (methodId) => {
    return COSTING_METHODS.find(m => m.id === methodId) || { name: 'Unknown', unitLabel: '?' };
};

// Helper to format currency/rate values
const formatRate = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 'N/A' : num.toFixed(2); // Show 2 decimal places
};

// Helper to calculate and format the rate summary
const getRateSummary = (warehouseRates, unitLabel) => {
    if (!warehouseRates || typeof warehouseRates !== 'object') return unitLabel || 'N/A';

    const rates = Object.values(warehouseRates)
        .map(rate => parseFloat(rate))
        .filter(rate => !isNaN(rate)); // Get valid numeric rates

    if (rates.length === 0) return unitLabel || 'N/A'; // No valid rates

    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);

    if (minRate === maxRate) {
        return `${formatRate(minRate)} ${unitLabel}`; // Single rate
    } else {
        return `${formatRate(minRate)} - ${formatRate(maxRate)} ${unitLabel}`; // Range
    }
};

// --- SVG Icons (Simple inline examples) ---
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);


// --- Component ---
function StepLibraryTable({ steps = [], onEdit, onDelete, onAddNew }) { // Default steps to empty array

    const handleEdit = onEdit || ((stepId) => { console.log("Edit:", stepId); alert(`Edit: ${stepId}`); });
    const handleDelete = (stepId, stepName) => {
        if (window.confirm(`Delete "${stepName || 'this step'}"?`)) {
            if (onDelete) { onDelete(stepId); }
            else { console.log("Delete:", stepId); alert(`Delete: ${stepId}`); }
        }
    };

    return (
        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 lg:p-8">
            {/* Header Section */}
            <div className="sm:flex sm:items-center mb-6">
                <div className="sm:flex-auto">
                    <h1 className="text-xl font-semibold text-gray-900">Rework Step Library</h1>
                    <p className="mt-2 text-sm text-gray-700"> A list of all defined rework steps available for orders. </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button type="button" onClick={onAddNew} className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto">
                        + Add New Step
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto border-t border-gray-200"> {/* Added border-t */}
                <div className="inline-block min-w-full align-middle">
                    <table className="min-w-full divide-y divide-gray-200">
                        {/* Table Header */}
                        <thead className="bg-gray-50"> {/* Slightly lighter header */}
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"> Step Name ({PRIMARY_LANG_CODE.toUpperCase()}) </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"> Costing Method </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"> Rate Summary </th>
                            <th scope="col" className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 sm:pr-6"> Actions </th> {/* Right align actions */}
                        </tr>
                        </thead>

                        {/* Table Body */}
                        <tbody className="divide-y divide-gray-200 bg-white">
                        {steps && steps.length > 0 ? (
                            steps.map((step, index) => {
                                const methodInfo = getCostingMethodInfo(step.costingMethod);
                                const primaryName = step.name?.[PRIMARY_LANG_CODE] || step.id;
                                // Calculate Rate Summary
                                const rateSummary = getRateSummary(step.warehouseRates, methodInfo.unitLabel);

                                return (
                                    // Added Zebra Striping: even:bg-gray-50
                                    <tr key={step.id} className="even:bg-gray-50 hover:bg-indigo-50"> {/* Added hover color */}
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                            {primaryName}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {methodInfo.name}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {/* Display Rate Summary */}
                                            {rateSummary}
                                        </td>
                                        {/* Actions with Icons */}
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                            <button
                                                onClick={() => handleEdit(step.id)}
                                                className="p-1 text-indigo-600 hover:text-indigo-900 rounded focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 mr-2" // Adjusted margin
                                                aria-label={`Edit ${primaryName}`}
                                            >
                                                <EditIcon />
                                                <span className="sr-only">Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(step.id, primaryName)}
                                                className="p-1 text-red-600 hover:text-red-900 rounded focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                                                aria-label={`Delete ${primaryName}`}
                                            >
                                                <DeleteIcon />
                                                <span className="sr-only">Delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center py-10 px-3 text-sm text-gray-500">
                                    No rework steps defined yet.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default StepLibraryTable;