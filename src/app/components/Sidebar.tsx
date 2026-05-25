import { useState, useRef, useEffect } from 'react';
import { Plus, Coffee, MoreVertical, Pencil, Trash2, X, Check, Menu } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useConversation } from '../contexts/ConversationContext';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { conversations, deleteConversation, renameConversation, currentConversation, setCurrentConversation } = useConversation();
  const { isAuthenticated } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNewChat = () => {
    setCurrentConversation(null);
    navigate('/');
    onClose?.();
  };

  const handleConversationClick = (conv: typeof conversations[0]) => {
    setCurrentConversation(conv);
    navigate('/response', { state: { userMessage: conv.userMessage } });
    onClose?.();
  };

  const handleRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle);
    setMenuOpenId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    deleteConversation(id);
    setMenuOpenId(null);
  };

  return (
    <aside className={`
      w-[260px] shrink-0 bg-white border-r border-gray-200/50 flex flex-col
      fixed lg:static inset-y-0 left-0 z-40 transition-transform duration-300
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Mobile close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Logo */}
      <div className="h-14 border-b border-gray-200/50 px-4 flex items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#5C6BC0] rounded-lg flex items-center justify-center">
            <span className="text-white font-semibold text-base">U</span>
          </div>
          <span className="text-base font-semibold text-gray-900">UDI AI</span>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="w-full h-10 bg-[#5C6BC0] hover:bg-[#4E5BAD] text-white rounded-xl flex items-center justify-center gap-2 transition-colors font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          새 대화
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {isAuthenticated ? (
          conversations.length > 0 ? (
            conversations.map((conv) => (
              <div key={conv.id} className="relative group">
                {editingId === conv.id ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(conv.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-[#5C6BC0]"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRename(conv.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleConversationClick(conv)}
                      className={`flex-1 px-3 py-2 text-sm text-left hover:bg-gray-50 rounded-lg truncate ${
                        currentConversation?.id === conv.id ? 'bg-gray-100' : ''
                      }`}
                    >
                      {conv.title}
                    </button>
                    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity" ref={menuOpenId === conv.id ? menuRef : null}>
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === conv.id ? null : conv.id)}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                      {menuOpenId === conv.id && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                          <button
                            onClick={() => handleRename(conv.id, conv.title)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            이름 변경
                          </button>
                          <button
                            onClick={() => handleDelete(conv.id)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="px-3 py-4 text-sm text-gray-500 text-center">
              아직 대화 내역이 없어요
            </p>
          )
        ) : (
          <p className="px-3 py-4 text-sm text-gray-500 text-center">
            로그인하시면 대화 내역이 저장됩니다
          </p>
        )}
      </div>

      {/* Support Link */}
      <div className="p-4 border-t border-gray-200/50">
        <a
          href="#"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#5C6BC0] transition-colors"
        >
          <Coffee className="w-4 h-4" />
          커피 한 잔 후원하기
        </a>
      </div>
    </aside>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <Menu className="w-6 h-6 text-gray-700" />
    </button>
  );
}
