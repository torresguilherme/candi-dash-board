import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import logo from "@/assets/logo.png";

interface AdminHeaderProps {
  onSignOut: () => void;
  onToggleSidebar?: () => void;
}

export const AdminHeader = ({ onSignOut, onToggleSidebar }: AdminHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 border-b bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onToggleSidebar && (
              <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <img src={logo} alt="Person Corp" className="h-12 object-contain" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onSignOut}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
