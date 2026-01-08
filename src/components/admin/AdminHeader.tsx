import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, UserPlus, Menu } from "lucide-react";
import logo from "@/assets/logo.png";

interface AdminHeaderProps {
  onSignOut: () => void;
  onToggleSidebar?: () => void;
}

export const AdminHeader = ({ onSignOut, onToggleSidebar }: AdminHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {onToggleSidebar && (
              <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <img src={logo} alt="Person Corp" className="h-10 w-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Person Corp
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Área Administrativa
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate("/cadastro")}
              className="hidden sm:flex"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Cadastro
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onSignOut}
              className="text-muted-foreground hover:text-foreground"
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
