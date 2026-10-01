import React, { useState } from 'react';
import { FileText, Users, ChevronDown, Check, ShieldAlert } from 'lucide-react';
import { useDemoUser } from '../context/DemoUserContext';

export const Header: React.FC = () => {
  const { currentUser, switchUser, availableUsers } = useDemoUser();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">DocuCraft</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  <ShieldAlert className="w-3 h-3 mr-1" />
                  Demo Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Lightweight Collaborative Document Editor</p>
            </div>
          </div>

          {/* User Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-3 p-1.5 pr-3 rounded-lg hover:bg-slate-100 transition border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-medium flex items-center justify-center text-sm shadow-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs text-slate-400 font-medium leading-none">Logged in as</p>
                <p className="text-sm font-semibold text-slate-800 leading-tight">{currentUser.name}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {isOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Switch Demo User</p>
                    <p className="text-xs text-slate-500 mt-0.5">Select a user to test access control</p>
                  </div>
                  <div className="py-1">
                    {availableUsers.map((user) => {
                      const isSelected = user.id === currentUser.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            switchUser(user);
                            setIsOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition ${
                            isSelected ? 'bg-blue-50/60' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className={`text-sm ${isSelected ? 'font-bold text-blue-900' : 'font-medium text-slate-700'}`}>
                                {user.name}
                              </p>
                              <p className="text-xs text-slate-400">{user.email}</p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
