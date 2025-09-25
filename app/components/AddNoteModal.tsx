// app/components/AddNoteModal.tsx
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
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

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o título e o conteúdo da nota.');
      return;
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
      });
      
      setTitle('');
      setContent('');
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
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
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
          
          <View style={styles.characterCount}>
            <Text style={styles.characterCountText}>
              {content.length}/2000 caracteres
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 10,
    marginBottom: 20,
    color: '#333',
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  characterCountText: {
    fontSize: 12,
    color: '#666',
  },
  tagsInput: {
    marginTop: 16,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f7f7f7',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryInput: {
    marginTop: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#f7f7f7',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
