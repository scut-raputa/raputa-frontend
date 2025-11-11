# RAPUTA Frontend

## Project Overview

**RAPUTA** (Real-time AI Platform for Unobtrusive Triaging of Airway) is a Vue.js–based frontend for intelligent, non-invasive screening of dysphagia and aspiration risk. It provides clinicians with interactive views to manage patients, monitor real-time physiological signals, run assisted analyses (real-time or file-based), and export structured reports. The frontend connects to backend services for data handling, model execution, and device communication.

---

## Key Functional Modules

### Patient Management

Create, view, and edit patient records and appointment schedules. The system automatically maintains organized storage directories per patient (and per date) for raw signals, reports, and attachments, and links historical check records to each patient.

### Model Management

Upload, select, and manage AI detection models used in screening. The module provides **model performance summaries** (e.g., accuracy, sensitivity/recall, specificity) to help users choose the most suitable model for a task.

### System Monitoring

Run and control screening tasks in **two modes**:

* **Real-time Mode:** Stream laryngeal motion, swallowing sound, and airflow/respiration signals from connected devices; configure detection parameters; visualize segmentation and risk levels; export structured reports.
* **File Mode:** **Select files online** (local upload or server-side selection) and run offline detection with the same visualization and report export pipeline.

### Data Management

Browse historical data organized by **patient / task / date**. Filter, preview, and download raw signals and reports to support review and audit.

### Data Statistics

A concise operational dashboard with:

* Patient screening trends and charts
* Device overview (online/offline status and recent history)

### Department Management / System Management (Role-Based)

Capabilities vary by login role:

* **Department User (department-scoped account):**

  * Manage **devices within the department** (discovery, connect/disconnect, status).
  * **View** department doctors’ information (read-only).
  * Update **personal profile** (password, avatar, etc.).
* **System Administrator:**

  * Interface switches to **System Management**.
  * **Edit** all users (departments) and **edit** all doctors across the system.
  * Perform global configuration for departments, accounts, and devices.

---

## Tech Stack

* **Frontend:** Vue 3, TypeScript, Element Plus, ECharts
* **Integration:** RESTful APIs to backend services for data I/O, model execution, and device control
* **Reporting:** Structured result views with PDF export
