import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
}

export const ControllerMoveIcon: React.FC<IconProps> = ({ size = 24, color = "#007AFF" }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 19L12 22L9 19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 9L22 12L19 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 12H22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 9L2 12L5 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 5L12 2L15 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

export const ControllerSelectIcon: React.FC<IconProps> = ({ size = 24, color = "#007AFF" }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.0369 4.6879C3.99743 4.59682 3.98626 4.49597 4.00484 4.39846C4.02342 4.30094 4.07088 4.21127 4.14108 4.14108C4.21127 4.07088 4.30094 4.02342 4.39846 4.00484C4.49597 3.98626 4.59682 3.99743 4.6879 4.0369L20.6879 10.5369C20.7852 10.5765 20.8675 10.6458 20.9232 10.7349C20.9789 10.824 21.0051 10.9283 20.9981 11.0331C20.9912 11.138 20.9514 11.2379 20.8844 11.3188C20.8174 11.3997 20.7266 11.4575 20.6249 11.4839L14.5009 13.0639C14.1549 13.1529 13.839 13.3329 13.5861 13.5852C13.3332 13.8376 13.1526 14.1531 13.0629 14.4989L11.4839 20.6249C11.4575 20.7266 11.3997 20.8174 11.3188 20.8844C11.2379 20.9514 11.138 20.9912 11.0331 20.9981C10.9283 21.0051 10.824 20.9789 10.7349 20.9232C10.6458 20.8675 10.5765 20.7852 10.5369 20.6879L4.0369 4.6879Z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

export const ControllerBBoxIcon: React.FC<IconProps> = ({ size = 24, color = "#007AFF" }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="22" height="22" stroke={color} strokeWidth="2" strokeDasharray="3 3"/>
    </svg>
  );
};

export const ControllerZoomInIcon: React.FC<IconProps> = ({ size = 24, color = "#222222" }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12H19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 5V19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

export const ControllerZoomOutIcon: React.FC<IconProps> = ({ size = 24, color = "#222222" }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 12H19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

export const SidemenuIcon1: React.FC<IconProps> = ({ size = 24, color = "#007AFF" }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 12H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 6H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 18H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

export const ControllerDeleteIcon: React.FC<IconProps> = ({ size = 24, color = "#222" }) => {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 11V17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 11V17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 6H21" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};
