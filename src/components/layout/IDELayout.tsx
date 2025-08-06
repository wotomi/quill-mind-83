import { useState, useEffect } from "react";
import { FilePanel } from "../panels/FilePanel";
import { EditorPanel } from "../panels/EditorPanel"; 
import { ChatPanel } from "../panels/ChatPanel";
import { TopBar } from "./TopBar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export const IDELayout = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const { toast } = useToast();

  const handleFileSelect = async (filename: string) => {
    if (!filename) {
      setSelectedFile(null);
      setFileContent("");
      return;
    }

    setSelectedFile(filename);
    // Content will be loaded by EditorPanel
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopBar />
      
      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* File Management Panel */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <FilePanel 
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Editor Panel */}
          <ResizablePanel defaultSize={55} minSize={30}>
            <EditorPanel 
              selectedFile={selectedFile}
              content={fileContent}
              onContentChange={setFileContent}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* AI Chat Panel */}
          <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
            <ChatPanel selectedFile={selectedFile} />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};