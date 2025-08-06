import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface CollaboratorInfo {
  id: string
  display_name: string
  avatar_url?: string
  cursor_position: number
  selection_start: number
  selection_end: number
  is_active: boolean
}

interface UseCollaborationProps {
  fileId: string | null
  userId: string | null
  content: string
  onContentChange: (content: string) => void
}

export const useCollaboration = ({ 
  fileId, 
  userId, 
  content, 
  onContentChange 
}: UseCollaborationProps) => {
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const { toast } = useToast()

  // Update editing session
  const updateEditingSession = useCallback(async (
    cursorPosition: number,
    selectionStart: number,
    selectionEnd: number
  ) => {
    if (!fileId || !userId) return

    const { error } = await supabase
      .from('editing_sessions')
      .upsert({
        file_id: fileId,
        user_id: userId,
        cursor_position: cursorPosition,
        selection_start: selectionStart,
        selection_end: selectionEnd,
        is_active: true,
        last_activity: new Date().toISOString()
      })

    if (error) {
      console.error('Error updating editing session:', error)
    }
  }, [fileId, userId])

  // Save file content to database
  const saveFileContent = useCallback(async (newContent: string) => {
    if (!fileId) return

    const { error } = await supabase
      .from('files')
      .update({ 
        content: newContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId)

    if (error) {
      console.error('Error saving file:', error)
      toast({
        title: "Error saving file",
        description: error.message,
        variant: "destructive"
      })
    }
  }, [fileId, toast])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!fileId) return

    let fileChannel: any
    let sessionChannel: any

    const setupRealtimeSubscriptions = async () => {
      // Subscribe to file content changes
      fileChannel = supabase
        .channel(`file-${fileId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'files',
            filter: `id=eq.${fileId}`
          },
          (payload) => {
            if (payload.new.content !== content) {
              onContentChange(payload.new.content)
            }
          }
        )
        .subscribe()

      // Subscribe to editing sessions
      sessionChannel = supabase
        .channel(`sessions-${fileId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'editing_sessions',
            filter: `file_id=eq.${fileId}`
          },
          async () => {
            // Reload collaborators when sessions change
            const { data, error } = await supabase
              .from('editing_sessions')
              .select(`
                user_id,
                cursor_position,
                selection_start,
                selection_end,
                is_active,
                profiles!user_id (
                  display_name,
                  avatar_url
                )
              `)
              .eq('file_id', fileId)
              .eq('is_active', true)

            if (error) {
              console.error('Error loading collaborators:', error)
              return
            }

            const collaboratorList = data
              ?.filter(session => session.user_id !== userId)
              .map(session => ({
                id: session.user_id,
                display_name: (session.profiles as any)?.display_name || 'Anonymous',
                avatar_url: (session.profiles as any)?.avatar_url,
                cursor_position: session.cursor_position,
                selection_start: session.selection_start,
                selection_end: session.selection_end,
                is_active: session.is_active
              })) || []

            setCollaborators(collaboratorList)
          }
        )
        .subscribe()

      setIsConnected(true)
    }

    setupRealtimeSubscriptions()

    return () => {
      if (fileChannel) supabase.removeChannel(fileChannel)
      if (sessionChannel) supabase.removeChannel(sessionChannel)
      setIsConnected(false)
    }
  }, [fileId, userId, content, onContentChange])

  // Clean up editing session on unmount
  useEffect(() => {
    return () => {
      if (fileId && userId) {
        supabase
          .from('editing_sessions')
          .update({ is_active: false })
          .eq('file_id', fileId)
          .eq('user_id', userId)
      }
    }
  }, [fileId, userId])

  return {
    collaborators,
    isConnected,
    updateEditingSession,
    saveFileContent
  }
}