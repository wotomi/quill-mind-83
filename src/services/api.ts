const API_BASE_URL = 'http://localhost:8000';

export interface FileInfo {
  name: string;
  size: string;
  type: 'file' | 'folder';
  last_modified?: string;
}

export interface DiffResponse {
  has_changes: boolean;
  diff: string[];
  changes: number;
}

export interface FileStatusResponse {
  filename: string;
  has_changes: boolean;
  last_modified: string;
  size: number;
}

export interface StatsResponse {
  total_files: number;
  total_size: string;
  files_with_changes: number;
}

export interface AIAgentRequest {
  message: string;
  filename?: string;
  line_start?: number;
  line_end?: number;
  action_type?: 'analyze' | 'edit' | 'suggest' | 'summarize';
}

export interface AIAgentResponse {
  response: string;
  suggested_changes?: string;
  confidence: number;
  action_taken?: string;
}

export interface ExportRequest {
  filename: string;
  format: 'pdf' | 'html' | 'docx' | 'txt';
  options?: {
    include_metadata?: boolean;
    styling?: 'minimal' | 'default' | 'professional';
  };
}

class APIService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // File Management APIs
  async uploadFile(file: File): Promise<{ message: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getFiles(): Promise<FileInfo[]> {
    return this.request<FileInfo[]>('/files');
  }

  async getFileContent(filename: string): Promise<{ content: string }> {
    return this.request<{ content: string }>(`/file/${encodeURIComponent(filename)}`);
  }

  async updateFileContent(filename: string, content: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/file/${encodeURIComponent(filename)}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteFile(filename: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/file/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });
  }

  // Diff and Change Management APIs
  async getFileDiff(filename: string): Promise<DiffResponse> {
    return this.request<DiffResponse>(`/file/${encodeURIComponent(filename)}/diff`);
  }

  async acceptChanges(filename: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/file/${encodeURIComponent(filename)}/accept-changes`, {
      method: 'POST',
    });
  }

  async rejectChanges(filename: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/file/${encodeURIComponent(filename)}/reject-changes`, {
      method: 'POST',
    });
  }

  async getFileStatus(filename: string): Promise<FileStatusResponse> {
    return this.request<FileStatusResponse>(`/file/${encodeURIComponent(filename)}/status`);
  }

  // System APIs
  async initializeTracking(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/initialize-tracking', {
      method: 'POST',
    });
  }

  async reinitializeTracking(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/reinitialize-tracking', {
      method: 'POST',
    });
  }

  async getStats(): Promise<StatsResponse> {
    return this.request<StatsResponse>('/stats');
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }

  // Embedding APIs
  async indexDocuments(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/embedding/index', {
      method: 'POST',
    });
  }

  async getIndexingStatus(): Promise<{ status: string; indexed_files: number }> {
    return this.request<{ status: string; indexed_files: number }>('/embedding/status');
  }

  // AI Agent API (new)
  async aiAgentAction(request: AIAgentRequest): Promise<AIAgentResponse> {
    return this.request<AIAgentResponse>('/agent/action', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Export API (new)
  async exportFile(request: ExportRequest): Promise<{ download_url: string; message: string }> {
    return this.request<{ download_url: string; message: string }>('/export', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Test Changes API
  async createTestChanges(filename: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/test-changes/${encodeURIComponent(filename)}`, {
      method: 'POST',
    });
  }
}

export const apiService = new APIService();