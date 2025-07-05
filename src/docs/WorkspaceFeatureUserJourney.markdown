# User Journey for Workspace Feature

## Overview
This user journey describes the experience of a team (consisting of an API Developer, QA Engineer, and Technical Writer) using the workspace feature to collaborate on an API project. The journey highlights key interactions with the workspace, including creating a workspace, importing and editing API specifications, testing endpoints, managing tasks, and collaborating in real-time. The goal is to illustrate how the workspace feature streamlines API development and documentation workflows.

## Persona
- **Primary User**: Emma, an API Developer, responsible for designing and testing API endpoints.
- **Secondary Users**:
  - Liam, a QA Engineer, tasked with testing APIs and reporting issues.
  - Sophia, a Technical Writer, responsible for documenting API endpoints and schemas.
- **Context**: The team is working on an “Inventory API” project, building and documenting a set of RESTful endpoints for a client.

## User Journey

### 1. Creating a Workspace
- **Step**: Emma logs into the platform and navigates to the “Workspaces” section.
- **Action**: She clicks “Create Workspace,” enters the name “Inventory API Project,” and adds a brief description: “API for managing inventory and stock levels.”
- **Outcome**: The system creates a new workspace with a unique ID, and Emma is assigned the Admin role by default.
- **Interaction**:
  - Emma sees a confirmation message: “Workspace ‘Inventory API Project’ created successfully.”
  - The workspace dashboard loads, displaying an empty state with prompts to “Import a Spec” or “Invite Team Members.”
- **SRS Reference**: FR1, FR4, NFR1

### 2. Inviting Team Members
- **Step**: Emma invites Liam (QA Engineer) and Sophia (Technical Writer) to the workspace.
- **Action**:
  - She navigates to the “Team” tab in the workspace dashboard and enters Liam’s and Sophia’s email addresses.
  - She assigns Liam the Editor role (can edit/test APIs) and Sophia the Editor role (can edit documentation).
- **Outcome**:
  - The system sends email invitations with a link to join the workspace.
  - Liam and Sophia accept the invitations, log in, and are added to the workspace with their respective roles.
- **Interaction**:
  - Emma receives a notification: “Liam and Sophia have joined the workspace.”
  - The dashboard updates to show team members and their roles.
- **SRS Reference**: FR7, FR8, NFR5

### 3. Importing an API Specification
- **Step**: Emma imports an OpenAPI specification for the Inventory API.
- **Action**:
  - She navigates to the “Specs” tab and clicks “Import Spec.”
  - She uploads a YAML file (`inventory-api.yaml`) containing endpoints like `GET /products` and `POST /stock`.
- **Outcome**:
  - The system validates the YAML file (OpenAPI 3.0 compliant) and imports it into the workspace.
  - The dashboard populates with a list of endpoints (`endpoint-list.tsx`) and schemas (`schema-table.tsx`).
- **Interaction**:
  - Emma sees a success message: “Spec ‘inventory-api.yaml’ imported successfully.”
  - The workspace dashboard displays a summary of 10 endpoints and 5 schemas.
- **SRS Reference**: FR2, FR19, NFR9

### 4. Organizing Resources
- **Step**: Emma organizes the imported spec for better team access.
- **Action**:
  - She creates two folders in the workspace: “Production APIs” and “Sandbox APIs.”
  - She tags the `GET /products` endpoint as “Production” and the `POST /stock` endpoint as “Sandbox.”
- **Outcome**: The system updates the workspace structure, grouping endpoints by folder and tag.
- **Interaction**:
  - Emma sees the endpoints organized under their respective folders in the dashboard.
  - She pins the `GET /products` endpoint to the dashboard for quick access.
- **SRS Reference**: FR3, FR22

### 5. Collaborative Editing
- **Step**: Sophia begins documenting the API while Emma updates an endpoint.
- **Action**:
  - Sophia opens the `endpoint-detail.tsx` component for `GET /products` and adds a description: “Retrieves a list of products with optional filtering by category.”
  - Simultaneously, Emma edits the `POST /stock` endpoint to add a new request parameter (`quantity`).
- **Outcome**:
  - The system synchronizes changes in real-time via WebSockets, ensuring no conflicts.
  - Both users see each other’s updates instantly in the workspace.
