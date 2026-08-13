'use client';

import { useState } from 'react';
import { HiPlus, HiTrash } from 'react-icons/hi2';

const initialCollaborations: any[] = [];

export default function AdminCollaborationsPage() {
  const [collaborations] = useState(initialCollaborations);

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-rich-black mb-2">Collaborations</h1>
          <p className="font-sans text-sm text-warm-gray/60">Manage brand collaborations and partnerships.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-rich-black text-white font-sans text-xs tracking-wider uppercase hover:bg-warm-gray transition-all">
          <HiPlus className="w-4 h-4" />
          Add Collaboration
        </button>
      </div>

      <div className="bg-white rounded-sm border border-cream/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cream/50 bg-ivory/50">
              <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Brand Name</th>
              <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Description</th>
              <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Featured</th>
              <th className="text-left p-4 font-sans text-xs tracking-wider uppercase text-warm-gray/60">Actions</th>
            </tr>
          </thead>
          <tbody>
            {collaborations.map((c) => (
              <tr key={c.id} className="border-b border-cream/30 hover:bg-ivory/50 transition-colors">
                <td className="p-4 font-serif text-sm text-rich-black">{c.name}</td>
                <td className="p-4 font-sans text-sm text-warm-gray/70">{c.description}</td>
                <td className="p-4">
                  {c.featured ? <span className="text-magenta/60">★</span> : <span className="text-beige">★</span>}
                </td>
                <td className="p-4">
                  <button className="p-2 rounded-sm hover:bg-magenta/10 text-warm-gray/60 hover:text-rose-500 transition-all">
                    <HiTrash className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
