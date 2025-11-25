# TabularPractice Data Repository Structure

This document describes the structure for the decoupled data repository. You can create a new GitHub repository and push the contents of `public/data` to it.

## 📂 Directory Structure

```text
/
├── index.json            # [Required] The master index file
├── README.md             # [Optional] Documentation for your question bank
└── papers/               # [Required] Folder containing individual paper details
    ├── math1-2023.json
    ├── math1-2022.json
    └── ...
```

## 📄 File Formats

### 1. `index.json`
This file is loaded on the initial page load. It should be lightweight and contain metadata for all questions.

**Schema:**
```json
[
  {
    "id": "math1-2023-01",      // Unique ID
    "paperId": "math1-2023",    // ID of the paper it belongs to
    "number": 1,                // Question number
    "type": "choice",           // "choice" | "fill" | "answer"
    "tags": ["limit"]           // Array of tag IDs
  },
  ...
]
```

### 2. `papers/[paperId].json`
This file is loaded lazily when a user selects a specific year/paper. It contains the full content of the questions.

**Schema:**
```json
{
  "paperId": "math1-2023",
  "questions": {
    "math1-2023-01": {
      "id": "math1-2023-01",
      "paperId": "math1-2023",
      "number": 1,
      "type": "choice",
      "tags": ["limit"],
      "contentMd": "Calculate the limit...",  // Markdown content
      "answerMd": "**(B)**",                  // Markdown answer
      "analysisMd": "Use L'Hopital's rule...",// Markdown analysis
      "videoUrl": "https://..."               // Optional video link
    },
    ...
  }
}
```

## 🚀 How to Deploy

1. **Create a new GitHub Repository** (e.g., `my-math-questions`).
2. **Push the files** described above to the `main` branch.
3. **Get the Base URL**:
   - Use GitHub Raw: `https://raw.githubusercontent.com/<username>/<repo>/main`
   - Or use GitHub Pages: Enable Pages in settings, then use `https://<username>.github.io/<repo>`
4. **Configure App**:
   - Open TabularPractice Settings.
   - Paste the Base URL into the "Repository Source" field.
   - Click "Verify & Save".
