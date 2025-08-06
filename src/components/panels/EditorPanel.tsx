import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, 
  Eye, 
  Code, 
  Users,
  FileText,
  Download,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FileData, Collaborator } from "@/types/collaboration";

interface EditorPanelProps {
  selectedFile: FileData | null;
  content: string;
  onContentChange: (content: string) => void;
  onCursorChange?: (position: number, selectionStart: number, selectionEnd: number) => void;
  collaborators?: Collaborator[];
}

export const EditorPanel = ({ 
  selectedFile, 
  content, 
  onContentChange, 
  onCursorChange,
  collaborators = []
}: EditorPanelProps) => {
  const [activeTab, setActiveTab] = useState("edit");
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Track changes
  useEffect(() => {
    if (selectedFile) {
      setHasChanges(content !== selectedFile.content);
    }
  }, [content, selectedFile]);

  // Handle cursor position changes
  const handleSelectionChange = () => {
    if (textareaRef.current && onCursorChange) {
      const textarea = textareaRef.current;
      onCursorChange(
        textarea.selectionStart,
        textarea.selectionStart,
        textarea.selectionEnd
      );
    }
  };

  const handleContentChange = (newContent: string) => {
    onContentChange(newContent);
  };

  const renderMarkdownPreview = (text: string) => {
    // Simple markdown rendering - you could use a library like react-markdown for more features
    return text
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-bold mb-2">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-semibold mb-2">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-medium mb-2">{line.slice(4)}</h3>;
        }
        if (line.startsWith('- ')) {
          return <li key={index} className="ml-4">{line.slice(2)}</li>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="mb-2">{line}</p>;
      });
  };

  const renderCollaboratorCursors = () => {
    if (!textareaRef.current || collaborators.length === 0) return null;

    return collaborators.map((collaborator, index) => (
      <Badge
        key={collaborator.id}
        variant="secondary"
        className="absolute top-2 right-2"
        style={{
          marginTop: `${index * 24}px`,
          backgroundColor: `hsl(${(collaborator.id.charCodeAt(0) * 137.5) % 360}, 70%, 50%)`,
          color: 'white'
        }}
      >
        {collaborator.display_name}
      </Badge>
    ));
  };

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-medium mb-2">No File Selected</h3>
          <p className="text-sm">
            Select a file from the file panel to start editing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="font-medium text-sm">{selectedFile.filename}</span>
          {hasChanges && (
            <Badge variant="secondary" className="text-xs">
              Modified
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {collaborators.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {collaborators.length}
              </span>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            disabled={!hasChanges || saving}
            onClick={() => {
              setSaving(true);
              // Content is auto-saved via the collaboration hook
              setTimeout(() => setSaving(false), 1000);
            }}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Editor Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mx-3 mt-3">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="flex-1 p-3 pt-0">
          <div className="relative h-full">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onSelect={handleSelectionChange}
              onKeyUp={handleSelectionChange}
              onClick={handleSelectionChange}
              placeholder="Start typing..."
              className="h-full resize-none font-mono text-sm leading-6"
              style={{ minHeight: '100%' }}
            />
            {renderCollaboratorCursors()}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="flex-1 p-3 pt-0">
          <ScrollArea className="h-full">
            <div className="prose prose-sm max-w-none">
              {content ? (
                <div className="space-y-2">
                  {renderMarkdownPreview(content)}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>No content to preview</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};