import React from 'react';
import { Group, Rect, Text as KonvaText, Circle, Star } from 'react-konva';

export const BrainstormTopic = ({ topic, onUpdate }) => {
  return (
    <Group
      x={topic.x}
      y={topic.y}
      draggable
      onDragEnd={(e) => {
        onUpdate(topic.id, {
          ...topic,
          x: e.target.x(),
          y: e.target.y()
        });
      }}
    >
      {/* Topic background */}
      <Rect
        width={topic.width}
        height={topic.height}
        fill={topic.color}
        cornerRadius={50}
        shadowColor="black"
        shadowOpacity={0.3}
        shadowOffset={{ x: 3, y: 3 }}
        shadowBlur={10}
      />
      
      {/* Topic text */}
      <KonvaText
        x={15}
        y={topic.height / 2 - 12}
        text={topic.text}
        fontSize={18}
        fontStyle="bold"
        fill={topic.textColor}
        width={topic.width - 30}
        align="center"
        verticalAlign="middle"
        wrap="word"
      />
    </Group>
  );
};

export const BrainstormIdea = ({ idea, onUpdate, onVote }) => {
  return (
    <Group
      x={idea.x}
      y={idea.y}
      draggable
      onDragEnd={(e) => {
        onUpdate(idea.id, {
          ...idea,
          x: e.target.x(),
          y: e.target.y()
        });
      }}
    >
      {/* Idea bubble */}
      <Circle
        x={idea.width / 2}
        y={idea.height / 2}
        radius={Math.min(idea.width, idea.height) / 2}
        fill={idea.color}
        stroke="white"
        strokeWidth={3}
        shadowColor="black"
        shadowOpacity={0.2}
        shadowOffset={{ x: 2, y: 2 }}
        shadowBlur={5}
      />
      
      {/* Idea text */}
      <KonvaText
        x={10}
        y={idea.height / 2 - 16}
        text={idea.text}
        fontSize={12}
        fontStyle="bold"
        fill="white"
        width={idea.width - 20}
        align="center"
        verticalAlign="middle"
        wrap="word"
      />
      
      {/* Vote count */}
      {idea.votes > 0 && (
        <Group>
          <Circle
            x={idea.width - 15}
            y={15}
            radius={12}
            fill="#ef4444"
            stroke="white"
            strokeWidth={2}
          />
          <KonvaText
            x={idea.width - 22}
            y={9}
            text={idea.votes.toString()}
            fontSize={10}
            fontStyle="bold"
            fill="white"
            width={14}
            align="center"
          />
        </Group>
      )}
    </Group>
  );
};

export const BrainstormTimer = ({ timer, x, y }) => {
  return (
    <Group x={x} y={y}>
      <Rect
        width={200}
        height={40}
        fill="#f3f4f6"
        stroke="#d1d5db"
        strokeWidth={1}
        cornerRadius={20}
      />
      
      <KonvaText
        x={10}
        y={12}
        text="⏰ Brainstorming Session"
        fontSize={14}
        fontStyle="bold"
        fill="#374151"
        width={180}
        align="center"
      />
    </Group>
  );
};

export default { BrainstormTopic, BrainstormIdea, BrainstormTimer };
