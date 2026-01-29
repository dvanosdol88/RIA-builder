# Strategic Blueprint: The Agentic RIA Ecosystem

## 1. Executive Summary: The "Construction Zone" Vision
The goal of this architecture is to transition the RIA application from a standard interface into a specialized **Advisory Orchestrator**. By leveraging the **Model Context Protocol (MCP)** as secure "piping," the application bridges the gap between raw AI models and private business data. This ensures the AI is not just generating text, but performing auditable actions—updating CRMs, adjusting financial plans, and logging every event for regulatory compliance.

## 2. Core Tech Stack & Connectivity
The ecosystem is built on connecting three primary pillars of advisor technology through specialized MCP servers.

### **A. Wealthbox CRM (The Data Anchor)**
Wealthbox acts as the central repository for all client relationships and workflows.
* **Integration Method:** Best accessed through "bridge" servers like Zapier or Pipedream.
* **Key Capabilities:** AI can use tools like `Notes`, `Update_Task`, and `Get_Contact_Details`.
* **Strategic Value:** Moves the AI from a standalone tool to a Virtual Assistant that proactively manages the CRM without manual data entry.

### **B. RightCapital (The Planning Engine)**
RightCapital provides the quantitative "ground truth" for a client’s financial goals.
* **Integration Method:** Managed via a custom "shim" server or direct API calls to pull metrics like the **Probability of Success**.
* **Key Capabilities:** AI can parse incoming documents (tax returns/statements) into RightCapital-ready formats and flag plan inconsistencies for advisor review.
* **Strategic Value:** Automates the "heavy lifting" of data entry and provides real-time planning updates on Scenario Analysis cards.

### **C. Zocks (The Intelligence Layer)**
Zocks serves as the "Source of Truth" for all client conversations and document-based data extraction.
* **Integration Method:** Utilizes the Zocks API to build a private MCP server.
* **Key Capabilities:** * **Field Syncing:** Over 200 data points (income, goals, family) sync directly into RightCapital.
    * **Fact Extraction:** Pulls "Client Signals" (e.g., mention of a new house) and triggers relevant tasks in Wealthbox.
* **Strategic Value:** Eliminates manual note-taking and ensures the **Human Review Protocol** is backed by structured, accurate data.

---

## 3. The Unified Workflow: "The Orchestrator Model"
By unifying these tools via MCP, a single client interaction triggers a cascade of automated events:

1.  **Intake:** A meeting occurs; **Zocks** captures structured facts and action items.
2.  **Retrieval:** The RIA App’s AI calls the **Zocks MCP** to fetch "Client Priorities" and "Signals."
3.  **CRM Update:** The AI triggers a **Wealthbox MCP** tool to create tasks and follow-up notes.
4.  **Planning:** The AI identifies financial changes and updates the **RightCapital** success score.
5.  **Audit Log:** The entire data flow is captured in the **Logging Database**, satisfying the 5-year retention requirement.

---

## 4. Governance, Security, and Compliance
The system is built on a "Compliance First" foundation, as evidenced by your repository secrets for `ANTHROPIC_API_KEY` and `SLACK_WEBHOOK_URL`[cite: 8].

* **Traceability:** Every MCP call is a "tool use" event, making every piece of data the AI touches fully auditable.
* **Data Sovereignty:** Local MCP servers allow for processing sensitive PDFs locally, ensuring they are never used to train public AI models.
* **Alerting:** Slack integrations are configured to ping a compliance channel whenever an AI action requires **Human Review**.

---

## 5. Implementation Roadmap

| Phase | Focus | Key Deliverable |
| :--- | :--- | :--- |
| **Phase 1** | **CRM Connectivity** | Connect Wealthbox via Zapier MCP; test note creation from the app chat. |
| **Phase 2** | **Client Intelligence** | Integrate Zocks API to pull structured meeting summaries into Scenario Analysis cards. |
| **Phase 3** | **Governance Layer** | Establish the "Logging MCP" to mirror all tool interactions for a 5-year audit trail. |
| **Phase 4** | **Planning Automation** | Enable bi-directional sync between Zocks signals and RightCapital planning fields. |