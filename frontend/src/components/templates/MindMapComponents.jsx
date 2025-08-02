import React from 'react';
import { Group, Rect, Text as KonvaText, Line, Circle } from 'react-konva';

export const MindMapNode = ({ node, onUpdate }) => {
  return (
    <Group
      x={node.x}
      y={node.y}
      draggable
      onDragEnd={(e) => {
        onUpdate(node.id, {
          ...node,
          x: e.target.x(),
          y: e.target.y()
        });
      }}
    >
      {/* Node background */}
      <Rect
        width={node.width}
        height={node.height}
        fill={node.color}
        cornerRadius={node.level === 0 ? 50 : 25}
        shadowColor="black"
        shadowOpacity={0.2}
        shadowOffset={{ x: 2, y: 2 }}
        shadowBlur={6}
      />
      
      {/* Node text */}
      <KonvaText
        x={10}
        y={node.height / 2 - 8}
        text={node.text}
        fontSize={node.level === 0 ? 16 : 14}
        fontStyle={node.level === 0 ? "bold" : "normal"}
        fill={node.textColor}
        width={node.width - 20}
        align="center"
        verticalAlign="middle"
        wrap="word"
      />
    </Group>
  );
};

export const MindMapConnection = ({ connection, nodes }) => {
  const fromNode = nodes.find(n => n.id === connection.from);
  const toNode = nodes.find(n => n.id === connection.to);
  
  if (!fromNode || !toNode) return null;

  const points = connection.points || [
    fromNode.x + fromNode.width / 2,
    fromNode.y + fromNode.height / 2,
    toNode.x + toNode.width / 2,
    toNode.y + toNode.height / 2
  ];

  return (
    <Line
      points={points}
      stroke="#64748b"
      strokeWidth={2}
      tension={0.3}
      lineCap="round"
    />
  );
};

export default { MindMapNode, MindMapConnection };
