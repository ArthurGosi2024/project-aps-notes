// app/index.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddNoteModal from './components/AddNoteModal';
import EditNoteModal from './components/EditNoteModal';
import ViewNoteModal from './components/ViewNoteModal';
import { deleteNote, getNotes, Note, togglePinned } from './storage/notes-storage';

export default function HomeScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const notesData = await getNotes();
      // Ordenar por data de atualização (mais recentes primeiro)
      const sortedNotes = notesData.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setNotes(sortedNotes);
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar as notas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleAddNote = () => {
    setShowAddModal(true);
  };

  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setShowViewModal(true);
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setShowEditModal(true);
  };

  const handleDeleteNote = async (noteId: string): Promise<boolean> => {
    try {
      console.log('Iniciando exclusão da nota:', noteId);
      const success = await deleteNote(noteId);
      console.log('Resultado da exclusão:', success);
      
      if (success) {
        console.log('Recarregando lista de notas...');
        await loadNotes();
        console.log('Lista recarregada com sucesso');
        return true;
      } else {
        console.log('Falha na exclusão da nota');
        return false;
      }
    } catch (error) {
      console.error('Erro na função handleDeleteNote:', error);
      return false;
    }
  };

  const handleNoteAdded = () => {
    loadNotes();
  };

  const handleNoteUpdated = () => {
    loadNotes();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Hoje';
    } else if (diffDays === 2) {
      return 'Ontem';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={styles.noteItem}
      onPress={() => handleViewNote(item)}
      activeOpacity={0.7}
    >
      <View style={styles.noteContent}>
        <Text style={styles.noteTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.notePreview} numberOfLines={2}>
          {item.content}
        </Text>
        <Text style={styles.noteDate}>
          {formatDate(item.updatedAt)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => handleEditNote(item)}
      >
        <Text style={styles.editButtonText}>Editar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.editButton, { marginLeft: 8 }]}
        onPress={async () => {
          await togglePinned(item.id);
          await loadNotes();
        }}
      >
        <Text style={styles.editButtonText}>{item.pinned ? 'Desafixar' : 'Fixar'}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>Nenhuma nota encontrada</Text>
      <Text style={styles.emptyStateText}>
        Toque no botão "+" para criar sua primeira nota.
        Use o campo de busca para filtrar por título ou conteúdo.
        Você pode fixar notas importantes para aparecerem primeiro.
      </Text>
    </View>
  );

  const filteredNotes = useMemo(() => {
    const text = query.trim().toLowerCase();
    const listByText = text
      ? notes.filter(n =>
          n.title.toLowerCase().includes(text) ||
          n.content.toLowerCase().includes(text)
        )
      : notes;
    const list = categoryFilter
      ? listByText.filter(n => (n.category || '').toLowerCase() === categoryFilter.toLowerCase())
      : listByText;
    const pinned = list.filter(n => n.pinned);
    const others = list.filter(n => !n.pinned);
    return [...pinned, ...others];
  }, [notes, query]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => {
      if (n.category) set.add(n.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [notes]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Notas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddNote}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Dica: use a busca para localizar notas rapidamente. Fixe notas essenciais
          para mantê-las no topo. Toque na nota para ver detalhes, editar,
          compartilhar e excluir. Você também pode exportar/importar notas abaixo.
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Buscar por título ou conteúdo"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
        {categories.length > 0 && (
          <View style={styles.chipsRow}>
            <TouchableOpacity
              style={[styles.chip, !categoryFilter && styles.chipActive]}
              onPress={() => setCategoryFilter(null)}
            >
              <Text style={[styles.chipText, !categoryFilter && styles.chipTextActive]}>Todas</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, categoryFilter === cat && styles.chipActive]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Text style={[styles.chipText, categoryFilter === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderNoteItem}
        contentContainerStyle={filteredNotes.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadNotes} />
        }
        showsVerticalScrollIndicator={false}
      />

      <AddNoteModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onNoteAdded={handleNoteAdded}
      />

      <ViewNoteModal
        visible={showViewModal}
        note={selectedNote}
        onClose={() => {
          setShowViewModal(false);
          setSelectedNote(null);
        }}
        onEdit={handleEditNote}
        onDelete={handleDeleteNote}
      />

      <EditNoteModal
        visible={showEditModal}
        note={selectedNote}
        onClose={() => {
          setShowEditModal(false);
          setSelectedNote(null);
        }}
        onNoteUpdated={handleNoteUpdated}
      />

      <View style={styles.footerActions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={async () => {
            const json = await (await import('./storage/notes-storage')).exportNotes();
            Alert.alert('Exportar', 'JSON copiado/gerado. Compartilhe ou copie do console.');
            console.log('NOTES_EXPORT_JSON =>\n', json);
          }}
        >
          <Text style={styles.secondaryButtonText}>Exportar JSON</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={async () => {
            Alert.prompt(
              'Importar Notas',
              'Cole abaixo o JSON exportado para importar as notas.',
              [
                {
                  text: 'Cancelar',
                  style: 'cancel',
                },
                {
                  text: 'Importar',
                  onPress: async (text?: string) => {
                    if (!text) return;
                    const res = await (await import('./storage/notes-storage')).importNotes(text);
                    if (res) {
                      Alert.alert('Sucesso', `Notas importadas: ${res.imported}`);
                      loadNotes();
                    } else {
                      Alert.alert('Erro', 'JSON inválido ou erro na importação.');
                    }
                  },
                },
              ],
              'plain-text'
            );
          }}
        >
          <Text style={styles.secondaryButtonText}>Importar JSON</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  chipActive: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f2f2f7',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoBox: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  noteItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  noteContent: {
    flex: 1,
    marginRight: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notePreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
