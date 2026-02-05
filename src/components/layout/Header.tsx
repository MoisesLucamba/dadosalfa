import { motion } from "framer-motion";
import { Bell, Search, User, ChevronDown, LogOut, Sun, Moon, Settings, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useNavigate } from "react-router-dom";
import { MobileNav } from "./MobileNav";
import { DataSyncButton } from "@/components/dashboard/DataSyncButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface HeaderProps {
  activeItem?: string;
}

export function Header({ activeItem = "/" }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão terminada com sucesso");
    navigate("/auth");
  };

  // Extract user display name
  const userDisplayName = user?.email?.split("@")[0] || "Utilizador";
  const userInitials = userDisplayName.substring(0, 2).toUpperCase();

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="h-16 md:h-18 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-black to-gray-900 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 shadow-lg"
    >
      {/* ═══════════════════════════════════════════════════════════════
          LEFT SECTION - Mobile Nav + Search
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-3 md:gap-4 flex-1">
        <MobileNav activeItem={activeItem} />
        
        {/* Search Bar */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative hidden sm:block cursor-pointer flex-1 max-w-md"
          onClick={() => navigate("/search")}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-xl blur opacity-0 hover:opacity-100 transition-opacity duration-300" />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <div className="w-full h-10 pl-10 pr-4 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-800 hover:border-red-800/50 rounded-xl text-sm text-gray-400 flex items-center transition-all duration-300">
              Pesquisar blocos, operadores, análises...
            </div>
          </div>
        </motion.div>
        
        {/* Mobile Search Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="sm:hidden hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
          onClick={() => navigate("/search")}
        >
          <Search className="w-5 h-5" />
        </Button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          RIGHT SECTION - Actions & User Menu
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 md:gap-3">
        
        {/* Data Sync Button */}
        <div className="hidden lg:block">
          <DataSyncButton variant="compact" />
        </div>
        
        {/* Live Indicator */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-800/30 rounded-full"
        >
          <motion.span 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-red-500 rounded-full shadow-lg shadow-red-500/50"
          />
          <span className="text-xs font-bold text-red-400 uppercase tracking-wider">LIVE</span>
        </motion.div>

        {/* Theme Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          className="relative overflow-hidden group hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
          title={theme === "dark" ? "Modo Claro" : "Modo Escuro"}
        >
          <motion.div
            initial={false}
            animate={{ rotate: theme === "dark" ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </motion.div>
        </Button>

        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors group"
          title="Notificações"
        >
          <Bell className="w-5 h-5 group-hover:animate-wiggle" />
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full shadow-lg shadow-red-500/50"
          />
        </Button>

        {/* User Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-xl hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-gray-900/50 border border-transparent hover:border-gray-800 transition-all duration-300 group"
            >
              {/* User Avatar */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-blue-600 rounded-full blur opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-red-800 to-red-600 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">{userInitials}</span>
                </div>
              </div>

              {/* User Info - Desktop Only */}
              <div className="text-left hidden md:block">
                <p className="text-sm font-bold text-white truncate max-w-[140px] group-hover:text-red-400 transition-colors">
                  {userDisplayName}
                </p>
                <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                  Conta Ativa
                </p>
              </div>

              <ChevronDown className="w-4 h-4 text-gray-500 hidden md:block group-hover:text-white transition-colors" />
            </motion.button>
          </DropdownMenuTrigger>

          {/* Dropdown Content */}
          <DropdownMenuContent 
            align="end" 
            className="w-64 bg-gradient-to-b from-gray-900 to-black border border-gray-800 shadow-2xl rounded-xl p-2"
          >
            {/* User Info Header */}
            <DropdownMenuLabel className="px-3 py-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-800 to-red-600 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">{userInitials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {userDisplayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>

            <div className="py-1">
              {/* Profile Option */}
              <DropdownMenuItem 
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 cursor-pointer transition-colors"
                onClick={() => {
                  toast.info("Perfil em desenvolvimento");
                }}
              >
                <UserCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Ver Perfil</span>
              </DropdownMenuItem>

              {/* Settings Option */}
              <DropdownMenuItem 
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 cursor-pointer transition-colors"
                onClick={() => {
                  toast.info("Configurações em desenvolvimento");
                }}
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Configurações</span>
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="bg-gray-800 my-1" />

            {/* Sign Out Option */}
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-bold">Terminar Sessão</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CUSTOM ANIMATIONS
          ═══════════════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        .group:hover .animate-wiggle {
          animation: wiggle 0.5s ease-in-out;
        }
      `}</style>
    </motion.header>
  );
}