import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Save, 
  Eye, 
  Code, 
  GitCompare, 
  Check, 
  X,
  FileText,
  Download,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService, DiffResponse } from "@/services/api";

interface EditorPanelProps {
  selectedFile: string | null;
  content: string;
  onContentChange: (content: string) => void;
}

export const EditorPanel = ({ selectedFile, content, onContentChange }: EditorPanelProps) => {
  const [activeTab, setActiveTab] = useState("edit");
  const [hasChanges, setHasChanges] = useState(false);
  const [diff, setDiff] = useState<DiffResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  // Load file content when selected file changes
  useEffect(() => {
    if (selectedFile) {
      loadFileContent();
    }
  }, [selectedFile]);

  // Load diff when switching to diff tab
  useEffect(() => {
    if (activeTab === "diff" && selectedFile) {
      loadDiff();
    }
  }, [activeTab, selectedFile]);

  const loadFileContent = async () => {
    if (!selectedFile) return;
    
    try {
      setLoading(true);
      const response = await apiService.getFileContent(selectedFile);
      onContentChange(response.content);
      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Error loading file",
        description: error instanceof Error ? error.message : "Failed to load file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDiff = async () => {
    if (!selectedFile) return;
    
    try {
      const diffResponse = await apiService.getFileDiff(selectedFile);
      setDiff(diffResponse);
    } catch (error) {
      toast({
        title: "Error loading diff",
        description: error instanceof Error ? error.message : "Failed to load diff",
        variant: "destructive",
      });
    }
  };

  const handleContentChange = (newContent: string) => {
    onContentChange(newContent);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    
    try {
      setSaving(true);
      await apiService.updateFileContent(selectedFile, content);
      setHasChanges(false);
      toast({
        title: "File saved",
        description: `${selectedFile} has been saved successfully`,
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save file",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptChanges = async () => {
    if (!selectedFile) return;
    
    try {
      await apiService.acceptChanges(selectedFile);
      toast({
        title: "Changes accepted",
        description: "All changes have been accepted",
      });
      await loadDiff(); // Refresh diff
    } catch (error) {
      toast({
        title: "Error accepting changes",
        description: error instanceof Error ? error.message : "Failed to accept changes",
        variant: "destructive",
      });
    }
  };

  const handleRejectChanges = async () => {
    if (!selectedFile) return;
    
    try {
      await apiService.rejectChanges(selectedFile);
      toast({
        title: "Changes rejected",
        description: "All changes have been rejected",
      });
      await loadDiff(); // Refresh diff
      await loadFileContent(); // Reload content
    } catch (error) {
      toast({
        title: "Error rejecting changes",
        description: error instanceof Error ? error.message : "Failed to reject changes",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: 'pdf' | 'html' | 'docx' | 'txt') => {
    if (!selectedFile) return;
    
    try {
      setExporting(true);
      const response = await apiService.exportFile({
        filename: selectedFile,
        format,
        options: {
          include_metadata: true,
          styling: 'professional'
        }
      });
      
      // In a real implementation, you might want to trigger a download
      window.open(response.download_url, '_blank');
      
      toast({
        title: "Export successful",
        description: `${selectedFile} exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export file",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // Parse diff lines for better display
  const parsedDiff = diff?.diff?.map((line, index) => {
    if (line.startsWith('@@')) {
      return { type: 'header', content: line, lineNumber: null };
    } else if (line.startsWith('+')) {
      return { type: 'added', content: line.substring(1), lineNumber: null };
    } else if (line.startsWith('-')) {
      return { type: 'removed', content: line.substring(1), lineNumber: null };
    } else {
      return { type: 'context', content: line, lineNumber: null };
    }
  }) || [];

  if (!selectedFile) {
    return (
      <div className="h-full bg-editor border-r border-panel-border flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No File Selected</h3>
          <p className="text-muted-foreground">Choose a file from the panel to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-editor border-r border-panel-border flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-panel-border bg-panel-header flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{selectedFile}</span>
            {hasChanges && (
              <div className="w-2 h-2 rounded-full bg-primary" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={handleSave}
            disabled={!hasChanges || saving || loading}
            className="text-xs"
          >
            {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
            Save
          </Button>
          
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => handleExport('pdf')}
              disabled={exporting || !selectedFile}
              className="text-xs"
            >
              {exporting ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="h-10 bg-panel-header border-b border-panel-border rounded-none justify-start px-4">
          <TabsTrigger value="edit" className="data-[state=active]:bg-active-tab/20 data-[state=active]:text-primary">
            <Code className="w-3 h-3 mr-1" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="data-[state=active]:bg-active-tab/20 data-[state=active]:text-primary">
            <Eye className="w-3 h-3 mr-1" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="diff" className="data-[state=active]:bg-active-tab/20 data-[state=active]:text-primary">
            <GitCompare className="w-3 h-3 mr-1" />
            Diff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="flex-1 m-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Start writing your markdown..."
              className="h-full resize-none border-0 rounded-none bg-transparent font-mono text-sm leading-relaxed focus-visible:ring-0"
            />
          )}
        </TabsContent>

        <TabsContent value="preview" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-6 prose prose-invert max-w-none">
              {/* Mock markdown preview */}
              <h1>Preview of {selectedFile}</h1>
              <p>This would show the rendered markdown content...</p>
              <pre className="bg-muted p-4 rounded">{content}</pre>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="diff" className="flex-1 m-0">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-panel-border bg-panel-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">Changes</h3>
                  {diff && (
                    <span className="text-xs text-muted-foreground">
                      {diff.changes} change{diff.changes !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleAcceptChanges}
                    disabled={!diff?.has_changes}
                    className="h-7 text-xs bg-diff-added/20 border-diff-added/50 hover:bg-diff-added/30"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Accept All
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleRejectChanges}
                    disabled={!diff?.has_changes}
                    className="h-7 text-xs bg-diff-removed/20 border-diff-removed/50 hover:bg-diff-removed/30"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Reject All
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4">
                {!diff ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !diff.has_changes ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No changes detected
                  </div>
                ) : (
                  <div className="font-mono text-sm space-y-1">
                    {parsedDiff.map((line, index) => (
                      <div 
                        key={index}
                        className={cn(
                          "p-2 rounded",
                          line.type === "header" && "bg-muted/50 text-muted-foreground font-semibold",
                          line.type === "added" && "bg-diff-added/10 text-diff-added",
                          line.type === "removed" && "bg-diff-removed/10 text-diff-removed",
                          line.type === "context" && "text-foreground"
                        )}
                      >
                        {line.type === "added" && "+ "}
                        {line.type === "removed" && "- "}
                        {line.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};