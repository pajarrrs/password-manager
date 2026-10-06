import React, { useState } from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import { LockScreen } from './components/LockScreen';
import { Navbar } from './components/Navbar';
import { VaultList } from './components/VaultList';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ItemFormModal } from './components/ItemFormModal';
import { PasswordGeneratorModal } from './components/PasswordGeneratorModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { SettingsModal } from './components/SettingsModal';
import { VaultItem } from './types/vault';

const MainLayout: React.FC = () => {
  const { isLocked, isLoading } = useVault();

  // Modals state
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian-950 text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <span className="text-xs font-mono text-zinc-500">Checking vault...</span>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <div className="min-h-screen bg-obsidian-950 text-zinc-100 flex flex-col pb-10 font-sans selection:bg-white/10 selection:text-white">
      <Navbar
        onOpenNewItem={() => {
          setEditingItem(null);
          setIsFormOpen(true);
        }}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1">
        <VaultList
          onSelectItem={(item) => setSelectedItem(item)}
          onOpenNewItem={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
        />
      </main>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onEdit={(item) => {
          setSelectedItem(null);
          setEditingItem(item);
          setIsFormOpen(true);
        }}
      />

      {/* Add / Edit Form Modal */}
      <ItemFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingItem(null);
        }}
        initialItem={editingItem}
      />

      {/* Standalone Password Generator */}
      <PasswordGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
      />

      {/* Security Audit Modal */}
      <SecurityAuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        onSelectFixItem={(item) => {
          setEditingItem(item);
          setIsFormOpen(true);
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <VaultProvider>
      <MainLayout />
    </VaultProvider>
  );
}

export default App;
