'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface Chat {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function CRUDPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', url: '' });
  const [editingChat, setEditingChat] = useState<Chat | null>(null);
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [showSecretKeyModal, setShowSecretKeyModal] = useState(false);
  const [secretKeyModalType, setSecretKeyModalType] = useState<'edit' | 'delete' | null>(null);
  const [pendingChat, setPendingChat] = useState<Chat | null>(null);

  // Fetch chats
  const fetchChats = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/chats?page=${page}&pageSize=${pagination.pageSize}`);
      if (!response.ok) {
        throw new Error('Error al obtener chats');
      }
      const data = await response.json();
      setChats(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchChats(1);
  }, []);

  // Handle create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!formData.name.trim() || !formData.url.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear chat');
      }

      setSuccessMessage('Chat creado exitosamente');
      setFormData({ name: '', url: '' });
      fetchChats(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Handle update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChat) return;

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/chats', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret_key: secretKeyInput,
          name: formData.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar chat');
      }

      setSuccessMessage('Chat actualizado exitosamente');
      setEditingChat(null);
      setFormData({ name: '', url: '' });
      setSecretKeyInput('');
      setShowSecretKeyModal(false);
      fetchChats(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!secretKeyInput) return;

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/chats?secret_key=${encodeURIComponent(secretKeyInput)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar chat');
      }

      setSuccessMessage('Chat eliminado exitosamente');
      setSecretKeyInput('');
      setShowSecretKeyModal(false);
      setPendingChat(null);
      setSecretKeyModalType(null);
      fetchChats(pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button
  const handleEditClick = (chat: Chat) => {
    setPendingChat(chat);
    setFormData({ name: chat.name, url: chat.url });
    setSecretKeyInput('');
    setSecretKeyModalType('edit');
    setShowSecretKeyModal(true);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingChat(null);
    setPendingChat(null);
    setFormData({ name: '', url: '' });
    setSecretKeyInput('');
    setShowSecretKeyModal(false);
    setSecretKeyModalType(null);
  };

  // Handle delete button
  const handleDeleteClick = (chat: Chat) => {
    setPendingChat(chat);
    setSecretKeyInput('');
    setSecretKeyModalType('delete');
    setShowSecretKeyModal(true);
  };

  // Confirm secret key for edit
  const handleConfirmSecretKeyEdit = () => {
    if (secretKeyInput.trim()) {
      setEditingChat(pendingChat);
      setShowSecretKeyModal(false);
      setSecretKeyModalType(null);
    }
  };

  // Confirm secret key for delete
  const handleConfirmSecretKeyDelete = () => {
    if (secretKeyInput.trim()) {
      handleDelete();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🚀 CRUD de Chats</h1>
        <p className={styles.subtitle}>Gestiona tus chats de forma sencilla</p>
      </div>

      {/* Alerts */}
      {error && <div className={`${styles.alert} ${styles.alert_error}`}>{error}</div>}
      {successMessage && <div className={`${styles.alert} ${styles.alert_success}`}>{successMessage}</div>}

      <div className={styles.content}>
        {/* Form Section */}
        <div className={styles.form_section}>
          <h2>{editingChat ? '✏️ Editar Chat' : '➕ Crear Nuevo Chat'}</h2>
          <form onSubmit={editingChat ? handleUpdate : handleCreate} className={styles.form}>
            <div className={styles.form_group}>
              <label htmlFor="name">Nombre del Chat</label>
              <input
                id="name"
                type="text"
                placeholder="Ej: Mi Chat Principal"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
              />
            </div>

            {!editingChat && (
              <div className={styles.form_group}>
                <label htmlFor="url">URL del Chat</label>
                <input
                  id="url"
                  type="url"
                  placeholder="Ej: https://example.com"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  disabled={loading}
                />
              </div>
            )}

            <div className={styles.button_group}>
              <button
                type="submit"
                className={styles.btn_primary}
                disabled={loading}
              >
                {loading ? 'Procesando...' : editingChat ? '💾 Guardar Cambios' : '➕ Crear'}
              </button>
              {editingChat && (
                <button
                  type="button"
                  className={styles.btn_secondary}
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  ❌ Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Chats List Section */}
        <div className={styles.list_section}>
          <h2>📋 Lista de Chats ({pagination.total})</h2>

          {chats.length === 0 && !loading ? (
            <div className={styles.empty_state}>
              <p>No hay chats creados aún</p>
            </div>
          ) : (
            <>
              <div className={styles.table_wrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>URL</th>
                      <th>Fecha de Creación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chats.map((chat) => (
                      <tr key={chat.id}>
                        <td className={styles.cell_name}>{chat.name}</td>
                        <td className={styles.cell_url}>
                          <a href={chat.url} target="_blank" rel="noopener noreferrer">
                            {chat.url}
                          </a>
                        </td>
                        <td className={styles.cell_date}>
                          {new Date(chat.createdAt).toLocaleDateString('es-ES')}
                        </td>
                        <td className={styles.cell_actions}>
                          <button
                            className={styles.btn_edit}
                            onClick={() => handleEditClick(chat)}
                            disabled={loading}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className={styles.btn_delete}
                            onClick={() => handleDeleteClick(chat)}
                            disabled={loading}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={styles.pagination}>
                <button
                  className={styles.btn_pagination}
                  onClick={() => fetchChats(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                >
                  ← Anterior
                </button>
                <span className={styles.page_info}>
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  className={styles.btn_pagination}
                  onClick={() => fetchChats(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loading}
                >
                  Siguiente →
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Secret Key Modal */}
      {showSecretKeyModal && (
        <div className={styles.modal_overlay}>
          <div className={styles.modal}>
            <h3>
              {secretKeyModalType === 'edit' ? '🔐 Ingresa Secret Key para Editar' : '🔐 Ingresa Secret Key para Eliminar'}
            </h3>
            <p>
              {secretKeyModalType === 'edit'
                ? 'Por favor ingresa la secret_key del chat para editarlo'
                : 'Por favor ingresa la secret_key del chat para eliminarlo'}
            </p>
            <div className={styles.form_group}>
              <label htmlFor="secret_key_input">Secret Key</label>
              <input
                id="secret_key_input"
                type="password"
                placeholder="Pega tu secret_key aquí"
                value={secretKeyInput}
                onChange={(e) => setSecretKeyInput(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className={styles.modal_buttons}>
              <button
                className={styles.btn_cancel}
                onClick={() => {
                  setShowSecretKeyModal(false);
                  setSecretKeyInput('');
                  setPendingChat(null);
                  setSecretKeyModalType(null);
                }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                className={secretKeyModalType === 'delete' ? styles.btn_delete_confirm : styles.btn_primary}
                onClick={secretKeyModalType === 'edit' ? handleConfirmSecretKeyEdit : handleConfirmSecretKeyDelete}
                disabled={loading || !secretKeyInput.trim()}
              >
                {loading ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
