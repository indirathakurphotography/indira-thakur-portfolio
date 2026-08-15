'use client';
import { useEffect, useState } from 'react';
interface FAQ { _id?: string; question: string; answer: string; }
export default function CategoryFAQs({ category }: { category: string }) {
  const [items, setItems] = useState<FAQ[]>([]); const [open, setOpen] = useState<number | null>(0);
  useEffect(() => { fetch('/api/faqs?category=' + encodeURIComponent(category)).then(r => r.ok ? r.json() : []).then(setItems).catch(() => setItems([])); }, [category]);
  if (!items.length) return null;
  return <section className="max-w-4xl mx-auto border-t border-[#E7DDD2] pt-14"><p className="font-mono text-[10px] uppercase tracking-[.3em] text-[#C39E96] mb-3">Helpful information</p><h2 className="font-serif text-3xl text-[#2B2625] mb-7">{category} FAQs</h2><div className="divide-y divide-[#E7DDD2]">{items.map((item, index) => <div key={item._id || index}><button onClick={() => setOpen(open === index ? null : index)} className="w-full text-left py-5 flex justify-between gap-6 font-serif text-lg text-[#2B2625]"><span>{item.question}</span><span>{open === index ? '-' : '+'}</span></button>{open === index && <p className="pb-5 pr-10 text-sm leading-relaxed text-[#7C706D] whitespace-pre-wrap">{item.answer}</p>}</div>)}</div></section>;
}