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
import { apiService, FileInfo } from "@/services/api";

interface FilePanelProps {
  selectedFile: string | null;
  onFileSelect: (filename: string) => void;
}

export const FilePanel = ({ selectedFile, onFileSelect }: FilePanelProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const filesData = await apiService.getFiles();
      setFiles(filesData);
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
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await apiService.uploadFile(file);
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully`,
      });
      await loadFiles(); // Refresh file list
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (filename: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await apiService.deleteFile(filename);
      toast({
        title: "File deleted",
        description: `${filename} has been deleted`,
      });
      await loadFiles();
      
      // Clear selection if deleted file was selected
      if (selectedFile === filename) {
        onFileSelect("");
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full bg-file-tree border-r border-panel-border flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-panel-border bg-panel-header">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-foreground">Files</h2>
          <div className="flex gap-1">
            <input
              type="file"
              accept=".md,.txt,.json"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" disabled={uploading}>
              <Plus className="w-3 h-3" />
            </Button>
            <label htmlFor="file-upload">
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" asChild disabled={uploading}>
                <span className="cursor-pointer">
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                </span>
              </Button>
            </label>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-8 text-xs bg-background border-border"
          />
        </div>
      </div>

      {/* File List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? "No files match your search" : "No files uploaded yet"}
            </div>
          ) : (
            filteredFiles.map((file) => (
              <div
                key={file.name}
                onClick={() => file.type === "file" && onFileSelect(file.name)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded cursor-pointer group transition-colors",
                  "hover:bg-secondary/50",
                  selectedFile === file.name && file.type === "file" 
                    ? "bg-primary/20 text-primary border border-primary/30" 
                    : "text-foreground"
                )}
              >
                {file.type === "folder" ? (
                  <Folder className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <FileText className="w-4 h-4 text-muted-foreground" />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{file.name}</div>
                  {file.size && (
                    <div className="text-xs text-muted-foreground">{file.size}</div>
                  )}
                </div>

                {file.type === "file" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteFile(file.name, e)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};