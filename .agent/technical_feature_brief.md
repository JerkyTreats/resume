# 📄 Technical Feature Brief: Dynamic Static Resume Renderer for PDF Export

### **Project Name:** Reactive Resume System
### **Phase:** Dynamic Content Injection & PDF-Ready Rendering

---

## 🎯 **Objective**

To develop a **static HTML/CSS resume template** enhanced with lightweight JavaScript that dynamically renders structured JSON resume data for **local, print-to-PDF export**. This system is part of a larger pipeline where a backend ATS optimizer generates tailored JSON content per job description.

---

## 🧱 **Scope of Work**

### **Frontend Goals**

- Convert current HTML/Tailwind resume layout into a **data-driven, JSON-injected system**.
- Maintain full static page structure — no backend, no server calls at runtime.
- Ensure **pixel-perfect layout control** for print output (via browser → PDF).
- Support **dynamic job blocks**, skills, summary, and header data.
- Keep the footprint minimal — no React or build tooling.
- Ensure print-friendliness via `@media print` and page-break control.

### **Backend Integration**

- Accepts structured `resume.json` output from backend ATS optimizer.
- Frontend consumes this file via `<script>` injection or local `fetch()`.

---

## ⚙️ **Technical Design**

### **Technologies**

- **Tailwind CSS:** Utility-first styling, optimized for print and layout control.
- **Alpine.js:** Lightweight reactivity framework (3kB gzipped), zero-build, ideal for static HTML with dynamic data binding.
- **Static Hosting Context:** Local HTML file opened in browser; no live server.

### **Data Format**

A comprehensive `resume.json` structure that represents all hardcoded content from the current HTML template:

```json
{
  "header": {
    "name": "JUSTIN NEARING",
    "title": "Scaling Reliable Systems",
    "location": "Burnaby",
    "email": "justin.f.nearing@gmail.com",
    "linkedin": "https://linkedin.com/in/justinnearing"
  },
  "sidebar": {
    "photo": "justin_green.jpeg",
    "summary": {
      "title": "SUMMARY",
      "content": "Platform Engineering Manager with over 15 years of experience.\n\nManaged fleets of Kubernetes clusters gracefully handling 14k RPS across 1400+ domains.\n\nManaged incredible Platform Infrastructure team ensuring reliable, secure, performant cloud infrastructure for global-scale services."
    },
    "skills": {
      "title": "SKILLS",
      "categories": [
        {
          "name": "Cloud Infrastructure",
          "items": [
            "Google Cloud (GCP) / AWS",
            "Docker, Kubernetes (K8s)",
            "ArgoCD, Helm, Terraform",
            "MongoDB, SQL, Redis, Elasticsearch",
            "Golang, Node.js, Python, Bash"
          ]
        },
        {
          "name": "SRE",
          "items": [
            "On-call triage, remediation, postmortem + prevention"
          ]
        },
        {
          "name": "Secrets/Access Management",
          "items": [
            "Cloud Security; Config Connector"
          ]
        },
        {
          "name": "Edge Compute/Cache",
          "items": [
            "Fastly + VCL, DNS, traffic shaping + bot management"
          ]
        },
        {
          "name": "Engineering Management",
          "items": [
            "Roadmap, project, capacity planning",
            "Hiring, onboarding, managing direct reports",
            "Presentations, reporting to upper management"
          ]
        },
        {
          "name": "General",
          "items": [
            "Advocate for cross-team communication, collaboration, alignment.",
            "Strong believer in iterative improvement, data-driven decision making.",
            "Genuine love for documentation."
          ]
        }
      ]
    }
  },
  "main": {
    "experience": {
      "title": "EXPERIENCE",
      "jobs": [
        {
          "title": "Staff Platform Engineer",
          "company": "VerticalScope Inc.",
          "startDate": "05/2024",
          "endDate": "06/2025",
          "bullets": [
            "Managed senior Platform Engineers to gracefully handle 14k RPS across 1400+ domains.",
            "Developed core platform strategy of Security, Reliability, Developer Experience.",
            "Led iterative improvement, data-driven decision-making, and metrics tracking.",
            "Promoted blameless postmortem culture and consistent communication standards."
          ],
          "technicalDetails": [
            "Edge infra @ 14k RPS / 1400+ domains, Fastly + VCL",
            "Multi-cluster Kubernetes w/ Istio ingress, Helm, Terraform",
            "GitOps via ArgoCD; SlackOps in Go; GitHub Actions",
            "Monitoring: Prometheus, Grafana, Kibana, OTEL, Honeycomb",
            "On-call rotation included"
          ]
        },
        {
          "title": "Lead Software Engineer",
          "company": "Kabam Games Inc.",
          "startDate": "06/2017",
          "endDate": "05/2023",
          "bullets": [
            "Led infra overhaul across 5 business critical products with 0 downtime",
            "Scaled Unity backend infra for >1M MAU",
            "Migrated VMs → Kubernetes; built CI/CD pipelines",
            "Managed sensitive DB upgrades + SRE rotations"
          ]
        },
        {
          "title": "DevOps Lead",
          "company": "LemonStand",
          "startDate": "09/2016",
          "endDate": "04/2017",
          "bullets": [
            "Overhauled local + Linux AWS environments",
            "Streamlined dev onboarding and monitoring"
          ]
        },
        {
          "title": "Automation Engineer",
          "company": "United Front Games",
          "startDate": "07/2015",
          "endDate": "05/2016",
          "bullets": [
            "Launched 20+ minute Unity builds in under 5 mins",
            "Built one-step CI for AAA games"
          ]
        }
      ]
    }
  },
  "styling": {
    "colors": {
      "primary": "#2a6465",
      "accent": "#1a4240",
      "textPrimary": "#000000",
      "textSecondary": "#6b7280",
      "textAccent": "#0e7490"
    },
    "layout": {
      "sidebarWidth": "1/3",
      "mainWidth": "2/3",
      "maxWidth": "5xl"
    }
  }
}
```

