// app/components/ViewNoteModal.tsx
import * as Sharing from 'expo-sharing';
import React from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Note, togglePinned } from '../storage/notes-storage';

interface ViewNoteModalProps {
  visible: boolean;
  note: Note | null;
  onClose: () => void;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => Promise<boolean>;
}

export default function ViewNoteModal({ 
  visible, 
  note, 
  onClose, 
  onEdit, 
  onDelete 
}: ViewNoteModalProps) {
  if (!note) return null;

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Iniciando exclusão no modal, ID:', note.id);
              const success = await onDelete(note.id);
              console.log('Resultado da exclusão no modal:', success);
              
              if (success) {
                console.log('Fechando modal após exclusão bem-sucedida');
                onClose();
              } else {
                console.log('Exclusão falhou, mantendo modal aberto');
                Alert.alert('Erro', 'Não foi possível excluir a nota. Tente novamente.');
              }
            } catch (error) {
              console.error('Erro ao excluir nota no modal:', error);
              Alert.alert('Erro', 'Ocorreu um erro ao excluir a nota. Tente novamente.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Fechar</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={async () => {
                if (!note) return;
                await togglePinned(note.id);
                Alert.alert('Sucesso', note.pinned ? 'Nota desafixada' : 'Nota fixada');
              }}
              style={styles.actionButton}
            >
              <Text style={styles.actionText}>{note.pinned ? 'Desafixar' : 'Fixar'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                const content = `Título: ${note.title}\n\n${note.content}\n\nTags: ${(note.tags ?? []).join(', ')}`;
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(
                    undefined as any,
                    { dialogTitle: 'Compartilhar nota', mimeType: 'text/plain', UTI: 'public.plain-text' }
                  );
                } else {
                  Alert.alert('Compartilhar', content);
                }
              }}
              style={styles.actionButton}
            >
              <Text style={styles.actionText}>Compartilhar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => onEdit(note)} 
              style={styles.actionButton}
            >
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleDelete} 
              style={[styles.actionButton, styles.deleteButton]}
            >
              <Text style={[styles.actionText, styles.deleteText]}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.noteTitle}>{note.title}</Text>
          
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>
              Criada em: {formatDate(note.createdAt)}
            </Text>
            {note.updatedAt !== note.createdAt && (
              <Text style={styles.metadataText}>
                Atualizada em: {formatDate(note.updatedAt)}
              </Text>
            )}
            {!!note.category && (
              <Text style={styles.metadataText}>
                Categoria: {note.category}
              </Text>
            )}
            {!!(note.tags && note.tags.length) && (
              <Text style={styles.metadataText}>
                Tags: {note.tags.join(', ')}
              </Text>
            )}
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.noteContent}>{note.content}</Text>
          </View>
        </ScrollView>
      </View>
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
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    padding: 8,
  },
  actionText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  deleteButton: {
    // Estilo específico para o botão de deletar
  },
  deleteText: {
    color: '#FF3B30',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  noteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    lineHeight: 32,
  },
  metadata: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metadataText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  contentContainer: {
    flex: 1,
  },
  noteContent: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});
