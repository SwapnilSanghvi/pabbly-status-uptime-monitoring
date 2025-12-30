import { useState, useEffect } from 'react';
import { getAPIGroups, createAPIGroup, updateAPIGroup, deleteAPIGroup, reorderAPIGroups } from '../../services/adminService';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Row Component
function SortableGroupRow({ group, onEdit, onDelete, isDefault }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-4 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          title="Drag to reorder"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{group.name}</span>
          {isDefault && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Default</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600">{group.api_count || 0} APIs</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(group)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
          {!isDefault && (
            <button
              onClick={() => onDelete(group)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function GroupManageModal({ isOpen, onClose, onSuccess }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [showForm, setShowForm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await getAPIGroups();
      setGroups(response.groups || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    try {
      if (editingGroup) {
        await updateAPIGroup(editingGroup.id, { name: formData.name.trim() });
        toast.success('Group updated successfully');
      } else {
        await createAPIGroup({ name: formData.name.trim() });
        toast.success('Group created successfully');
      }

      setFormData({ name: '' });
      setEditingGroup(null);
      setShowForm(false);
      fetchGroups();
      onSuccess();
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error(error.response?.data?.error || 'Failed to save group');
    }
  };

  const handleEdit = (group) => {
    setEditingGroup(group);
    setFormData({ name: group.name });
    setShowForm(true);
  };

  const handleDelete = async (group) => {
    if (!confirm(`Are you sure you want to delete "${group.name}"? ${group.api_count > 0 ? `Its ${group.api_count} API(s) will be moved to the default group.` : ''}`)) {
      return;
    }

    try {
      await deleteAPIGroup(group.id);
      toast.success('Group deleted successfully');
      fetchGroups();
      onSuccess();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error(error.response?.data?.error || 'Failed to delete group');
    }
  };

  const handleAddNew = () => {
    setEditingGroup(null);
    setFormData({ name: '' });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingGroup(null);
    setFormData({ name: '' });
    setShowForm(false);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = groups.findIndex((g) => g.id === active.id);
      const newIndex = groups.findIndex((g) => g.id === over.id);

      const newGroups = arrayMove(groups, oldIndex, newIndex);
      setGroups(newGroups);

      try {
        const groupIds = newGroups.map((g) => g.id);
        await reorderAPIGroups(groupIds);
        toast.success('Groups reordered successfully');
        onSuccess();
      } catch (error) {
        console.error('Error reordering groups:', error);
        toast.error('Failed to reorder groups');
        fetchGroups();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Manage API Groups</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 overflow-y-auto flex-1">
            {/* Add/Edit Form */}
            {showForm ? (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  {editingGroup ? 'Edit Group' : 'Create New Group'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Group Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ name: e.target.value })}
                      placeholder="e.g., Pabbly Connect"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                    >
                      {editingGroup ? 'Update Group' : 'Create Group'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelForm}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="mb-4">
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Group
                </button>
              </div>
            )}

            {/* Groups List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading groups...</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No groups found. Create your first group to organize your APIs.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        Order
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Group Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        APIs
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={groups.map((g) => g.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <tbody className="bg-white divide-y divide-gray-200">
                        {groups.map((group) => (
                          <SortableGroupRow
                            key={group.id}
                            group={group}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            isDefault={group.is_default}
                          />
                        ))}
                      </tbody>
                    </SortableContext>
                  </DndContext>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              💡 Drag groups to reorder them. Changes are saved automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