**Key Data Model Features:**

- **Header Section**: Contains all main contact and title information
- **Sidebar Section**: Photo, summary, and categorized skills with hierarchical structure
- **Main Section**: Experience with detailed job information including optional technical details
- **Styling Section**: Theme colors and layout configuration for consistent rendering
- **Flexible Structure**: Skills can have multiple categories, jobs can have optional technical details
- **Date Format**: Consistent MM/YYYY format for start/end dates
- **Content Separation**: Clear separation between regular bullets and technical details per job

### **Layout Strategy**

- Resume page divided into sidebar and main content.
- Job blocks rendered from a loop over `experience[]`.
- Skill groups rendered from a loop over `skills[]`.
- Conditional blocks (e.g. technical details, awards) only rendered if present.
- Print break logic via `.page-break-after` and `@media print`.

---

## 🧪 **Implementation Plan**

### **Phase 1: Foundation Setup**

| Step | Task | Description | Status |
|------|------|-------------|--------|
| 1 | Create Alpine.js Enhanced HTML Structure | Modify `resume.html` to include Alpine.js CDN and basic data scaffolding | ✅ COMPLETED |
| 2 | Create Initial JSON Data Structure | Create `resume.json` file with the exact structure from the technical brief | ✅ COMPLETED |
| 3 | Implement Data Loading Mechanism | Add JavaScript to fetch and inject JSON data into Alpine.js | ✅ COMPLETED |

### **Phase 2: Template Migration**

| Step | Task | Description | Status |
|------|------|-------------|--------|
| 4 | Convert Header Section | Replace hardcoded header with Alpine.js template | ✅ COMPLETED |
| 5 | Convert Sidebar Summary & Photo | Make sidebar photo and summary dynamic | ✅ COMPLETED |
| 6 | Convert Skills Section | Transform hardcoded skills into dynamic category-based rendering | ✅ COMPLETED |
| 7 | Convert Experience Section | Replace hardcoded job blocks with dynamic templates | ✅ COMPLETED |

### **Phase 3: Advanced Features**

| Step | Task | Description | Status |
|------|------|-------------|--------|
| 8 | Implement Conditional Rendering | Add logic for optional content sections | TODO |
| 9 | Add Print Optimization | Enhance existing print styles for dynamic content | TODO |
| 10 | Implement Styling Configuration | Make colors and layout configurable via JSON | TODO |

### **Success Criteria Validation**

After completing all steps, the system should meet these criteria:

- ✅ Resume content updates via swapping `resume.json` — no HTML edits required
- ✅ Print-to-PDF works in all major browsers (Chrome, Safari, Edge)
- ✅ Layout fidelity is preserved regardless of data length
- ✅ System handles edge cases: no experience, extra long skills, etc.
- ✅ Total frontend build is fully self-contained (single HTML file + external Tailwind & Alpine)

---
