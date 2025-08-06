import { Button } from "@/components/ui/button";
import { Code2, FileText, MessageSquare, Settings } from "lucide-react";

export const TopBar = () => {
  return (
    <header className="h-12 border-b border-panel-border bg-panel-header flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-primary flex items-center justify-center">
            <Code2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">QuillMind</span>
        </div>
        
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <FileText className="w-4 h-4 mr-2" />
            Files
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            <MessageSquare className="w-4 h-4 mr-2" />
            AI Chat
          </Button>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};