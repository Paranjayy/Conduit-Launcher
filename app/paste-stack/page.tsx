"use client";

import React from 'react';
import { PasteStack } from '@/components/paste-stack';

export default function PasteStackPage() {
  return (
    <div className="h-screen bg-gray-950 text-white overflow-hidden">
      <PasteStack onViewChange={() => {}} />
    </div>
  );
} 