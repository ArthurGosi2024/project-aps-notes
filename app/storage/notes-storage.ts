// app/storage/notes-storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTES_KEY = "NOTES_KEY";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  tags?: string[];
  category?: string;
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
  };
  
  notes.push(newNote);
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  return newNote;
}

export async function updateNote(id: string, updatedNote: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<Note | null> {
  const notes = await getNotes();
  const noteIndex = notes.findIndex(note => note.id === id);
  
  if (noteIndex === -1) {
    return null;
  }
  
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
  };
  
  notes[noteIndex] = updatedNoteData;
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  return updatedNoteData;
}

export async function togglePinned(id: string): Promise<Note | null> {
  const notes = await getNotes();
  const noteIndex = notes.findIndex(n => n.id === id);
  if (noteIndex === -1) {
    return null;
  }
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

export async function deleteNote(id: string): Promise<boolean> {
  try {
    console.log('=== INÍCIO DA EXCLUSÃO ===');
    console.log('ID recebido para exclusão:', id);
    console.log('Tipo do ID:', typeof id);
    
    const notes = await getNotes();
    console.log('Notas carregadas do storage:', notes.length);
    console.log('IDs das notas existentes:', notes.map(n => n.id));
    
    const noteIndex = notes.findIndex(note => note.id === id);
    console.log('Índice encontrado:', noteIndex);
    
    if (noteIndex === -1) {
      console.log('ERRO: Nota não encontrada para exclusão');
      console.log('ID procurado:', id);
      console.log('IDs disponíveis:', notes.map(n => n.id));
      return false;
    }
    
    const noteToDelete = notes[noteIndex];
    console.log('Nota a ser excluída:', noteToDelete.title);
    
    notes.splice(noteIndex, 1);
    console.log('Notas após exclusão:', notes.length);
    
    const jsonString = JSON.stringify(notes);
    console.log('JSON a ser salvo:', jsonString.substring(0, 200) + '...');
    
    await AsyncStorage.setItem(NOTES_KEY, jsonString);
    console.log('Nota salva no AsyncStorage com sucesso');
    
    // Verificar se foi realmente salva
    const savedNotes = await getNotes();
    console.log('Verificação: notas após salvar:', savedNotes.length);
    console.log('=== FIM DA EXCLUSÃO ===');
    
    return true;
  } catch (error) {
    console.error('ERRO ao excluir nota:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
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
    // validações simples de estrutura
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
      }));

    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(sanitized));
    return { imported: sanitized.length };
  } catch (e) {
    console.error('Erro ao importar notas', e);
    return null;
  }
}
