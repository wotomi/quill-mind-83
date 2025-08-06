import { useState, useEffect } from "react";
import { FilePanel } from "../panels/FilePanel";
import { EditorPanel } from "../panels/EditorPanel"; 
import { ChatPanel } from "../panels/ChatPanel";
import { TopBar } from "./TopBar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ProjectSelector } from "../collaboration/ProjectSelector";
import { CollaboratorsList } from "../collaboration/CollaboratorsList";
import { useCollaboration } from "@/hooks/useCollaboration";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { FileData, Project } from "@/types/collaboration";

export const IDELayout = () => {
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const { collaborators, isConnected, updateEditingSession, saveFileContent } = useCollaboration({
    fileId: selectedFile?.id || null,
    userId: user?.id || null,
    content: fileContent,
    onContentChange: setFileContent
  });

  const handleFileSelect = async (fileData: FileData | null) => {
    if (!fileData) {
      setSelectedFile(null);
      setFileContent("");
      return;
    }

    setSelectedFile(fileData);
    setFileContent(fileData.content);
  };

  const handleContentChange = (newContent: string) => {
    setFileContent(newContent);
    // Auto-save after a delay
    const timeoutId = setTimeout(() => {
      saveFileContent(newContent);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  };

  if (authLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <div className="h-screen flex items-center justify-center">Please log in to access the IDE.</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopBar />
      
      {/* Project and Collaboration Header */}
      <ProjectSelector
        currentProject={currentProject}
        onProjectChange={setCurrentProject}
        userId={user.id}
      />
      
      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* File Management Panel */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <div className="h-full flex flex-col">
              <CollaboratorsList
                collaborators={collaborators}
                isConnected={isConnected}
              />
              <FilePanel 
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                currentProject={currentProject}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Editor Panel */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <EditorPanel 
              selectedFile={selectedFile}
              content={fileContent}
              onContentChange={handleContentChange}
              onCursorChange={updateEditingSession}
              collaborators={collaborators}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* AI Chat Panel */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <ChatPanel selectedFile={selectedFile?.filename || null} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};