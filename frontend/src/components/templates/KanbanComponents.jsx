import React from 'react';
import { Group, Rect, Text as KonvaText } from 'react-konva';

export const KanbanColumn = ({ column, onUpdate }) => {
  return (
    <Group
      x={column.x}
      y={column.y}
      draggable
      onDragEnd={(e) => {
        onUpdate(column.id, {
          ...column,
          x: e.target.x(),
          y: e.target.y()
        });
      }}
    >
      {/* Column background */}
      <Rect
        width={column.width}
        height={column.height}
        fill={column.color}
        stroke="#d1d5db"
        strokeWidth={1}
        cornerRadius={8}
      />
      
      {/* Column title */}
      <KonvaText
        x={10}
        y={15}
        text={column.title}
        fontSize={16}
        fontStyle="bold"
        fill="#374151"
        width={column.width - 20}
        align="center"
      />
      
      {/* Cards */}
      {column.cards.map((card, index) => (
        <KanbanCard
          key={card.id}
          card={card}
          x={10}
          y={50 + index * 80}
          width={column.width - 20}
          onUpdate={onUpdate}
        />
      ))}
    </Group>
  );
};

export const KanbanCard = ({ card, x, y, width, onUpdate }) => {
  const cardHeight = 60;
  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981'
  };

  return (
    <Group x={x} y={y}>
      {/* Card background */}
      <Rect
        width={width}
        height={cardHeight}
        fill="white"
        stroke="#e5e7eb"
        strokeWidth={1}
        cornerRadius={6}
        shadowColor="black"
        shadowOpacity={0.1}
        shadowOffset={{ x: 0, y: 2 }}
        shadowBlur={4}
      />
      
      {/* Priority indicator */}
      <Rect
        width={4}
        height={cardHeight}
        fill={priorityColors[card.priority] || '#6b7280'}
        cornerRadius={[6, 0, 0, 6]}
      />
      
      {/* Card title */}
      <KonvaText
        x={12}
        y={8}
        text={card.title}
        fontSize={14}
        fontStyle="bold"
        fill="#111827"
        width={width - 24}
        wrap="word"
      />
      
      {/* Card description */}
      {card.description && (
        <KonvaText
          x={12}
          y={28}
          text={card.description}
          fontSize={11}
          fill="#6b7280"
          width={width - 24}
          wrap="word"
        />
      )}
    </Group>
  );
};

export default { KanbanColumn, KanbanCard };
