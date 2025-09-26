import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTES_KEY = "NOTES_KEY";

// Adicionamos 'color' como obrigatório
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  tags?: string[];
  category?: string;
  color: string; // ← novo campo
}

export async function getNotes(): Promise<Note[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(NOTES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error("Erro ao carregar notas", e);
    return [];
  }
}

// Função para salvar uma nova nota, garantindo que 'color' exista
export async function saveNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
  const notes = await getNotes();
  const newNote: Note = {
    id: Date.now().toString(),
    ...note,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: note.pinned ?? false,
    tags: Array.isArray(note.tags) ? note.tags : [],
    category: note.category ? String(note.category) : undefined,
    color: note.color || '#fff', // ← garante cor padrão
  };
  
  notes.push(newNote);
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  return newNote;
}

// Função para atualizar uma nota existente
export async function updateNote(
  id: string,
  updatedNote: Partial<Omit<Note, 'id' | 'createdAt'>>
): Promise<Note | null> {
  const notes = await getNotes();
  const noteIndex = notes.findIndex(note => note.id === id);

  if (noteIndex === -1) return null;

  const updatedNoteData: Note = {
    ...notes[noteIndex],
    ...updatedNote,
    updatedAt: new Date().toISOString(),
    tags: updatedNote.tags !== undefined
      ? (Array.isArray(updatedNote.tags) ? updatedNote.tags : notes[noteIndex].tags ?? [])
      : (notes[noteIndex].tags ?? []),
    category: updatedNote.category !== undefined
      ? (updatedNote.category ? String(updatedNote.category) : undefined)
      : (notes[noteIndex].category),
    color: updatedNote.color || notes[noteIndex].color || '#fff', // ← garante cor
  };

  notes[noteIndex] = updatedNoteData;
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  return updatedNoteData;
}

// Toggle pinned permanece igual
export async function togglePinned(id: string): Promise<Note | null> {
  const notes = await getNotes();
  const noteIndex = notes.findIndex(n => n.id === id);
  if (noteIndex === -1) return null;

  const current = notes[noteIndex];
  const next: Note = {
    ...current,
    pinned: !current.pinned,
    updatedAt: new Date().toISOString(),
  };

  notes[noteIndex] = next;
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  return next;
}

// Delete nota permanece igual
export async function deleteNote(id: string): Promise<boolean> {
  try {
    const notes = await getNotes();
    const noteIndex = notes.findIndex(note => note.id === id);
    if (noteIndex === -1) return false;

    notes.splice(noteIndex, 1);
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    return true;
  } catch (error) {
    console.error('Erro ao excluir nota:', error);
    return false;
  }
}

export async function getNoteById(id: string): Promise<Note | null> {
  const notes = await getNotes();
  return notes.find(note => note.id === id) || null;
}

export async function exportNotes(): Promise<string> {
  const notes = await getNotes();
  return JSON.stringify(notes, null, 2);
}

export async function importNotes(json: string): Promise<{ imported: number } | null> {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;

    const sanitized: Note[] = parsed
      .filter((n: any) => n && typeof n.id === 'string')
      .map((n: any) => ({
        id: String(n.id),
        title: String(n.title ?? ''),
        content: String(n.content ?? ''),
        createdAt: n.createdAt ? String(n.createdAt) : new Date().toISOString(),
        updatedAt: n.updatedAt ? String(n.updatedAt) : new Date().toISOString(),
        pinned: Boolean(n.pinned),
        tags: Array.isArray(n.tags) ? n.tags.map((t: any) => String(t)) : [],
        category: n.category ? String(n.category) : undefined,
        color: n.color || '#fff', // ← garante cor caso não venha do import
      }));

    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(sanitized));
    return { imported: sanitized.length };
  } catch (e) {
    console.error('Erro ao importar notas', e);
    return null;
  }
}
