import React, { useState } from 'react';
import styles from './TaskMeasurementForm.module.css';

interface TaskStep {
  id: number;
  stepName: string;
  startTime: string;
  endTime: string;
  notes: string;
}

export default function TaskMeasurementForm() {
  const [pageTitle, setPageTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<TaskStep[]>([]);
  const [currentStep, setCurrentStep] = useState<TaskStep>({
    id: 0,
    stepName: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  const addStep = () => {
    if (currentStep.stepName && currentStep.startTime && currentStep.endTime) {
      setSteps([...steps, { ...currentStep, id: Date.now() }]);
      setCurrentStep({
        id: 0,
        stepName: '',
        startTime: '',
        endTime: '',
        notes: '',
      });
    }
  };

  const deleteStep = (id: number) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
  };

  const calculateTotalDuration = () => {
    return steps.reduce((total, step) => {
      return total + calculateDuration(step.startTime, step.endTime);
    }, 0);
  };

  return (
    <div className={styles.container}>
      <div className={styles.formGroup}>
        <label htmlFor="pageTitle">Page Title</label>
        <input
          type="text"
          id="pageTitle"
          value={pageTitle}
          onChange={(e) => setPageTitle(e.target.value)}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
        />
      </div>

      <h2>Steps</h2>
      <div className={styles.stepEntry}>
        <div className={styles.formGroup}>
          <label htmlFor="stepName">Step Name</label>
          <input
            type="text"
            id="stepName"
            value={currentStep.stepName}
            onChange={(e) => setCurrentStep({ ...currentStep, stepName: e.target.value })}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="startTime">Start Time</label>
          <input
            type="datetime-local"
            id="startTime"
            value={currentStep.startTime}
            onChange={(e) => setCurrentStep({ ...currentStep, startTime: e.target.value })}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="endTime">End Time</label>
          <input
            type="datetime-local"
            id="endTime"
            value={currentStep.endTime}
            onChange={(e) => setCurrentStep({ ...currentStep, endTime: e.target.value })}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            value={currentStep.notes}
            onChange={(e) => setCurrentStep({ ...currentStep, notes: e.target.value })}
            rows={2}
          />
        </div>

        <button type="button" className={styles.button} onClick={addStep}>
          Add Step
        </button>
      </div>

      <h2>Steps Table</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Step Name</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Duration</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step) => (
            <tr key={step.id}>
              <td>{step.stepName}</td>
              <td>{new Date(step.startTime).toLocaleString()}</td>
              <td>{new Date(step.endTime).toLocaleString()}</td>
              <td>{calculateDuration(step.startTime, step.endTime)} minutes</td>
              <td>{step.notes}</td>
              <td>
                <button
                  className={styles.deleteButton}
                  onClick={() => deleteStep(step.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.totalDuration}>
        <h3>Total Duration: {calculateTotalDuration()} minutes</h3>
      </div>
    </div>
  );
} 