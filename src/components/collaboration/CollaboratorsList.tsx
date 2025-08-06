import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { Collaborator } from "@/types/collaboration"

interface CollaboratorsListProps {
  collaborators: Collaborator[]
  isConnected: boolean
}

export const CollaboratorsList = ({ collaborators, isConnected }: CollaboratorsListProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex items-center gap-2 p-2 border-b border-border">
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        {collaborators.length === 0 ? 'Working alone' : `${collaborators.length + 1} collaborator${collaborators.length === 0 ? '' : 's'}`}
      </span>
      
      <div className="flex items-center gap-1 ml-auto">
        {isConnected && (
          <Badge variant="secondary" className="text-xs">
            Live
          </Badge>
        )}
        
        {collaborators.map((collaborator) => (
          <Avatar key={collaborator.id} className="h-6 w-6">
            <AvatarImage src={collaborator.avatar_url} />
            <AvatarFallback className="text-xs">
              {getInitials(collaborator.display_name)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
    </div>
  )
}