import React from 'react';
import { Group, Rect, Text as KonvaText, Line } from 'react-konva';

export const PresentationSlide = ({ slide, onUpdate, isActive }) => {
  return (
    <Group
      x={slide.x}
      y={slide.y}
      draggable={!isActive}
      onDragEnd={(e) => {
        onUpdate(slide.id, {
          ...slide,
          x: e.target.x(),
          y: e.target.y()
        });
      }}
    >
      {/* Slide background */}
      <Rect
        width={slide.width}
        height={slide.height}
        fill={slide.background}
        stroke={isActive ? "#3b82f6" : "#d1d5db"}
        strokeWidth={isActive ? 3 : 1}
        cornerRadius={8}
        shadowColor="black"
        shadowOpacity={0.1}
        shadowOffset={{ x: 0, y: 4 }}
        shadowBlur={8}
      />
      
      {/* Slide number */}
      <Rect
        x={10}
        y={10}
        width={30}
        height={20}
        fill="#3b82f6"
        cornerRadius={4}
      />
      <KonvaText
        x={15}
        y={16}
        text={slide.slideNumber.toString()}
        fontSize={12}
        fill="white"
        fontStyle="bold"
      />
      
      {/* Title */}
      <KonvaText
        x={20}
        y={50}
        text={slide.title}
        fontSize={24}
        fontStyle="bold"
        fill="#111827"
        width={slide.width - 40}
        align="center"
      />
      
      {/* Subtitle */}
      {slide.subtitle && (
        <KonvaText
          x={20}
          y={90}
          text={slide.subtitle}
          fontSize={16}
          fill="#6b7280"
          width={slide.width - 40}
          align="center"
        />
      )}
      
      {/* Content */}
      {slide.content?.map((item, index) => (
        <PresentationContent
          key={index}
          item={item}
          x={40}
          y={140 + index * 30}
          width={slide.width - 80}
        />
      ))}
    </Group>
  );
};

const PresentationContent = ({ item, x, y, width }) => {
  if (item.type === 'bullet') {
    return (
      <Group x={x} y={y}>
        {/* Bullet point */}
        <Rect
          x={0}
          y={6}
          width={6}
          height={6}
          fill="#374151"
          cornerRadius={3}
        />
        
        {/* Text */}
        <KonvaText
          x={15}
          y={0}
          text={item.text}
          fontSize={14}
          fill="#374151"
          width={width - 15}
          wrap="word"
        />
      </Group>
    );
  }
  
  return null;
};

export default { PresentationSlide };
