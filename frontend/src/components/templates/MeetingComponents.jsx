import React from 'react';
import { Group, Rect, Text as KonvaText, Circle } from 'react-konva';

export const MeetingHeader = ({ header, onUpdate }) => {
  return (
    <Group
      x={header.x}
      y={header.y}
      draggable
      onDragEnd={(e) => {
        onUpdate(header.id, {
          ...header,
          x: e.target.x(),
          y: e.target.y()
        });
      }}
    >
      {/* Header background */}
      <Rect
        width={header.width}
        height={header.height}
        fill={header.color}
        stroke="#d1d5db"
        strokeWidth={1}
        cornerRadius={8}
      />
      
      {/* Meeting title */}
      <KonvaText
        x={20}
        y={20}
        text={header.title}
        fontSize={20}
        fontStyle="bold"
        fill="#111827"
        width={header.width - 40}
      />
      
      {/* Date */}
      <KonvaText
        x={20}
        y={50}
        text={`Date: ${header.date}`}
        fontSize={14}
        fill="#6b7280"
        width={header.width - 40}
      />
      
      {/* Attendees */}
      <KonvaText
        x={20}
        y={75}
        text={`Attendees: ${header.attendees.join(', ')}`}
        fontSize={14}
        fill="#6b7280"
        width={header.width - 40}
        wrap="word"
      />
    </Group>
  );
};

export const MeetingSection = ({ section, onUpdate }) => {
  return (
    <Group
      x={section.x}
      y={section.y}
      draggable
      onDragEnd={(e) => {
        onUpdate(section.id, {
          ...section,
          x: e.target.x(),
          y: e.target.y()
        });
      }}
    >
      {/* Section background */}
      <Rect
        width={section.width}
        height={section.height}
        fill={section.color}
        stroke="#d1d5db"
        strokeWidth={1}
        cornerRadius={8}
      />
      
      {/* Section title */}
      <Rect
        width={section.width}
        height={40}
        fill="rgba(59, 130, 246, 0.1)"
        cornerRadius={[8, 8, 0, 0]}
      />
      
      <KonvaText
        x={15}
        y={12}
        text={section.title}
        fontSize={16}
        fontStyle="bold"
        fill="#1f2937"
        width={section.width - 30}
      />
      
      {/* Section items */}
      {section.items?.map((item, index) => (
        <MeetingItem
          key={item.id}
          item={item}
          x={15}
          y={50 + index * 25}
          width={section.width - 30}
        />
      ))}
    </Group>
  );
};

const MeetingItem = ({ item, x, y, width }) => {
  return (
    <Group x={x} y={y}>
      {/* Checkbox */}
      <Rect
        x={0}
        y={2}
        width={14}
        height={14}
        fill={item.done ? "#10b981" : "white"}
        stroke="#d1d5db"
        strokeWidth={1}
        cornerRadius={2}
      />
      
      {item.done && (
        <KonvaText
          x={3}
          y={4}
          text="✓"
          fontSize={10}
          fill="white"
          fontStyle="bold"
        />
      )}
      
      {/* Item text */}
      <KonvaText
        x={20}
        y={0}
        text={item.text}
        fontSize={12}
        fill={item.done ? "#6b7280" : "#374151"}
        width={width - 20}
        wrap="word"
        textDecoration={item.done ? "line-through" : ""}
      />
      
      {/* Deadline (for action items) */}
      {item.deadline && (
        <KonvaText
          x={width - 80}
          y={0}
          text={`Due: ${item.deadline}`}
          fontSize={10}
          fill="#ef4444"
          width={80}
          align="right"
        />
      )}
    </Group>
  );
};

export default { MeetingHeader, MeetingSection };
