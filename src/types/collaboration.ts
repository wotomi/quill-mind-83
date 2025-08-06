export interface FileData {
  id: string
  filename: string
  content: string
  project_id: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  owner_id: string
  created_at: string
}

export interface Collaborator {
  id: string
  display_name: string
  avatar_url?: string
  cursor_position: number
  selection_start: number
  selection_end: number
  is_active: boolean
}

export interface Profile {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}