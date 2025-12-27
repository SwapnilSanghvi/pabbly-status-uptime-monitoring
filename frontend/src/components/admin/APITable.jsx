import { useState, useEffect } from 'react';
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
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { deleteAPI, reorderAPIs } from '../../services/adminService';
import Timestamp from '../shared/Timestamp';

function SortableRow({ api, onEdit, handleDelete, deleting, getStatusBadge }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: api.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="hover:bg-gray-50"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            title="Drag to reorder"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-sm font-medium text-gray-900">{api.name}</div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-500 max-w-xs truncate" title={api.url}>
          {api.url}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(api.last_status)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {api.is_public ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Public
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Private
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {api.uptime_24h ? `${parseFloat(api.uptime_24h).toFixed(2)}%` : 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">
          <Timestamp timestamp={api.last_checked} format="hybrid" />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onEdit(api)}
          className="text-blue-600 hover:text-blue-900 mr-4"
        >
          Edit
        </button>
        <button
          onClick={() => handleDelete(api)}
          disabled={deleting === api.id}
          className="text-red-600 hover:text-red-900 disabled:opacity-50"
        >
          {deleting === api.id ? 'Deleting...' : 'Delete'}
        </button>
      </td>
    </tr>
  );
}

export default function APITable({ apis, onEdit, onDelete, onAdd, onReorder }) {
  const [deleting, setDeleting] = useState(null);
  const [items, setItems] = useState(apis);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update items when apis prop changes
  useEffect(() => {
    setItems(apis);
  }, [apis]);

  const handleDelete = async (api) => {
    if (!window.confirm(`Are you sure you want to delete "${api.name}"?`)) {
      return;
    }

    setDeleting(api.id);
    try {
      await deleteAPI(api.id);
      toast.success('API deleted successfully');
      onDelete(api.id);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete API');
    } finally {
      setDeleting(null);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Send the new order to the backend
      try {
        const apiIds = newItems.map(item => item.id);
        await reorderAPIs(apiIds);
        toast.success('API order updated');

        // Notify parent component
        if (onReorder) {
          onReorder(newItems);
        }
      } catch (error) {
        console.error('Reorder error:', error);
        toast.error('Failed to update order');
        // Revert on error
        setItems(apis);
      }
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'success') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
          Operational
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1.5"></span>
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <span className="h-2 w-2 rounded-full bg-red-500 mr-1.5"></span>
        Down
      </span>
    );
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No APIs yet</h3>
        <p className="text-gray-500 mb-6">Get started by adding your first API endpoint to monitor</p>
        <button
          onClick={onAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Your First API
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visibility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uptime (24h)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Checked
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <SortableContext
                items={items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((api) => (
                  <SortableRow
                    key={api.id}
                    api={api}
                    onEdit={onEdit}
                    handleDelete={handleDelete}
                    deleting={deleting}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </DndContext>
      </div>
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        💡 Tip: Drag the ☰ icon to reorder APIs. The order will be saved automatically.
      </div>
    </div>
  );
}
