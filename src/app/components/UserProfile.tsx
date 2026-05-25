import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function UserProfile() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 rounded-full transition-colors"
      >
        <img
          src={user.avatar}
          alt={user.name}
          className="w-8 h-8 rounded-full"
        />
        <span className="font-medium text-sm text-gray-900 hidden sm:block">{user.name}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform hidden sm:block ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
          <button className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-sm text-gray-700">
            <User className="w-4 h-4" />
            내 계정
          </button>
          <button
            onClick={logout}
            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-sm text-gray-700"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
