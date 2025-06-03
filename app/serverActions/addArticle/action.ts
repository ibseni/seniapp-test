'use server'

import { revalidatePath } from 'next/cache'
import { db } from "@/src/lib/prisma";

export async function addArticle(formData: FormData) {
    const title = formData.get('title') as string;
    
    await db.articles.create({
        data: { title }
    });

    revalidatePath('/articles/server');
}