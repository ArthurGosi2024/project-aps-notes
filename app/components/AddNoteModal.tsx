// app/components/AddNoteModal.tsx
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { saveNote } from '../storage/notes-storage';

interface AddNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onNoteAdded: () => void;
}

export default function AddNoteModal({ visible, onClose, onNoteAdded }: AddNoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('#fff');
  const [dueDate, setDueDate] = useState(''); // DD/MM/YYYY

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o título e o conteúdo da nota.');
      return;
    }

    // Validação da data
let dueDateISO: string | undefined;
if (dueDate) {
  const parts = dueDate.split('/');
  if (parts.length !== 3) {
    Alert.alert('Erro', 'Data inválida. Use o formato DD/MM/AAAA.');
    return;
  }

  const [dayStr, monthStr, yearStr] = parts;
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);

  // Bloquear datas inválidas
  if (
    isNaN(day) || isNaN(month) || isNaN(year) ||
    day < 1 || day > 31 ||
    month < 1 || month > 12 ||
    year < 1900 || year > 2100
  ) {
    Alert.alert('Erro', 'Data inválida. Verifique o dia, mês e ano.');
    return;
  }

  const due = new Date(year, month - 1, day);
  const now = new Date();
  now.setHours(0, 0, 0, 0); // ignora hora

  if (due < now) {
    Alert.alert('Erro', 'A data de validade não pode ser anterior a hoje.');
    return;
  }

  dueDateISO = due.toISOString();
}

    setLoading(true);
    try {
      await saveNote({
        title: title.trim(),
        content: content.trim(),
        tags: tagsInput
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
        category: category.trim() || undefined,
        color,
        dueDate: dueDateISO,
      });

      // reset
      setTitle('');
      setContent('');
      setTagsInput('');
      setCategory('');
      setColor('#fff');
      setDueDate('');
      onNoteAdded();
      onClose();
      Alert.alert('Sucesso', 'Nota adicionada com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Erro ao salvar a nota. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setTagsInput('');
    setCategory('');
    setColor('#fff');
    setDueDate('');
    onClose();
  };

  // Função para adicionar "/" automaticamente
  const handleDueDateChange = (text: string) => {
    let sanitized = text.replace(/[^0-9]/g, '');
    if (sanitized.length > 2 && sanitized.length <= 4) {
      sanitized = sanitized.slice(0, 2) + '/' + sanitized.slice(2);
    } else if (sanitized.length > 4) {
      sanitized = sanitized.slice(0, 2) + '/' + sanitized.slice(2, 4) + '/' + sanitized.slice(4, 8);
    }
    setDueDate(sanitized);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: color }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Nova Nota</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, loading && styles.disabledButton]}
            disabled={loading}
          >
            <Text style={styles.saveText}>Salvar</Text>
          </TouchableOpacity>
        </View>

        {/* ScrollView para evitar sobreposição do conteúdo */}
        <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <TextInput
              style={styles.titleInput}
              placeholder="Título da nota"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              autoFocus
            />

            <TextInput
              style={styles.contentInput}
              placeholder="Conteúdo da nota"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={2000}
            />

            <TextInput
              style={styles.tagsInput}
              placeholder="Tags (separe por vírgula, ex: estudo, trabalho)"
              value={tagsInput}
              onChangeText={setTagsInput}
            />

            <TextInput
              style={styles.categoryInput}
              placeholder="Categoria (ex: Pessoal, Trabalho, Estudo)"
              value={category}
              onChangeText={setCategory}
              maxLength={40}
            />

            {/* Input de data de validade */}
            <TextInput
              style={styles.dueDateInput}
              placeholder="Data de validade (DD/MM/AAAA)"
              value={dueDate}
              onChangeText={handleDueDateChange}
              maxLength={10}
              keyboardType="numeric"
            />

            {/* Seletor de cores */}
            <Text style={{ marginTop: 16, fontWeight: '600', fontSize: 16, color: '#333' }}>Cor da nota:</Text>
            <View style={styles.colorPicker}>
              {['#fff', '#FFCDD2', '#C8E6C9', '#BBDEFB', '#FFF9C4', '#D1C4E9'].map((c, i) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c, borderWidth: color === c ? 2 : 0, marginRight: i < 5 ? 10 : 0 }
                  ]}
                />
              ))}
            </View>

            <View style={styles.characterCount}>
              <Text style={styles.characterCountText}>
                {content.length}/2000 caracteres
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cancelButton: { padding: 8 },
  cancelText: { fontSize: 16, color: '#007AFF' },
  saveButton: { padding: 8 },
  saveText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  disabledButton: { opacity: 0.5 },
  content: { flex: 1, padding: 20 },
  titleInput: { fontSize: 20, fontWeight: '600', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', paddingVertical: 10, marginBottom: 20, color: '#333' },
  contentInput: { flex: 1, fontSize: 16, color: '#333', textAlignVertical: 'top', minHeight: 100 },
  characterCount: { alignItems: 'flex-end', marginTop: 10 },
  characterCountText: { fontSize: 12, color: '#666' },
  tagsInput: { marginTop: 16, fontSize: 14, color: '#333', backgroundColor: '#f7f7f7', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  categoryInput: { marginTop: 12, fontSize: 14, color: '#333', backgroundColor: '#f7f7f7', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  dueDateInput: { marginTop: 12, fontSize: 14, color: '#333', backgroundColor: '#f7f7f7', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  colorPicker: { flexDirection: 'row', marginTop: 8 },
  colorCircle: { width: 32, height: 32, borderRadius: 16, borderColor: '#000' },
});
