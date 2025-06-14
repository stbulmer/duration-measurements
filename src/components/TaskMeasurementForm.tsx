import React, { useState } from 'react';
import styles from './TaskMeasurementForm.module.css';
import { Octokit } from '@octokit/rest';

interface TaskStep {
  id: number;
  stepName: string;
  startTime: string;
  endTime: string;
  notes: string;
}

interface FormData {
  pageTitle: string;
  description: string;
  steps: TaskStep[];
  totalDuration: number;
}

declare global {
  interface Window {
    GITHUB_CONFIG?: {
      token: string;
      owner: string;
      repo: string;
    };
  }
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleSubmit = async () => {
    if (!pageTitle || !description || steps.length === 0) {
      setErrorMessage('Please fill in all required fields and add at least one step');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Create the markdown content
      const markdownContent = `---
sidebar_position: 2
title: ${pageTitle}
description: ${description}
---

# ${pageTitle}

${description}

## Task Steps

| Step Name | Start Time | End Time | Duration (minutes) | Notes |
|-----------|------------|----------|-------------------|-------|
${steps.map(step => {
  const startTime = new Date(step.startTime).toLocaleString();
  const endTime = new Date(step.endTime).toLocaleString();
  const duration = Math.round((new Date(step.endTime).getTime() - new Date(step.startTime).getTime()) / (1000 * 60));
  return `| ${step.stepName} | ${startTime} | ${endTime} | ${duration} | ${step.notes} |`;
}).join('\n')}

## Total Duration
Total time spent: ${calculateTotalDuration()} minutes
`;

      // Create a new branch name
      const branchName = `task-measurement-${pageTitle.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

      // Initialize Octokit with token validation
      const githubConfig = window.GITHUB_CONFIG;
      
      if (!githubConfig) {
        throw new Error('GitHub configuration is not loaded. Please refresh the page and try again.');
      }

      const { token, owner, repo } = githubConfig;
      
      if (!token) {
        throw new Error('GitHub token is not configured. Please check your .env.local file.');
      }

      if (!owner || !repo) {
        throw new Error('GitHub owner or repo is not configured. Please check your .env.local file.');
      }

      const octokit = new Octokit({
        auth: token,
      });

      // Test the token with a simple API call
      try {
        await octokit.users.getAuthenticated();
      } catch (error) {
        console.error('Token validation error:', error);
        throw new Error('Invalid GitHub token. Please check your token permissions and try again.');
      }

      // Get the main branch's latest commit SHA
      const { data: mainBranch } = await octokit.repos.getBranch({
        owner,
        repo,
        branch: 'main',
      });

      // Create a new branch
      await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: mainBranch.commit.sha,
      });

      // Create the file in the new branch
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: `task-measurements/docs/${pageTitle.toLowerCase().replace(/\s+/g, '-')}.md`,
        message: `Add task measurement: ${pageTitle}`,
        content: Buffer.from(markdownContent).toString('base64'),
        branch: branchName,
      });

      // Create a pull request
      const pr = await octokit.pulls.create({
        owner,
        repo,
        title: `Add task measurement: ${pageTitle}`,
        body: `This PR adds a new task measurement for: ${pageTitle}\n\nTotal duration: ${calculateTotalDuration()} minutes`,
        head: branchName,
        base: 'main',
      });

      setSubmitStatus('success');
      
      // Reset form after successful submission
      setPageTitle('');
      setDescription('');
      setSteps([]);
      setCurrentStep({
        id: 0,
        stepName: '',
        startTime: '',
        endTime: '',
        notes: '',
      });

      // Open the PR in a new tab
      window.open(pr.data.html_url, '_blank');
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Error submitting form. Please check your GitHub configuration and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
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

      <div className={styles.submitSection}>
        <button 
          type="button" 
          className={styles.submitButton} 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit and Create PR'}
        </button>

        {errorMessage && (
          <div className={styles.errorMessage}>
            {errorMessage}
          </div>
        )}

        {submitStatus === 'success' && (
          <div className={styles.successMessage}>
            Form submitted successfully! A PR has been created.
          </div>
        )}
      </div>
    </div>
  );
} 