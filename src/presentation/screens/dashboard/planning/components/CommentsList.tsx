import React, { useState, useEffect } from "react";
import {
  PlanningComment,
  usePlanningStore,
} from "../../../../../store/planningStore";
import useUserDataStore from "../../../../../store/UserDataStore";
import moment from "moment";
import "moment/locale/es";
import {
  UserCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import ConfirmModal from "./ConfirmModal";

interface CommentsListProps {
  comments: PlanningComment[];
  planningId: string;
}

const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  planningId,
}) => {
  const { getUserById } = useUserDataStore();
  const { addComment, updateComment, deleteComment } = usePlanningStore();
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userCache, setUserCache] = useState<Record<string, any>>({});

  useEffect(() => {
    // Cargar datos de usuarios para los comentarios
    const loadUserData = async () => {
      const userIds = [
        ...new Set(comments.map((comment) => comment.createdBy)),
      ];
      const newCache: Record<string, any> = {};

      for (const userId of userIds) {
        if (!userCache[userId]) {
          const userData = await getUserById(userId);
          if (userData) {
            newCache[userId] = userData;
          }
        }
      }

      setUserCache((prev) => ({ ...prev, ...newCache }));
    };

    loadUserData();
  }, [comments, getUserById, userCache]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    await addComment(planningId, newComment);
    setNewComment("");
    setSubmitting(false);
  };

  const handleStartEditing = (comment: PlanningComment) => {
    setEditingComment(comment.id);
    setEditText(comment.text);
  };

  const handleCancelEditing = () => {
    setEditingComment(null);
    setEditText("");
  };

  const handleSubmitEdit = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!editText.trim()) return;

    setSubmitting(true);
    await updateComment(commentId, editText);
    setEditingComment(null);
    setSubmitting(false);
  };

  const handleDeleteComment = async () => {
    if (deleteCommentId) {
      await deleteComment(deleteCommentId);
      setDeleteCommentId(null);
    }
  };

  const renderComment = (comment: PlanningComment) => {
    const user = userCache[comment.createdBy];
    const isEditing = editingComment === comment.id;

    return (
      <div
        key={comment.id}
        className="bg-white dark:bg-gray-700 px-4 py-5 sm:px-6 rounded-lg shadow mb-4"
      >
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            {user?.photoURL ? (
              <img
                className="h-10 w-10 rounded-full"
                src={user.photoURL}
                alt={`${user.name} ${user.lastName}`}
              />
            ) : (
              <UserCircleIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user ? `${user.name} ${user.lastName}` : "Usuario"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {comment.updatedAt
                ? `Editado ${moment(comment.updatedAt).fromNow()}`
                : moment(comment.createdAt).fromNow()}
            </p>

            {isEditing ? (
              <form
                onSubmit={(e) => handleSubmitEdit(e, comment.id)}
                className="mt-2"
              >
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary shadow-sm sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  disabled={submitting}
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    disabled={submitting}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    disabled={submitting}
                  >
                    {submitting ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                {comment.text}
              </div>
            )}
          </div>

          {!isEditing && user && user.uid === comment.createdBy && (
            <div className="flex-shrink-0 self-start flex">
              <button
                onClick={() => handleStartEditing(comment)}
                className="p-1 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
              >
                <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                onClick={() => setDeleteCommentId(comment.id)}
                className="ml-1 p-1 rounded-full text-gray-400 dark:text-gray-500 hover:text-red-500"
              >
                <TrashIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flow-root">
        <ul className="mb-8">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <li key={comment.id}>{renderComment(comment)}</li>
            ))
          ) : (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No hay comentarios
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comienza la conversación.
              </p>
            </div>
          )}
        </ul>
      </div>

      <div className="mt-6">
        <form onSubmit={handleSubmitComment} className="relative">
          <div className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
            <textarea
              rows={3}
              name="comment"
              id="comment"
              className="block w-full resize-none border-0 py-3 focus:ring-0 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Añade un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={!newComment.trim() || submitting}
            >
              <PaperAirplaneIcon
                className="-ml-1 mr-2 h-5 w-5"
                aria-hidden="true"
              />
              {submitting ? "Enviando..." : "Comentar"}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={!!deleteCommentId}
        title="Eliminar comentario"
        message="¿Estás seguro de que deseas eliminar este comentario? Esta acción no se puede deshacer."
        confirmButtonText="Eliminar"
        cancelButtonText="Cancelar"
        onConfirm={handleDeleteComment}
        onCancel={() => setDeleteCommentId(null)}
        isDestructive={true}
      />
    </div>
  );
};

export default CommentsList;
