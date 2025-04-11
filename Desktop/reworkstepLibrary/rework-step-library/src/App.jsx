// ./src/App.jsx
import React, { useState } from 'react';
import AddReworkStepForm from './components/AddReworkStepForm';
import StepLibraryTable from './components/StepLibraryTable';
import './index.css'; // Tailwind styles

// --- Mock Data (for initial state in App) ---
const initialMockSteps = [
    // (Include the mockSteps array from StepLibraryTable's previous version here)
    { id: 'step_1', name: { en: 'Standard Repackaging', de: '...', cs: '...', pl: '...' }, description: { en: '...', de: '...', cs: '...', pl: '...' }, costingMethod: 'FIXED', warehouseRates: { WH_01: 10.00, WH_02: 12.00, WH_03: 10.00, WH_04: 11.00, WH_05: 10.00, WH_06: 12.00, WH_07: 11.00 } },
    { id: 'step_2', name: { en: 'Label Application (Multi-Kolli)', de: '...', cs: '...', pl: '...' }, description: { en: '...', de: '...', cs: '...', pl: '...' }, costingMethod: 'PER_COLLI', warehouseRates: { WH_01: 2.50, WH_02: 3.00, WH_03: 2.50, WH_04: 2.75, WH_05: 2.50, WH_06: 3.00, WH_07: 2.75 } },
    { id: 'step_3', name: { en: 'Quality Check & Polish', de: '...', cs: '...', pl: '...' }, description: { en: '...', de: '...', cs: '...', pl: '...' }, costingMethod: 'BY_TIME_MIN', warehouseRates: { WH_01: 0.75, WH_02: 0.85, WH_03: 0.75, WH_04: 0.80, WH_05: 0.75, WH_06: 0.85, WH_07: 0.80 } },
];
// --- End Mock Data ---


function App() {
    const [steps, setSteps] = useState(initialMockSteps); // Manage steps list
    const [isFormVisible, setIsFormVisible] = useState(false); // Control form visibility

    // Function to add a new step to the list
    const handleAddStep = (newStepData) => {
        setSteps(prevSteps => [
            ...prevSteps,
            newStepData // Add the new step (with temporary ID)
        ]);
        // In a real app, you'd likely post to an API and then refetch/update state
    };

    // Function to delete a step
    const handleDeleteStep = (stepIdToDelete) => {
        setSteps(prevSteps => prevSteps.filter(step => step.id !== stepIdToDelete));
        alert(`Step ${stepIdToDelete} deleted locally.`);
        // In a real app, call API to delete then refetch/update
    };

    // Placeholder for edit functionality
    const handleEditStep = (stepIdToEdit) => {
        alert(`Edit functionality for Step ${stepIdToEdit} is not implemented yet.`);
        // Would typically involve fetching the step data, pre-populating the form,
        // showing the form, and having the form submit an update.
    };

    // Functions to control form visibility
    const showAddForm = () => setIsFormVisible(true);
    const hideAddForm = () => setIsFormVisible(false);

    return (
        <div className="bg-gray-100 min-h-screen py-10 px-4 sm:px-6 lg:px-8">

            {/* Render the Table, passing steps and handlers */}
            <StepLibraryTable
                steps={steps}
                onAddNew={showAddForm}
                onEdit={handleEditStep} // Pass edit handler
                onDelete={handleDeleteStep} // Pass delete handler
            />

            {/* Conditionally render the Form */}
            {isFormVisible && (
                <AddReworkStepForm
                    onStepAdd={handleAddStep} // Pass function to add step
                    onCancel={hideAddForm}    // Pass function to hide form
                />
            )}

        </div>
    );
}

export default App;