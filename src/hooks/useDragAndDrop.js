import { useRef } from 'react';

export function useDragAndDrop(category, isPinned, allCategories, onDragEnd) {
  const groupRef = useRef(null);

  const handleDragStart = (e) => {
    if (isPinned) { e.preventDefault(); return; }
    e.dataTransfer.setData("text/plain", category);
    if (groupRef.current) groupRef.current.classList.add('dragging');
  };

  const handleDragEndEvent = () => {
    if (groupRef.current) groupRef.current.classList.remove('dragging');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (isPinned) return;
    if (groupRef.current) groupRef.current.classList.add('drag-over');
  };

  const handleDragLeave = () => {
    if (groupRef.current) groupRef.current.classList.remove('drag-over');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (groupRef.current) groupRef.current.classList.remove('drag-over');
    if (isPinned) return;
    
    const draggedCategory = e.dataTransfer.getData("text/plain");
    if (draggedCategory && draggedCategory !== category) {
      const newOrder = [...allCategories];
      const fromIdx = newOrder.indexOf(draggedCategory);
      const toIdx = newOrder.indexOf(category);
      if (fromIdx > -1 && toIdx > -1) {
        newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, draggedCategory);
        onDragEnd(newOrder);
      }
    }
  };

  return {
    groupRef,
    handleDragStart,
    handleDragEndEvent,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
}
