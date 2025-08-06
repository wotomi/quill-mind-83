import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Plus, Settings, Users } from "lucide-react"
import { Project } from "@/types/collaboration"

interface ProjectSelectorProps {
  currentProject: Project | null
  onProjectChange: (project: Project | null) => void
  userId: string
}

export const ProjectSelector = ({ currentProject, onProjectChange, userId }: ProjectSelectorProps) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDescription, setNewProjectDescription] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("editor")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Load user's projects
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading projects:', error)
      return
    }

    setProjects(data || [])
    
    // Set first project as current if none selected
    if (!currentProject && data && data.length > 0) {
      onProjectChange(data[0])
    }
  }

  const createProject = async () => {
    if (!newProjectName.trim()) return

    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: newProjectName,
        description: newProjectDescription,
        owner_id: userId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive"
      })
    } else {
      setProjects(prev => [data, ...prev])
      onProjectChange(data)
      setShowCreateDialog(false)
      setNewProjectName("")
      setNewProjectDescription("")
      toast({
        title: "Project created",
        description: `${data.name} has been created successfully.`
      })
    }
    setLoading(false)
  }

  const inviteCollaborator = async () => {
    if (!inviteEmail.trim() || !currentProject) return

    setLoading(true)
    
    // First, check if user exists
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', inviteEmail)

    if (profileError || !profiles || profiles.length === 0) {
      toast({
        title: "User not found",
        description: "No user found with this email address.",
        variant: "destructive"
      })
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('project_collaborators')
      .insert({
        project_id: currentProject.id,
        user_id: profiles[0].id,
        role: inviteRole
      })

    if (error) {
      console.error('Error inviting collaborator:', error)
      toast({
        title: "Error inviting collaborator",
        description: error.message,
        variant: "destructive"
      })
    } else {
      setShowInviteDialog(false)
      setInviteEmail("")
      toast({
        title: "Collaborator invited",
        description: `${inviteEmail} has been added to the project.`
      })
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center gap-2 p-2 border-b border-border">
      <Select
        value={currentProject?.id || ""}
        onValueChange={(value) => {
          const project = projects.find(p => p.id === value)
          onProjectChange(project || null)
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowCreateDialog(true)}
      >
        <Plus className="h-4 w-4" />
      </Button>

      {currentProject && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowInviteDialog(true)}
        >
          <Users className="h-4 w-4" />
        </Button>
      )}

      {currentProject && (
        <Badge variant="secondary" className="ml-auto">
          {currentProject.name}
        </Badge>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Project name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={createProject}
                disabled={loading || !newProjectName.trim()}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invite Collaborator Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Collaborator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Email address"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={inviteCollaborator}
                disabled={loading || !inviteEmail.trim()}
              >
                Invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}