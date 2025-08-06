# Required Backend API Additions

To complete the AI markdown editor integration, please add these two new API endpoints to your backend:

## 1. AI Agent Action API

**Endpoint:** `POST /agent/action`

**Purpose:** Handle AI assistant interactions for document analysis, editing suggestions, and content improvements.

**Request Body:**
```json
{
  "message": "string",           // User's message/request
  "filename": "string",          // Optional: current file context
  "line_start": "number",        // Optional: specific line range start
  "line_end": "number",          // Optional: specific line range end
  "action_type": "string"        // Optional: "analyze" | "edit" | "suggest" | "summarize"
}
```

**Response:**
```json
{
  "response": "string",          // AI's response text
  "suggested_changes": "string", // Optional: suggested content changes
  "confidence": "number",        // Confidence score 0-1
  "action_taken": "string"       // Optional: description of action performed
}
```

**Example Usage:**
- User asks: "Improve the introduction section"
- AI analyzes the current file content
- Returns suggestions and optionally creates tracked changes

## 2. Export File API

**Endpoint:** `POST /export`

**Purpose:** Export markdown files to various formats (PDF, HTML, DOCX, TXT).

**Request Body:**
```json
{
  "filename": "string",          // File to export
  "format": "string",            // "pdf" | "html" | "docx" | "txt"
  "options": {
    "include_metadata": "boolean",      // Optional: include file metadata
    "styling": "string"                 // Optional: "minimal" | "default" | "professional"
  }
}
```

**Response:**
```json
{
  "download_url": "string",      // URL to download the exported file
  "message": "string"            // Success message
}
```

**Implementation Notes:**
- Use libraries like `pandoc`, `weasyprint`, or `puppeteer` for format conversion
- Store exported files temporarily (24-48 hours)
- Return a downloadable URL that expires after a reasonable time

## Integration Points

The frontend is now fully integrated with your existing API structure and these two additional endpoints will complete the functionality:

1. **File Management** ✅ (Already implemented)
2. **Diff Tracking** ✅ (Already implemented) 
3. **AI Agent** ⏳ (Needs `/agent/action` endpoint)
4. **Export** ⏳ (Needs `/export` endpoint)

## Error Handling

Both endpoints should return standard HTTP error codes:
- 400: Bad Request (invalid parameters)
- 500: Internal Server Error
- 422: Validation Error

The frontend already handles these error cases with user-friendly toast notifications.