- **Interaction**:
  - Sophia sees Emma’s cursor in the editor and a notification: “Emma updated POST /stock.”
  - Emma sees Sophia’s documentation update in the `GET /products` view.
- **SRS Reference**: FR5, FR6, NFR2

### 6. Commenting and Task Assignment
- **Step**: Liam reviews the spec and identifies an issue.
- **Action**:
  - Liam opens the `POST /stock` endpoint and adds a comment: “Missing validation for negative quantities.”
  - He creates a task titled “Add quantity validation” and assigns it to Emma with a due date of tomorrow.
- **Outcome**:
  - The system links the task to the `POST /stock` endpoint and notifies Emma.
  - The task appears on the workspace dashboard under “Pending Tasks.”
- **Interaction**:
  - Emma receives an in-app notification: “Liam assigned you a task: Add quantity validation.”
  - The dashboard highlights the task with a “To Do” status.
- **SRS Reference**: FR6, FR16, FR17, FR18, FR8

### 7. Interactive API Testing
- **Step**: Emma tests the `GET /products` endpoint to ensure it works as expected.
- **Action**:
  - She navigates to the “Test” tab, where Swagger UI is embedded.
  - She configures query parameters (e.g., `category=electronics`) and executes the request.
  - She saves the test configuration for reuse.
- **Outcome**:
  - The system sends the request to a mock server (using `prism`) and displays the response.
  - The test configuration is saved and accessible to the team.
- **Interaction**:
  - Emma sees the response: `{ "products": [...] }` in Swagger UI.
  - She shares the saved configuration with Liam for further testing.
- **SRS Reference**: FR13, FR14, FR15

### 8. Version Control
- **Step**: Emma updates the spec and wants to track changes.
- **Action**:
  - She commits the updated `inventory-api.yaml` as version “v1.1” with a note: “Added quantity parameter.”
  - She compares “v1.1” with “v1.0” to review changes.
- **Outcome**:
  - The system saves the new version and highlights differences (e.g., new `quantity` parameter in `POST /stock`).
  - The version history is updated in the workspace.
- **Interaction**:
  - Emma sees a diff view showing the added parameter.
  - She shares the version update with the team via a notification.
- **SRS Reference**: FR9, FR10, FR11

### 9. Exporting and Sharing
- **Step**: Sophia exports the documented spec for the client.
- **Action**:
  - She navigates to the “Specs” tab and selects “Export” for `inventory-api.yaml`.
  - She downloads the spec as a JSON file.
- **Outcome**: The system generates a JSON file containing the latest spec version.
- **Interaction**:
  - Sophia sees a download prompt and saves `inventory-api.json` to her device.
  - She shares the file with the client via email.
- **SRS Reference**: FR20

### 10. Reviewing Progress
- **Step**: The team reviews the workspace dashboard to track progress.
- **Action**:
  - Emma opens the dashboard to view recent activity (e.g., Sophia’s documentation, Liam’s comment).
  - She marks the “Add quantity validation” task as “Done” after implementing it.
- **Outcome**:
  - The system updates the task status and logs the activity.
  - The dashboard reflects the latest changes and task completions.
- **Interaction**:
  - The team sees a summary: “3 endpoints updated, 1 task completed, 2 active tasks.”
  - Emma customizes the dashboard to show a grid view with pinned resources.
- **SRS Reference**: FR4, FR18, FR23, NFR1

## Key Touchpoints
- **Ease of Use**: Intuitive interface for creating workspaces, importing specs, and navigating resources.
- **Collaboration**: Real-time editing and commenting streamline team communication.
- **Feedback Loop**: Task assignments and notifications keep the team aligned.
- **Flexibility**: Support for folders, tags, and pinned resources enhances organization.
- **Interactivity**: Embedded Swagger UI and mock servers enable seamless testing.

## Pain Points Addressed
- **Disorganized Resources**: Folders and tags group related endpoints and schemas.
- **Collaboration Barriers**: Real-time editing and comments reduce email back-and-forth.
- **Version Confusion**: Version history and comparison prevent accidental overwrites.
- **Testing Overhead**: Saved test configurations and mock servers speed up validation.

## Success Criteria
- Emma, Liam, and Sophia complete the Inventory API project within a week, with all endpoints documented and tested.
- The team reports high satisfaction with real-time collaboration and task management.
- The client receives a clean, well-documented OpenAPI spec (`inventory-api.json`).