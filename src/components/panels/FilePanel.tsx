import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  File, 
  Folder, 
  Search, 
  Plus,
  MoreHorizontal,
  Trash2,
  FileText,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { FileData, Project } from "@/types/collaboration";

interface FilePanelProps {
  selectedFile: FileData | null;
  onFileSelect: (file: FileData | null) => void;
  currentProject: Project | null;
}

export const FilePanel = ({ selectedFile, onFileSelect, currentProject }: FilePanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Load files when project changes
  useEffect(() => {
    if (currentProject) {
      loadFiles();
    } else {
      setFiles([]);
      setLoading(false);
    }
  }, [currentProject]);

  const loadFiles = async () => {
    if (!currentProject) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('filename');

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      toast({
        title: "Error loading files",
        description: error instanceof Error ? error.message : "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentProject) {
      toast({
        title: "No project selected",
        description: "Please select a project before uploading files.",
        variant: "destructive"
      });
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const content = await file.text();
      
      const { data, error } = await supabase
        .from('files')
        .insert({
          project_id: currentProject.id,
          filename: file.name,
          content: content,
          file_type: file.type || 'text/plain'
        })
        .select()
        .single();

      if (error) throw error;

      setFiles(prev => [...prev, data]);
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
      
      // Reset the input
      event.target.value = '';
    } catch (error) {
      toast({
        title: "Error uploading file",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (file: FileData, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', file.id);

      if (error) throw error;

      setFiles(prev => prev.filter(f => f.id !== file.id));
      
      if (selectedFile?.id === file.id) {
        onFileSelect(null);
      }
      
      toast({
        title: "File deleted",
        description: `${file.filename} has been deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error deleting file",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const createNewFile = async () => {
    if (!currentProject) {
      toast({
        title: "No project selected",
        description: "Please select a project before creating files.",
        variant: "destructive"
      });
      return;
    }

    const filename = prompt("Enter filename:");
    if (!filename) return;

    try {
      const { data, error } = await supabase
        .from('files')
        .insert({
          project_id: currentProject.id,
          filename: filename,
          content: '',
          file_type: 'text/plain'
        })
        .select()
        .single();

      if (error) throw error;

      setFiles(prev => [...prev, data]);
      onFileSelect(data);
      
      toast({
        title: "File created",
        description: `${filename} has been created.`,
      });
    } catch (error) {
      toast({
        title: "Error creating file",
        description: error instanceof Error ? error.message : "Failed to create file",
        variant: "destructive",
      });
    }
  };

  const filteredFiles = files.filter(file =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentProject) {
    return (
      <div className="h-full p-4 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Select a project to view files</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold text-sm">Files</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={createNewFile}
            className="ml-auto"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          {/* File Upload */}
          <div className="relative">
            <input
              type="file"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Uploading..." : "Upload File"}
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>
      </div>

      {/* File List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery ? "No files match your search" : "No files yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => onFileSelect(file)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md cursor-pointer group hover:bg-accent/50 transition-colors",
                    selectedFile?.id === file.id && "bg-accent text-accent-foreground"
                  )}
                >
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm flex-1 truncate">{file.filename}</span>
                  <button
                    onClick={(e) => handleDeleteFile(file, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/20 rounded"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};