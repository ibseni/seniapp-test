"use client";

import { db } from "@/src/lib/prisma";
import { createArticle } from "@/src/lib/queries";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";

interface ArticleFormProps {
  addArticle: (data: FormData) => Promise<void>;
}

export default function ArticleForm({ addArticle }: ArticleFormProps) {
  const [title, setTitle] = useState("");
  const supabase = createClient();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!title) return;

    const formData = new FormData();
    formData.append('title', title);
    
    await addArticle(formData);
    setTitle(""); // Reset form
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Titel
        </label>
        <input
          type="text"
          name="title"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Gib den Titel des Artikels ein"
        />
      </div>
      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Artikel hinzufügen
      </button>
    </form>
  );
}
