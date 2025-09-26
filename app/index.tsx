// app/index.tsx
// Diego Paiva Batista / Matricula: 2024101217
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

// Temas
const lightTheme = {
  background: '#f8f9fa',
  card: '#fff',
  text: '#333',
  subtext: '#666',
  border: '#e0e0e0',
  button: '#ff0037ff',
  buttonText: '#fff',
};

const darkTheme = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#ff006fff',
  subtext: '#aaa',
  border: '#333',
  button: '#a155ffff',
  buttonText: '#000',
};

export default function HomeScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const loadNotes = async () => {
    setLoading(true);
    try {
      const notesData = await getNotes();
      const sortedNotes = notesData.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setNotes(sortedNotes);
      if (categoryFilter && !sortedNotes.some(n => (n.category || '') === categoryFilter)) {
        setCategoryFilter(null);
      }
       if (tagFilter && !sortedNotes.some(n => (n.tags || []).includes(tagFilter))) {
        setTagFilter(null);
    }
    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar as notas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleAddNote = () => setShowAddModal(true);
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
      const success = await deleteNote(noteId);
      if (success) {
        await loadNotes();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };
  const handleNoteAdded = () => loadNotes();
  const handleNoteUpdated = () => loadNotes();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`;
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={[styles.noteItem, { backgroundColor: item.color || theme.card, borderColor: theme.border }]}
      onPress={() => handleViewNote(item)}
      activeOpacity={0.7}
    >
      <View style={styles.noteContent}>
        <Text style={[styles.noteTitle, { color: '#000' }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.notePreview, { color: '#000' }]} numberOfLines={2}>
          {item.content}
        </Text>
        <Text style={[styles.noteDate, { color: 'rgba(26, 26, 26, 1)' }]}>
          {formatDate(item.updatedAt)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: theme.border }]}
        onPress={() => handleEditNote(item)}
      >
        <Text style={[styles.editButtonText, { color: theme.button }]}>Editar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.editButton, { marginLeft: 8, backgroundColor: theme.border }]}
        onPress={async () => {
          await togglePinned(item.id);
          await loadNotes();
        }}
      >
        <Text style={[styles.editButtonText, { color: theme.button }]}>{item.pinned ? 'Desafixar' : 'Fixar'}</Text>
      </TouchableOpacity>

      {/* Lixeira */}
      <TouchableOpacity
        style={[styles.editButton, { marginLeft: 8, backgroundColor: '#ff0000ff' }]}
        onPress={async () => {
          await handleDeleteNote(item.id);
        }}
      >
        <Text style={[styles.editButtonText, { color: '#fff' }]}>X</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyStateTitle, { color: theme.subtext }]}>Nenhuma nota encontrada</Text>
      <Text style={[styles.emptyStateText, { color: theme.subtext }]}>
        Toque no botão "+" para criar sua primeira nota.
        Use o campo de busca para filtrar por título ou conteúdo.
        Você pode fixar notas importantes para aparecerem primeiro.
      </Text>
    </View>
  );

  const filteredNotes = useMemo(() => {
    const text = query.trim().toLowerCase();
    let listByText = text
      ? notes.filter(n => n.title.toLowerCase().includes(text) || n.content.toLowerCase().includes(text))
      : [...notes];

    if (categoryFilter) {
      listByText = listByText.filter(n => (n.category || '').toLowerCase() === categoryFilter.toLowerCase());
    }

    if (tagFilter) {
      listByText = listByText.filter(n => n.tags && n.tags.length > 0 && n.tags.includes(tagFilter));
    }

    const pinned = listByText.filter(n => n.pinned);
    const others = listByText.filter(n => !n.pinned);
    return [...pinned, ...others];
  }, [notes, query, categoryFilter, tagFilter]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => { if (n.category) set.add(n.category); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [notes]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => { if (n.tags) n.tags.forEach(tag => set.add(tag)); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [notes]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Minhas Notas</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.button }]}
            onPress={handleAddNote}
          >
            <Text style={[styles.addButtonText, { color: theme.buttonText }]}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.button }]}
            onPress={() => setIsDarkMode(!isDarkMode)}
          >
            <Text style={[styles.addButtonText, { color: theme.buttonText, fontSize: 15 }]}>
              {isDarkMode ? '☀️' : '🌒'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DICAS */}
      <View style={[styles.infoBox, { backgroundColor: theme.card }]}>
        <Text style={[styles.infoText, { color: theme.subtext }]}>
          Dica: use a busca para localizar notas rapidamente. Fixe notas essenciais
          para mantê-las no topo. Toque na nota para ver detalhes, editar,
          compartilhar e excluir. Você também pode exportar/importar notas abaixo.
        </Text>
      </View>

      {/* BUSCA + CATEGORIAS */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TextInput
          placeholder="Buscar por título ou conteúdo"
          placeholderTextColor={theme.subtext}
          value={query}
          onChangeText={setQuery}
          style={[styles.searchInput, { backgroundColor: theme.background, color: theme.text }]}
        />
        {categories.length > 0 && (
          <View style={styles.chipsRow}>
            <TouchableOpacity
              style={[styles.chip, !categoryFilter && styles.chipActive, { backgroundColor: !categoryFilter ? theme.button : theme.card }]}
              onPress={() => setCategoryFilter(null)}
            >
              <Text style={[styles.chipText, !categoryFilter && styles.chipTextActive, { color: !categoryFilter ? theme.buttonText : theme.text }]}>Todas</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, categoryFilter === cat && styles.chipActive, { backgroundColor: categoryFilter === cat ? theme.button : theme.card }]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Text style={[styles.chipText, categoryFilter === cat && styles.chipTextActive, { color: categoryFilter === cat ? theme.buttonText : theme.text }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* FILTRO POR TAGS */}
      {allTags.length > 0 && (
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, !tagFilter && styles.chipActive, { backgroundColor: !tagFilter ? theme.button : theme.card }]}
            onPress={() => setTagFilter(null)}
          >
            <Text style={[styles.chipText, !tagFilter && styles.chipTextActive, { color: !tagFilter ? theme.buttonText : theme.text }]}>
              Todas
            </Text>
          </TouchableOpacity>
          {allTags.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[styles.chip, tagFilter === tag && styles.chipActive, { backgroundColor: tagFilter === tag ? theme.button : theme.card }]}
              onPress={() => setTagFilter(tag)}
            >
              <Text style={[styles.chipText, tagFilter === tag && styles.chipTextActive, { color: tagFilter === tag ? theme.buttonText : theme.text }]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* LISTA DE NOTAS */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderNoteItem}
        contentContainerStyle={filteredNotes.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadNotes} />}
        showsVerticalScrollIndicator={false}
      />

      {/* MODAIS */}
      <AddNoteModal visible={showAddModal} onClose={() => setShowAddModal(false)} onNoteAdded={handleNoteAdded} />
      <ViewNoteModal
        visible={showViewModal}
        note={selectedNote}
        onClose={() => { setShowViewModal(false); setSelectedNote(null); }}
        onEdit={handleEditNote}
        onDelete={handleDeleteNote}
      />
      <EditNoteModal
        visible={showEditModal}
        note={selectedNote}
        onClose={() => { setShowEditModal(false); setSelectedNote(null); }}
        onNoteUpdated={handleNoteUpdated}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  searchContainer: { paddingHorizontal: 60, paddingBottom: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8, marginTop: 8, marginLeft: 9},
  chip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#f0f0f0' },
  chipActive: { backgroundColor: '#007AFF' },
  chipText: { color: '#333', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  searchInput: { height: 40, backgroundColor: '#f2f2f7', borderRadius: 8, paddingHorizontal: 12, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  infoBox: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  infoText: { fontSize: 13, color: '#666', lineHeight: 18 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  addButtonText: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  listContainer: { padding: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  secondaryButton: { flex: 1, paddingVertical: 4, backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center' },
  secondaryButtonText: { color: '#333', fontWeight: '600' },
  noteItem: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  noteContent: { flex: 1, marginRight: 12 },
  noteTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  notePreview: { fontSize: 14, color: '#666', marginBottom: 8, lineHeight: 20 },
  noteDate: { fontSize: 12, color: '#999' },
  editButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f0f0f0', borderRadius: 6 },
  editButtonText: { fontSize: 12, color: '#007AFF', fontWeight: '600' },
  emptyState: { alignItems: 'center' },
  emptyStateTitle: { fontSize: 18, fontWeight: '600', color: '#666', marginBottom: 8 },
  emptyStateText: { fontSize: 14, color: '#999', textAlign: 'center', lineHeight: 20 },
});

// Diego Paiva Batista / Matricula: 2024101217