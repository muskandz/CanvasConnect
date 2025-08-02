import React from 'react';
import { Group, Rect, Text as KonvaText, Line, Circle, RegularPolygon, Arrow } from 'react-konva';

export const FlowchartStart = ({ node, onUpdate }) => (
  <FlowchartNode node={node} onUpdate={onUpdate} shape="ellipse" />
);

export const FlowchartEnd = ({ node, onUpdate }) => (
  <FlowchartNode node={node} onUpdate={onUpdate} shape="ellipse" />
);

export const FlowchartProcess = ({ node, onUpdate }) => (
  <FlowchartNode node={node} onUpdate={onUpdate} shape="rectangle" />
);

export const FlowchartDecision = ({ node, onUpdate }) => (
  <FlowchartNode node={node} onUpdate={onUpdate} shape="diamond" />
);

const FlowchartNode = ({ node, onUpdate, shape }) => {
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
      {/* Node shape */}
      {shape === 'rectangle' && (
        <Rect
          width={node.width}
          height={node.height}
          fill={node.color}
          stroke="#374151"
          strokeWidth={2}
          cornerRadius={4}
        />
      )}
      
      {shape === 'ellipse' && (
        <Circle
          x={node.width / 2}
          y={node.height / 2}
          radius={Math.min(node.width, node.height) / 2}
          fill={node.color}
          stroke="#374151"
          strokeWidth={2}
        />
      )}
      
      {shape === 'diamond' && (
        <RegularPolygon
          x={node.width / 2}
          y={node.height / 2}
          sides={4}
          radius={Math.min(node.width, node.height) / 2}
          fill={node.color}
          stroke="#374151"
          strokeWidth={2}
          rotation={45}
        />
      )}
      
      {/* Node text */}
      <KonvaText
        x={10}
        y={node.height / 2 - 8}
        text={node.text}
        fontSize={14}
        fontStyle="bold"
        fill="white"
        width={node.width - 20}
        align="center"
        verticalAlign="middle"
        wrap="word"
      />
    </Group>
  );
};

export const FlowchartArrow = ({ arrow, nodes }) => {
  const fromNode = nodes.find(n => n.id === arrow.from);
  const toNode = nodes.find(n => n.id === arrow.to);
  
  if (!fromNode || !toNode) return null;

  const points = arrow.points || [
    fromNode.x + fromNode.width / 2,
    fromNode.y + fromNode.height,
    toNode.x + toNode.width / 2,
    toNode.y
  ];

  return (
    <Group>
      <Line
        points={points}
        stroke="#374151"
        strokeWidth={2}
        tension={0.1}
      />
      
      {/* Arrow head */}
      <RegularPolygon
        x={points[points.length - 2]}
        y={points[points.length - 1]}
        sides={3}
        radius={8}
        fill="#374151"
        rotation={-90}
      />
      
      {/* Label */}
      {arrow.label && (
        <KonvaText
          x={(points[0] + points[2]) / 2 - 20}
          y={(points[1] + points[3]) / 2 - 10}
          text={arrow.label}
          fontSize={12}
          fill="#374151"
          width={40}
          align="center"
        />
      )}
    </Group>
  );
};

export default { FlowchartStart, FlowchartEnd, FlowchartProcess, FlowchartDecision, FlowchartArrow };
